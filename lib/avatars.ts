import type { AvatarPreset } from "./validation";

/** Procedural avatar presets — original, no third-party artwork. Each is a
 *  glyph + gradient rendered in CSS/canvas, so there are no image assets to
 *  host or moderate for the default case. */
export const AVATAR_META: Record<AvatarPreset, { glyph: string; from: string; to: string }> = {
  "neon-fox": { glyph: "🦊", from: "#f97316", to: "#ec4899" },
  "cyber-skull": { glyph: "💀", from: "#22d3ee", to: "#6366f1" },
  "violet-orb": { glyph: "🔮", from: "#a855f7", to: "#6366f1" },
  "pink-bolt": { glyph: "⚡", from: "#ec4899", to: "#f43f5e" },
  "blue-wave": { glyph: "🌊", from: "#3b82f6", to: "#22d3ee" },
  ghost: { glyph: "👾", from: "#8b5cf6", to: "#d946ef" },
  diamond: { glyph: "💎", from: "#22d3ee", to: "#a855f7" },
  crown: { glyph: "👑", from: "#eab308", to: "#f97316" },
};

export function avatarMeta(preset: string) {
  return AVATAR_META[preset as AvatarPreset] ?? AVATAR_META["violet-orb"];
}
