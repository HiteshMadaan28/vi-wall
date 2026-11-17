"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Loader2 } from "lucide-react";

export function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (res.ok) {
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.message ?? "Incorrect password.");
    }
  };

  return (
    <form onSubmit={submit} className="mt-8 max-w-sm rounded-2xl glass-strong p-6">
      <div className="flex items-center gap-2 text-ink-dim">
        <Lock size={16} /> <span className="text-sm font-semibold">Restricted area</span>
      </div>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Admin password"
        className="vw-input mt-4"
        autoFocus
      />
      {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl btn-neon px-5 py-2.5 font-bold disabled:opacity-60"
      >
        {loading && <Loader2 size={16} className="animate-spin" />} Sign in
      </button>
    </form>
  );
}
