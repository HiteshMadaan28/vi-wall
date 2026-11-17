import type { Metadata } from "next";
import { ViWall } from "@/components/ViWall";
import { PlayerSearch } from "@/components/PlayerSearch";

export const metadata: Metadata = {
  title: "The Wall",
  description: "Explore the giant VI-shaped wall built from player tiles around the world.",
};

export default async function WallPage({
  searchParams,
}: {
  searchParams: Promise<{ tile?: string }>;
}) {
  const { tile } = await searchParams;
  const highlight = tile != null && tile !== "" ? Number(tile) : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-black">
        The <span className="neon-text">VI</span> Wall
      </h1>
      <p className="mt-2 max-w-2xl text-ink-dim">
        Thousands of tiles form one giant VI. Drag to pan, scroll or pinch to
        zoom, and tap any tile to meet the player behind it.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <ViWall highlightTile={Number.isFinite(highlight) ? highlight : null} />
        <PlayerSearch />
      </div>
    </div>
  );
}
