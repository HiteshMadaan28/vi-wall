/**
 * Pure scoring / ranking logic for the country competition.
 *
 * These functions take raw per-country tile counts (which come from real
 * database aggregates of approved participants) and derive rankings,
 * percentages and head-to-head comparisons. No randomness, no I/O — so the
 * same inputs always produce the same leaderboard and the logic is unit
 * tested in isolation.
 */

import { getCountry } from "./countries";

export interface CountryTally {
  iso: string;
  /** Number of approved participants / occupied tiles for this country. */
  tiles: number;
}

export interface RankedCountry {
  iso: string;
  name: string;
  flag: string;
  accent: string;
  tiles: number;
  /** Percentage of total wall capacity this country occupies (0–100). */
  percentOfWall: number;
  /** Percentage of all claimed tiles this country holds (0–100). */
  percentOfClaimed: number;
  rank: number;
}

/**
 * Rank countries by tile count (descending). Ties are broken alphabetically by
 * ISO code so ordering is stable and deterministic. Countries with zero tiles
 * are excluded from the ranked list.
 */
export function rankCountries(
  tallies: CountryTally[],
  wallCapacity: number
): RankedCountry[] {
  const totalClaimed = tallies.reduce((sum, t) => sum + Math.max(0, t.tiles), 0);

  const ranked = tallies
    .filter((t) => t.tiles > 0)
    .map((t) => {
      const country = getCountry(t.iso);
      return {
        iso: t.iso,
        name: country?.name ?? t.iso,
        flag: country?.flag ?? "🏳️",
        accent: country?.accent ?? "#a855f7",
        tiles: t.tiles,
        percentOfWall:
          wallCapacity > 0 ? (t.tiles / wallCapacity) * 100 : 0,
        percentOfClaimed:
          totalClaimed > 0 ? (t.tiles / totalClaimed) * 100 : 0,
        rank: 0,
      };
    })
    .sort((a, b) => {
      if (b.tiles !== a.tiles) return b.tiles - a.tiles;
      return a.iso.localeCompare(b.iso);
    });

  ranked.forEach((c, i) => {
    c.rank = i + 1;
  });

  return ranked;
}

export function topCountries(
  tallies: CountryTally[],
  wallCapacity: number,
  limit = 10
): RankedCountry[] {
  return rankCountries(tallies, wallCapacity).slice(0, limit);
}

/** Percentage of the whole wall that is filled (0–100), rounded helper below. */
export function wallFillPercent(
  totalClaimed: number,
  wallCapacity: number
): number {
  if (wallCapacity <= 0) return 0;
  return (totalClaimed / wallCapacity) * 100;
}

export function roundPercent(value: number, decimals = 1): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export interface BattleResult {
  a: RankedCountry | null;
  b: RankedCountry | null;
  /** Positive => a leads, negative => b leads, 0 => tie. */
  difference: number;
  leaderIso: string | null;
}

/**
 * Compare two countries head to head using the already-ranked list so the
 * ranks shown in a battle match the leaderboard exactly.
 */
export function compareCountries(
  ranked: RankedCountry[],
  isoA: string,
  isoB: string
): BattleResult {
  const a = ranked.find((c) => c.iso === isoA.toUpperCase()) ?? null;
  const b = ranked.find((c) => c.iso === isoB.toUpperCase()) ?? null;
  const tilesA = a?.tiles ?? 0;
  const tilesB = b?.tiles ?? 0;
  const difference = tilesA - tilesB;
  let leaderIso: string | null = null;
  if (difference > 0) leaderIso = isoA.toUpperCase();
  else if (difference < 0) leaderIso = isoB.toUpperCase();
  return { a, b, difference, leaderIso };
}
