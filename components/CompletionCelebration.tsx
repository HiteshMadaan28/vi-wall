"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { cssSunset } from "@/lib/gradient";

const SEEN_KEY = "vi_completion_seen_v1";

/**
 * The signature completion celebration. Rendered only when the wall is
 * complete. Plays its cinematic sweep exactly once per visitor (guarded by
 * localStorage); on later visits it doesn't replay. The one-time *event* is
 * guaranteed server-side by the wall_state flag — this is just the visual.
 * Honours prefers-reduced-motion by showing the final state without animation.
 */
export function CompletionCelebration() {
  const [show, setShow] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const already = typeof window !== "undefined" && localStorage.getItem(SEEN_KEY);
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    setReduced(Boolean(prefersReduced));
    if (!already) {
      setShow(true);
      localStorage.setItem(SEEN_KEY, new Date().toISOString());
      if (!prefersReduced) {
        const t = setTimeout(() => setShow(false), 6000);
        return () => clearTimeout(t);
      }
    }
  }, []);

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center bg-black/80 p-6 backdrop-blur-sm"
      onClick={() => setShow(false)}
    >
      <button
        aria-label="Close"
        onClick={() => setShow(false)}
        className="absolute right-4 top-4 rounded-lg p-2 text-ink-dim hover:text-ink"
      >
        <X size={22} />
      </button>

      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl p-10 text-center">
        {/* bloom background in the sunset gradient */}
        <div
          className={`absolute inset-0 ${reduced ? "" : "vi-bloom"}`}
          style={{ background: cssSunset("135deg"), opacity: 0.9 }}
          aria-hidden
        />
        {/* light sweep */}
        {!reduced && (
          <div
            className="vi-sweep absolute inset-y-0 left-0 w-1/2"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.65), transparent)",
            }}
            aria-hidden
          />
        )}

        <div className={`relative ${reduced ? "" : "vi-rise"}`}>
          <div className="font-display text-5xl font-black tracking-wide text-white drop-shadow-lg sm:text-6xl">
            VI
          </div>
          <h2 className="mt-4 font-display text-2xl font-black text-white sm:text-3xl">
            THE VI WALL IS COMPLETE!
          </h2>
          <p className="mx-auto mt-3 max-w-md text-white/90">
            Thousands of players. Countries around the world. One monument. Built
            together.
          </p>
        </div>
      </div>
    </div>
  );
}
