"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { CheckCircle2, Loader2, Mail, AlertTriangle } from "lucide-react";
import { claimFormSchema, AVATAR_PRESETS, type ClaimFormOutput, type ClaimFormValues } from "@/lib/validation";
import { AVATAR_META } from "@/lib/avatars";
import { COUNTRIES } from "@/lib/countries";
import { MESSAGE_MAX_LENGTH } from "@/lib/config";
import { track } from "@/lib/analytics";

type Stage =
  | { kind: "form" }
  | { kind: "pending"; emailSent: boolean; devVerifyUrl?: string };

export function ClaimForm({
  tileIndex,
  reservationToken,
  onReservationLost,
}: {
  tileIndex: number;
  reservationToken: string;
  onReservationLost: () => void;
}) {
  const [stage, setStage] = useState<Stage>({ kind: "form" });
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ClaimFormValues, unknown, ClaimFormOutput>({
    resolver: zodResolver(claimFormSchema),
    defaultValues: { avatar: "violet-orb", countryIso: "IN", message: "", socialUrl: "" },
  });

  useEffect(() => {
    track("claim_started");
  }, []);

  const avatar = watch("avatar");
  const message = watch("message") ?? "";

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    track("claim_submitted", { country: values.countryIso });
    const res = await fetch("/api/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, tileIndex, reservationToken }),
    });
    const data = await res.json().catch(() => ({}));

    if (res.ok) {
      setStage({ kind: "pending", emailSent: data.emailSent, devVerifyUrl: data.devVerifyUrl });
      return;
    }

    if (res.status === 409 && data.error === "reservation_expired") {
      onReservationLost();
      return;
    }

    if (res.status === 400 && data.issues) {
      Object.entries(data.issues as Record<string, string[]>).forEach(([field, msgs]) => {
        setError(field as keyof ClaimFormValues, { message: msgs[0] });
      });
      return;
    }
    setServerError(data.message ?? "Something went wrong. Please try again.");
  });

  if (stage.kind === "pending") {
    return (
      <div className="rounded-2xl glass-strong p-8 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full btn-neon">
          <Mail size={26} />
        </div>
        <h2 className="mt-4 font-display text-2xl font-bold">Almost there</h2>
        {stage.emailSent ? (
          <p className="mx-auto mt-2 max-w-md text-ink-dim">
            We sent a verification link to your email. Click it to confirm and your
            tile will be placed on the VI Wall.
          </p>
        ) : (
          <p className="mx-auto mt-2 max-w-md text-ink-dim">
            Your claim is saved as <strong>pending</strong>. Email delivery isn&apos;t
            configured on this deployment, so no email was sent.
          </p>
        )}

        {stage.devVerifyUrl && (
          <div className="mx-auto mt-5 max-w-md rounded-xl border border-amber-300/30 bg-amber-300/5 p-4 text-left">
            <p className="flex items-center gap-2 text-sm font-semibold text-amber-200">
              <AlertTriangle size={16} /> Developer mode
            </p>
            <p className="mt-1 text-xs text-amber-100/80">
              Email isn&apos;t configured, so here is your verification link for local
              testing only. In production this is sent by email and never shown.
            </p>
            <Link
              href={stage.devVerifyUrl}
              className="mt-3 inline-block rounded-lg btn-neon px-4 py-2 text-sm font-bold"
            >
              Verify &amp; claim my tile
            </Link>
          </div>
        )}

        <Link href="/wall" className="mt-6 inline-block text-sm font-semibold text-neon-violet hover:text-neon-pink">
          Explore the wall while you wait →
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl glass-strong p-6 sm:p-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold">Your details</h2>
          <p className="mt-1 text-sm text-ink-dim">
            Verify your email to lock in your block and put your country on the board.
          </p>
        </div>
        <span className="shrink-0 rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-center">
          <span className="block text-[10px] uppercase tracking-wide text-ink-faint">Your block</span>
          <span className="font-display text-sm font-bold text-ink">VI-{String(tileIndex).padStart(5, "0")}</span>
        </span>
      </div>

      <div className="mt-6 grid gap-5">
        <Field label="Gaming username" error={errors.username?.message}>
          <input
            {...register("username")}
            placeholder="e.g. night_rider"
            className="vw-input"
            autoComplete="off"
          />
        </Field>

        <Field label="Email (for verification — never shown publicly)" error={errors.email?.message}>
          <input {...register("email")} type="email" placeholder="you@example.com" className="vw-input" />
        </Field>

        <Field label="Country" error={errors.countryIso?.message}>
          <select {...register("countryIso")} className="vw-input">
            {COUNTRIES.map((c) => (
              <option key={c.iso} value={c.iso}>
                {c.flag} {c.name}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label={`Message (optional · ${message.length}/${MESSAGE_MAX_LENGTH})`}
          error={errors.message?.message}
        >
          <textarea
            {...register("message")}
            rows={2}
            maxLength={MESSAGE_MAX_LENGTH}
            placeholder="Say something for your country"
            className="vw-input resize-none"
          />
        </Field>

        <div>
          <span className="mb-2 block text-sm font-semibold text-ink-dim">Pick an avatar</span>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
            {AVATAR_PRESETS.map((preset) => {
              const meta = AVATAR_META[preset];
              const active = avatar === preset;
              return (
                <button
                  type="button"
                  key={preset}
                  onClick={() => setValue("avatar", preset)}
                  aria-label={preset}
                  className={`grid aspect-square place-items-center rounded-xl text-xl ring-2 transition-all ${
                    active ? "ring-neon-pink scale-105" : "ring-white/10 hover:ring-white/30"
                  }`}
                  style={{ background: `linear-gradient(135deg, ${meta.from}, ${meta.to})` }}
                >
                  {meta.glyph}
                </button>
              );
            })}
          </div>
        </div>

        <Field label="Social link (optional)" error={errors.socialUrl?.message}>
          <input {...register("socialUrl")} placeholder="https://..." className="vw-input" />
        </Field>
      </div>

      {serverError && (
        <p className="mt-4 rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-200">
          {serverError}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl btn-neon px-5 py-3 font-display font-bold disabled:opacity-60"
      >
        {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
        {isSubmitting ? "Submitting…" : "Claim my tile"}
      </button>

      <p className="mt-3 text-center text-xs text-ink-faint">
        By claiming you agree to our{" "}
        <Link href="/terms" className="underline hover:text-ink-dim">Terms</Link> and{" "}
        <Link href="/guidelines" className="underline hover:text-ink-dim">Guidelines</Link>.
      </p>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-ink-dim">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-300">{error}</span>}
    </label>
  );
}
