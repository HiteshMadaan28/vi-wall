/**
 * In-memory model of the tile allocator.
 *
 * This mirrors the semantics of the Postgres `verify_and_allocate` function
 * (SELECT ... FOR UPDATE SKIP LOCKED ORDER BY allocation_order LIMIT 1 + the
 * UNIQUE constraint on wall_tiles.participant_id). The production guarantee is
 * enforced by the database; this model lets the critical invariants be unit
 * tested without a live Postgres:
 *
 *   1. a tile is never allocated to two participants;
 *   2. a participant never holds two tiles;
 *   3. with N concurrent claims against M free tiles, exactly min(N, M) win —
 *      including the "100 users race for the last tile, 1 wins" case;
 *   4. releasing a participant frees their tile and lowers the country score.
 */

export interface ModelTile {
  tileIndex: number;
  allocationOrder: number;
  participantId: string | null;
  countryIso: string | null;
}

export class TileAllocator {
  private tiles: ModelTile[];
  private byParticipant = new Map<string, number>(); // participantId -> tileIndex

  constructor(capacity: number) {
    this.tiles = Array.from({ length: capacity }, (_, i) => ({
      tileIndex: i,
      allocationOrder: i,
      participantId: null,
      countryIso: null,
    }));
  }

  /** Allocate the lowest-order free tile to a participant. Returns the tile,
   *  or null if the wall is full. Enforces one-tile-per-participant. */
  allocate(participantId: string, countryIso: string): ModelTile | null {
    if (this.byParticipant.has(participantId)) {
      return this.tiles[this.byParticipant.get(participantId)!];
    }
    const tile = this.tiles
      .filter((t) => t.participantId === null)
      .sort((a, b) => a.allocationOrder - b.allocationOrder)[0];
    if (!tile) return null; // wall_full
    tile.participantId = participantId;
    tile.countryIso = countryIso;
    this.byParticipant.set(participantId, tile.tileIndex);
    return tile;
  }

  /** Free a participant's tile (admin reject / remove). */
  release(participantId: string): void {
    const idx = this.byParticipant.get(participantId);
    if (idx == null) return;
    const tile = this.tiles[idx];
    tile.participantId = null;
    tile.countryIso = null;
    this.byParticipant.delete(participantId);
  }

  countryTiles(): { iso: string; tiles: number }[] {
    const counts = new Map<string, number>();
    for (const t of this.tiles) {
      if (t.participantId && t.countryIso) {
        counts.set(t.countryIso, (counts.get(t.countryIso) ?? 0) + 1);
      }
    }
    return [...counts.entries()].map(([iso, tiles]) => ({ iso, tiles }));
  }

  occupiedCount(): number {
    return this.tiles.filter((t) => t.participantId !== null).length;
  }
}
