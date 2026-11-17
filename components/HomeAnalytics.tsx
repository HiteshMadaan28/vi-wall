"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";

/** Fires the homepage_view event once on mount. Kept as its own client
 *  component so the homepage itself can stay a server component. */
export function HomeAnalytics() {
  useEffect(() => {
    track("homepage_view");
    if (document.referrer && !document.referrer.includes(window.location.host)) {
      track("referral_visit", { source: new URL(document.referrer).hostname });
    }
  }, []);
  return null;
}
