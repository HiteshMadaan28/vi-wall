import type { Metadata } from "next";
import { Suspense } from "react";
import { VerifyClient } from "@/components/VerifyClient";

export const metadata: Metadata = {
  title: "Verify your tile",
  robots: { index: false, follow: false },
};

export default function VerifyPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-14 sm:px-6">
      <Suspense fallback={<div className="text-center text-ink-dim">Loading…</div>}>
        <VerifyClient />
      </Suspense>
    </div>
  );
}
