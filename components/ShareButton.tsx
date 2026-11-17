"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";
import { track } from "@/lib/analytics";

export function ShareButton({ username }: { username: string }) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = `${window.location.origin}/player/${username.toLowerCase()}`;
    track("profile_shared", { source: "profile" });
    if (navigator.share) {
      await navigator.share({ title: `${username} on The VI Wall`, url }).catch(() => {});
      return;
    }
    await navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <button onClick={share} className="inline-flex items-center gap-2 rounded-xl btn-neon px-5 py-2.5 font-bold">
      {copied ? <Check size={16} /> : <Share2 size={16} />}
      {copied ? "Link copied" : "Share profile"}
    </button>
  );
}
