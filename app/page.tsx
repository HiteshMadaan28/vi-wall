import Link from "next/link";
import { ArrowRight, Compass } from "lucide-react";
import { getStats, getLeaderboard, getActivity } from "@/lib/data";
import { StatsBar } from "@/components/StatsBar";
import { ViWall } from "@/components/ViWall";
import { Leaderboard } from "@/components/Leaderboard";
import { ActivityFeed } from "@/components/ActivityFeed";
import { CountryBattle } from "@/components/CountryBattle";
import { SpotlightPlaceholder } from "@/components/SpotlightPlaceholder";
import { PlayerSearch } from "@/components/PlayerSearch";
import { Countdown } from "@/components/Countdown";
import { HomeAnalytics } from "@/components/HomeAnalytics";

// Revalidate the server-rendered snapshot often; client components poll for
// finer-grained freshness.
export const revalidate = 15;

export default async function HomePage() {
  const [stats, leaderboard, activity] = await Promise.all([
    getStats(),
    getLeaderboard(10),
    getActivity(20),
  ]);

  return (
    <>
      <HomeAnalytics />

      {/* ---- Hero ---------------------------------------------------------- */}
      <section className="relative mx-auto max-w-7xl px-4 pt-10 sm:px-6 sm:pt-16">
        <div className="vi-grid-overlay pointer-events-none absolute inset-0 -z-10 opacity-40" />
        <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-ink-dim">
              Unofficial fan project
            </span>
            <h1 className="mt-4 font-display text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
              ONE WORLD.
              <br />
              MILLIONS OF PLAYERS.
              <br />
              <span className="neon-text">ONE GIANT VI.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-ink-dim">
              Every player represents a tile. Every tile represents a country.
              Together, we&apos;re building a global gaming monument.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link href="/claim" className="inline-flex items-center gap-2 rounded-xl btn-neon px-6 py-3 font-display font-bold">
                Claim Your Tile <ArrowRight size={18} />
              </Link>
              <Link href="/wall" className="inline-flex items-center gap-2 rounded-xl btn-ghost px-6 py-3 font-display font-bold">
                <Compass size={18} /> Explore the Wall
              </Link>
            </div>

            <div className="mt-6">
              <Countdown />
            </div>
          </div>

          {/* The VI wall is the visual centerpiece, visible immediately. */}
          <div>
            <ViWall compact />
          </div>
        </div>

        <div className="mt-10">
          <StatsBar initial={stats} />
        </div>
      </section>

      {/* ---- Question banner ---------------------------------------------- */}
      <section className="mx-auto mt-16 max-w-7xl px-4 sm:px-6">
        <div className="rounded-2xl glass p-6 text-center sm:p-8">
          <h2 className="font-display text-2xl font-black sm:text-3xl">
            WHICH COUNTRY WILL <span className="neon-text">DOMINATE</span> THE VI WALL?
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-ink-dim">
            Recognition, competition, belonging. Claim a tile, represent your
            country, and climb the global leaderboard.
          </p>
        </div>
      </section>

      {/* ---- Leaderboard + Activity --------------------------------------- */}
      <section className="mx-auto mt-10 grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-2">
        <Leaderboard initial={leaderboard} limit={10} />
        <ActivityFeed initial={activity} />
      </section>

      {/* ---- Battle + Search ---------------------------------------------- */}
      <section className="mx-auto mt-6 grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-2">
        <CountryBattle initial={leaderboard} />
        <PlayerSearch />
      </section>

      {/* ---- Full wall ---------------------------------------------------- */}
      <section className="mx-auto mt-14 max-w-7xl px-4 sm:px-6">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-display text-2xl font-bold">The VI Wall</h2>
          <Link href="/wall" className="text-sm font-semibold text-neon-violet hover:text-neon-pink">
            Open full view →
          </Link>
        </div>
        <ViWall />
      </section>

      {/* ---- Spotlight placeholder ---------------------------------------- */}
      <section className="mx-auto mt-10 max-w-7xl px-4 sm:px-6">
        <SpotlightPlaceholder />
      </section>
    </>
  );
}
