import "server-only";
import { getAdminClient } from "./supabase/admin";
import { WALL_CAPACITY } from "./data";
import { getCountry } from "./countries";

export interface AdminOverview {
  totalParticipants: number;
  pending: number;
  verified: number;
  approved: number;
  rejected: number;
  removed: number;
  suspended: number;
  occupiedTiles: number;
  reservedTiles: number;
  availableTiles: number;
  wallCapacity: number;
}

export interface AdminParticipant {
  id: string;
  username: string;
  countryIso: string;
  countryFlag: string;
  status: string;
  emailVerified: boolean;
  message: string | null;
  socialUrl: string | null;
  createdAt: string;
  tileIndex: number | null;
}

async function countByStatus(status: string): Promise<number> {
  const db = getAdminClient();
  if (!db) return 0;
  const { count } = await db
    .from("participants")
    .select("id", { count: "exact", head: true })
    .eq("status", status);
  return count ?? 0;
}

export async function getAdminOverview(): Promise<AdminOverview> {
  const db = getAdminClient();
  const empty: AdminOverview = {
    totalParticipants: 0, pending: 0, verified: 0, approved: 0, rejected: 0,
    removed: 0, suspended: 0, occupiedTiles: 0, reservedTiles: 0,
    availableTiles: WALL_CAPACITY, wallCapacity: WALL_CAPACITY,
  };
  if (!db) return empty;

  // free any expired reservations before counting
  await db.rpc("release_expired_reservations");

  const [pending, verified, approved, rejected, removed, suspended] =
    await Promise.all([
      countByStatus("pending_verification"),
      countByStatus("verified"),
      countByStatus("approved"),
      countByStatus("rejected"),
      countByStatus("removed"),
      countByStatus("suspended"),
    ]);

  const { count: occupied } = await db
    .from("wall_tiles")
    .select("id", { count: "exact", head: true })
    .eq("status", "occupied");

  const { count: reserved } = await db
    .from("wall_tiles")
    .select("id", { count: "exact", head: true })
    .eq("status", "reserved");

  const occupiedTiles = occupied ?? 0;
  const reservedTiles = reserved ?? 0;
  return {
    totalParticipants: pending + verified + approved + rejected + removed + suspended,
    pending, verified, approved, rejected, removed, suspended,
    occupiedTiles,
    reservedTiles,
    availableTiles: WALL_CAPACITY - occupiedTiles - reservedTiles,
    wallCapacity: WALL_CAPACITY,
  };
}

export async function listParticipants(
  statusFilter: string | null,
  search: string | null,
  limit = 100
): Promise<AdminParticipant[]> {
  const db = getAdminClient();
  if (!db) return [];
  let query = db
    .from("participants")
    .select(
      "id, username, status, email_verified, message, social_url, created_at, countries(iso_code), wall_tiles(tile_index)"
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (statusFilter) query = query.eq("status", statusFilter);
  if (search) query = query.ilike("username_normalized", `%${search.toLowerCase()}%`);

  const { data, error } = await query;
  if (error || !data) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map((row) => {
    const iso = row.countries?.iso_code ?? "";
    const tile = Array.isArray(row.wall_tiles) ? row.wall_tiles[0] : row.wall_tiles;
    return {
      id: row.id,
      username: row.username,
      countryIso: iso,
      countryFlag: getCountry(iso)?.flag ?? "🏳️",
      status: row.status,
      emailVerified: row.email_verified,
      message: row.message ?? null,
      socialUrl: row.social_url ?? null,
      createdAt: row.created_at,
      tileIndex: tile?.tile_index ?? null,
    };
  });
}

export type AdminAction = "approve" | "reject" | "remove" | "suspend" | "restore";

const ACTION_STATUS: Record<AdminAction, string> = {
  approve: "approved",
  reject: "rejected",
  remove: "removed",
  suspend: "suspended",
  restore: "approved",
};

/** Applies a moderation action, frees the tile when needed, and writes an
 *  audit row. Returns false if the participant doesn't exist. */
export async function applyAdminAction(
  participantId: string,
  action: AdminAction,
  adminIdentifier: string
): Promise<boolean> {
  const db = getAdminClient();
  if (!db) return false;

  const { data: existing } = await db
    .from("participants")
    .select("id, country_id")
    .eq("id", participantId)
    .maybeSingle();
  if (!existing) return false;

  const newStatus = ACTION_STATUS[action];
  const { error } = await db
    .from("participants")
    .update({ status: newStatus })
    .eq("id", participantId);
  if (error) return false;

  // reject / remove / suspend free the tile so the country score drops
  if (action === "reject" || action === "remove" || action === "suspend") {
    await db.rpc("release_participant_tile", { p_participant: participantId });
  }

  await db.from("admin_actions").insert({
    action,
    admin_identifier: adminIdentifier,
    target_participant_id: participantId,
    metadata: { new_status: newStatus },
  });

  const eventType =
    action === "approve" ? "participant_approved" : `participant_${action}`;
  await db.from("activity_events").insert({
    event_type: eventType,
    participant_id: participantId,
    country_id: (existing as { country_id: number }).country_id,
    metadata: {},
  });

  return true;
}
