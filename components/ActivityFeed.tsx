"use client";

import { useEffect, useState } from "react";
import { Activity, UserPlus, Flag, ShieldCheck } from "lucide-react";
import { getCountry } from "@/lib/countries";
import type { ActivityItem } from "@/lib/types";

/** Live activity feed. Backed entirely by real activity_events rows — never
 *  fabricated. Polls every 15s (gentle, not aggressive). */
export function ActivityFeed({ initial }: { initial: ActivityItem[] }) {
  const [events, setEvents] = useState(initial);

  useEffect(() => {
    const load = () =>
      fetch("/api/activity?limit=20")
        .then((r) => r.json())
        .then((d) => setEvents(d.events))
        .catch(() => {});
    const id = setInterval(load, 15_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="rounded-2xl glass p-4 sm:p-6">
      <h2 className="flex items-center gap-2 font-display text-lg font-bold">
        <Activity size={18} className="text-neon-cyan" /> Live Activity
      </h2>

      {events.length === 0 ? (
        <p className="mt-6 text-center text-sm text-ink-faint">
          Activity will appear here as players join.
        </p>
      ) : (
        <ul className="mt-4 max-h-[420px] space-y-2 overflow-y-auto scroll-neon pr-1">
          {events.map((e) => (
            <li key={e.id} className="flex items-start gap-3 rounded-lg bg-black/20 px-3 py-2.5">
              <span className="mt-0.5 text-neon-violet">{iconFor(e.type)}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-ink">{describe(e)}</p>
                <p className="text-[11px] text-ink-faint">{timeAgo(e.createdAt)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function iconFor(type: string) {
  if (type === "player_joined") return <UserPlus size={16} />;
  if (type === "country_milestone") return <Flag size={16} />;
  return <ShieldCheck size={16} />;
}

function describe(e: ActivityItem): string {
  const iso = e.countryIso ?? (e.metadata.country_iso as string | undefined);
  const country = iso ? getCountry(iso) : undefined;
  const countryLabel = country ? `${country.flag} ${country.name}` : iso ?? "Someone";
  switch (e.type) {
    case "player_joined": {
      const username = (e.metadata.username as string) ?? "A new player";
      return `${username} from ${countryLabel} joined the VI Wall.`;
    }
    case "country_milestone": {
      const tiles = e.metadata.tiles as number | undefined;
      return `${countryLabel} reached ${tiles?.toLocaleString() ?? "a new"} tiles.`;
    }
    case "participant_approved":
      return `A player from ${countryLabel} was approved.`;
    case "participant_removed":
    case "participant_rejected":
      return `A player from ${countryLabel} was removed by moderators.`;
    default:
      return "New activity on the wall.";
  }
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
