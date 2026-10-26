export function StatsChart({
  days,
}: {
  days: { day: string; views: number; clicks: number }[];
}) {
  const max = Math.max(1, ...days.map((d) => Math.max(d.views, d.clicks)));
  const points = (key: "views" | "clicks") =>
    days
      .map(
        (d, i) =>
          `${20 + (i / (days.length - 1)) * 660},${170 - (d[key] / max) * 145}`,
      )
      .join(" ");
  return (
    <div className="stats-chart">
      <div className="chart-legend">
        <span>● Visualizações</span>
        <span>● Cliques</span>
        <small>Últimos 30 dias · UTC</small>
      </div>
      <svg
        viewBox="0 0 700 210"
        role="img"
        aria-label="Visualizações e cliques nos últimos 30 dias"
      >
        <title>Visitas e cliques diários</title>
        {[25, 75, 125, 175].map((y) => (
          <line key={y} x1="20" y1={y} x2="680" y2={y} stroke="#ffffff0d" />
        ))}
        <polyline
          points={points("views")}
          fill="none"
          stroke="#b49af5"
          strokeWidth="3"
        />
        <polyline
          points={points("clicks")}
          fill="none"
          stroke="#83dbd0"
          strokeWidth="2"
        />
        {[0, 14, 29].map((i) => (
          <text
            key={i}
            x={20 + (i / 29) * 660}
            y="200"
            textAnchor={i === 0 ? "start" : i === 29 ? "end" : "middle"}
            fontSize="10"
            fill="#8e7d9f"
          >
            {days[i]?.day.slice(5)}
          </text>
        ))}
      </svg>
    </div>
  );
}
