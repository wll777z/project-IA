import { beforeAll, afterAll, it, expect } from "vitest";
import { setupDB } from "./setup-db";
let f: Awaited<ReturnType<typeof setupDB>>,
  p: typeof import("../src/lib/profiles"),
  service: typeof import("../src/lib/appearance-store");
let id: string;
const now = new Date("2026-10-27T12:00:00Z");
beforeAll(async () => {
  f = await setupDB();
  p = await import("../src/lib/profiles");
  service = await import("../src/lib/appearance-store");
  await f.db.user.createMany({
    data: [
      { id: "one", name: "One", email: "one@example.com" },
      { id: "two", name: "Two", email: "two@example.com" },
    ],
  });
  await p.saveProfile("one", {
    ...p.emptyProfile("One"),
    username: "collections_player",
    published: true,
  });
});
afterAll(async () => f?.close());
it("Free não cria coleções", async () => {
  await expect(
    service.changeAppearance("one", { action: "create", name: "No" }),
  ).rejects.toThrow("Pro");
});
it("salva somente aparência, aplica e desfaz sem excluir links ou conteúdo", async () => {
  await f.db.entitlement.create({ data: { userId: "one", plan: "PRO" } });
  const row = await service.changeAppearance("one", {
    action: "create",
    name: "Original",
  });
  expect("id" in row).toBe(true);
  id = (row as { id: string }).id;
  let profile = (await p.getOwnedProfile("one"))!;
  profile = await p.saveProfile("one", {
    ...profile,
    bio: "Keep my content",
    accentColor: "#abcdef",
    studio: { ...profile.studio, layout: "showcase", width: "wide" },
  });
  await service.changeAppearance("one", {
    action: "apply",
    id,
    profileRevision: profile.revision,
  });
  const applied = (await p.getOwnedProfile("one"))!;
  expect(applied.accentColor).toBe("#a78bfa");
  expect(applied.bio).toBe("Keep my content");
  await service.changeAppearance("one", {
    action: "undo",
    profileRevision: applied.revision,
  });
  expect((await p.getOwnedProfile("one"))?.accentColor).toBe("#abcdef");
});
it("propriedade e revisões impedem aplicar ou renomear dados alheios/antigos", async () => {
  await f.db.entitlement.create({ data: { userId: "two", plan: "PRO" } });
  await p.saveProfile("two", {
    ...p.emptyProfile("Two"),
    username: "collections_other",
  });
  await expect(
    service.changeAppearance("two", {
      action: "apply",
      id,
      profileRevision: 1,
    }),
  ).rejects.toThrow("encontrada");
  await service.changeAppearance("one", {
    action: "rename",
    id,
    name: "Renamed",
    revision: 0,
  });
  await expect(
    service.changeAppearance("one", {
      action: "rename",
      id,
      name: "Stale",
      revision: 0,
    }),
  ).rejects.toThrow("mudou");
  await expect(
    service.changeAppearance("one", {
      action: "apply",
      id,
      profileRevision: 0,
    }),
  ).rejects.toThrow("mudou");
});
it("duplicar conserva uma cópia independente", async () => {
  await service.changeAppearance("one", {
    action: "duplicate",
    id,
    name: "Copy",
  });
  expect((await service.listAppearances("one")).items).toHaveLength(2);
});
it("agenda resolve início/fim por instantes UTC e restaura o padrão sem cron", async () => {
  await service.changeSchedule(
    "one",
    {
      action: "create",
      appearanceId: id,
      startsAt: "2026-10-27T10:00:00-03:00",
      endsAt: "2026-10-27T11:00:00-03:00",
      timeZone: "America/Sao_Paulo",
    },
    now,
  );
  const base = (await p.getOwnedProfile("one"))!;
  expect(
    (
      await service.resolveSeason(
        "one",
        base,
        true,
        new Date("2026-10-27T12:59:59Z"),
      )
    ).accentColor,
  ).toBe("#abcdef");
  expect(
    (
      await service.resolveSeason(
        "one",
        base,
        true,
        new Date("2026-10-27T13:00:00Z"),
      )
    ).accentColor,
  ).toBe("#a78bfa");
  expect(
    (
      await service.resolveSeason(
        "one",
        base,
        true,
        new Date("2026-10-27T14:00:00Z"),
      )
    ).accentColor,
  ).toBe("#abcdef");
  expect((await p.getOwnedProfile("one"))?.accentColor).toBe("#abcdef");
});
it("sobreposição, fuso inválido e coleção alheia são recusados", async () => {
  const input = {
    action: "create",
    appearanceId: id,
    startsAt: "2026-10-27T13:30:00Z",
    endsAt: "2026-10-27T15:00:00Z",
    timeZone: "UTC",
  };
  await expect(service.changeSchedule("one", input, now)).rejects.toThrow(
    "intervalo",
  );
  await expect(service.changeSchedule("two", input, now)).rejects.toThrow(
    "encontrada",
  );
  await expect(
    service.changeSchedule("one", { ...input, timeZone: "Not/AZone" }, now),
  ).rejects.toThrow();
});
it("expiração suspende aplicação e agenda mas preserva coleções e permite cancelar", async () => {
  await f.db.entitlement.update({
    where: { userId: "one" },
    data: { expiresAt: new Date(0) },
  });
  await expect(
    service.changeAppearance("one", {
      action: "apply",
      id,
      profileRevision: 4,
    }),
  ).rejects.toThrow("Pro");
  const base = (await p.getOwnedProfile("one"))!;
  expect(
    (
      await service.resolveSeason(
        "one",
        base,
        false,
        new Date("2026-10-27T13:30:00Z"),
      )
    ).accentColor,
  ).toBe(base.accentColor);
  const list = await service.listAppearances("one");
  expect(list.items).toHaveLength(2);
  await service.changeSchedule("one", {
    action: "cancel",
    id: list.schedules[0].id,
  });
  expect((await service.listAppearances("one")).schedules).toHaveLength(0);
});
it("exclusão do dono remove coleções e agendamentos", async () => {
  await f.db.user.delete({ where: { id: "one" } });
  expect(await f.db.savedAppearance.count({ where: { userId: "one" } })).toBe(
    0,
  );
});
