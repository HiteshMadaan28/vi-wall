import { describe, it, expect } from "vitest";
import { generateViTiles, viCapacity, isInsideVi } from "@/lib/vi-mask";

describe("vi-mask", () => {
  it("is deterministic across calls for the same resolution", () => {
    const a = generateViTiles(80, 50);
    const b = generateViTiles(80, 50);
    expect(a.length).toBe(b.length);
    expect(a).toEqual(b);
  });

  it("assigns row-major, contiguous indices", () => {
    const tiles = generateViTiles(60, 37);
    tiles.forEach((t, i) => expect(t.index).toBe(i));
  });

  it("produces a unique allocation order covering every tile once", () => {
    const tiles = generateViTiles(60, 37);
    const orders = new Set(tiles.map((t) => t.allocationOrder));
    expect(orders.size).toBe(tiles.length);
    const max = Math.max(...tiles.map((t) => t.allocationOrder));
    expect(max).toBe(tiles.length - 1);
  });

  it("scales capacity up with resolution without changing the shape", () => {
    const small = viCapacity(60, 37);
    const large = viCapacity(120, 74);
    expect(large).toBeGreaterThan(small);
  });

  it("marks the vertical stem of the I as inside and the gaps as outside", () => {
    // centre of the I stem
    expect(isInsideVi(0.815, 0.5)).toBe(true);
    // empty gap between V and I
    expect(isInsideVi(0.6, 0.5)).toBe(false);
    // outside the top margin
    expect(isInsideVi(0.5, 0.02)).toBe(false);
  });
});
