/**
 * Deterministic generation of the Roman-numeral "VI" silhouette.
 *
 * The silhouette is defined mathematically and rasterised onto a grid, so the
 * exact same set of tiles is produced on the server and the client for a given
 * resolution. The shape is resolution-independent: increasing the column count
 * yields more tiles (more capacity) without changing the proportions, so future
 * capacity increases never require rebuilding the layout logic.
 */

export interface ViTile {
  /** Stable index in row-major reading order. Persisted as `tile_index`. */
  index: number;
  /** Column (0 = left). */
  col: number;
  /** Row (0 = top). */
  row: number;
  /** Normalised x in [0,1], centre of the cell. */
  nx: number;
  /** Normalised y in [0,1], centre of the cell. */
  ny: number;
  /**
   * Deterministic allocation order. Tiles are claimed in ascending order of
   * this value, scattered across the whole silhouette so a partially filled
   * wall still reads as a VI rather than filling top-to-bottom.
   */
  allocationOrder: number;
}

/** Stable 2D hash -> [0,1). Used to scatter the allocation order. */
function hash2d(col: number, row: number): number {
  let h = (col * 73856093) ^ (row * 19349663);
  // force unsigned 32-bit then mix
  h = Math.imul(h ^ (h >>> 15), 2246822519);
  h ^= h >>> 13;
  h = Math.imul(h, 3266489917);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

function inRange(v: number, lo: number, hi: number): boolean {
  return v >= lo && v <= hi;
}

/**
 * Returns true when the normalised point (x,y) falls inside the VI silhouette.
 * Coordinates: x grows right, y grows downward, both in [0,1].
 */
export function isInsideVi(x: number, y: number): boolean {
  // ---- Letter "V" : occupies the left portion -----------------------------
  const vTop = 0.1;
  const vBottom = 0.9;
  if (inRange(y, vTop, vBottom)) {
    const p = (y - vTop) / (vBottom - vTop); // 0 at top, 1 at bottom
    const half = 0.06; // half stroke thickness
    // left stroke travels from top-left inward to the bottom apex
    const leftCenter = 0.05 + (0.26 - 0.05) * p;
    // right stroke travels from upper area inward to the same apex
    const rightCenter = 0.49 + (0.29 - 0.49) * p;
    if (Math.abs(x - leftCenter) < half) return true;
    if (Math.abs(x - rightCenter) < half) return true;
  }

  // ---- Letter "I" : occupies the right portion ----------------------------
  const iLeft = 0.66;
  const iRight = 0.97;
  const iCenter = (iLeft + iRight) / 2;
  const iTop = 0.1;
  const iBottom = 0.9;
  if (inRange(x, iLeft, iRight) && inRange(y, iTop, iBottom)) {
    // vertical stem
    if (Math.abs(x - iCenter) < 0.05) return true;
    // top serif
    if (inRange(y, iTop, iTop + 0.12)) return true;
    // bottom serif
    if (inRange(y, iBottom - 0.12, iBottom)) return true;
  }

  return false;
}

let cache: { cols: number; rows: number; tiles: ViTile[] } | null = null;

/**
 * Generate the ordered list of tiles that make up the VI silhouette for a
 * given grid resolution. Deterministic and memoised per resolution.
 */
export function generateViTiles(cols: number, rows: number): ViTile[] {
  if (cache && cache.cols === cols && cache.rows === rows) return cache.tiles;

  const raw: Omit<ViTile, "index" | "allocationOrder">[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const nx = (col + 0.5) / cols;
      const ny = (row + 0.5) / rows;
      if (isInsideVi(nx, ny)) {
        raw.push({ col, row, nx, ny });
      }
    }
  }

  // reading-order index is already row-major because of the loop order
  const withIndex = raw.map((t, index) => ({ ...t, index }));

  // allocation order: sort a copy by a stable scatter hash, then rank
  const scattered = [...withIndex]
    .map((t) => ({ index: t.index, key: hash2d(t.col, t.row) }))
    .sort((a, b) => a.key - b.key);

  const allocationByIndex = new Map<number, number>();
  scattered.forEach((s, rank) => allocationByIndex.set(s.index, rank));

  const tiles: ViTile[] = withIndex.map((t) => ({
    ...t,
    allocationOrder: allocationByIndex.get(t.index) ?? t.index,
  }));

  cache = { cols, rows, tiles };
  return tiles;
}

/** Total number of tiles (capacity) for a resolution. */
export function viCapacity(cols: number, rows: number): number {
  return generateViTiles(cols, rows).length;
}
