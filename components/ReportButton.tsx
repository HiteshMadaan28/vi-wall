"use client";

import { useState } from "react";
import { Flag, Loader2 } from "lucide-react";

/** Lets a visitor report a participant for moderation. */
export function ReportButton({ username }: { username: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  const submit = async () => {
    if (reason.trim().length < 5) {
      setStatus("error");
      return;
    }
    setStatus("sending");
    const res = await fetch("/api/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, reason }),
    });
    setStatus(res.ok ? "done" : "error");
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-faint hover:text-red-300"
      >
        <Flag size={13} /> Report
      </button>
    );
  }

  return (
    <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-4">
      {status === "done" ? (
        <p className="text-sm text-emerald-300">Thanks. Our moderators will review this.</p>
      ) : (
        <>
          <label className="block text-sm font-semibold text-ink-dim">Report this player</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="What's the problem?"
            className="vw-input mt-2 resize-none"
          />
          {status === "error" && (
            <p className="mt-1 text-xs text-red-300">Please add a few words (min 5 characters).</p>
          )}
          <div className="mt-2 flex gap-2">
            <button
              onClick={submit}
              disabled={status === "sending"}
              className="inline-flex items-center gap-1.5 rounded-lg btn-neon px-3 py-1.5 text-sm font-bold disabled:opacity-60"
            >
              {status === "sending" && <Loader2 size={14} className="animate-spin" />}
              Submit report
            </button>
            <button onClick={() => setOpen(false)} className="rounded-lg btn-ghost px-3 py-1.5 text-sm">
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
}
