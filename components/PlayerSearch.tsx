"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search, Loader2, MapPin } from "lucide-react";
import type { SearchHit } from "@/lib/types";

/** Debounced participant search. Hits the server (indexed ILIKE, capped at 20
 *  rows) so it never loads the whole database. Results link to profiles and
 *  can jump to the player's tile on the wall. */
export function PlayerSearch() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    const term = q.trim();
    if (term.length < 1) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    timer.current = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(term)}`)
        .then((r) => r.json())
        .then((d) => setResults(d.results ?? []))
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 280);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [q]);

  return (
    <div className="rounded-2xl glass p-4 sm:p-6">
      <h2 className="flex items-center gap-2 font-display text-lg font-bold">
        <Search size={18} className="text-neon-cyan" /> Find a Player
      </h2>
      <div className="relative mt-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by username"
          className="w-full rounded-lg border border-white/10 bg-black/30 py-2.5 pl-9 pr-9 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-neon-violet/60"
        />
        {loading && (
          <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-neon-violet" />
        )}
      </div>

      {q.trim() && !loading && results.length === 0 && (
        <p className="mt-4 text-sm text-ink-faint">No players found.</p>
      )}

      {results.length > 0 && (
        <ul className="mt-4 space-y-1.5">
          {results.map((r) => (
            <li key={r.username} className="flex items-center gap-2">
              <Link
                href={`/player/${r.username.toLowerCase()}`}
                className="flex flex-1 items-center gap-2 rounded-lg bg-black/20 px-3 py-2 text-sm hover:bg-white/5"
              >
                <span>{r.countryFlag}</span>
                <span className="font-semibold text-ink">{r.username}</span>
              </Link>
              {r.tileIndex != null && (
                <Link
                  href={`/wall?tile=${r.tileIndex}`}
                  className="rounded-lg btn-ghost px-2.5 py-2 text-xs"
                  aria-label={`Locate ${r.username} on the wall`}
                >
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
