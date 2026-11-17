import "server-only";
import { getAdminClient } from "./supabase/admin";
import { GRID_COLS, GRID_ROWS } from "./config";
import { viCapacity } from "./vi-mask";
import { getCountry } from "./countries";
import {
  rankCountries,
  topCountries,
  wallFillPercent,
  type CountryTally,
  type RankedCountry,
} from "./scoring";
import type {
  WallStats,
  OccupiedTile,
  PublicProfile,
  ActivityItem,
  SearchHit,
} from "./types";

export const WALL_CAPACITY = viCapacity(GRID_COLS, GRID_ROWS);

interface CountryStatRow {
  country_id: number;
  iso_code: string;
  name: string;
  flag_emoji: string;
  tiles: number;
}

async function countryTallies(): Promise<CountryTally[]> {
  const db = getAdminClient();
  if (!db) return [];
  const { data, error } = await db
    .from("country_stats")
    .select("iso_code, tiles");
  if (error || !data) return [];
  return (data as { iso_code: string; tiles: number }[]).map((r) => ({
    iso: r.iso_code,
    tiles: Number(r.tiles) || 0,
  }));
}

export async function getStats(): Promise<WallStats> {
  const db = getAdminClient();
  const base: WallStats = {
    configured: Boolean(db),
    totalPlayers: 0,
    totalTiles: 0,
    wallCapacity: WALL_CAPACITY,
    participatingCountries: 0,
    fillPercent: 0,
    leader: null,
  };
  if (!db) return base;

  const tallies = await countryTallies();
  const ranked = rankCountries(tallies, WALL_CAPACITY);
  const totalTiles = tallies.reduce((s, t) => s + t.tiles, 0);
  const leader = ranked[0] ?? null;

  return {
    ...base,
    totalPlayers: totalTiles, // one approved participant == one occupied tile
    totalTiles,
    participatingCountries: ranked.length,
    fillPercent: wallFillPercent(totalTiles, WALL_CAPACITY),
    leader: leader
      ? { iso: leader.iso, name: leader.name, flag: leader.flag, tiles: leader.tiles }
      : null,
  };
}

export async function getLeaderboard(limit?: number): Promise<RankedCountry[]> {
  const tallies = await countryTallies();
  return limit
    ? topCountries(tallies, WALL_CAPACITY, limit)
    : rankCountries(tallies, WALL_CAPACITY);
}

export async function getOccupiedTiles(): Promise<OccupiedTile[]> {
  const db = getAdminClient();
  if (!db) return [];
  const { data, error } = await db
    .from("wall_tiles")
    .select(
      "tile_index, x_position, y_position, participants!inner(username, avatar, avatar_url, status, countries(iso_code))"
    )
    .eq("status", "occupied")
    .in("participants.status", ["approved", "verified"]);
  if (error || !data) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map((row) => {
    const p = row.participants;
    return {
      tileIndex: row.tile_index,
      x: row.x_position,
      y: row.y_position,
      username: p.username,
      countryIso: p.countries?.iso_code ?? "",
      avatar: p.avatar ?? "violet-orb",
      avatarUrl: p.avatar_url ?? null,
      status: p.status === "approved" ? "approved" : "verified",
    } satisfies OccupiedTile;
  });
}

export async function getProfile(
  usernameNormalized: string
): Promise<PublicProfile | null> {
  const db = getAdminClient();
  if (!db) return null;
  const { data, error } = await db
    .from("participants")
    .select(
      "username, avatar, avatar_url, message, social_url, status, created_at, countries(iso_code, name, flag_emoji), wall_tiles(tile_index, x_position, y_position)"
    )
    .eq("username_normalized", usernameNormalized)
    .in("status", ["approved", "verified"])
    .maybeSingle();
  if (error || !data) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row = data as any;
  const tile = Array.isArray(row.wall_tiles) ? row.wall_tiles[0] : row.wall_tiles;
  return {
    username: row.username,
    countryIso: row.countries?.iso_code ?? "",
    countryName: row.countries?.name ?? "",
    countryFlag: row.countries?.flag_emoji ?? "🏳️",
    avatar: row.avatar ?? "violet-orb",
    avatarUrl: row.avatar_url ?? null,
    message: row.message ?? null,
    socialUrl: row.social_url ?? null,
    tileIndex: tile?.tile_index ?? null,
    x: tile?.x_position ?? null,
    y: tile?.y_position ?? null,
    joinedAt: row.created_at,
    status: row.status,
  };
}

export async function searchParticipants(q: string): Promise<SearchHit[]> {
  const db = getAdminClient();
  if (!db) return [];
  const term = q.trim().toLowerCase();
  if (!term) return [];
  const { data, error } = await db
    .from("participants")
    .select("username, countries(iso_code), wall_tiles(tile_index)")
    .ilike("username_normalized", `%${term}%`)
    .in("status", ["approved", "verified"])
    .limit(20);
  if (error || !data) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map((row) => {
    const iso = row.countries?.iso_code ?? "";
    const tile = Array.isArray(row.wall_tiles) ? row.wall_tiles[0] : row.wall_tiles;
    return {
      username: row.username,
      countryIso: iso,
      countryFlag: getCountry(iso)?.flag ?? "🏳️",
      tileIndex: tile?.tile_index ?? null,
    };
  });
}

export async function getCountryParticipants(
  iso: string,
  limit = 50
): Promise<SearchHit[]> {
  const db = getAdminClient();
  if (!db) return [];
  const country = getCountry(iso);
  if (!country) return [];
  const { data: countryRow } = await db
    .from("countries")
    .select("id")
    .eq("iso_code", country.iso)
    .maybeSingle();
  if (!countryRow) return [];

  const { data, error } = await db
    .from("participants")
    .select("username, wall_tiles(tile_index)")
    .eq("country_id", (countryRow as { id: number }).id)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map((row) => {
    const tile = Array.isArray(row.wall_tiles) ? row.wall_tiles[0] : row.wall_tiles;
    return {
      username: row.username,
      countryIso: country.iso,
      countryFlag: country.flag,
      tileIndex: tile?.tile_index ?? null,
    };
  });
}

export async function getActivity(limit = 20): Promise<ActivityItem[]> {
  const db = getAdminClient();
  if (!db) return [];
  const { data, error } = await db
    .from("activity_events")
    .select("id, event_type, country_id, metadata, created_at, countries(iso_code)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map((row) => ({
    id: row.id,
    type: row.event_type,
    countryIso: row.countries?.iso_code ?? null,
    createdAt: row.created_at,
    metadata: row.metadata ?? {},
  }));
}

export type { RankedCountry, CountryStatRow };
