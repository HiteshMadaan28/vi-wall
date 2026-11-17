import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { sampleGradient, scaleBrightness, rgbString } from "@/lib/gradient";

/** Right-hero tile legend + primary CTA. The swatches match the real tile
 *  rendering: muted gradient (available), full gradient (occupied), bright
 *  ring (your block). */
export function HeroLegend() {
  const sample = sampleGradient(0.5); // representative mid-gradient colour
  const items = [
    {
      label: "Your Block",
      style: { background: rgbString(sample), boxShadow: "0 0 0 2px #fff, 0 0 10px rgba(255,255,255,.6)" },
    },
    { label: "Occupied Block", style: { background: rgbString(sample) } },
    { label: "Available Block", style: { background: rgbString(scaleBrightness(sample, 0.42)) } },
  ];

  return (
    <div className="rounded-2xl glass-strong p-5">
      <h3 className="text-[11px] font-semibold uppercase tracking-widest text-ink-faint">
        Tile legend
      </h3>
      <ul className="mt-3 space-y-2.5">
        {items.map((it) => (
          <li key={it.label} className="flex items-center gap-3">
            <span className="h-5 w-5 rounded-[5px]" style={it.style} aria-hidden />
            <span className="text-sm font-semibold text-ink">{it.label}</span>
          </li>
        ))}
      </ul>

      <div className="mt-5 border-t border-white/10 pt-5">
        <Link
          href="/claim"
          className="flex items-center justify-center gap-2 rounded-xl btn-neon px-5 py-3 font-display text-base font-bold"
        >
          CLAIM YOUR BLOCK <ArrowRight size={18} />
        </Link>
        <p className="mt-3 text-center text-[11px] font-semibold uppercase tracking-widest text-ink-faint">
          Be part of something bigger
        </p>
      </div>
    </div>
  );
}
