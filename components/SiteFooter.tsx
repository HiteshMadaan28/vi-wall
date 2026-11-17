import Link from "next/link";
import { CONTACT_EMAIL } from "@/lib/config";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-white/5 bg-[#070311]/90">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg btn-neon font-display text-xs font-black">
                VI
              </span>
              <span className="font-display text-base font-bold tracking-wider">
                THE VI WALL
              </span>
            </div>
            <p className="mt-3 max-w-md text-sm text-ink-dim">
              A community-built digital monument where every player is a tile and
              every tile lifts a country up the board.
            </p>
          </div>

          <div>
            <h3 className="font-display text-sm font-bold tracking-wide text-ink">
              Explore
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-ink-dim">
              <li><Link href="/wall" className="hover:text-ink">The Wall</Link></li>
              <li><Link href="/leaderboard" className="hover:text-ink">Leaderboard</Link></li>
              <li><Link href="/battle" className="hover:text-ink">Country Battle</Link></li>
              <li><Link href="/claim" className="hover:text-ink">Claim a Tile</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-display text-sm font-bold tracking-wide text-ink">
              Legal
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-ink-dim">
              <li><Link href="/privacy" className="hover:text-ink">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-ink">Terms of Use</Link></li>
              <li><Link href="/guidelines" className="hover:text-ink">Community Guidelines</Link></li>
              <li><Link href="/contact" className="hover:text-ink">Contact</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 rounded-xl border border-amber-300/20 bg-amber-300/5 p-4 text-xs leading-relaxed text-amber-100/80">
          <strong>Unofficial fan project.</strong> The VI Wall is an independent,
          community-run experiment. It is not affiliated with, endorsed by, or
          connected to Rockstar Games or any game publisher. All branding here is
          original. No official logos, characters, or artwork are used. Game names
          are referenced only nominatively.
        </div>

        <div className="mt-6 flex flex-col items-start justify-between gap-2 text-xs text-ink-faint sm:flex-row sm:items-center">
          <span>© {new Date().getFullYear()} The VI Wall. Built by the community.</span>
          <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-ink-dim">
            {CONTACT_EMAIL}
          </a>
        </div>
      </div>
    </footer>
  );
}
