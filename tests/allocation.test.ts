import { describe, it, expect } from "vitest";
import { TileAllocator } from "@/lib/allocation-model";
import { rankCountries } from "@/lib/scoring";

describe("tile allocation", () => {
  it("never allocates the same tile to two participants", () => {
    const a = new TileAllocator(50);
    const assigned = new Set<number>();
    for (let i = 0; i < 50; i++) {
      const tile = a.allocate(`p${i}`, "IN");
      expect(tile).not.toBeNull();
      expect(assigned.has(tile!.tileIndex)).toBe(false);
      assigned.add(tile!.tileIndex);
    }
  });

  it("gives a participant the same tile if they claim twice (no double tiles)", () => {
    const a = new TileAllocator(10);
    const first = a.allocate("p1", "US");
    const second = a.allocate("p1", "US");
    expect(first!.tileIndex).toBe(second!.tileIndex);
    expect(a.occupiedCount()).toBe(1);
  });

  it("CRITICAL: 100 claims for the final tile — exactly one succeeds", () => {
    const a = new TileAllocator(50);
    // fill 49 of 50 tiles
    for (let i = 0; i < 49; i++) a.allocate(`seed${i}`, "US");
    expect(a.occupiedCount()).toBe(49);

    // 100 distinct participants race for the single remaining tile
    const results = Array.from({ length: 100 }, (_, i) =>
      a.allocate(`racer${i}`, "IN")
    );
    const winners = results.filter((r) => r !== null);
    const losers = results.filter((r) => r === null);

    expect(winners.length).toBe(1);
    expect(losers.length).toBe(99);
    expect(a.occupiedCount()).toBe(50); // wall full, never over-allocated
  });

  it("allocates in ascending allocation order", () => {
    const a = new TileAllocator(5);
    expect(a.allocate("p1", "IN")!.allocationOrder).toBe(0);
    expect(a.allocate("p2", "IN")!.allocationOrder).toBe(1);
  });

  it("removing a participant frees the tile and lowers the country score", () => {
    const a = new TileAllocator(10);
    a.allocate("p1", "IN");
    a.allocate("p2", "IN");
    a.allocate("p3", "US");

    let ranked = rankCountries(a.countryTiles(), 10);
    expect(ranked.find((c) => c.iso === "IN")!.tiles).toBe(2);
    expect(a.occupiedCount()).toBe(3);

    a.release("p1"); // admin removes a player

    ranked = rankCountries(a.countryTiles(), 10);
    expect(ranked.find((c) => c.iso === "IN")!.tiles).toBe(1);
    expect(a.occupiedCount()).toBe(2);

    // freed tile is reused by the next claimant
    const reused = a.allocate("p4", "US");
    expect(reused!.allocationOrder).toBe(0); // lowest-order freed tile
  });
});
