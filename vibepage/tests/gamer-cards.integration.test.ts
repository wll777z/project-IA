import { beforeAll, afterAll, it, expect } from "vitest";
import sharp from "sharp";
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
it("normaliza avatar de cartão, protege rascunho e inclui dados na exportação", async () => {
  const { auth } = await import("../src/lib/auth");
  await auth.api.signUpEmail({
    body: {
      name: "Uploader",
      email: "upload@example.com",
      password: "a-long-passphrase-123",
    },
  });
  const login = await auth.handler(
    new Request("http://localhost:3000/api/auth/sign-in/email", {
      method: "POST",
      headers: {
        origin: "http://localhost:3000",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        email: "upload@example.com",
        password: "a-long-passphrase-123",
      }),
    }),
  );
  const cookie = login.headers.get("set-cookie")!.split(";")[0];
  const user = await fixture.db.user.findUniqueOrThrow({
    where: { email: "upload@example.com" },
  });
  const upload = await import("../src/app/api/uploads/[kind]/route");
  const media = await import("../src/app/api/media/[id]/route");
  const image = await sharp({
    create: { width: 32, height: 32, channels: 3, background: "red" },
  })
    .png()
    .toBuffer();
  const response = await upload.POST(
    new Request("http://localhost:3000/api/uploads/gamer-avatar", {
      method: "POST",
      headers: {
        cookie,
        origin: "http://localhost:3000",
        "content-type": "image/png",
      },
      body: new Uint8Array(image),
    }),
    { params: Promise.resolve({ kind: "gamer-avatar" }) },
  );
  expect(response.status).toBe(200);
  const key = (await response.json()).key;
  const ctx = { params: Promise.resolve({ id: key }) };
  expect(
    (
      await media.GET(
        new Request("http://localhost:3000/api/media/" + key),
        ctx,
      )
    ).status,
  ).toBe(404);
  const own = await media.GET(
    new Request("http://localhost:3000/api/media/" + key, {
      headers: { cookie },
    }),
    ctx,
  );
  expect(own.status).toBe(200);
  expect(own.headers.get("content-type")).toBe("image/webp");
  let saved = await profiles.saveProfile(user.id, {
    ...profiles.emptyProfile("Uploader"),
    username: "uploader",
    gamerCards: [card({ avatarKey: key })],
  });
  saved = await profiles.saveProfile(user.id, { ...saved, published: true });
  expect(
    (
      await media.GET(
        new Request("http://localhost:3000/api/media/" + key),
        ctx,
      )
    ).status,
  ).toBe(200);
  await expect(
    profiles.saveProfile("other", {
      ...profiles.emptyProfile("Other"),
      username: "other_player",
      gamerCards: [card({ avatarKey: key })],
    }),
  ).rejects.toThrow("imagens");
  const exportRoute = await import("../src/app/api/account/export/route");
  const exported = await (
    await exportRoute.GET(
      new Request("http://localhost:3000/api/account/export", {
        headers: { cookie },
      }),
    )
  ).json();
  expect(exported.profile.gamerCards[0].avatarKey).toBe(key);
  await fixture.db.entitlement.create({
    data: { userId: user.id, plan: "PRO" },
  });
  saved = await profiles.saveProfile(user.id, {
    ...saved,
    gamerCards: [card(), card(), card(), card({ avatarKey: key })],
  });
  await fixture.db.entitlement.update({
    where: { userId: user.id },
    data: { expiresAt: new Date(0) },
  });
  expect(
    (
      await media.GET(
        new Request("http://localhost:3000/api/media/" + key),
        ctx,
      )
    ).status,
  ).toBe(404);
  expect((await profiles.getOwnedProfile(user.id))?.gamerCards).toHaveLength(4);
  await profiles.saveProfile(user.id, { ...saved, gamerCards: [] });
  expect(
    await fixture.db.upload.count({
      where: { userId: user.id, kind: "gamer-avatar" },
    }),
  ).toBe(0);
  expect(
    (
      await media.GET(
        new Request("http://localhost:3000/api/media/" + key),
        ctx,
      )
    ).status,
  ).toBe(404);
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
