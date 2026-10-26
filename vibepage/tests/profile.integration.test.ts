import { beforeAll, afterAll, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { setupDB } from "./setup-db";
let fixture: Awaited<ReturnType<typeof setupDB>>;
let services: typeof import("../src/lib/profiles");
let route: typeof import("../src/app/api/profile/route");
let uploads: typeof import("../src/lib/uploads");
let input: import("../src/lib/validation").ProfileInput;
let cookie = "";
beforeAll(async () => {
  fixture = await setupDB();
  services = await import("../src/lib/profiles");
  route = await import("../src/app/api/profile/route");
  uploads = await import("../src/lib/uploads");
  const { auth } = await import("../src/lib/auth");
  await auth.api.signUpEmail({
    body: {
      name: "Player",
      email: "owner@example.com",
      password: "a-very-long-passphrase",
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
        email: "owner@example.com",
        password: "a-very-long-passphrase",
      }),
    }),
  );
  cookie = (login.headers.get("set-cookie") || "").split(";")[0];
  input = {
    ...services.emptyProfile("Player"),
    username: "player_77",
    links: [
      { id: randomUUID(), title: "Canal", url: "https://example.com/channel" },
      { id: randomUUID(), title: "Comunidade", url: "https://example.org/" },
    ],
  };
});
afterAll(async () => fixture?.close());
const request = (
  data: unknown = input,
  origin = "http://localhost:3000",
  withCookie = true,
) =>
  new Request("http://localhost:3000/api/profile", {
    method: "PUT",
    headers: {
      origin,
      "content-type": "application/json",
      ...(withCookie ? { cookie } : {}),
    },
    body: JSON.stringify(data),
  });
it("exige sessão e origem nas alterações", async () => {
  expect((await route.PUT(request(input, undefined, false))).status).toBe(401);
  expect(
    (await route.PUT(request(input, "https://attacker.example"))).status,
  ).toBe(403);
});
it("cria perfil persistente com links em ordem", async () => {
  const r = await route.PUT(request());
  expect(r.status).toBe(200);
  input = (await r.json()).profile;
  expect(input.revision).toBe(1);
  expect(
    (
      await services.getOwnedProfile(
        (
          await fixture.db.user.findUniqueOrThrow({
            where: { email: "owner@example.com" },
          })
        ).id,
      )
    )?.links[0].title,
  ).toBe("Canal");
});
it("reordena sem perder ids e rejeita abas antigas", async () => {
  const old = { ...input };
  input = { ...input, links: [...input.links].reverse() };
  const r = await route.PUT(request());
  expect(r.status).toBe(200);
  input = (await r.json()).profile;
  expect(input.links[0].title).toBe("Comunidade");
  expect((await route.PUT(request(old))).status).toBe(409);
});
it("recusa campos arbitrários e URLs ativas", async () => {
  expect((await route.PUT(request({ ...input, userId: "other" }))).status).toBe(
    400,
  );
  expect(
    (
      await route.PUT(
        request({
          ...input,
          links: [
            { id: randomUUID(), title: "Bad", url: "javascript:alert(1)" },
          ],
        }),
      )
    ).status,
  ).toBe(400);
});
it("não permite recursos Pro no plano Free", async () => {
  expect(
    (await route.PUT(request({ ...input, hideBranding: true }))).status,
  ).toBe(403);
  expect(
    (await route.PUT(request({ ...input, themeId: "cyber-neon" }))).status,
  ).toBe(403);
});
it("recusa imagens de outra conta", async () => {
  expect(
    (await route.PUT(request({ ...input, avatarKey: randomUUID() }))).status,
  ).toBe(403);
});
it("garante username único e impede roubo de link", async () => {
  await fixture.db.user.create({
    data: { id: "other", name: "Other", email: "other@example.com" },
  });
  await expect(
    services.saveProfile("other", {
      ...services.emptyProfile("Other"),
      username: input.username,
    }),
  ).rejects.toThrow();
  await expect(
    services.saveProfile("other", {
      ...input,
      username: "other_person",
      revision: 0,
    }),
  ).rejects.toThrow("não pertence");
});
it("processa imagem removendo metadados e limita pixels/tipos", async () => {
  const source = await sharp({
    create: { width: 24, height: 24, channels: 3, background: "#a78bfa" },
  })
    .png()
    .toBuffer();
  const result = await uploads.processImage(source, "image/png", "avatar");
  expect(result.mimeType).toBe("image/webp");
  expect((await sharp(result.content).metadata()).exif).toBeUndefined();
  await expect(
    uploads.processImage(source, "image/jpeg", "avatar"),
  ).rejects.toThrow();
  await expect(
    uploads.processImage(
      Buffer.from('<svg onload="alert(1)"/>'),
      "image/svg+xml",
      "avatar",
    ),
  ).rejects.toThrow();
  await expect(
    uploads.processImage(
      Buffer.alloc(4 * 1024 * 1024 + 1),
      "image/png",
      "avatar",
    ),
  ).rejects.toThrow();
});
it("aplica limite atômico em requisições concorrentes", async () => {
  const { consumeLimit } = await import("../src/lib/limits");
  const r = await Promise.allSettled(
    Array.from({ length: 8 }, () =>
      consumeLimit("same-owner", "test-limit", 3),
    ),
  );
  expect(r.filter((v) => v.status === "fulfilled")).toHaveLength(3);
});
it("mantém a imagem publicada até salvar a imagem nova e limita o armazenamento", async () => {
  const uploadRoute = await import("../src/app/api/uploads/[kind]/route");
  const mediaRoute = await import("../src/app/api/media/[id]/route");
  const image = await sharp({
    create: { width: 32, height: 32, channels: 3, background: "red" },
  })
    .png()
    .toBuffer();
  const makeRequest = () =>
    new Request("http://localhost:3000/api/uploads/avatar", {
      method: "POST",
      headers: {
        origin: "http://localhost:3000",
        cookie,
        "content-type": "image/png",
      },
      body: new Uint8Array(image),
    });
  const first = await uploadRoute.POST(makeRequest(), {
    params: Promise.resolve({ kind: "avatar" }),
  });
  expect(first.status).toBe(200);
  const firstKey = (await first.json()).key;
  const user = await fixture.db.user.findUniqueOrThrow({
    where: { email: "owner@example.com" },
  });
  input = await services.saveProfile(user.id, {
    ...input,
    avatarKey: firstKey,
    published: true,
  });
  const second = await uploadRoute.POST(makeRequest(), {
    params: Promise.resolve({ kind: "avatar" }),
  });
  expect(second.status).toBe(200);
  const secondKey = (await second.json()).key;
  expect(secondKey).not.toBe(firstKey);
  expect(
    (await fixture.db.profile.findUniqueOrThrow({ where: { userId: user.id } }))
      .avatarKey,
  ).toBe(firstKey);
  expect(
    (
      await mediaRoute.GET(new Request("http://localhost:3000/api/media"), {
        params: Promise.resolve({ id: firstKey }),
      })
    ).status,
  ).toBe(200);
  expect(
    (
      await mediaRoute.GET(new Request("http://localhost:3000/api/media"), {
        params: Promise.resolve({ id: secondKey }),
      })
    ).status,
  ).toBe(404);
  await uploadRoute.POST(makeRequest(), {
    params: Promise.resolve({ kind: "avatar" }),
  });
  expect(
    await fixture.db.upload.count({
      where: { userId: user.id, kind: "avatar" },
    }),
  ).toBe(2);
});
it("limita o corpo da autenticação antes de processá-lo", async () => {
  const authRoute = await import("../src/app/api/auth/[...all]/route");
  const result = await authRoute.POST(
    new Request("http://localhost:3000/api/auth/sign-in/email", {
      method: "POST",
      headers: {
        origin: "http://localhost:3000",
        "content-type": "application/json",
      },
      body: JSON.stringify({ extra: "x".repeat(17000) }),
    }),
  );
  expect(result.status).toBe(413);
});
it("remove links e uploads ao excluir o dono", async () => {
  const user = await fixture.db.user.findUniqueOrThrow({
    where: { email: "owner@example.com" },
  });
  await fixture.db.user.delete({ where: { id: user.id } });
  expect(await fixture.db.profile.count()).toBe(0);
  expect(await fixture.db.profileLink.count()).toBe(0);
  expect(await fixture.db.upload.count()).toBe(0);
});
