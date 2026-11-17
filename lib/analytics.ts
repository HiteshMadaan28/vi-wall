"use client";

import { GA_MEASUREMENT_ID } from "./config";

/**
 * Thin analytics wrapper around Google Analytics (gtag).
 *
 * - Fully configurable: when NEXT_PUBLIC_GA_MEASUREMENT_ID is unset every call
 *   is a no-op, so nothing loads and nothing is tracked.
 * - Never send personal data (emails, tokens) — only the typed event names and
 *   non-identifying parameters below.
 */

export type AnalyticsEvent =
  | "homepage_view"
  | "wall_view"
  | "wall_zoom"
  | "player_tile_click"
  | "leaderboard_view"
  | "country_selected"
  | "claim_started"
  | "claim_submitted"
  | "claim_verified"
  | "profile_shared"
  | "referral_visit"
  | "country_comparison";

type Params = Record<string, string | number | boolean>;
type Gtag = (command: string, ...args: unknown[]) => void;

declare global {
  interface Window {
    gtag?: Gtag;
    dataLayer?: unknown[];
  }
}

export function analyticsEnabled(): boolean {
  return Boolean(GA_MEASUREMENT_ID);
}

export function track(event: AnalyticsEvent, params: Params = {}): void {
  if (typeof window === "undefined" || !GA_MEASUREMENT_ID) return;
  window.gtag?.("event", event, params);
}
