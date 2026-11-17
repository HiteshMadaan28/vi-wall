"use client";

import { useEffect, useState } from "react";
import { Users, Grid3x3, Globe2, Crown, Gauge } from "lucide-react";
import { roundPercent } from "@/lib/scoring";
import type { WallStats } from "@/lib/types";

/** Live headline stats. Seeded with server-rendered data for a fast first
 *  paint, then polled gently (every 20s) so counts stay current without
 *  hammering the API. */
export function StatsBar({ initial }: { initial: WallStats }) {
  const [stats, setStats] = useState(initial);

  useEffect(() => {
    const load = () =>
      fetch("/api/stats")
        .then((r) => r.json())
        .then(setStats)
        .catch(() => {});
    const id = setInterval(load, 20_000);
    return () => clearInterval(id);
  }, []);

  const items = [
    { icon: Users, label: "Players", value: stats.totalPlayers.toLocaleString() },
    { icon: Grid3x3, label: "Tiles claimed", value: stats.totalTiles.toLocaleString() },
    { icon: Globe2, label: "Countries", value: stats.participatingCountries.toLocaleString() },
    {
      icon: Crown,
      label: "Leading",
      value: stats.leader ? `${stats.leader.flag} ${stats.leader.iso}` : "—",
    },
    { icon: Gauge, label: "Wall filled", value: `${roundPercent(stats.fillPercent)}%` },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {items.map((it) => (
        <div key={it.label} className="rounded-xl glass p-4">
          <div className="flex items-center gap-2 text-ink-faint">
            <it.icon size={16} />
            <span className="text-xs font-semibold uppercase tracking-wide">{it.label}</span>
          </div>
          <div className="mt-1.5 font-display text-xl font-bold text-ink sm:text-2xl">
            {it.value}
          </div>
        </div>
      ))}
    </div>
  );
}
