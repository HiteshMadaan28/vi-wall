"use client";

import { useEffect, useState } from "react";
import { EVENT_DATE } from "@/lib/config";

/**
 * Countdown to the configured event date. Renders nothing unless
 * NEXT_PUBLIC_EVENT_DATE is set to a valid date, so no fabricated date is
 * ever shown. The date is configured in one place (lib/config).
 */
export function Countdown() {
  const target = EVENT_DATE ? new Date(EVENT_DATE).getTime() : NaN;
  const valid = Number.isFinite(target);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!valid) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [valid]);

  if (!valid) return null;

  const diff = Math.max(0, target - now);
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1000);

  const units = [
    { label: "Days", value: days },
    { label: "Hours", value: hours },
    { label: "Min", value: minutes },
    { label: "Sec", value: seconds },
  ];

  return (
    <div className="inline-flex items-center gap-2 rounded-xl glass px-3 py-2">
      {units.map((u) => (
        <div key={u.label} className="text-center">
          <div className="font-display text-xl font-black text-ink tabular-nums">
            {String(u.value).padStart(2, "0")}
          </div>
          <div className="text-[10px] uppercase tracking-wide text-ink-faint">{u.label}</div>
        </div>
      ))}
    </div>
  );
}
