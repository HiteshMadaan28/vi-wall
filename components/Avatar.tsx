import { avatarMeta } from "@/lib/avatars";

export function Avatar({
  preset,
  url,
  size = 48,
  username,
}: {
  preset: string;
  url?: string | null;
  size?: number;
  username?: string;
}) {
  if (url) {
    return (
      // User-supplied avatar URLs from arbitrary hosts: a plain <img> avoids
      // routing untrusted remote images through the Next optimizer.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={username ? `${username} avatar` : "avatar"}
        width={size}
        height={size}
        className="rounded-full object-cover ring-2 ring-white/20"
        style={{ width: size, height: size }}
      />
    );
  }
  const meta = avatarMeta(preset);
  return (
    <span
      className="inline-grid place-items-center rounded-full ring-2 ring-white/15"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.5,
        background: `linear-gradient(135deg, ${meta.from}, ${meta.to})`,
      }}
      aria-hidden
    >
      {meta.glyph}
    </span>
  );
}
