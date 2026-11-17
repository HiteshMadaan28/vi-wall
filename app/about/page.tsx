import type { Metadata } from "next";
import Link from "next/link";
import { MousePointerClick, MailCheck, Trophy } from "lucide-react";
import { LegalShell } from "@/components/LegalShell";

export const metadata: Metadata = {
  title: "About",
  description: "What The VI Wall is, and how to claim your block.",
};

export default function AboutPage() {
  return (
    <LegalShell title="About The VI Wall">
      <p>
        The VI Wall is a community-built digital monument: a giant Roman numeral
        <strong> VI</strong> made of thousands of individual blocks. Every block
        represents one person. Pick your own block, represent your country, and
        become part of a global gaming monument that fills up over time.
      </p>

      <h2>How it works</h2>
      <ul>
        <li><strong>Choose your block</strong> — explore the wall and tap any available block.</li>
        <li><strong>Verify your email</strong> — we hold your block for 10 minutes while you confirm.</li>
        <li><strong>You&apos;re on the wall</strong> — your block lights up and adds one point to your country.</li>
      </ul>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Step icon={<MousePointerClick size={18} />} title="Pick">Select an available block that&apos;s yours.</Step>
        <Step icon={<MailCheck size={18} />} title="Verify">Confirm via the email we send.</Step>
        <Step icon={<Trophy size={18} />} title="Compete">Help your country climb the leaderboard.</Step>
      </div>

      <h2>Country competition</h2>
      <p>
        Each verified block counts as one participant for its country. Watch the
        leaderboard and country battles shift as the wall fills. When every block
        is claimed and verified, the whole VI celebrates its completion.
      </p>

      <h2>Independent fan project</h2>
      <p>
        The VI Wall is an independent, unofficial fan project. It is not affiliated
        with, endorsed by, or connected to Rockstar Games or any game publisher.
        All artwork here is original.
      </p>

      <p className="mt-6">
        <Link href="/claim" className="font-semibold text-neon-pink">Claim your block →</Link>
      </p>
    </LegalShell>
  );
}

function Step({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4 not-prose">
      <div className="grid h-9 w-9 place-items-center rounded-lg btn-neon">{icon}</div>
      <h3 className="mt-2 font-display text-base font-bold text-ink">{title}</h3>
      <p className="mt-1 text-sm text-ink-dim">{children}</p>
    </div>
  );
}
