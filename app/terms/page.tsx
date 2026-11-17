import type { Metadata } from "next";
import { LegalShell } from "@/components/LegalShell";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "The terms for participating in The VI Wall.",
};

export default function TermsPage() {
  return (
    <LegalShell title="Terms of Use" updated="Phase One">
      <h2>Acceptance</h2>
      <p>By claiming a tile or using this site, you agree to these terms and our Community Guidelines.</p>

      <h2>Unofficial fan project</h2>
      <p>
        <strong>The VI Wall is an independent, unofficial fan project.</strong> It is not
        affiliated with, endorsed by, sponsored by, or connected to Rockstar Games
        or any game publisher. All branding and artwork on this site are original.
        We do not use official logos, characters, screenshots, or promotional
        material. Game titles may be referenced only to describe what inspired this
        community experiment.
      </p>

      <h2>Your content</h2>
      <ul>
        <li>One verified participant may hold one tile. Duplicate or automated claims are not allowed.</li>
        <li>You are responsible for the username, message, avatar, and links you submit.</li>
        <li>You must not submit content that is illegal, hateful, harassing, deceptive, or infringing.</li>
        <li>You grant us permission to display the public parts of your submission on the wall and profile pages.</li>
      </ul>

      <h2>Moderation</h2>
      <p>
        We may reject, remove, or suspend any participant or content that breaks
        these terms or our guidelines, at our discretion, to keep the wall safe.
      </p>

      <h2>No payments in Phase One</h2>
      <p>
        There are no paid features in Phase One. Nothing you can buy affects
        country rankings. The spotlight area is a placeholder only.
      </p>

      <h2>Disclaimer</h2>
      <p>
        The service is provided &quot;as is&quot; without warranties. This is a
        hobby experiment and may change or shut down at any time.
      </p>
    </LegalShell>
  );
}
