/**
 * Country reference data.
 *
 * `iso`, `name` and `flag` mirror the `countries` table in the database.
 * `accent` is a presentation-only colour used to tint a country's tiles on the
 * wall. Accents are inspired by national colours but kept subtle so the wall
 * stays readable rather than chaotic.
 */

export interface Country {
  iso: string; // ISO 3166-1 alpha-2
  name: string;
  flag: string; // emoji
  accent: string; // hex, tile tint
}

export const COUNTRIES: Country[] = [
  { iso: "IN", name: "India", flag: "🇮🇳", accent: "#ff9933" },
  { iso: "US", name: "United States", flag: "🇺🇸", accent: "#3b82f6" },
  { iso: "GB", name: "United Kingdom", flag: "🇬🇧", accent: "#6366f1" },
  { iso: "BR", name: "Brazil", flag: "🇧🇷", accent: "#22c55e" },
  { iso: "DE", name: "Germany", flag: "🇩🇪", accent: "#eab308" },
  { iso: "FR", name: "France", flag: "🇫🇷", accent: "#60a5fa" },
  { iso: "CA", name: "Canada", flag: "🇨🇦", accent: "#ef4444" },
  { iso: "AU", name: "Australia", flag: "🇦🇺", accent: "#14b8a6" },
  { iso: "JP", name: "Japan", flag: "🇯🇵", accent: "#f43f5e" },
  { iso: "KR", name: "South Korea", flag: "🇰🇷", accent: "#38bdf8" },
  { iso: "MX", name: "Mexico", flag: "🇲🇽", accent: "#16a34a" },
  { iso: "IT", name: "Italy", flag: "🇮🇹", accent: "#34d399" },
  { iso: "ES", name: "Spain", flag: "🇪🇸", accent: "#f59e0b" },
  { iso: "NL", name: "Netherlands", flag: "🇳🇱", accent: "#fb923c" },
  { iso: "SE", name: "Sweden", flag: "🇸🇪", accent: "#2563eb" },
  { iso: "PL", name: "Poland", flag: "🇵🇱", accent: "#f87171" },
  { iso: "RU", name: "Russia", flag: "🇷🇺", accent: "#818cf8" },
  { iso: "TR", name: "Turkey", flag: "🇹🇷", accent: "#dc2626" },
  { iso: "AR", name: "Argentina", flag: "🇦🇷", accent: "#7dd3fc" },
  { iso: "ID", name: "Indonesia", flag: "🇮🇩", accent: "#e11d48" },
  { iso: "PH", name: "Philippines", flag: "🇵🇭", accent: "#2dd4bf" },
  { iso: "ZA", name: "South Africa", flag: "🇿🇦", accent: "#10b981" },
  { iso: "EG", name: "Egypt", flag: "🇪🇬", accent: "#f97316" },
  { iso: "NG", name: "Nigeria", flag: "🇳🇬", accent: "#4ade80" },
  { iso: "SA", name: "Saudi Arabia", flag: "🇸🇦", accent: "#15803d" },
  { iso: "AE", name: "United Arab Emirates", flag: "🇦🇪", accent: "#22c55e" },
  { iso: "PK", name: "Pakistan", flag: "🇵🇰", accent: "#166534" },
  { iso: "BD", name: "Bangladesh", flag: "🇧🇩", accent: "#059669" },
  { iso: "VN", name: "Vietnam", flag: "🇻🇳", accent: "#ef4444" },
  { iso: "TH", name: "Thailand", flag: "🇹🇭", accent: "#a78bfa" },
  { iso: "MY", name: "Malaysia", flag: "🇲🇾", accent: "#fbbf24" },
  { iso: "SG", name: "Singapore", flag: "🇸🇬", accent: "#f472b6" },
  { iso: "UA", name: "Ukraine", flag: "🇺🇦", accent: "#facc15" },
  { iso: "PT", name: "Portugal", flag: "🇵🇹", accent: "#dc2626" },
  { iso: "GR", name: "Greece", flag: "🇬🇷", accent: "#3b82f6" },
  { iso: "IE", name: "Ireland", flag: "🇮🇪", accent: "#22c55e" },
  { iso: "NO", name: "Norway", flag: "🇳🇴", accent: "#60a5fa" },
  { iso: "FI", name: "Finland", flag: "🇫🇮", accent: "#93c5fd" },
  { iso: "DK", name: "Denmark", flag: "🇩🇰", accent: "#f87171" },
  { iso: "BE", name: "Belgium", flag: "🇧🇪", accent: "#fbbf24" },
  { iso: "CH", name: "Switzerland", flag: "🇨🇭", accent: "#ef4444" },
  { iso: "AT", name: "Austria", flag: "🇦🇹", accent: "#fca5a5" },
  { iso: "CZ", name: "Czechia", flag: "🇨🇿", accent: "#818cf8" },
  { iso: "NZ", name: "New Zealand", flag: "🇳🇿", accent: "#38bdf8" },
  { iso: "CL", name: "Chile", flag: "🇨🇱", accent: "#f43f5e" },
  { iso: "CO", name: "Colombia", flag: "🇨🇴", accent: "#fbbf24" },
  { iso: "PE", name: "Peru", flag: "🇵🇪", accent: "#f87171" },
  { iso: "RO", name: "Romania", flag: "🇷🇴", accent: "#facc15" },
  { iso: "HU", name: "Hungary", flag: "🇭🇺", accent: "#4ade80" },
  { iso: "IL", name: "Israel", flag: "🇮🇱", accent: "#60a5fa" },
];

const byIso = new Map(COUNTRIES.map((c) => [c.iso, c]));

export function getCountry(iso: string): Country | undefined {
  return byIso.get(iso.toUpperCase());
}

export function isValidCountry(iso: string): boolean {
  return byIso.has(iso.toUpperCase());
}

/** Fallback accent for a country not present in the reference list. */
export const DEFAULT_ACCENT = "#a855f7";

export function accentFor(iso: string | null | undefined): string {
  if (!iso) return DEFAULT_ACCENT;
  return byIso.get(iso.toUpperCase())?.accent ?? DEFAULT_ACCENT;
}
