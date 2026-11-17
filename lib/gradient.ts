/**
 * The VI Wall sunset gradient.
 *
 * One continuous gradient coordinate system spans the whole VI silhouette: a
 * tile's colour is sampled from its vertical position (ny in [0,1], top→bottom)
 * so the VI reads as a single piece of artwork rather than per-tile colours.
 * Ownership never changes a tile's underlying gradient colour — occupied tiles
 * use the exact same sample, just rendered at full strength with a subtle
 * ownership border, while available tiles are shown muted.
 */

export interface RGB {
  r: number;
  g: number;
  b: number;
}

interface Stop {
  t: number;
  color: RGB;
}

function hex(h: string): RGB {
  const n = h.replace("#", "");
  return {
    r: parseInt(n.slice(0, 2), 16),
    g: parseInt(n.slice(2, 4), 16),
    b: parseInt(n.slice(4, 6), 16),
  };
}

/** Sunset stops, top → bottom: violet → magenta → hot pink → rose → orange → warm yellow. */
const STOPS: Stop[] = [
  { t: 0.0, color: hex("#7c3aed") }, // violet
  { t: 0.22, color: hex("#a21caf") }, // magenta/purple
  { t: 0.44, color: hex("#db2777") }, // hot pink
  { t: 0.64, color: hex("#f43f5e") }, // rose
  { t: 0.82, color: hex("#fb923c") }, // orange
  { t: 1.0, color: hex("#fbbf24") }, // warm sunset yellow
];

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Sample the sunset gradient at normalised position t in [0,1]. */
export function sampleGradient(t: number): RGB {
  const clamped = Math.max(0, Math.min(1, t));
  for (let i = 0; i < STOPS.length - 1; i++) {
    const a = STOPS[i];
    const b = STOPS[i + 1];
    if (clamped >= a.t && clamped <= b.t) {
      const local = (clamped - a.t) / (b.t - a.t || 1);
      return {
        r: Math.round(lerp(a.color.r, b.color.r, local)),
        g: Math.round(lerp(a.color.g, b.color.g, local)),
        b: Math.round(lerp(a.color.b, b.color.b, local)),
      };
    }
  }
  return STOPS[STOPS.length - 1].color;
}

export function rgbString({ r, g, b }: RGB, alpha = 1): string {
  return alpha >= 1 ? `rgb(${r},${g},${b})` : `rgba(${r},${g},${b},${alpha})`;
}

/** Darken an RGB toward black by factor in [0,1] (1 = unchanged). */
export function scaleBrightness({ r, g, b }: RGB, factor: number): RGB {
  return {
    r: Math.round(r * factor),
    g: Math.round(g * factor),
    b: Math.round(b * factor),
  };
}

/** Lighten an RGB toward white by amount in [0,1] (0 = unchanged). */
export function lighten({ r, g, b }: RGB, amount: number): RGB {
  return {
    r: Math.round(r + (255 - r) * amount),
    g: Math.round(g + (255 - g) * amount),
    b: Math.round(b + (255 - b) * amount),
  };
}

/** CSS linear-gradient string for the whole VI, used by non-canvas UI accents. */
export function cssSunset(angle = "180deg"): string {
  const stops = STOPS.map((s) => `${rgbString(s.color)} ${Math.round(s.t * 100)}%`);
  return `linear-gradient(${angle}, ${stops.join(", ")})`;
}
