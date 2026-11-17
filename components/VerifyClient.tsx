"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Loader2, XCircle, Share2, Trophy, MapPin } from "lucide-react";
import { getCountry } from "@/lib/countries";
import { GRID_ROWS } from "@/lib/config";
import { sampleGradient, rgbString } from "@/lib/gradient";
import { track } from "@/lib/analytics";

interface Success {
  ok: true;
  username: string;
  status: string;
  tileIndex: number;
  x: number;
  y: number;
  countryIso: string;
  countryRank: number | null;
  completed: boolean;
  autoApproved: boolean;
}

export function VerifyClient() {
  const params = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState<"loading" | "error" | "done">("loading");
  const [data, setData] = useState<Success | null>(null);
  const [error, setError] = useState<string>("");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    if (!token) {
      setState("error");
      setError("No verification token provided.");
      return;
    }
    fetch("/api/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (res.ok) {
          setData(body);
          setState("done");
          track("claim_verified", { country: body.countryIso });
        } else {
          setError(body.message ?? "Verification failed.");
          setState("error");
        }
      })
      .catch(() => {
        setError("Network error. Please try again.");
        setState("error");
      });
  }, [token]);

  if (state === "loading") {
    return (
      <div className="grid place-items-center rounded-2xl glass-strong py-16">
        <Loader2 className="animate-spin text-neon-violet" size={32} />
        <p className="mt-3 text-ink-dim">Verifying and placing your tile…</p>
      </div>
    );
  }

  if (state === "error" || !data) {
    return (
      <div className="rounded-2xl glass-strong p-8 text-center">
        <XCircle className="mx-auto text-red-400" size={40} />
        <h1 className="mt-3 font-display text-2xl font-bold">Couldn&apos;t verify</h1>
        <p className="mt-2 text-ink-dim">{error}</p>
        <Link href="/claim" className="mt-6 inline-block rounded-xl btn-neon px-5 py-2.5 font-bold">
          Try claiming again
        </Link>
      </div>
    );
  }

  const country = getCountry(data.countryIso);

  return <SuccessScreen data={data} countryName={country?.name ?? data.countryIso} flag={country?.flag ?? "🏳️"} />;
}

function SuccessScreen({
  data,
  countryName,
  flag,
}: {
  data: Success;
  countryName: string;
  flag: string;
}) {
  const share = async () => {
    const url = `${window.location.origin}/player/${data.username.toLowerCase()}`;
    track("profile_shared", { source: "verify" });
    if (navigator.share) {
      await navigator.share({ title: `${data.username} on The VI Wall`, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url).catch(() => {});
    }
  };

  const swatch = rgbString(sampleGradient((data.y + 0.5) / GRID_ROWS));

  return (
    <div className="rounded-2xl glass-strong p-8 text-center neon-ring">
      <CheckCircle2 className="mx-auto text-emerald-400" size={44} />
      <h1 className="mt-3 font-display text-2xl font-black sm:text-3xl">
        YOUR PLACE IN THE VI IS RESERVED.
      </h1>
      {!data.autoApproved && (
        <p className="mt-2 text-sm text-amber-300/90">
          Your block is placed and pending final admin approval.
        </p>
      )}
      {data.completed && (
        <p className="mt-2 text-sm font-semibold text-emerald-300">
          You placed the final block — the VI Wall is complete! 🎉
        </p>
      )}

      <div className="mx-auto mt-6 flex justify-center">
        <span
          className="h-14 w-14 rounded-xl ring-2 ring-white/40"
          style={{ background: swatch }}
          aria-hidden
        />
      </div>

      <div className="mx-auto mt-6 grid max-w-sm gap-3 text-left">
        <Row label="Player" value={data.username} />
        <Row label="Country" value={`${flag} ${countryName}`} />
        <Row
          label="Country rank"
          value={data.countryRank ? `#${data.countryRank}` : "—"}
          icon={<Trophy size={15} className="text-neon-pink" />}
        />
        <Row
          label="Your block"
          value={`VI-${String(data.tileIndex).padStart(5, "0")}`}
          icon={<MapPin size={15} className="text-neon-violet" />}
        />
      </div>

      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link href={`/wall?tile=${data.tileIndex}`} className="rounded-xl btn-neon px-5 py-2.5 font-bold">
          See my block on the wall
        </Link>
        <button onClick={share} className="inline-flex items-center gap-2 rounded-xl btn-ghost px-5 py-2.5 font-bold">
          <Share2 size={16} /> Share
        </button>
      </div>
      <Link
        href={`/player/${data.username.toLowerCase()}`}
        className="mt-4 inline-block text-sm font-semibold text-neon-violet hover:text-neon-pink"
      >
        View my public profile →
      </Link>
    </div>
  );
}

function Row({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-black/25 px-4 py-2.5">
      <span className="flex items-center gap-1.5 text-sm text-ink-dim">{icon}{label}</span>
      <span className="font-display font-bold text-ink">{value}</span>
    </div>
  );
}
