"use client";
import { useState } from "react";
import { StatsChart } from "@/components/stats-chart";
export function StatsPeriod({
  days,
}: {
  days: { day: string; views: number; clicks: number }[];
}) {
  const [period, setPeriod] = useState<7 | 30>(30);
  const selected = days.slice(-period);
  const views = selected.reduce((total, d) => total + d.views, 0),
    clicks = selected.reduce((total, d) => total + d.clicks, 0);
  return (
    <>
      <div
        className="period-switch"
        role="group"
        aria-label="Período do gráfico"
      >
        {([7, 30] as const).map((value) => (
          <button
            type="button"
            key={value}
            aria-pressed={period === value}
            onClick={() => setPeriod(value)}
          >
            {value} dias
          </button>
        ))}
      </div>
      <p className="period-summary" aria-live="polite">
        {views} visualizações e {clicks} cliques nos últimos {period} dias.
      </p>
      <StatsChart days={selected} />
    </>
  );
}
