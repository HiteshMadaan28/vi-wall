"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, LogOut, RefreshCw, Check, X, Trash2, Ban } from "lucide-react";
import type { AdminOverview, AdminParticipant } from "@/lib/admin-data";
import type { ActivityItem } from "@/lib/types";

const STATUS_FILTERS = [
  { key: "", label: "All" },
  { key: "pending_verification", label: "Pending" },
  { key: "verified", label: "Verified" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "removed", label: "Removed" },
  { key: "suspended", label: "Suspended" },
];

interface Payload {
  overview: AdminOverview;
  participants: AdminParticipant[];
  activity: ActivityItem[];
}

export function AdminDashboard() {
  const router = useRouter();
  const [data, setData] = useState<Payload | null>(null);
  const [filter, setFilter] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (filter) qs.set("status", filter);
    if (query.trim()) qs.set("q", query.trim());
    const res = await fetch(`/api/admin/data?${qs.toString()}`);
    if (res.status === 401) {
      router.refresh();
      return;
    }
    setData(await res.json());
    setLoading(false);
  }, [filter, query, router]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (participantId: string, action: string) => {
    setBusy(participantId + action);
    await fetch("/api/admin/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participantId, action }),
    });
    setBusy(null);
    load();
  };

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
  };

  const o = data?.overview;

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <button onClick={load} className="inline-flex items-center gap-1.5 rounded-lg btn-ghost px-3 py-1.5 text-sm">
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={logout} className="inline-flex items-center gap-1.5 rounded-lg btn-ghost px-3 py-1.5 text-sm">
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </div>

      {/* overview cards */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        <Stat label="Total" value={o?.totalParticipants} />
        <Stat label="Pending" value={o?.pending} />
        <Stat label="Verified" value={o?.verified} />
        <Stat label="Approved" value={o?.approved} accent />
        <Stat label="Occupied tiles" value={o?.occupiedTiles} />
        <Stat label="Available" value={o?.availableTiles} />
      </div>

      {/* filters + search */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
              filter === f.key ? "btn-neon" : "btn-ghost"
            }`}
          >
            {f.label}
          </button>
        ))}
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load()}
          placeholder="Search username…"
          className="vw-input ml-auto max-w-xs"
        />
      </div>

      {/* participant table */}
      <div className="mt-4 overflow-x-auto rounded-2xl glass">
        {loading && !data ? (
          <div className="grid place-items-center py-16">
            <Loader2 className="animate-spin text-neon-violet" />
          </div>
        ) : (
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-white/10 text-left text-ink-faint">
              <tr>
                <th className="px-4 py-3 font-semibold">Player</th>
                <th className="px-4 py-3 font-semibold">Country</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Tile</th>
                <th className="px-4 py-3 font-semibold">Message</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.participants.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-ink-faint">
                    No participants match this filter.
                  </td>
                </tr>
              )}
              {data?.participants.map((p) => (
                <tr key={p.id} className="border-b border-white/5">
                  <td className="px-4 py-3">
                    <Link href={`/player/${p.username.toLowerCase()}`} className="font-semibold text-ink hover:text-neon-pink">
                      {p.username}
                    </Link>
                    {!p.emailVerified && <span className="ml-2 text-xs text-amber-300/80">unverified</span>}
                  </td>
                  <td className="px-4 py-3">{p.countryFlag} {p.countryIso}</td>
                  <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                  <td className="px-4 py-3 text-ink-dim">{p.tileIndex ?? "—"}</td>
                  <td className="max-w-[220px] truncate px-4 py-3 text-ink-dim">{p.message ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                      <ActionBtn label="Approve" busy={busy === p.id + "approve"} onClick={() => act(p.id, "approve")} className="text-emerald-300">
                        <Check size={15} />
                      </ActionBtn>
                      <ActionBtn label="Reject" busy={busy === p.id + "reject"} onClick={() => act(p.id, "reject")} className="text-amber-300">
                        <X size={15} />
                      </ActionBtn>
                      <ActionBtn label="Suspend" busy={busy === p.id + "suspend"} onClick={() => act(p.id, "suspend")} className="text-orange-300">
                        <Ban size={15} />
                      </ActionBtn>
                      <ActionBtn label="Remove" busy={busy === p.id + "remove"} onClick={() => act(p.id, "remove")} className="text-red-300">
                        <Trash2 size={15} />
                      </ActionBtn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value?: number; accent?: boolean }) {
  return (
    <div className={`rounded-xl p-3 ${accent ? "glass-strong neon-ring" : "glass"}`}>
      <div className="text-xs uppercase tracking-wide text-ink-faint">{label}</div>
      <div className="mt-1 font-display text-xl font-bold">{value ?? "—"}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    approved: "bg-emerald-400/15 text-emerald-200",
    verified: "bg-sky-400/15 text-sky-200",
    pending_verification: "bg-amber-400/15 text-amber-200",
    rejected: "bg-red-400/15 text-red-200",
    removed: "bg-red-400/15 text-red-200",
    suspended: "bg-orange-400/15 text-orange-200",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${colors[status] ?? "bg-white/10"}`}>
      {status.replace("_", " ")}
    </span>
  );
}

function ActionBtn({
  children,
  onClick,
  label,
  busy,
  className = "",
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  busy: boolean;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      aria-label={label}
      title={label}
      className={`grid h-8 w-8 place-items-center rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-50 ${className}`}
    >
      {busy ? <Loader2 size={14} className="animate-spin" /> : children}
    </button>
  );
}
