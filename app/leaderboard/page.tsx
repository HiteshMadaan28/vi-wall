import type { Metadata } from "next";
import { getLeaderboard } from "@/lib/data";
import { Leaderboard } from "@/components/Leaderboard";
import { CountryPlayers } from "@/components/CountryPlayers";
import { isValidCountry } from "@/lib/countries";

export const revalidate = 15;

export const metadata: Metadata = {
  title: "Country Leaderboard",
  description: "The full country ranking on The VI Wall. See which country is dominating.",
};

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ country?: string }>;
}) {
  const { country } = await searchParams;
  const selected = country && isValidCountry(country) ? country.toUpperCase() : null;
  const ranked = await getLeaderboard();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-black">
        Country <span className="neon-text">Leaderboard</span>
      </h1>
      <p className="mt-2 max-w-2xl text-ink-dim">
        Every approved tile is one point for a country. Ranked by real database
        counts, updated continuously.
      </p>

      <div className="mt-6 grid gap-6">
        {selected && <CountryPlayers iso={selected} />}
        <Leaderboard initial={ranked} showSearch showViewAll={false} />
      </div>
    </div>
  );
}
