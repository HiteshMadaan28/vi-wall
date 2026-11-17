import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Leaderboard } from "@/components/Leaderboard";
import { StatsBar } from "@/components/StatsBar";
import type { RankedCountry } from "@/lib/scoring";
import type { WallStats } from "@/lib/types";

// Components poll via fetch; stub it so tests don't hit the network.
beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ countries: [] }) }))
  );
});

const ranked: RankedCountry[] = [
  { iso: "IN", name: "India", flag: "🇮🇳", accent: "#ff9933", tiles: 2450, percentOfWall: 24.5, percentOfClaimed: 54, rank: 1 },
  { iso: "US", name: "United States", flag: "🇺🇸", accent: "#3b82f6", tiles: 2100, percentOfWall: 21, percentOfClaimed: 46, rank: 2 },
];

describe("Leaderboard", () => {
  it("renders ranked countries with tile counts", () => {
    render(<Leaderboard initial={ranked} showSearch={false} showViewAll={false} />);
    expect(screen.getByText("India")).toBeInTheDocument();
    expect(screen.getByText("United States")).toBeInTheDocument();
    expect(screen.getByText("2,450")).toBeInTheDocument();
  });

  it("shows an empty state when there are no countries", () => {
    render(<Leaderboard initial={[]} showSearch={false} showViewAll={false} />);
    expect(screen.getByText(/No countries on the board yet/i)).toBeInTheDocument();
  });
});

describe("StatsBar", () => {
  it("renders headline stats and the leading country", () => {
    const stats: WallStats = {
      configured: true,
      totalPlayers: 1234,
      totalTiles: 1234,
      wallCapacity: 3418,
      participatingCountries: 12,
      fillPercent: 36.1,
      leader: { iso: "IN", name: "India", flag: "🇮🇳", tiles: 500 },
    };
    render(<StatsBar initial={stats} />);
    // players and tiles both read 1,234 in Phase One (one tile per player)
    expect(screen.getAllByText("1,234").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/🇮🇳 IN/)).toBeInTheDocument();
    expect(screen.getByText("36.1%")).toBeInTheDocument();
  });
});
