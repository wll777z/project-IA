import { beforeAll, afterAll, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import jsQR from "jsqr";
import { setupDB } from "./setup-db";
let f: Awaited<ReturnType<typeof setupDB>>,
  p: typeof import("../src/lib/profiles"),
  share: typeof import("../src/lib/sharing"),
  stats: typeof import("../src/lib/analytics-advanced");
let profile: import("../src/lib/validation").ProfileInput;
const linkId = randomUUID(),
  cardId = randomUUID();
const now = new Date("2026-10-27T12:00:00Z");
async function decode(buffer: Buffer) {
  const { data, info } = await sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return jsQR(new Uint8ClampedArray(data), info.width, info.height)?.data;
}
beforeAll(async () => {
  f = await setupDB();
  p = await import("../src/lib/profiles");
  share = await import("../src/lib/sharing");
  stats = await import("../src/lib/analytics-advanced");
  await f.db.user.createMany({
    data: [
      { id: "one", name: "One", email: "private@example.com" },
      { id: "other", name: "Other", email: "other@example.com" },
    ],
  });
  await f.db.entitlement.create({ data: { userId: "one", plan: "PRO" } });
  profile = await p.saveProfile("one", {
    ...p.emptyProfile("Sharing Player"),
    username: "sharing_player",
    published: true,
    links: [
      { id: linkId, title: "=malicious_formula", url: "https://example.com/" },
    ],
    gamerCards: [
      {
        id: cardId,
        game: "roblox",
        displayName: "Card One",
        handle: "@one",
        detail: "Provided by me",
        edition: "",
        url: "https://www.roblox.com/",
        avatarKey: null,
        color: "#a78bfa",
        style: "minimal",
        layout: "compact",
        icon: "gamepad",
        glow: false,
        animated: false,
      },
    ],
  });
});
afterAll(async () => f?.close());
it("QR PNG decodifica para a URL canônica exata sem serviço externo", async () => {
  expect(await decode(await share.qrPNG(profile.username))).toBe(
    "http://localhost:3000/sharing_player",
  );
});
it.each(["neon", "holographic", "minimal", "galaxy", "retro"] as const)(
  "VibeCard %s gera PNG e QR legível",
  async (style) => {
    const response = await share.vibeCardPNG(profile, style);
    expect(response.headers.get("cache-control")).toContain("no-store");
    const png = Buffer.from(await response.arrayBuffer());
    const info = await sharp(png).metadata();
    expect(info.width).toBe(1280);
    expect(info.height).toBe(720);
    const qr = await sharp(png)
      .extract({ left: 966, top: 230, width: 220, height: 220 })
      .png()
      .toBuffer();
    expect(await decode(qr)).toBe("http://localhost:3000/sharing_player");
  },
);
it("geração pública exige publicação; rascunhos retornam 404", async () => {
  const route = await import("../src/app/api/vibecard/[username]/route"),
    qr = await import("../src/app/api/qr/[username]/route");
  await p.saveProfile("other", {
    ...p.emptyProfile("Other"),
    username: "sharing_draft",
  });
  const ctx = { params: Promise.resolve({ username: "sharing_draft" }) };
  expect(
    (
      await route.GET(
        new Request("http://localhost:3000/api/vibecard/sharing_draft"),
        ctx,
      )
    ).status,
  ).toBe(404);
  expect(
    (
      await qr.GET(
        new Request("http://localhost:3000/api/qr/sharing_draft"),
        ctx,
      )
    ).status,
  ).toBe(404);
});
it("analytics compara períodos, trata base zero e sanitiza fórmulas no CSV", async () => {
  const record = await f.db.profile.findUniqueOrThrow({
    where: { userId: "one" },
  });
  await f.db.pageView.createMany({
    data: [
      {
        profileId: record.id,
        day: new Date("2026-10-27T00:00:00Z"),
        count: 7,
        clicks: 3,
      },
      {
        profileId: record.id,
        day: new Date("2026-10-20T00:00:00Z"),
        count: 2,
        clicks: 1,
      },
    ],
  });
  await f.db.linkClick.create({
    data: { linkId, day: new Date("2026-10-27T00:00:00Z"), count: 3 },
  });
  await f.db.cardClick.create({
    data: { cardId, day: new Date("2026-10-27T00:00:00Z"), count: 4 },
  });
  const result = await stats.advancedStats("one", 7, now);
  expect(result.days).toHaveLength(90);
  expect(result.comparison.views).toEqual({
    current: 7,
    previous: 2,
    delta: 5,
    percent: 250,
  });
  expect(result.comparison.cardClicks.percent).toBeNull();
  expect(result.weekly.cardClicks).toBe(4);
  expect(result.topLinks[0].clicks).toBe(3);
  expect(stats.statsCSV(result)).toContain("'=malicious_formula");
});
it("Free não recebe detalhes nem CSV; endpoint sem sessão é bloqueado", async () => {
  await expect(stats.advancedStats("other", 7, now)).rejects.toThrow("Pro");
  const route = await import("../src/app/api/stats/export/route");
  expect(
    (await route.GET(new Request("http://localhost:3000/api/stats/export")))
      .status,
  ).toBe(401);
});
it("redirecionamento de cartão conta somente destino salvo e respeita seções ocultas", async () => {
  const route = await import("../src/app/go/card/[id]/route");
  const req = new Request(
    `http://localhost:3000/go/card/${cardId}?url=https://evil.example/`,
  );
  const ctx = { params: Promise.resolve({ id: cardId }) };
  const result = await route.GET(req, ctx);
  expect(result.status).toBe(302);
  expect(result.headers.get("location")).toBe("https://www.roblox.com/");
  expect(
    (await f.db.cardClick.aggregate({ _sum: { count: true } }))._sum.count,
  ).toBe(5);
  profile = await p.saveProfile("one", {
    ...profile,
    studio: { ...profile.studio, hidden: ["gamerCards"] },
  });
  expect((await route.GET(req, ctx)).status).toBe(404);
});
