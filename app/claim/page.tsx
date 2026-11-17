import type { Metadata } from "next";
import { ClaimFlow } from "@/components/ClaimFlow";

export const metadata: Metadata = {
  title: "Claim Your Block",
  description: "Choose your own block on The VI Wall and put your country on the global board.",
};

export default function ClaimPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <ClaimFlow />
    </div>
  );
}
