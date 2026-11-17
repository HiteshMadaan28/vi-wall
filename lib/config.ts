/**
 * Central, environment-driven configuration.
 *
 * Everything that might change between environments (event date, wall
 * resolution, feature flags) lives here so it is configured in one place
 * rather than hardcoded throughout the app.
 */

function intFromEnv(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/** Number of columns the VI silhouette is rasterised into. */
export const GRID_COLS = intFromEnv(process.env.NEXT_PUBLIC_WALL_COLS, 132);

/**
 * Vertical-to-horizontal ratio of the silhouette bounding box.
 * The row count is derived from the column count so the VI keeps its
 * proportions at any resolution.
 */
export const GRID_ASPECT = 0.62;

export const GRID_ROWS = Math.round(GRID_COLS * GRID_ASPECT);

/**
 * Optional event date. Only used to render the countdown; when unset the
 * countdown is hidden rather than counting toward a fabricated date.
 */
export const EVENT_DATE = process.env.NEXT_PUBLIC_EVENT_DATE || "";
export const EVENT_TIMEZONE = process.env.NEXT_PUBLIC_EVENT_TIMEZONE || "UTC";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const SITE_NAME = "The VI Wall";
export const SITE_DESCRIPTION =
  "Join players from around the world and help your country dominate the giant VI-shaped gaming wall.";

/** Google Analytics measurement id. Analytics is a no-op when unset. */
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "";

/** Public contact address shown on legal / privacy pages. */
export const CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL || "contact@example.com";

/** How long a selected tile stays reserved while the user verifies (minutes). */
export const RESERVATION_MINUTES = intFromEnv(
  process.env.NEXT_PUBLIC_RESERVATION_MINUTES,
  10
);

export const MESSAGE_MAX_LENGTH = 140;
export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 20;
