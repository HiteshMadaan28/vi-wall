import Link from "next/link";
import { ArrowRight, Compass, Users, Globe2, Trophy } from "lucide-react";
import { getStats, getLeaderboard, getActivity } from "@/lib/data";
import { StatsBar } from "@/components/StatsBar";
import { ViWall } from "@/components/ViWall";
import { WallCompletion } from "@/components/WallCompletion";
import { Leaderboard } from "@/components/Leaderboard";
import { ActivityFeed } from "@/components/ActivityFeed";
import { CountryBattle } from "@/components/CountryBattle";
import { SpotlightPlaceholder } from "@/components/SpotlightPlaceholder";
import { PlayerSearch } from "@/components/PlayerSearch";
import { Countdown } from "@/components/Countdown";
import { HomeAnalytics } from "@/components/HomeAnalytics";

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
      <section className="relative mx-auto max-w-7xl px-4 pt-10 sm:px-6 sm:pt-14">
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
              Claim your own block, represent your country, and become part of a
              global gaming monument.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link href="/claim" className="inline-flex items-center gap-2 rounded-xl btn-neon px-6 py-3 font-display font-bold">
                Claim Your Block <ArrowRight size={18} />
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

      {/* ---- Main VI wall -------------------------------------------------- */}
      <section className="mx-auto mt-14 max-w-7xl px-4 sm:px-6">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold">The VI Wall</h2>
            <p className="text-sm text-ink-dim">
              One continuous sunset gradient. Every block is one person.
            </p>
          </div>
          <Link href="/claim" className="text-sm font-semibold text-neon-violet hover:text-neon-pink">
            Claim a block →
          </Link>
        </div>
        <ViWall />
      </section>

      {/* ---- Wall completion ---------------------------------------------- */}
      <section className="mx-auto mt-6 max-w-7xl px-4 sm:px-6">
        <WallCompletion initial={stats} />
      </section>

      {/* ---- Question banner ---------------------------------------------- */}
      <section className="mx-auto mt-10 max-w-7xl px-4 sm:px-6">
        <div className="rounded-2xl glass p-6 text-center sm:p-8">
          <h2 className="font-display text-2xl font-black sm:text-3xl">
            WHICH COUNTRY WILL <span className="neon-text">DOMINATE</span> THE VI WALL?
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-ink-dim">
            Recognition, competition, belonging. Claim a block, represent your
            country, and climb the global leaderboard.
          </p>
        </div>
      </section>

      {/* ---- Leaderboard + Battle ----------------------------------------- */}
      <section className="mx-auto mt-10 grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-2">
        <Leaderboard initial={leaderboard} limit={10} />
        <CountryBattle initial={leaderboard} />
      </section>

      {/* ---- Activity + Search -------------------------------------------- */}
      <section className="mx-auto mt-6 grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-2">
        <ActivityFeed initial={activity} />
        <PlayerSearch />
      </section>

      {/* ---- Community participation info --------------------------------- */}
      <section className="mx-auto mt-14 max-w-7xl px-4 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <InfoCard icon={<Users size={20} />} title="Individual ownership">
            Every verified block belongs to one person, permanently, at a position
            they chose themselves.
          </InfoCard>
          <InfoCard icon={<Globe2 size={20} />} title="Global participation">
            Players from countries around the world fill the VI together, one block
            at a time.
          </InfoCard>
          <InfoCard icon={<Trophy size={20} />} title="Country competition">
            Each block adds one point for its country. Watch the leaderboard shift
            as the wall fills.
          </InfoCard>
        </div>
      </section>

      {/* ---- Spotlight placeholder ---------------------------------------- */}
      <section className="mx-auto mt-10 max-w-7xl px-4 sm:px-6">
        <SpotlightPlaceholder />
      </section>
    </>
  );
}

function InfoCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl glass p-5">
      <div className="grid h-10 w-10 place-items-center rounded-xl btn-neon">{icon}</div>
      <h3 className="mt-3 font-display text-lg font-bold">{title}</h3>
      <p className="mt-1.5 text-sm text-ink-dim">{children}</p>
    </div>
  );
}
