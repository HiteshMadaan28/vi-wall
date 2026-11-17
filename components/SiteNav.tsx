"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Grid3x3 } from "lucide-react";

const LINKS = [
  { href: "/wall", label: "Explore Wall" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/battle", label: "Country Battle" },
  { href: "/players", label: "Players" },
  { href: "/about", label: "About" },
];

export function SiteNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-[#070311]/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <span className="grid h-9 w-9 place-items-center rounded-lg btn-neon font-display text-sm font-black">
            VI
          </span>
          <span className="font-display text-lg font-bold tracking-wider text-ink">
            THE VI WALL
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-ink-dim transition-colors hover:bg-white/5 hover:text-ink"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/claim"
            className="ml-2 rounded-lg btn-neon px-4 py-2 text-sm font-bold"
          >
            Claim a Block
          </Link>
        </div>

        <button
          type="button"
          aria-label="Toggle menu"
          className="rounded-lg p-2 text-ink md:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-white/5 px-4 pb-4 md:hidden">
          <div className="flex flex-col gap-1 pt-2">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-3 text-base font-semibold text-ink-dim hover:bg-white/5 hover:text-ink"
              >
                <Grid3x3 size={16} /> {l.label}
              </Link>
            ))}
            <Link
              href="/claim"
              onClick={() => setOpen(false)}
              className="mt-1 rounded-lg btn-neon px-3 py-3 text-center text-base font-bold"
            >
              Claim a Block
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
