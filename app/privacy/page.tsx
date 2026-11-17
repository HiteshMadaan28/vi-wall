import type { Metadata } from "next";
import { LegalShell } from "@/components/LegalShell";
import { CONTACT_EMAIL } from "@/lib/config";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How The VI Wall handles your data.",
};

export default function PrivacyPage() {
  return (
    <LegalShell title="Privacy Policy" updated="Phase One">
      <p>
        The VI Wall is a community fan project. This policy explains what we
        collect and why. We keep data collection to the minimum needed to run
        the wall.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li><strong>Gaming username</strong> — shown publicly on your tile and profile.</li>
        <li><strong>Country</strong> — shown publicly and counted toward the leaderboard.</li>
        <li><strong>Optional message, avatar, and social link</strong> — shown publicly if you provide them.</li>
        <li><strong>Email address</strong> — used only to verify your claim. It is never shown publicly and never sent to analytics.</li>
      </ul>

      <h2>Analytics</h2>
      <p>
        If analytics is enabled on this deployment, we record non-identifying
        usage events (such as page views and wall interactions) with IP
        anonymisation. We never send your email or other personal details to any
        analytics provider.
      </p>

      <h2>Data removal</h2>
      <p>
        You can request removal of your profile at any time using the Report
        control on your profile, or by emailing <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        When a participant is removed, their tile is freed and their country
        score is reduced accordingly.
      </p>

      <h2>Cookies</h2>
      <p>
        We use a single signed cookie only for administrators who sign into the
        moderation console. Regular visitors are not required to accept cookies
        to use the wall.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about privacy? Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </LegalShell>
  );
}
