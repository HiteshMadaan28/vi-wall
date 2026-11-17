import type { Metadata } from "next";
import { PlayerSearch } from "@/components/PlayerSearch";
import { ActivityFeed } from "@/components/ActivityFeed";
import { getActivity } from "@/lib/data";

export const revalidate = 15;

export const metadata: Metadata = {
  title: "Players",
  description: "Find players on The VI Wall and see who just joined.",
};

export default async function PlayersPage() {
  const activity = await getActivity(20);
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold">
        <span className="neon-text">Players</span>
      </h1>
      <p className="mt-2 max-w-2xl text-ink-dim">
        Search for a player by username and jump to their block on the wall, or
        watch who&apos;s joining right now.
      </p>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <PlayerSearch />
        <ActivityFeed initial={activity} />
      </div>
    </div>
  );
}
