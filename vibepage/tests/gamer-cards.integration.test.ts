import { beforeAll, afterAll, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { setupDB } from "./setup-db";
import {
  gamerCardSchema,
  profileSchema,
  type GamerCardInput,
  type ProfileInput,
} from "../src/lib/validation";
import { themes } from "../src/lib/themes";
let fixture: Awaited<ReturnType<typeof setupDB>>;
let profiles: typeof import("../src/lib/profiles");
let publicProfiles: typeof import("../src/lib/public-profile");
let data: ProfileInput;
const card = (extra: Partial<GamerCardInput> = {}): GamerCardInput => ({
  id: randomUUID(),
  game: "roblox",
  displayName: "Sword main",
  handle: "@player",
  detail: "Blox Fruits",
  edition: "",
  url: "https://www.roblox.com/",
  avatarKey: null,
  color: "#a78bfa",
  style: "minimal",
  layout: "compact",
  icon: "swords",
  glow: false,
  animated: false,
  ...extra,
});
beforeAll(async () => {
  fixture = await setupDB();
  profiles = await import("../src/lib/profiles");
  publicProfiles = await import("../src/lib/public-profile");
  await fixture.db.user.createMany({
    data: [
      { id: "owner", name: "Player", email: "one@example.com" },
      { id: "other", name: "Other", email: "two@example.com" },
    ],
  });
  data = {
    ...profiles.emptyProfile("Player"),
    username: "card_player",
    published: true,
    gamerCards: [card(), card({ game: "minecraft", edition: "java" })],
  };
});
afterAll(async () => fixture?.close());
it("persiste cartões e reordena preservando IDs", async () => {
  data = await profiles.saveProfile("owner", data);
  const ids = data.gamerCards.map((c) => c.id);
  data = await profiles.saveProfile("owner", {
    ...data,
    gamerCards: [...data.gamerCards].reverse(),
  });
  expect(
    (await profiles.getOwnedProfile("owner"))?.gamerCards.map((c) => c.id),
  ).toEqual(ids.reverse());
  expect(
    (await publicProfiles.getPublicProfile(data.username))?.profile.gamerCards,
  ).toHaveLength(2);
});
it("recusa IDs de cartões de outro dono e faz rollback", async () => {
  await expect(
    profiles.saveProfile("other", {
      ...profiles.emptyProfile("Other"),
      username: "other_player",
      gamerCards: [data.gamerCards[0]],
    }),
  ).rejects.toThrow("não pertence");
  expect(await fixture.db.profile.count({ where: { userId: "other" } })).toBe(
    0,
  );
  expect(
    (
      await fixture.db.gamerCard.findUniqueOrThrow({
        where: { id: data.gamerCards[0].id },
      })
    ).profileId,
  ).toBe(
    (await fixture.db.profile.findUniqueOrThrow({ where: { userId: "owner" } }))
      .id,
  );
});
it("Free recusa limites, estilos e efeitos Pro no backend", async () => {
  for (const changes of [
    { gamerCards: Array.from({ length: 4 }, () => card()) },
    { gamerCards: [card({ style: "holographic" })] },
    { gamerCards: [card({ glow: true })] },
    { gamerCards: [card({ animated: true })] },
    { gamerCards: [card({ layout: "banner" })] },
    { backgroundEffect: "aurora" },
    { avatarEffect: "ring" },
    { buttonEffect: "shine" },
    { entranceEffect: "zoom" },
    { fontFamily: "mono" },
  ]) {
    await expect(
      profiles.saveProfile("owner", { ...data, ...changes }),
    ).rejects.toThrow("Pro");
  }
  expect((await profiles.getOwnedProfile("owner"))?.revision).toBe(
    data.revision,
  );
});
it("não aceita imagens estrangeiras ou IDs repetidos", async () => {
  await expect(
    profiles.saveProfile("owner", {
      ...data,
      gamerCards: [card({ avatarKey: randomUUID() })],
    }),
  ).rejects.toThrow("imagens");
  expect(
    profileSchema.safeParse({
      ...data,
      gamerCards: [data.gamerCards[0], data.gamerCards[0]],
    }).success,
  ).toBe(false);
});
it.each([
  "javascript:alert(1)",
  "https://127.0.0.1/",
  "https://user:pass@example.com/",
  "https://x.local/",
])("recusa URL perigosa de cartão: %s", (url) => {
  expect(gamerCardSchema.safeParse(card({ url })).success).toBe(false);
});
it("valida textos, enumerações e campos extras", () => {
  for (const change of [
    { displayName: "bad\0name" },
    { handle: "a\nfoo" },
    { style: "<script>" },
    { color: "url(javascript:x)" },
    { online: true },
  ])
    expect(gamerCardSchema.safeParse({ ...card(), ...change }).success).toBe(
      false,
    );
});
it("Pro grava todos os temas e efeitos; expiração produz fallback sem apagar cartões", async () => {
  await fixture.db.entitlement.create({
    data: { userId: "owner", plan: "PRO" },
  });
  for (const theme of themes)
    data = await profiles.saveProfile("owner", {
      ...data,
      themeId: theme.id,
      backgroundColor: theme.background,
    });
  data = await profiles.saveProfile("owner", {
    ...data,
    gamerCards: Array.from({ length: 12 }, () =>
      card({
        style: "holographic",
        glow: true,
        animated: true,
        layout: "banner",
      }),
    ),
    backgroundEffect: "stars",
    avatarEffect: "ring",
    buttonEffect: "shine",
    entranceEffect: "sequence",
    fontFamily: "mono",
  });
  expect(
    (await publicProfiles.getPublicProfile(data.username))?.profile.gamerCards,
  ).toHaveLength(12);
  await fixture.db.entitlement.update({
    where: { userId: "owner" },
    data: { expiresAt: new Date(0) },
  });
  const free = (await publicProfiles.getPublicProfile(data.username))!.profile;
  expect(free.gamerCards).toHaveLength(3);
  expect(free.gamerCards[0].glow).toBe(false);
  expect(free.themeId).toBe("midnight-purple");
  expect(free.backgroundEffect).toBe("none");
  expect((await profiles.getOwnedProfile("owner"))?.gamerCards).toHaveLength(
    12,
  );
  await expect(profiles.saveProfile("owner", data)).rejects.toThrow("Pro");
});
it("rascunho não expõe cartões e exclusão faz cascata", async () => {
  await fixture.db.profile.update({
    where: { userId: "owner" },
    data: { published: false },
  });
  expect(await publicProfiles.getPublicProfile(data.username)).toBeNull();
  await fixture.db.user.delete({ where: { id: "owner" } });
  expect(await fixture.db.gamerCard.count()).toBe(0);
});
