import { ImageResponse } from "next/og";
import { getProfile } from "@/lib/data";
import { normalizeUsername } from "@/lib/moderation";
import { avatarMeta } from "@/lib/avatars";

export const alt = "The VI Wall player profile";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Dynamic Open Graph image so shared profile links look great on social. */
export default async function Image({ params }: { params: { username: string } }) {
  const profile = await getProfile(normalizeUsername(params.username));
  const username = profile?.username ?? "Player";
  const country = profile ? `${profile.countryFlag} ${profile.countryName}` : "The VI Wall";
  const meta = avatarMeta(profile?.avatar ?? "violet-orb");

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(1200px 600px at 20% 0%, #2a0f4a, #070311), radial-gradient(1000px 600px at 100% 100%, #15204a, #070311)",
          color: "#f5f3ff",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            fontSize: 30,
            letterSpacing: 6,
            color: "#b9a8e0",
          }}
        >
          <div
            style={{
              display: "flex",
              width: 56,
              height: 56,
              borderRadius: 14,
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg,#d946ef,#6366f1)",
              fontWeight: 900,
              color: "#fff",
            }}
          >
            VI
          </div>
          THE VI WALL
        </div>

        <div
          style={{
            display: "flex",
            width: 180,
            height: 180,
            borderRadius: 999,
            alignItems: "center",
            justifyContent: "center",
            marginTop: 40,
            fontSize: 96,
            background: `linear-gradient(135deg, ${meta.from}, ${meta.to})`,
          }}
        >
          {meta.glyph}
        </div>

        <div style={{ marginTop: 28, fontSize: 68, fontWeight: 900 }}>{username}</div>
        <div style={{ marginTop: 8, fontSize: 36, color: "#b9a8e0" }}>{country}</div>
      </div>
    ),
    size
  );
}
