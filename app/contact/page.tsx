import type { Metadata } from "next";
import { LegalShell } from "@/components/LegalShell";
import { CONTACT_EMAIL } from "@/lib/config";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with The VI Wall team.",
};

export default function ContactPage() {
  return (
    <LegalShell title="Contact">
      <p>
        The VI Wall is run by a small community team. For questions, takedown or
        profile-removal requests, moderation reports, or anything else, email us:
      </p>
      <p>
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>
      <p className="text-sm text-ink-faint">
        This address is a placeholder configured via the
        <code> NEXT_PUBLIC_CONTACT_EMAIL </code> environment variable. Set it to
        your real contact address before going live.
      </p>
    </LegalShell>
  );
}
