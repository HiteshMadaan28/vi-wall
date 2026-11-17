"use client";

import { useEffect, useMemo, useState } from "react";
import { Swords } from "lucide-react";
import { COUNTRIES } from "@/lib/countries";
import { compareCountries, roundPercent, type RankedCountry } from "@/lib/scoring";
import { track } from "@/lib/analytics";

/** Head-to-head country comparison. Uses the live leaderboard so ranks and
 *  tile counts match the board exactly. */
export function CountryBattle({ initial }: { initial: RankedCountry[] }) {
  const [ranked, setRanked] = useState(initial);
  const [isoA, setIsoA] = useState("IN");
  const [isoB, setIsoB] = useState("US");

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((d) => setRanked(d.countries))
      .catch(() => {});
  }, []);

  const battle = useMemo(
    () => compareCountries(ranked, isoA, isoB),
    [ranked, isoA, isoB]
  );

  const select = (side: "a" | "b", iso: string) => {
    if (side === "a") setIsoA(iso);
    else setIsoB(iso);
    track("country_comparison", { a: side === "a" ? iso : isoA, b: side === "b" ? iso : isoB });
  };

  const leadLabel = (() => {
    if (!battle.a && !battle.b) return "No data yet.";
    if (battle.difference === 0) return "It's a dead heat.";
    const leaderIso = battle.leaderIso;
    const name = COUNTRIES.find((c) => c.iso === leaderIso)?.name ?? leaderIso;
    return `${name} leads by ${Math.abs(battle.difference).toLocaleString()} tiles.`;
  })();

  return (
    <div className="rounded-2xl glass p-4 sm:p-6">
      <h2 className="flex items-center gap-2 font-display text-lg font-bold">
        <Swords size={18} className="text-neon-pink" /> Country Battle
      </h2>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <BattleSide side="a" iso={isoA} other={isoB} ranked={ranked} onSelect={select} />
        <BattleSide side="b" iso={isoB} other={isoA} ranked={ranked} onSelect={select} />
      </div>

      <div className="mt-4 rounded-xl bg-black/30 p-3 text-center">
        <p className="font-display text-sm font-bold text-ink">{leadLabel}</p>
      </div>
    </div>
  );
}

function BattleSide({
  side,
  iso,
  other,
  ranked,
  onSelect,
}: {
  side: "a" | "b";
  iso: string;
  other: string;
  ranked: RankedCountry[];
  onSelect: (side: "a" | "b", iso: string) => void;
}) {
  const row = ranked.find((c) => c.iso === iso);
  const meta = COUNTRIES.find((c) => c.iso === iso);
  const tiles = row?.tiles ?? 0;

  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-center">
      <select
        value={iso}
        onChange={(e) => onSelect(side, e.target.value)}
        className="w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-sm font-semibold text-ink outline-none focus:border-neon-violet/60"
      >
        {COUNTRIES.map((c) => (
          <option key={c.iso} value={c.iso} disabled={c.iso === other}>
            {c.flag} {c.name}
          </option>
        ))}
      </select>
      <div className="mt-3 text-4xl">{meta?.flag}</div>
      <div className="mt-1 font-display text-2xl font-black text-ink">
        {tiles.toLocaleString()}
      </div>
      <div className="text-xs text-ink-dim">
        {row ? `Rank #${row.rank} · ${roundPercent(row.percentOfWall)}%` : "Unranked"}
      </div>
    </div>
  );
}
