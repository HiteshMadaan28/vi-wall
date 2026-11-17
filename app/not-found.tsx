import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto grid min-h-[60vh] max-w-xl place-items-center px-4 text-center">
      <div>
        <div className="font-display text-7xl font-black neon-text">VI</div>
        <h1 className="mt-4 font-display text-2xl font-bold">This tile doesn&apos;t exist</h1>
        <p className="mt-2 text-ink-dim">
          The page or player you&apos;re looking for isn&apos;t on the wall.
        </p>
        <Link href="/" className="mt-6 inline-block rounded-xl btn-neon px-6 py-3 font-bold">
          Back to the wall
        </Link>
      </div>
    </div>
  );
}
