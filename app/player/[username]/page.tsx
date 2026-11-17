import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ExternalLink, MapPin, CalendarDays } from "lucide-react";
import { getProfile } from "@/lib/data";
import { normalizeUsername } from "@/lib/moderation";
import { Avatar } from "@/components/Avatar";
import { ShareButton } from "@/components/ShareButton";
import { ReportButton } from "@/components/ReportButton";
import { SITE_URL } from "@/lib/config";

export const revalidate = 30;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfile(normalizeUsername(username));
  if (!profile) return { title: "Player not found" };

  const title = `${profile.username} · ${profile.countryFlag} ${profile.countryName}`;
  const description =
    profile.message?.trim() ||
    `${profile.username} is representing ${profile.countryName} on The VI Wall.`;
  const url = `${SITE_URL}/player/${profile.username.toLowerCase()}`;

  return {
    title: profile.username,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "profile" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function PlayerPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const profile = await getProfile(normalizeUsername(username));
  if (!profile) notFound();

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6">
      <div className="rounded-2xl glass-strong p-8 text-center">
        <div className="flex justify-center">
          <Avatar preset={profile.avatar} url={profile.avatarUrl} username={profile.username} size={88} />
        </div>
        <h1 className="mt-4 font-display text-3xl font-black">{profile.username}</h1>
        <p className="mt-1 text-lg text-ink-dim">
          {profile.countryFlag} {profile.countryName}
        </p>
        {profile.status === "verified" && (
          <p className="mt-1 text-xs text-amber-300/90">Pending admin approval</p>
        )}

        {profile.message && (
          <p className="mx-auto mt-5 max-w-md rounded-xl bg-white/5 p-4 text-ink italic">
            “{profile.message}”
          </p>
        )}

        <dl className="mx-auto mt-6 grid max-w-sm gap-2 text-left">
          {profile.tileIndex != null && (
            <Detail icon={<MapPin size={15} />} label="Tile" value={`#${profile.tileIndex} · (${profile.x}, ${profile.y})`} />
          )}
          <Detail
            icon={<CalendarDays size={15} />}
            label="Joined"
            value={new Date(profile.joinedAt).toLocaleDateString()}
          />
        </dl>

        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <ShareButton username={profile.username} />
          {profile.tileIndex != null && (
            <Link href={`/wall?tile=${profile.tileIndex}`} className="rounded-xl btn-ghost px-5 py-2.5 font-bold">
              Find on wall
            </Link>
          )}
          {profile.socialUrl && (
            <a
              href={profile.socialUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="inline-flex items-center gap-2 rounded-xl btn-ghost px-5 py-2.5 font-bold"
            >
              <ExternalLink size={16} /> Social
            </a>
          )}
        </div>

        <div className="mt-6 border-t border-white/5 pt-4">
          <ReportButton username={profile.username} />
        </div>
      </div>
    </div>
  );
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-black/25 px-4 py-2.5">
      <span className="flex items-center gap-1.5 text-sm text-ink-dim">{icon}{label}</span>
      <span className="font-semibold text-ink">{value}</span>
    </div>
  );
}
