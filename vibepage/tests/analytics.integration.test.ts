import { beforeAll, afterAll, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { setupDB } from "./setup-db";
let fixture: Awaited<ReturnType<typeof setupDB>>;
let stats: typeof import("../src/lib/analytics");
let profile: typeof import("../src/lib/public-profile");
let save: typeof import("../src/lib/profiles");
const linkId = randomUUID();
beforeAll(async () => {
  fixture = await setupDB();
  stats = await import("../src/lib/analytics");
  profile = await import("../src/lib/public-profile");
  save = await import("../src/lib/profiles");
  await fixture.db.user.create({
    data: { id: "owner", name: "Player", email: "player@example.com" },
  });
  await fixture.db.user.create({
    data: { id: "stranger", name: "Other", email: "other@example.com" },
  });
  await fixture.db.theme.create({
    data: { id: "cyber-neon", name: "Cyber Neon", premium: true },
  });
  await fixture.db.profile.create({
    data: {
      userId: "owner",
      username: "analytics_player",
      displayName: "Player",
      themeId: "cyber-neon",
      hideBranding: true,
      animation: "glow",
      published: true,
      links: {
        create: {
          id: linkId,
          title: "Canal",
          url: "https://example.com",
          position: 0,
        },
      },
    },
  });
});
afterAll(async () => fixture?.close());
it("soma visitas e cliques atomicamente", async () => {
  await Promise.all(
    Array.from({ length: 4 }, () => stats.recordView("analytics_player")),
  );
  await stats.recordClick(linkId);
  const row = await fixture.db.pageView.findFirstOrThrow();
  expect(row.count).toBe(4);
  expect(row.clicks).toBe(1);
  expect(await fixture.db.linkClick.count()).toBe(1);
});
it("Free vê resumo sem detalhamento privado", async () => {
  const r = await stats.getStats("owner");
  expect(r.views).toBe(4);
  expect(r.pro).toBe(false);
  expect(r).not.toHaveProperty("days");
  expect(r).not.toHaveProperty("totalClicks");
  expect((await stats.getStats("stranger")).views).toBe(0);
});
it("tema premium e remoção de marca não vazam sem entitlement", async () => {
  const r = await profile.getPublicProfile("analytics_player");
  expect(r?.profile.themeId).toBe("midnight-purple");
  expect(r?.profile.hideBranding).toBe(false);
  expect(r?.profile.animation).toBe("none");
});
it("Pro recebe 30 dias de dados e personalização", async () => {
  await fixture.db.entitlement.create({
    data: {
      userId: "owner",
      plan: "PRO",
      expiresAt: new Date(Date.now() + 86400000),
    },
  });
  const r = await stats.getStats("owner");
  expect(r.pro).toBe(true);
  expect("days" in r && r.days).toHaveLength(30);
  expect("totalClicks" in r && r.totalClicks).toBe(1);
  const publicData = await profile.getPublicProfile("analytics_player");
  expect(publicData?.profile.themeId).toBe("cyber-neon");
  expect(publicData?.profile.hideBranding).toBe(true);
});
it("edição Pro funciona e expiração bloqueia novas alterações premium", async () => {
  const data = await save.getOwnedProfile("owner");
  expect(data).not.toBeNull();
  const saved = await save.saveProfile("owner", data);
  expect(saved.revision).toBe(1);
  await fixture.db.entitlement.update({
    where: { userId: "owner" },
    data: { expiresAt: new Date(Date.now() - 1000) },
  });
  expect((await stats.getStats("owner")).pro).toBe(false);
  await expect(save.saveProfile("owner", saved)).rejects.toThrow("Pro");
  const { editableAppearance } = await import("../src/lib/appearance");
  const free = editableAppearance(saved, false);
  expect((await save.saveProfile("owner", free)).themeId).toBe(
    "midnight-purple",
  );
});
it("rascunhos não registram visitas ou cliques", async () => {
  await fixture.db.profile.update({
    where: { userId: "owner" },
    data: { published: false },
  });
  await expect(stats.recordView("analytics_player")).rejects.toThrow(
    "não encontrado",
  );
  await stats.recordClick(linkId);
  expect((await fixture.db.pageView.findFirstOrThrow()).clicks).toBe(1);
});
it("excluir a conta elimina todos os agregados", async () => {
  await fixture.db.user.delete({ where: { id: "owner" } });
  expect(await fixture.db.pageView.count()).toBe(0);
  expect(await fixture.db.linkClick.count()).toBe(0);
});
