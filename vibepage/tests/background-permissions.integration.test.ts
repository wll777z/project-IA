import { beforeAll, afterAll, it, expect } from "vitest";
import sharp from "sharp";
import { setupDB } from "./setup-db";
import { editableAppearance } from "../src/lib/appearance";
let fixture: Awaited<ReturnType<typeof setupDB>>;
let profiles: typeof import("../src/lib/profiles");
let publicProfiles: typeof import("../src/lib/public-profile");
let uploads: typeof import("../src/app/api/uploads/[kind]/route");
let media: typeof import("../src/app/api/media/[id]/route");
let profileAPI: typeof import("../src/app/api/profile/route");
let cookie: string, userId: string, image: Buffer, key: string;
let saved: import("../src/lib/validation").ProfileInput;
const headers = () => ({
  cookie,
  origin: "http://localhost:3000",
  "content-type": "application/json",
});
const upload = () =>
  uploads.POST(
    new Request("http://localhost:3000/api/uploads/background", {
      method: "POST",
      headers: { ...headers(), "content-type": "image/png" },
      body: new Uint8Array(image),
    }),
    { params: Promise.resolve({ kind: "background" }) },
  );
const getImage = (session = "") =>
  media.GET(
    new Request("http://localhost:3000/api/media/" + key, {
      headers: { cookie: session },
    }),
    { params: Promise.resolve({ id: key }) },
  );
beforeAll(async () => {
  fixture = await setupDB();
  profiles = await import("../src/lib/profiles");
  publicProfiles = await import("../src/lib/public-profile");
  uploads = await import("../src/app/api/uploads/[kind]/route");
  media = await import("../src/app/api/media/[id]/route");
  profileAPI = await import("../src/app/api/profile/route");
  const { auth } = await import("../src/lib/auth");
  const credentials = {
    email: "background@example.com",
    password: "a-long-passphrase-123",
  };
  await auth.api.signUpEmail({
    body: { ...credentials, name: "Background Player" },
  });
  const login = await auth.handler(
    new Request("http://localhost:3000/api/auth/sign-in/email", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(credentials),
    }),
  );
  cookie = login.headers.get("set-cookie")!.split(";")[0];
  userId = (
    await fixture.db.user.findUniqueOrThrow({
      where: { email: credentials.email },
    })
  ).id;
  image = await sharp({
    create: { width: 32, height: 32, channels: 3, background: "#a78bfa" },
  })
    .png()
    .toBuffer();
  saved = {
    ...profiles.emptyProfile("Background Player"),
    username: "background_player",
    published: true,
  };
});
afterAll(async () => fixture?.close());
it("Free não pode enviar imagem de fundo pela API", async () => {
  expect((await upload()).status).toBe(403);
  expect(await fixture.db.upload.count()).toBe(0);
});
it("Pro publica fundo; expiração o retira do DTO e da mídia pública sem apagar o arquivo", async () => {
  await fixture.db.entitlement.create({ data: { userId, plan: "PRO" } });
  const uploaded = await upload();
  expect(uploaded.status).toBe(200);
  key = (await uploaded.json()).key;
  saved = await profiles.saveProfile(userId, {
    ...saved,
    backgroundKey: key,
    themeId: "pink-dream",
    backgroundColor: "#201020",
    buttonStyle: "pill",
    animation: "glow",
    hideBranding: true,
    backgroundEffect: "aurora",
    avatarEffect: "ring",
    buttonEffect: "neon",
    entranceEffect: "zoom",
    fontFamily: "rounded",
  });
  expect((await getImage()).status).toBe(200);
  expect(
    (await publicProfiles.getPublicProfile(saved.username))?.profile
      .backgroundKey,
  ).toBe(key);
  await fixture.db.entitlement.update({
    where: { userId },
    data: { expiresAt: new Date(0) },
  });
  const free = (await publicProfiles.getPublicProfile(saved.username))!.profile;
  expect(free.backgroundKey).toBeNull();
  expect(free.themeId).toBe("midnight-purple");
  expect(free.backgroundColor).toBe("#100c1b");
  expect(free.buttonStyle).toBe("soft");
  expect(free.animation).toBe("none");
  expect(free.hideBranding).toBe(false);
  expect(free.backgroundEffect).toBe("none");
  expect(free.avatarEffect).toBe("none");
  expect(free.buttonEffect).toBe("none");
  expect(free.entranceEffect).toBe("fade");
  expect(free.fontFamily).toBe("modern");
  expect(free.accentColor).toBe(saved.accentColor);
  expect((await getImage()).status).toBe(404);
  expect((await getImage(cookie)).status).toBe(200);
  expect((await profiles.getOwnedProfile(userId))?.backgroundKey).toBe(key);
});
it("Free não reaplica imagem Pro nem com payload forjado; remover o fundo permite salvar", async () => {
  const basic = editableAppearance(saved, false, true);
  expect(basic.backgroundKey).toBeNull();
  const response = await profileAPI.PUT(
    new Request("http://localhost:3000/api/profile", {
      method: "PUT",
      headers: headers(),
      body: JSON.stringify({ ...basic, backgroundKey: key }),
    }),
  );
  expect(response.status).toBe(403);
  const success = await profileAPI.PUT(
    new Request("http://localhost:3000/api/profile", {
      method: "PUT",
      headers: headers(),
      body: JSON.stringify(basic),
    }),
  );
  expect(success.status).toBe(200);
});
