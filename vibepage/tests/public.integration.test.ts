import { beforeAll, afterAll, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { setupDB } from "./setup-db";
let fixture: Awaited<ReturnType<typeof setupDB>>;
let publicService: typeof import("../src/lib/public-profile");
let go: typeof import("../src/app/go/[id]/route");
let media: typeof import("../src/app/api/media/[id]/route");
const linkId = randomUUID(),
  imageId = randomUUID();
beforeAll(async () => {
  fixture = await setupDB();
  publicService = await import("../src/lib/public-profile");
  go = await import("../src/app/go/[id]/route");
  media = await import("../src/app/api/media/[id]/route");
  await fixture.db.user.create({
    data: { id: "owner", name: "Owner", email: "private@example.com" },
  });
  await fixture.db.theme.create({
    data: { id: "midnight-purple", name: "Midnight Purple" },
  });
  await fixture.db.profile.create({
    data: {
      userId: "owner",
      username: "the_player",
      displayName: "Player",
      links: {
        create: {
          id: linkId,
          title: "Canal",
          url: "https://example.com/channel",
          position: 0,
        },
      },
    },
  });
  const content = await sharp({
    create: { width: 20, height: 20, channels: 3, background: "purple" },
  })
    .webp()
    .toBuffer();
  await fixture.db.upload.create({
    data: {
      id: imageId,
      userId: "owner",
      kind: "avatar",
      content,
      width: 20,
      height: 20,
    },
  });
  await fixture.db.profile.update({
    where: { userId: "owner" },
    data: { avatarKey: imageId },
  });
});
afterAll(async () => fixture?.close());
it("rascunhos e nomes reservados não são públicos", async () => {
  expect(await publicService.getPublicProfile("the_player")).toBeNull();
  expect(await publicService.getPublicProfile("dashboard")).toBeNull();
  expect(
    (
      await go.GET(new Request("http://localhost/go"), {
        params: Promise.resolve({ id: linkId }),
      })
    ).status,
  ).toBe(404);
});
it("uploads de rascunho não vazam para anônimos", async () => {
  expect(
    (
      await media.GET(new Request("http://localhost/api/media"), {
        params: Promise.resolve({ id: imageId }),
      })
    ).status,
  ).toBe(404);
});
it("publica apenas o DTO público", async () => {
  await fixture.db.profile.update({
    where: { userId: "owner" },
    data: { published: true },
  });
  const result = await publicService.getPublicProfile("the_player");
  expect(result?.profile.displayName).toBe("Player");
  expect(JSON.stringify(result)).not.toContain("private@example.com");
  expect(result?.profile).not.toHaveProperty("userId");
});
it("redireciona somente para o destino salvo e retorna imagem normalizada", async () => {
  const r = await go.GET(
    new Request("http://localhost/go?url=https://bad.example"),
    { params: Promise.resolve({ id: linkId }) },
  );
  expect(r.status).toBe(302);
  expect(r.headers.get("location")).toBe("https://example.com/channel");
  const img = await media.GET(new Request("http://localhost/api/media"), {
    params: Promise.resolve({ id: imageId }),
  });
  expect(img.status).toBe(200);
  expect(img.headers.get("content-type")).toBe("image/webp");
});
it("não renderiza destinos legados inválidos em perfis públicos", async () => {
  await fixture.db.profileLink.update({
    where: { id: linkId },
    data: { url: "https://legacy.local." },
  });
  expect(
    (await publicService.getPublicProfile("the_player"))?.profile.links,
  ).toHaveLength(0);
  expect(
    (
      await go.GET(new Request("http://localhost/go"), {
        params: Promise.resolve({ id: linkId }),
      })
    ).status,
  ).toBe(404);
  await fixture.db.profileLink.update({
    where: { id: linkId },
    data: { url: "https://example.com/channel" },
  });
});
it("despublicação bloqueia links e imagens", async () => {
  await fixture.db.profile.update({
    where: { userId: "owner" },
    data: { published: false },
  });
  expect(
    (
      await go.GET(new Request("http://localhost/go"), {
        params: Promise.resolve({ id: linkId }),
      })
    ).status,
  ).toBe(404);
  expect(
    (
      await media.GET(new Request("http://localhost/api/media"), {
        params: Promise.resolve({ id: imageId }),
      })
    ).status,
  ).toBe(404);
});
