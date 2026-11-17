import { NextResponse } from "next/server";
import { getOccupiedTiles, getReservedTiles, WALL_CAPACITY } from "@/lib/data";
import { GRID_COLS, GRID_ROWS } from "@/lib/config";

export const dynamic = "force-dynamic";

/**
 * Returns the wall geometry (cols/rows/capacity) plus OCCUPIED and RESERVED
 * tiles. The client already knows every tile position (generated
 * deterministically), so sending only non-available tiles keeps the payload
 * small and avoids shipping thousands of empty rows.
 */
export async function GET() {
  const [tiles, reserved] = await Promise.all([getOccupiedTiles(), getReservedTiles()]);
  return NextResponse.json(
    { cols: GRID_COLS, rows: GRID_ROWS, capacity: WALL_CAPACITY, tiles, reserved },
    { headers: { "Cache-Control": "public, s-maxage=8, stale-while-revalidate=20" } }
  );
}
