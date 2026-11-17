"use client";

import { useEffect, useState } from "react";
import { Trophy, Grid3x3, CircleDot, Clock, CheckCircle2 } from "lucide-react";
import { roundPercent } from "@/lib/scoring";
import { cssSunset } from "@/lib/gradient";
import { CompletionCelebration } from "./CompletionCelebration";
import type { WallStats } from "@/lib/types";

/**
 * Wall completion tracker. All numbers come from real database records via
 * /api/stats. Pending reservations are shown separately and never counted as
 * completed. When the wall is complete, the celebration plays once.
 */
export function WallCompletion({ initial }: { initial: WallStats }) {
  const [stats, setStats] = useState(initial);

  useEffect(() => {
    const load = () =>
      fetch("/api/stats")
        .then((r) => r.json())
        .then(setStats)
        .catch(() => {});
    const id = setInterval(load, 15_000);
    return () => clearInterval(id);
  }, []);

  const pct = roundPercent(stats.completionPercent);

  return (
    <div className="rounded-2xl glass p-5 sm:p-6">
      {stats.completed && <CompletionCelebration />}

      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold">
          <Trophy size={18} className="text-neon-pink" /> Wall Completion
        </h2>
        {stats.completed && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-200">
            <CheckCircle2 size={13} /> Complete
          </span>
        )}
      </div>

      {/* progress bar painted with the sunset gradient */}
      <div className="mt-4">
        <div className="flex items-end justify-between">
          <span className="font-display text-3xl font-black">{pct}%</span>
          <span className="text-sm text-ink-dim">
            {stats.totalTiles.toLocaleString()} / {stats.wallCapacity.toLocaleString()} blocks
          </span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full rounded-full transition-[width] duration-700"
            style={{ width: `${Math.max(1.5, pct)}%`, backgroundImage: cssSunset("90deg") }}
          />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Cell icon={<Grid3x3 size={15} />} label="Capacity" value={stats.wallCapacity} />
        <Cell icon={<CheckCircle2 size={15} />} label="Occupied" value={stats.totalTiles} />
        <Cell icon={<CircleDot size={15} />} label="Available" value={stats.availableTiles} />
        <Cell icon={<Clock size={15} />} label="Reserving" value={stats.pendingReservations} />
      </div>
    </div>
  );
}

function Cell({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-xl bg-black/20 p-3">
      <div className="flex items-center gap-1.5 text-ink-faint">
        {icon}
        <span className="text-[11px] font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <div className="mt-1 font-display text-xl font-bold">{value.toLocaleString()}</div>
    </div>
  );
}
