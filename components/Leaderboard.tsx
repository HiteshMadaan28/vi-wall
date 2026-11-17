"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, Trophy } from "lucide-react";
import { roundPercent, type RankedCountry } from "@/lib/scoring";
import { track } from "@/lib/analytics";

/** Country leaderboard — the engagement engine. Shows rank, flag, tiles,
 *  wall percentage and a progress bar. Supports country search and an
 *  optional link to the full ranking page. */
export function Leaderboard({
  initial,
  limit,
  showSearch = true,
  showViewAll = true,
}: {
  initial: RankedCountry[];
  limit?: number;
  showSearch?: boolean;
  showViewAll?: boolean;
}) {
  const [rows, setRows] = useState(initial);
  const [query, setQuery] = useState("");

  useEffect(() => {
    track("leaderboard_view");
    const load = () =>
      fetch(`/api/leaderboard${limit ? `?limit=${limit}` : ""}`)
        .then((r) => r.json())
        .then((d) => setRows(d.countries))
        .catch(() => {});
    const id = setInterval(load, 20_000);
    return () => clearInterval(id);
  }, [limit]);

  const maxTiles = rows[0]?.tiles ?? 1;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? rows.filter((r) => r.name.toLowerCase().includes(q) || r.iso.toLowerCase().includes(q))
      : rows;
    return limit ? list.slice(0, limit) : list;
  }, [rows, query, limit]);

  return (
    <div className="rounded-2xl glass p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold">
          <Trophy size={18} className="text-neon-pink" /> Country Leaderboard
        </h2>
        {showViewAll && (
          <Link href="/leaderboard" className="text-sm font-semibold text-neon-violet hover:text-neon-pink">
            View all
          </Link>
        )}
      </div>

      {showSearch && (
        <div className="relative mt-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a country"
            className="w-full rounded-lg border border-white/10 bg-black/30 py-2 pl-9 pr-3 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-neon-violet/60"
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="mt-6 text-center text-sm text-ink-faint">
          No countries on the board yet. Be the first to claim a tile.
        </p>
      ) : (
        <ol className="mt-4 space-y-2">
          {filtered.map((c) => (
            <li key={c.iso}>
              <Link
                href={`/leaderboard?country=${c.iso}`}
                onClick={() => track("country_selected", { country: c.iso })}
                className="flex items-center gap-3 rounded-xl border border-white/5 bg-black/20 px-3 py-2.5 transition-colors hover:border-neon-violet/40 hover:bg-white/5"
              >
                <span className="w-6 text-center font-display text-sm font-bold text-ink-faint">
                  {c.rank}
                </span>
                <span className="text-xl">{c.flag}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-semibold text-ink">{c.name}</span>
                    <span className="shrink-0 font-display text-sm font-bold text-ink">
                      {c.tiles.toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max(3, (c.tiles / maxTiles) * 100)}%`,
                        background: `linear-gradient(90deg, ${c.accent}, #d946ef)`,
                      }}
                    />
                  </div>
                </div>
                <span className="w-14 shrink-0 text-right text-xs font-semibold text-ink-dim">
                  {roundPercent(c.percentOfWall)}%
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
