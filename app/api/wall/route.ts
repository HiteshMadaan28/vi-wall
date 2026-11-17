import { NextResponse } from "next/server";
import { getOccupiedTiles, WALL_CAPACITY } from "@/lib/data";
import { GRID_COLS, GRID_ROWS } from "@/lib/config";

export const dynamic = "force-dynamic";

/**
 * Returns the wall geometry (cols/rows/capacity) plus only the OCCUPIED tiles.
 * The client already knows every tile position (generated deterministically),
 * so sending occupied tiles alone keeps the payload small and avoids shipping
 * thousands of empty rows.
 */
export async function GET() {
  const tiles = await getOccupiedTiles();
  return NextResponse.json(
    { cols: GRID_COLS, rows: GRID_ROWS, capacity: WALL_CAPACITY, tiles },
    { headers: { "Cache-Control": "public, s-maxage=10, stale-while-revalidate=20" } }
  );
}
