import { db } from "@/lib/db";
import { isPro } from "@/lib/entitlements";
import { HttpError } from "@/lib/http";
import { utcDay } from "@/lib/analytics";
export function compareCounts(current: number, previous: number) {
  return {
    current,
    previous,
    delta: current - previous,
    percent:
      previous > 0
        ? Math.round(((current - previous) / previous) * 1000) / 10
        : null,
  };
}
export async function advancedStats(
  userId: string,
  period: 7 | 30 = 7,
  now = new Date(),
) {
  if (!isPro(await db.entitlement.findUnique({ where: { userId } }), now))
    throw new HttpError(403, "Analytics avançado precisa do plano Pro.");
  const profile = await db.profile.findUnique({
    where: { userId },
    select: {
      id: true,
      links: { select: { id: true, title: true } },
      gamerCards: { select: { id: true, displayName: true } },
    },
  });
  const end = utcDay(now),
    since = new Date(end.getTime() - 89 * 86400000);
  const rows = profile
    ? await db.pageView.findMany({
        where: { profileId: profile.id, day: { gte: since, lte: end } },
        orderBy: { day: "asc" },
      })
    : [];
  const cards = profile
    ? await db.cardClick.findMany({
        where: {
          card: { profileId: profile.id },
          day: { gte: since, lte: end },
        },
      })
    : [];
  const days = Array.from({ length: 90 }, (_, i) => {
    const day = new Date(since.getTime() + i * 86400000)
      .toISOString()
      .slice(0, 10);
    const row = rows.find((r) => r.day.toISOString().startsWith(day));
    return {
      day,
      views: row?.count ?? 0,
      clicks: row?.clicks ?? 0,
      cardClicks: cards
        .filter((c) => c.day.toISOString().startsWith(day))
        .reduce((n, c) => n + c.count, 0),
    };
  });
  const sum = (list: typeof days, key: "views" | "clicks" | "cardClicks") =>
    list.reduce((n, d) => n + d[key], 0);
  const current = days.slice(-period),
    previous = days.slice(-period * 2, -period);
  const linkRows = profile
    ? await db.linkClick.groupBy({
        by: ["linkId"],
        where: {
          link: { profileId: profile.id },
          day: {
            gte: new Date(end.getTime() - (period - 1) * 86400000),
            lte: end,
          },
        },
        _sum: { count: true },
      })
    : [];
  return {
    period,
    days,
    comparison: {
      views: compareCounts(sum(current, "views"), sum(previous, "views")),
      clicks: compareCounts(sum(current, "clicks"), sum(previous, "clicks")),
      cardClicks: compareCounts(
        sum(current, "cardClicks"),
        sum(previous, "cardClicks"),
      ),
    },
    weekly: {
      views: sum(days.slice(-7), "views"),
      clicks: sum(days.slice(-7), "clicks"),
      cardClicks: sum(days.slice(-7), "cardClicks"),
    },
    topLinks: (profile?.links ?? [])
      .map((l) => ({
        ...l,
        clicks: linkRows.find((r) => r.linkId === l.id)?._sum.count ?? 0,
      }))
      .sort((a, b) => b.clicks - a.clicks),
    topCards: (profile?.gamerCards ?? [])
      .map((c) => ({
        id: c.id,
        title: c.displayName,
        clicks: cards
          .filter(
            (r) =>
              r.cardId === c.id &&
              r.day >= new Date(end.getTime() - (period - 1) * 86400000),
          )
          .reduce((n, r) => n + r.count, 0),
      }))
      .sort((a, b) => b.clicks - a.clicks),
  };
}
export function csvCell(value: string | number) {
  const text = String(value);
  return (
    '"' +
    (/^[\s]*[=+\-@]/.test(text) ? "'" + text : text).replaceAll('"', '""') +
    '"'
  );
}
export function statsCSV(stats: Awaited<ReturnType<typeof advancedStats>>) {
  return (
    "\uFEFF" +
    [
      ["day_utc", "views", "link_clicks", "card_clicks"],
      ...stats.days.map((d) => [d.day, d.views, d.clicks, d.cardClicks]),
      [],
      ["links_current_period", "clicks"],
      ...stats.topLinks.map((l) => [l.title, l.clicks]),
      [],
      ["cards_current_period", "clicks"],
      ...stats.topCards.map((c) => [c.title, c.clicks]),
    ]
      .map((row) => row.map(csvCell).join(","))
      .join("\r\n")
  );
}
