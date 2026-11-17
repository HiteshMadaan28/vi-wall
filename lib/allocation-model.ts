/**
 * In-memory model of the tile reservation + occupation lifecycle.
 *
 * Mirrors the Postgres functions used in production:
 *   - reserve_tile       (atomic conditional UPDATE on status='available')
 *   - release_expired_reservations
 *   - verify_and_occupy  (reserved -> occupied, with completion check)
 *
 * The real guarantees are enforced by the database (atomic UPDATE + row locks
 * + UNIQUE constraints). This model lets the critical invariants be unit
 * tested without a live Postgres:
 *   1. two users cannot reserve the same tile — only one wins;
 *   2. many users reserving different tiles all succeed independently;
 *   3. a reserved-but-unverified final tile does NOT complete the wall;
 *   4. reservations expire and the tile becomes available again;
 *   5. removing a participant frees the tile and lowers the country score.
 */

export type TileStatus = "available" | "reserved" | "occupied";

interface ModelTile {
  tileIndex: number;
  status: TileStatus;
  token: string | null;
  reservedUntil: number | null;
  participantId: string | null;
  countryIso: string | null;
}

export class WallModel {
  private tiles: ModelTile[];

  constructor(capacity: number) {
    this.tiles = Array.from({ length: capacity }, (_, i) => ({
      tileIndex: i,
      status: "available" as TileStatus,
      token: null,
      reservedUntil: null,
      participantId: null,
      countryIso: null,
    }));
  }

  releaseExpired(now = Date.now()): void {
    for (const t of this.tiles) {
      if (t.status === "reserved" && (t.reservedUntil ?? 0) < now) {
        t.status = "available";
        t.token = null;
        t.reservedUntil = null;
      }
    }
  }

  /** Atomic reserve of a specific tile. Returns true only if it was available. */
  reserve(tileIndex: number, token: string, now = Date.now(), ttlMs = 600_000): boolean {
    this.releaseExpired(now);
    const t = this.tiles[tileIndex];
    if (!t || t.status !== "available") return false;
    t.status = "reserved";
    t.token = token;
    t.reservedUntil = now + ttlMs;
    return true;
  }

  /** Occupy a reserved tile if the token matches and it hasn't expired. */
  occupy(
    tileIndex: number,
    token: string,
    participantId: string,
    countryIso: string,
    now = Date.now()
  ): "ok" | "expired" | "invalid" {
    this.releaseExpired(now);
    const t = this.tiles[tileIndex];
    if (!t) return "invalid";
    if (t.status !== "reserved" || t.token !== token) {
      return t.status === "available" ? "expired" : "invalid";
    }
    t.status = "occupied";
    t.token = null;
    t.reservedUntil = null;
    t.participantId = participantId;
    t.countryIso = countryIso;
    return "ok";
  }

  release(participantId: string): void {
    for (const t of this.tiles) {
      if (t.participantId === participantId) {
        t.status = "available";
        t.participantId = null;
        t.countryIso = null;
        t.token = null;
        t.reservedUntil = null;
      }
    }
  }

  countryTiles(): { iso: string; tiles: number }[] {
    const counts = new Map<string, number>();
    for (const t of this.tiles) {
      if (t.status === "occupied" && t.countryIso) {
        counts.set(t.countryIso, (counts.get(t.countryIso) ?? 0) + 1);
      }
    }
    return [...counts.entries()].map(([iso, tiles]) => ({ iso, tiles }));
  }

  occupiedCount(): number {
    return this.tiles.filter((t) => t.status === "occupied").length;
  }

  reservedCount(): number {
    return this.tiles.filter((t) => t.status === "reserved").length;
  }

  isComplete(): boolean {
    return this.occupiedCount() === this.tiles.length;
  }
}
