import { beforeAll, afterAll, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { setupDB } from "./setup-db";
import { studioSchema, defaultStudio } from "../src/lib/studio-schema";
import type { BlockInput, ProfileInput } from "../src/lib/validation";
let f: Awaited<ReturnType<typeof setupDB>>,
  p: typeof import("../src/lib/profiles"),
  pub: typeof import("../src/lib/public-profile"),
  data: ProfileInput;
const block = (extra: Partial<BlockInput> = {}): BlockInput => ({
  id: randomUUID(),
  kind: "achievement",
  title: "Explorador",
  description: "Minha conquista",
  icon: "sparkles",
  url: "",
  imageKeys: [],
  items: [],
  game: "Minecraft",
  date: "2026-10-27",
  cardId: null,
  hidden: false,
  width: 1,
  ...extra,
});
beforeAll(async () => {
  f = await setupDB();
  p = await import("../src/lib/profiles");
  pub = await import("../src/lib/public-profile");
  await f.db.user.createMany({
    data: [
      { id: "owner", name: "Owner", email: "studio@example.com" },
      { id: "other", name: "Other", email: "other@example.com" },
    ],
  });
  data = {
    ...p.emptyProfile("Owner"),
    username: "studio_player",
    published: true,
  };
});
afterAll(async () => f?.close());
it("Free mantém o layout atual e não cria blocos ou colunas Pro", async () => {
  data = await p.saveProfile("owner", data);
  await expect(
    p.saveProfile("owner", {
      ...data,
      studio: { ...data.studio, layout: "dashboard", columns: 2 },
    }),
  ).rejects.toThrow("Pro");
  await expect(
    p.saveProfile("owner", { ...data, blocks: [block()] }),
  ).rejects.toThrow("Pro");
});
it("Pro persiste layout, blocos e ordem sem perder identidade", async () => {
  await f.db.entitlement.create({ data: { userId: "owner", plan: "PRO" } });
  const first = block(),
    second = block({
      kind: "project",
      title: "Meu projeto",
      url: "https://example.com/",
    });
  data = await p.saveProfile("owner", {
    ...data,
    studio: {
      ...studioSchema.parse(defaultStudio),
      layout: "dashboard",
      columns: 2,
      order: ["identity", "blocks", "gamerCards", "links"],
    },
    blocks: [second, first],
    vibeCardStyle: "galaxy",
  });
  expect((await p.getOwnedProfile("owner"))?.blocks.map((b) => b.id)).toEqual([
    second.id,
    first.id,
  ]);
  expect(
    (await pub.getPublicProfile(data.username))?.profile.studio.columns,
  ).toBe(2);
});
it.each(["classic", "dashboard", "showcase", "portfolio"] as const)(
  "layout %s persiste na API de domínio e no DTO público",
  async (layout) => {
    data = await p.saveProfile("owner", {
      ...data,
      studio: { ...data.studio, layout },
    });
    expect((await p.getOwnedProfile("owner"))?.studio.layout).toBe(layout);
    expect(
      (await pub.getPublicProfile(data.username))?.profile.studio.layout,
    ).toBe(layout);
  },
);
it("cliente antigo não apaga Studio e blocos quando omite os campos novos", async () => {
  const legacy = Object.fromEntries(
    Object.entries(data).filter(
      ([key]) => !["studio", "blocks", "vibeCardStyle"].includes(key),
    ),
  );
  data = await p.saveProfile("owner", {
    ...legacy,
    bio: "Old client, new data preserved",
  });
  expect(data.blocks).toHaveLength(2);
  expect(data.studio.layout).toBe("portfolio");
  expect(data.vibeCardStyle).toBe("galaxy");
});
it("IDs alheios, imagens estranhas e conteúdo ativo são recusados", async () => {
  await f.db.entitlement.create({ data: { userId: "other", plan: "PRO" } });
  await expect(
    p.saveProfile("other", {
      ...p.emptyProfile("Other"),
      username: "other_studio",
      blocks: [data.blocks[0]],
    }),
  ).rejects.toThrow("não pertence");
  await expect(
    p.saveProfile("owner", {
      ...data,
      blocks: [block({ kind: "gallery", imageKeys: [randomUUID()] })],
    }),
  ).rejects.toThrow("imagem");
  await expect(
    p.saveProfile("owner", {
      ...data,
      blocks: [block({ url: "javascript:alert(1)" })],
    }),
  ).rejects.toThrow();
});
it("blocos ocultos não entram no DTO público", async () => {
  data = await p.saveProfile("owner", {
    ...data,
    blocks: data.blocks.map((b) => ({ ...b, hidden: true })),
  });
  expect((await pub.getPublicProfile(data.username))?.profile.blocks).toEqual(
    [],
  );
});
it("expiração oculta Studio e blocos mas um save Free preserva dados privados", async () => {
  await f.db.entitlement.update({
    where: { userId: "owner" },
    data: { expiresAt: new Date(0) },
  });
  const free = (await pub.getPublicProfile(data.username))!.profile;
  expect(free.blocks).toEqual([]);
  expect(free.studio.layout).toBe("classic");
  expect(free.vibeCardStyle).toBe("minimal");
  const { editableAppearance } = await import("../src/lib/appearance");
  data = await p.saveProfile("owner", {
    ...editableAppearance(data, false, true),
    bio: "Edited on Free",
  });
  expect((await p.getOwnedProfile("owner"))?.blocks).toHaveLength(2);
  expect((await p.getOwnedProfile("owner"))?.studio.layout).toBe("portfolio");
  expect((await p.getOwnedProfile("owner"))?.vibeCardStyle).toBe("galaxy");
});
it("galeria usa upload real, é privada quando oculta e some no downgrade", async () => {
  const { auth } = await import("../src/lib/auth");
  const creds = {
    email: "gallery@example.com",
    password: "a-very-long-passphrase",
  };
  await auth.api.signUpEmail({ body: { ...creds, name: "Gallery" } });
  const r = await auth.handler(
    new Request("http://localhost:3000/api/auth/sign-in/email", {
      method: "POST",
      headers: {
        origin: "http://localhost:3000",
        "content-type": "application/json",
      },
      body: JSON.stringify(creds),
    }),
  );
  const cookie = r.headers.get("set-cookie")!.split(";")[0];
  const owner = (
    await f.db.user.findUniqueOrThrow({ where: { email: creds.email } })
  ).id;
  const uploads = await import("../src/app/api/uploads/[kind]/route"),
    media = await import("../src/app/api/media/[id]/route");
  const image = await sharp({
    create: { width: 32, height: 32, channels: 3, background: "red" },
  })
    .png()
    .toBuffer();
  const send = () =>
    uploads.POST(
      new Request("http://localhost:3000/api/uploads/gallery", {
        method: "POST",
        headers: {
          origin: "http://localhost:3000",
          cookie,
          "content-type": "image/png",
        },
        body: new Uint8Array(image),
      }),
      { params: Promise.resolve({ kind: "gallery" }) },
    );
  expect((await send()).status).toBe(403);
  await f.db.entitlement.create({ data: { userId: owner, plan: "PRO" } });
  const uploaded = await send();
  expect(uploaded.status).toBe(200);
  const key = (await uploaded.json()).key;
  const profile = await p.saveProfile(owner, {
    ...p.emptyProfile("Gallery"),
    username: "gallery_player",
    published: true,
    blocks: [block({ kind: "gallery", imageKeys: [key] })],
  });
  const get = () =>
    media.GET(new Request("http://localhost:3000/api/media/" + key), {
      params: Promise.resolve({ id: key }),
    });
  expect((await get()).status).toBe(200);
  await p.saveProfile(owner, {
    ...profile,
    blocks: profile.blocks.map((b) => ({ ...b, hidden: true })),
  });
  expect((await get()).status).toBe(404);
  await f.db.entitlement.update({
    where: { userId: owner },
    data: { expiresAt: new Date(0) },
  });
  expect((await get()).status).toBe(404);
  expect(await f.db.upload.count({ where: { id: key } })).toBe(1);
});
