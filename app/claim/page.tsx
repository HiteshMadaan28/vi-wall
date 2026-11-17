import type { Metadata } from "next";
import { ClaimForm } from "@/components/ClaimForm";

export const metadata: Metadata = {
  title: "Claim Your Tile",
  description: "Claim your tile on The VI Wall and put your country on the global board.",
};

export default function ClaimPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:px-6">
      <ClaimForm />
    </div>
  );
}
