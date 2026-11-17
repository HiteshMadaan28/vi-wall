"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, MapPin } from "lucide-react";
import { ViWall } from "./ViWall";
import { ClaimForm } from "./ClaimForm";
import { GRID_ROWS } from "@/lib/config";
import { sampleGradient, rgbString } from "@/lib/gradient";
import { track } from "@/lib/analytics";

interface Reservation {
  tileIndex: number;
  x: number;
  y: number;
  reservationToken: string;
  reservedUntil: string;
}

/**
 * Two-step claim: (1) choose your own block on the wall and reserve it, then
 * (2) fill in your details and verify. The reservation (atomic, ~10 min) holds
 * the exact block while the user completes verification.
 */
export function ClaimFlow() {
  const [step, setStep] = useState<"select" | "form">("select");
  const [selected, setSelected] = useState<{ tileIndex: number; x: number; y: number } | null>(null);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [reserving, setReserving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectTile = (tileIndex: number, pos: { x: number; y: number }) => {
    setError(null);
    setSelected({ tileIndex, x: pos.x, y: pos.y });
  };

  const reserveAndContinue = async () => {
    if (!selected) return;
    setReserving(true);
    setError(null);
    try {
      const res = await fetch("/api/reserve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tileIndex: selected.tileIndex }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setReservation({
          tileIndex: selected.tileIndex,
          x: selected.x,
          y: selected.y,
          reservationToken: data.reservationToken,
          reservedUntil: data.reservedUntil,
        });
        setStep("form");
        track("claim_started", { tile: selected.tileIndex });
      } else if (res.status === 409) {
        setError(data.message ?? "That block was just taken. Pick another.");
        setSelected(null);
      } else if (res.status === 503) {
        setError("The wall isn't connected yet on this deployment.");
      } else {
        setError("Couldn't reserve that block. Try again.");
      }
    } catch {
      setError("Network error. Try again.");
    } finally {
      setReserving(false);
    }
  };

  const resetToSelect = () => {
    setReservation(null);
    setSelected(null);
    setStep("select");
    setError(null);
  };

  if (step === "form" && reservation) {
    return (
      <div className="space-y-4">
        <button
          onClick={resetToSelect}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-dim hover:text-ink"
        >
          <ArrowLeft size={16} /> Choose a different block
        </button>
        <ReservationTimer reservedUntil={reservation.reservedUntil} onExpire={resetToSelect} />
        <ClaimForm
          tileIndex={reservation.tileIndex}
          reservationToken={reservation.reservationToken}
          onReservationLost={resetToSelect}
        />
      </div>
    );
  }

  const swatch = selected
    ? rgbString(sampleGradient((selected.y + 0.5) / GRID_ROWS))
    : null;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-black sm:text-3xl">
          Choose your own place in the <span className="neon-text">VI</span>
        </h1>
        <p className="mt-1 text-ink-dim">
          Zoom and pan the wall, then tap any available block to claim it as yours.
        </p>
      </div>

      <ViWall mode="select" selectedTile={selected?.tileIndex ?? null} onSelectTile={selectTile} />

      {error && (
        <p className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      )}

      {selected && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl glass-strong p-4">
          <div className="flex items-center gap-3">
            <span
              className="h-10 w-10 rounded-lg ring-2 ring-white/40"
              style={{ background: swatch ?? undefined }}
              aria-hidden
            />
            <div>
              <div className="flex items-center gap-1.5 text-sm text-ink-dim">
                <MapPin size={14} /> Block selected
              </div>
              <div className="font-display text-lg font-bold">
                VI-{String(selected.tileIndex).padStart(5, "0")}
              </div>
            </div>
          </div>
          <button
            onClick={reserveAndContinue}
            disabled={reserving}
            className="inline-flex items-center gap-2 rounded-xl btn-neon px-6 py-3 font-display font-bold disabled:opacity-60"
          >
            {reserving && <Loader2 size={16} className="animate-spin" />}
            Continue
          </button>
        </div>
      )}
    </div>
  );
}

function ReservationTimer({
  reservedUntil,
  onExpire,
}: {
  reservedUntil: string;
  onExpire: () => void;
}) {
  const [left, setLeft] = useState(() => msLeft(reservedUntil));

  useEffect(() => {
    const id = setInterval(() => {
      const ms = msLeft(reservedUntil);
      setLeft(ms);
      if (ms <= 0) {
        clearInterval(id);
        onExpire();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [reservedUntil, onExpire]);

  const mins = Math.floor(left / 60000);
  const secs = Math.floor((left % 60000) / 1000);

  return (
    <div className="rounded-lg border border-amber-300/25 bg-amber-300/5 px-3 py-2 text-sm text-amber-100">
      Block reserved for you — verify within{" "}
      <strong className="tabular-nums">
        {mins}:{String(secs).padStart(2, "0")}
      </strong>{" "}
      or it returns to the wall.
    </div>
  );
}

function msLeft(iso: string): number {
  return Math.max(0, new Date(iso).getTime() - Date.now());
}
