import type { Metadata } from "next";
import { LegalShell } from "@/components/LegalShell";

export const metadata: Metadata = {
  title: "Community Guidelines",
  description: "Keep The VI Wall fun and welcoming for everyone.",
};

export default function GuidelinesPage() {
  return (
    <LegalShell title="Community Guidelines" updated="Phase One">
      <p>The VI Wall is for celebrating games and countries together. Keep it friendly.</p>

      <h2>Do</h2>
      <ul>
        <li>Represent your country with pride.</li>
        <li>Pick a username and message you&apos;d be happy to show your friends.</li>
        <li>Report anything that looks abusive so moderators can review it.</li>
      </ul>

      <h2>Don&apos;t</h2>
      <ul>
        <li>No hate speech, harassment, threats, or slurs.</li>
        <li>No profanity in usernames or messages.</li>
        <li>No impersonation, spam, scams, or misleading links.</li>
        <li>No sexual, violent, or otherwise inappropriate content.</li>
        <li>No attempts to claim multiple tiles or inflate country scores.</li>
      </ul>

      <h2>Enforcement</h2>
      <p>
        Content that breaks these rules may be removed and the participant
        suspended. Removing a participant frees their tile and lowers their
        country&apos;s score automatically.
      </p>
    </LegalShell>
  );
}
