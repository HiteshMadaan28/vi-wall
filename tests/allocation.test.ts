import { describe, it, expect } from "vitest";
import { WallModel } from "@/lib/allocation-model";
import { rankCountries } from "@/lib/scoring";

describe("tile reservation + occupation", () => {
  it("CRITICAL: 100 users reserve the SAME tile — only one succeeds", () => {
    const w = new WallModel(50);
    const results = Array.from({ length: 100 }, (_, i) => w.reserve(7, `tok${i}`));
    expect(results.filter(Boolean).length).toBe(1);
    expect(w.reservedCount()).toBe(1);
  });

  it("CRITICAL: 100 users reserve DIFFERENT tiles — all succeed", () => {
    const w = new WallModel(100);
    const results = Array.from({ length: 100 }, (_, i) => w.reserve(i, `tok${i}`));
    expect(results.every(Boolean)).toBe(true);
    expect(w.reservedCount()).toBe(100);
  });

  it("occupies a reserved tile only with the matching token", () => {
    const w = new WallModel(10);
    w.reserve(3, "mine");
    expect(w.occupy(3, "wrong", "p1", "IN")).toBe("invalid");
    expect(w.occupy(3, "mine", "p1", "IN")).toBe("ok");
    expect(w.occupiedCount()).toBe(1);
  });

  it("releases expired reservations so the tile can be re-reserved", () => {
    const t0 = 1_000_000;
    const w = new WallModel(10);
    expect(w.reserve(2, "a", t0, 600_000)).toBe(true);
    // second user can't take it while active
    expect(w.reserve(2, "b", t0 + 60_000)).toBe(false);
    // after expiry it frees up
    expect(w.reserve(2, "b", t0 + 700_000)).toBe(true);
  });

  it("CRITICAL: a reserved-but-unverified final tile does NOT complete the wall", () => {
    const w = new WallModel(3);
    w.reserve(0, "a"); w.occupy(0, "a", "p0", "IN");
    w.reserve(1, "b"); w.occupy(1, "b", "p1", "US");
    // final tile only reserved, not verified/occupied
    w.reserve(2, "c");
    expect(w.isComplete()).toBe(false);
    // once the final claim verifies, the wall completes
    expect(w.occupy(2, "c", "p2", "GB")).toBe("ok");
    expect(w.isComplete()).toBe(true);
  });

  it("removing a participant frees the tile and lowers the country score", () => {
    const w = new WallModel(10);
    w.reserve(0, "a"); w.occupy(0, "a", "p1", "IN");
    w.reserve(1, "b"); w.occupy(1, "b", "p2", "IN");
    w.reserve(2, "c"); w.occupy(2, "c", "p3", "US");

    let ranked = rankCountries(w.countryTiles(), 10);
    expect(ranked.find((c) => c.iso === "IN")!.tiles).toBe(2);
    expect(w.occupiedCount()).toBe(3);

    w.release("p1");

    ranked = rankCountries(w.countryTiles(), 10);
    expect(ranked.find((c) => c.iso === "IN")!.tiles).toBe(1);
    expect(w.occupiedCount()).toBe(2);
  });
});
