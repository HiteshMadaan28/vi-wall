import { Sparkles, Lock } from "lucide-react";

/**
 * Premium spotlight — Phase One placeholder only.
 *
 * Intentionally shows NO bid amounts, NO fake bidders and NO payment flow.
 * Monetisation is a later phase pending legal + payment-provider review. The
 * database schema is kept extensible so a real bidding table can be added
 * without touching this UI contract.
 */
export function SpotlightPlaceholder() {
  return (
    <div className="relative overflow-hidden rounded-2xl glass p-6 text-center">
      <div className="absolute inset-0 opacity-30 vi-grid-overlay" aria-hidden />
      <div className="relative">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl btn-neon">
          <Sparkles size={22} />
        </div>
        <h2 className="mt-3 font-display text-lg font-bold">Spotlight · Coming soon</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-dim">
          A premium spotlight above the wall is planned for a future phase. The
          highest verified bidder will be featured here. Bidding and payments are
          not live yet — and spotlight placement will never affect country rankings.
        </p>
        <span className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs font-semibold text-ink-faint">
          <Lock size={12} /> Disabled in Phase One
        </span>
      </div>
    </div>
  );
}
