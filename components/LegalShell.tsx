export function LegalShell({
  title,
  updated,
  children,
}: {
  title: string;
  updated?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-black">{title}</h1>
      {updated && <p className="mt-1 text-sm text-ink-faint">Last updated: {updated}</p>}
      <div className="prose-vi mt-6 space-y-4 text-ink-dim [&_a]:text-neon-violet [&_a:hover]:text-neon-pink [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-ink [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-ink">
        {children}
      </div>
    </div>
  );
}
