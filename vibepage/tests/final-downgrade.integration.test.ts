import { afterAll, beforeAll, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { setupDB } from "./setup-db";
import { editableAppearance } from "../src/lib/appearance";
import { demoProfile } from "../src/lib/demo-profile";
let f: Awaited<ReturnType<typeof setupDB>>;
let p: typeof import("../src/lib/profiles");
let pub: typeof import("../src/lib/public-profile");
beforeAll(async () => {
  f = await setupDB();
  p = await import("../src/lib/profiles");
  pub = await import("../src/lib/public-profile");
});
afterAll(async () => f?.close());
async function expiredProfile(id: string, count: number) {
  await f.db.user.create({
    data: { id, name: id, email: id + "@example.com" },
  });
  await f.db.entitlement.create({ data: { userId: id, plan: "PRO" } });
  const key = randomUUID();
  const content = await sharp({
    create: { width: 8, height: 8, channels: 3, background: "#a78bfa" },
  })
    .webp()
    .toBuffer();
  await f.db.upload.create({
    data: {
      id: key,
      userId: id,
      kind: "background",
      content,
      width: 8,
      height: 8,
    },
  });
  const saved = await p.saveProfile(id, {
    ...p.emptyProfile(id),
    username: id,
    published: true,
    themeId: "galaxy-purple",
    backgroundKey: key,
    backgroundColor: "#221144",
    buttonStyle: "pill",
    animation: "glow",
    hideBranding: true,
    backgroundEffect: "aurora",
    avatarEffect: "ring",
    buttonEffect: "shine",
    entranceEffect: "sequence",
    fontFamily: "mono",
    gamerCards: Array.from({ length: count }, (_, i) => ({
      ...demoProfile.gamerCards[0],
      id: randomUUID(),
      displayName: "Card " + i,
      style: "holographic",
      layout: "banner",
      glow: true,
      animated: true,
    })),
  });
  await f.db.entitlement.update({
    where: { userId: id },
    data: { expiresAt: new Date(0) },
  });
  return saved;
}
it("save Free de identidade preserva aparência Pro privada e a restaura ao reativar", async () => {
  const saved = await expiredProfile("audit_private", 3);
  await p.saveProfile("audit_private", {
    ...editableAppearance(saved, false, true),
    bio: "Editado no Free",
  });
  const raw = (await p.getOwnedProfile("audit_private"))!;
  for (const key of [
    "backgroundKey",
    "backgroundColor",
    "themeId",
    "buttonStyle",
    "animation",
    "hideBranding",
    "backgroundEffect",
    "avatarEffect",
    "buttonEffect",
    "entranceEffect",
    "fontFamily",
  ] as const)
    expect(raw[key], key).toBe(saved[key]);
  expect(raw.gamerCards[0].style).toBe("holographic");
  expect(raw.gamerCards[0].glow).toBe(true);
  const free = (await pub.getPublicProfile(saved.username))!.profile;
  expect(free.backgroundKey).toBeNull();
  expect(free.gamerCards[0].style).toBe("minimal");
  await f.db.entitlement.update({
    where: { userId: "audit_private" },
    data: { expiresAt: null },
  });
  const renewed = (await pub.getPublicProfile(saved.username))!.profile;
  expect(renewed.backgroundKey).toBe(saved.backgroundKey);
  expect(renewed.themeId).toBe(saved.themeId);
  expect(renewed.bio).toBe("Editado no Free");
});
it("doze cartões legados não obrigam apagar nove para salvar identidade no Free", async () => {
  const saved = await expiredProfile("audit_excess", 12);
  const next = await p.saveProfile("audit_excess", {
    ...editableAppearance(saved, false, true),
    displayName: "Novo nome",
  });
  expect(next.gamerCards).toHaveLength(12);
  expect((await p.getOwnedProfile("audit_excess"))?.gamerCards).toHaveLength(
    12,
  );
  expect(
    (await pub.getPublicProfile(saved.username))?.profile.gamerCards,
  ).toHaveLength(3);
  await expect(
    p.saveProfile("audit_excess", {
      ...next,
      gamerCards: [
        ...next.gamerCards.slice(0, 11),
        { ...next.gamerCards[0], id: randomUUID() },
      ],
    }),
  ).rejects.toThrow("Pro");
});
it("preservação não impede Free de trocar uma paleta gratuita", async () => {
  await f.db.user.create({
    data: { id: "audit_free", name: "Free", email: "audit-free@example.com" },
  });
  const first = await p.saveProfile("audit_free", {
    ...p.emptyProfile("Free"),
    username: "audit_free",
  });
  const { applyTheme } = await import("../src/lib/appearance");
  const selected = applyTheme(first, "ice-blue");
  await p.saveProfile("audit_free", selected);
  const saved = (await p.getOwnedProfile("audit_free"))!;
  expect(saved.themeId).toBe("ice-blue");
  expect(saved.backgroundColor).toBe(selected.backgroundColor);
});
