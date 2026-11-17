"use client";

import { useEffect, useState } from "react";
import { Grid3x3, CheckCircle2, CircleDot, Gauge } from "lucide-react";
import { roundPercent } from "@/lib/scoring";
import { cssSunset } from "@/lib/gradient";
import type { WallStats } from "@/lib/types";

/** Left-hero statistics panel. Real data from /api/stats, polled gently. */
export function HeroStats({ initial }: { initial: WallStats }) {
  const [stats, setStats] = useState(initial);

  useEffect(() => {
    const load = () =>
      fetch("/api/stats").then((r) => r.json()).then(setStats).catch(() => {});
    const id = setInterval(load, 20_000);
    return () => clearInterval(id);
  }, []);

  const pct = roundPercent(stats.completionPercent);
  const rows = [
    { icon: Grid3x3, label: "Total Capacity", value: stats.wallCapacity },
    { icon: CheckCircle2, label: "Occupied Blocks", value: stats.totalTiles },
    { icon: CircleDot, label: "Available Blocks", value: stats.availableTiles },
  ];

  return (
    <div className="rounded-2xl glass-strong p-5">
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/5 text-neon-pink">
              <r.icon size={16} />
            </span>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
                {r.label}
              </div>
              <div className="font-display text-xl font-bold leading-tight">
                {r.value.toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 border-t border-white/10 pt-4">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
            <Gauge size={14} /> Completion
          </span>
          <span className="font-display text-lg font-bold">{pct}%</span>
        </div>
        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full rounded-full transition-[width] duration-700"
            style={{ width: `${Math.max(1.5, pct)}%`, backgroundImage: cssSunset("90deg") }}
          />
        </div>
      </div>
    </div>
  );
}
