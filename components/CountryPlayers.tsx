"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, MapPin, X } from "lucide-react";
import { getCountry } from "@/lib/countries";
import type { SearchHit } from "@/lib/types";

/** Player list for a selected country, shown on the leaderboard page. */
export function CountryPlayers({ iso }: { iso: string }) {
  const [players, setPlayers] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(true);
  const country = getCountry(iso);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/country/${iso}`)
      .then((r) => (r.ok ? r.json() : { players: [] }))
      .then((d) => setPlayers(d.players ?? []))
      .catch(() => setPlayers([]))
      .finally(() => setLoading(false));
  }, [iso]);

  if (!country) return null;

  return (
    <div className="rounded-2xl glass p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold">
          {country.flag} {country.name} players
        </h2>
        <Link href="/leaderboard" aria-label="Clear selection" className="rounded-lg p-1 text-ink-dim hover:text-ink">
          <X size={18} />
        </Link>
      </div>

      {loading ? (
        <div className="grid place-items-center py-8">
          <Loader2 className="animate-spin text-neon-violet" />
        </div>
      ) : players.length === 0 ? (
        <p className="mt-4 text-sm text-ink-faint">No approved players for this country yet.</p>
      ) : (
        <ul className="mt-4 grid gap-1.5 sm:grid-cols-2">
          {players.map((p) => (
            <li key={p.username} className="flex items-center gap-2">
              <Link
                href={`/player/${p.username.toLowerCase()}`}
                className="flex-1 truncate rounded-lg bg-black/20 px-3 py-2 text-sm font-semibold text-ink hover:bg-white/5"
              >
                {p.username}
              </Link>
              {p.tileIndex != null && (
                <Link href={`/wall?tile=${p.tileIndex}`} className="rounded-lg btn-ghost px-2.5 py-2" aria-label="Locate on wall">
                  <MapPin size={14} />
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
