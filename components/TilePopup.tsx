"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, ExternalLink, Share2, Loader2, MapPin } from "lucide-react";
import { Avatar } from "./Avatar";
import { getCountry } from "@/lib/countries";
import { track } from "@/lib/analytics";
import type { OccupiedTile, PublicProfile } from "@/lib/types";

/** Popup shown when a wall tile is clicked. Loads the full public profile
 *  (message, join date, social link) for the tapped participant. */
export function TilePopup({ tile, onClose }: { tile: OccupiedTile; onClose: () => void }) {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const country = getCountry(tile.countryIso);

  useEffect(() => {
    let active = true;
    fetch(`/api/profile/${encodeURIComponent(tile.username.toLowerCase())}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => active && setProfile(d?.profile ?? null))
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [tile.username]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const share = async () => {
    const url = `${window.location.origin}/player/${tile.username.toLowerCase()}`;
    track("profile_shared", { source: "tile_popup" });
    if (navigator.share) {
      await navigator.share({ title: `${tile.username} on The VI Wall`, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url).catch(() => {});
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl glass-strong p-6 neon-ring"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar preset={tile.avatar} url={tile.avatarUrl} username={tile.username} size={56} />
            <div>
              <h3 className="font-display text-lg font-bold">{tile.username}</h3>
              <p className="text-sm text-ink-dim">
                {country?.flag} {country?.name ?? tile.countryIso}
              </p>
            </div>
          </div>
          <button aria-label="Close" onClick={onClose} className="rounded-lg p-1 text-ink-dim hover:text-ink">
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div className="mt-6 grid place-items-center py-6">
            <Loader2 className="animate-spin text-neon-violet" />
          </div>
        ) : (
          <>
            {profile?.message && (
              <p className="mt-4 rounded-lg bg-white/5 p-3 text-sm italic text-ink">
                “{profile.message}”
              </p>
            )}
            <dl className="mt-4 space-y-1.5 text-sm">
              <div className="flex items-center gap-2 text-ink-dim">
                <MapPin size={14} />
                Tile #{tile.tileIndex} · ({tile.x}, {tile.y})
              </div>
              {profile?.joinedAt && (
                <div className="text-ink-dim">
                  Joined {new Date(profile.joinedAt).toLocaleDateString()}
                </div>
              )}
              {tile.status === "verified" && (
                <div className="text-amber-300/90">Pending admin approval</div>
              )}
            </dl>

            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href={`/player/${tile.username.toLowerCase()}`}
                className="flex-1 rounded-lg btn-neon px-3 py-2 text-center text-sm font-bold"
              >
                View profile
              </Link>
              <button onClick={share} className="rounded-lg btn-ghost px-3 py-2 text-sm font-semibold" aria-label="Share profile">
                <Share2 size={16} />
              </button>
              {profile?.socialUrl && (
                <a
                  href={profile.socialUrl}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="rounded-lg btn-ghost px-3 py-2 text-sm font-semibold"
                  aria-label="Open social link"
                >
                  <ExternalLink size={16} />
                </a>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
