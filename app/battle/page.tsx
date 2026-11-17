import type { Metadata } from "next";
import { getLeaderboard } from "@/lib/data";
import { CountryBattle } from "@/components/CountryBattle";

export const revalidate = 15;

export const metadata: Metadata = {
  title: "Country Battle",
  description: "Compare two countries head to head on The VI Wall.",
};

export default async function BattlePage() {
  const ranked = await getLeaderboard();
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-black">
        Country <span className="neon-text">Battle</span>
      </h1>
      <p className="mt-2 max-w-2xl text-ink-dim">
        Pick two countries and see who&apos;s ahead, by how many tiles, and where
        they sit on the board.
      </p>
      <div className="mt-6">
        <CountryBattle initial={ranked} />
      </div>
    </div>
  );
}
