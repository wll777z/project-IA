import { db } from "@/lib/db";
import { isPro } from "@/lib/entitlements";
import { HttpError } from "@/lib/http";
export function utcDay(date = new Date()) {
  return new Date(date.toISOString().slice(0, 10) + "T00:00:00.000Z");
}
export async function recordView(username: string) {
  const profile = await db.profile.findUnique({
    where: { username },
    select: { id: true, published: true },
  });
  if (!profile?.published) throw new HttpError(404, "Perfil não encontrado.");
  const day = utcDay();
  await db.pageView.upsert({
    where: { profileId_day: { profileId: profile.id, day } },
    create: { profileId: profile.id, day, count: 1 },
    update: { count: { increment: 1 } },
  });
}
export async function recordClick(linkId: string) {
  return db.$transaction(async (tx) => {
    const link = await tx.profileLink.findUnique({
      where: { id: linkId },
      select: { profileId: true, profile: { select: { published: true } } },
    });
    if (!link?.profile.published) return;
    const day = utcDay();
    await tx.pageView.upsert({
      where: { profileId_day: { profileId: link.profileId, day } },
      create: { profileId: link.profileId, day, count: 0, clicks: 1 },
      update: { clicks: { increment: 1 } },
    });
    await tx.linkClick.upsert({
      where: { linkId_day: { linkId, day } },
      create: { linkId, day, count: 1 },
      update: { count: { increment: 1 } },
    });
  });
}
export async function getStats(userId: string) {
  const [profile, entitlement] = await Promise.all([
    db.profile.findUnique({
      where: { userId },
      select: { id: true, links: { select: { id: true, title: true } } },
    }),
    db.entitlement.findUnique({ where: { userId } }),
  ]);
  const pro = isPro(entitlement);
  const totals = profile
    ? await db.pageView.aggregate({
        where: { profileId: profile.id },
        _sum: { count: true, clicks: true },
      })
    : null;
  const basic = {
    pro,
    views: totals?._sum.count ?? 0,
    links: profile?.links.length ?? 0,
  };
  if (!pro) return basic;
  const since = utcDay(new Date(Date.now() - 29 * 86400000));
  const [daily, clicks] = profile
    ? await Promise.all([
        db.pageView.findMany({
          where: { profileId: profile.id, day: { gte: since } },
          orderBy: { day: "asc" },
        }),
        db.linkClick.groupBy({
          by: ["linkId"],
          where: { link: { profileId: profile.id }, day: { gte: since } },
          _sum: { count: true },
        }),
      ])
    : [[], []];
  const days = Array.from({ length: 30 }, (_, i) => {
    const day = new Date(since.getTime() + i * 86400000)
      .toISOString()
      .slice(0, 10);
    const record = daily.find((r) => r.day.toISOString().startsWith(day));
    return { day, views: record?.count ?? 0, clicks: record?.clicks ?? 0 };
  });
  return {
    ...basic,
    totalClicks: totals?._sum.clicks ?? 0,
    days,
    topLinks: (profile?.links ?? [])
      .map((link) => ({
        ...link,
        clicks: clicks.find((c) => c.linkId === link.id)?._sum.count ?? 0,
      }))
      .sort((a, b) => b.clicks - a.clicks),
  };
}
