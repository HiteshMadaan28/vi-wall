import { describe, it, expect } from "vitest";
import { generateViTiles } from "@/lib/vi-mask";
import { buildTiles } from "../scripts/generate-tiles-sql.mjs";
import { GRID_COLS, GRID_ROWS } from "@/lib/config";

/**
 * Guards against drift between the runtime silhouette (lib/vi-mask.ts, used to
 * render the wall) and the SQL seed generator (scripts/generate-tiles-sql.mjs,
 * used to populate wall_tiles). If these disagree, tile_index values on the
 * wall would point at the wrong database rows.
 */
describe("tile seed vs runtime mask", () => {
  it("produces identical index/position/allocation for every tile", () => {
    const runtime = generateViTiles(GRID_COLS, GRID_ROWS);
    const seed = buildTiles();
    expect(seed.length).toBe(runtime.length);
    for (let i = 0; i < runtime.length; i++) {
      expect(seed[i].tile_index).toBe(runtime[i].index);
      expect(seed[i].x_position).toBe(runtime[i].col);
      expect(seed[i].y_position).toBe(runtime[i].row);
      expect(seed[i].allocation_order).toBe(runtime[i].allocationOrder);
    }
  });
});
