import { describe, it, expect } from "vitest";
import {
  rankCountries,
  topCountries,
  compareCountries,
  wallFillPercent,
  roundPercent,
} from "@/lib/scoring";

const CAPACITY = 1000;

const tallies = [
  { iso: "IN", tiles: 450 },
  { iso: "US", tiles: 420 },
  { iso: "GB", tiles: 140 },
  { iso: "BR", tiles: 140 }, // ties with GB -> alphabetical break (BR before GB)
  { iso: "ZZ", tiles: 0 }, // zero tiles -> excluded
];

describe("rankCountries", () => {
  it("ranks by tiles descending with deterministic tie-breaking", () => {
    const ranked = rankCountries(tallies, CAPACITY);
    expect(ranked.map((r) => r.iso)).toEqual(["IN", "US", "BR", "GB"]);
    expect(ranked.map((r) => r.rank)).toEqual([1, 2, 3, 4]);
  });

  it("excludes countries with zero tiles", () => {
    const ranked = rankCountries(tallies, CAPACITY);
    expect(ranked.find((r) => r.iso === "ZZ")).toBeUndefined();
  });

  it("computes percentage of wall capacity correctly", () => {
    const ranked = rankCountries(tallies, CAPACITY);
    const india = ranked.find((r) => r.iso === "IN")!;
    expect(india.percentOfWall).toBeCloseTo(45);
  });

  it("computes percentage of claimed tiles correctly", () => {
    const ranked = rankCountries(tallies, CAPACITY);
    const india = ranked.find((r) => r.iso === "IN")!;
    // total claimed = 450+420+140+140 = 1150
    expect(india.percentOfClaimed).toBeCloseTo((450 / 1150) * 100);
  });

  it("handles zero capacity without dividing by zero", () => {
    const ranked = rankCountries(tallies, 0);
    expect(ranked[0].percentOfWall).toBe(0);
  });
});

describe("topCountries", () => {
  it("limits to the requested number", () => {
    expect(topCountries(tallies, CAPACITY, 2).map((r) => r.iso)).toEqual([
      "IN",
      "US",
    ]);
  });
});

describe("wallFillPercent", () => {
  it("computes the filled percentage", () => {
    expect(wallFillPercent(250, 1000)).toBe(25);
    expect(wallFillPercent(0, 0)).toBe(0);
  });
});

describe("roundPercent", () => {
  it("rounds to one decimal by default", () => {
    expect(roundPercent(45.678)).toBe(45.7);
  });
});

describe("compareCountries", () => {
  it("reports the leader and the tile difference", () => {
    const ranked = rankCountries(tallies, CAPACITY);
    const battle = compareCountries(ranked, "IN", "US");
    expect(battle.leaderIso).toBe("IN");
    expect(battle.difference).toBe(30);
  });

  it("reports a tie as zero difference and no leader", () => {
    const ranked = rankCountries(tallies, CAPACITY);
    const battle = compareCountries(ranked, "GB", "BR");
    expect(battle.difference).toBe(0);
    expect(battle.leaderIso).toBeNull();
  });
});
