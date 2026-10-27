import { headers } from "next/headers";
import { consumeLimit, clientIdentity } from "@/lib/limits";
import { apiError } from "@/lib/http";
import { ImageResponse } from "next/og";
import { getPublicProfile } from "@/lib/public-profile";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const alt = "VibePage — perfil público";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default async function Image({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const data = await getPublicProfile(username);
  if (!data)
    return new Response(null, {
      status: 404,
      headers: { "Cache-Control": "no-store" },
    });
  try {
    await consumeLimit(
      clientIdentity({ headers: await headers() }),
      "public-og",
      12,
    );
  } catch (error) {
    return apiError(error);
  }
  const profile = data.profile;
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        background: profile?.backgroundColor || "#100c1b",
        padding: 80,
        color: "#f5efff",
        fontFamily: "sans-serif",
        flexDirection: "column",
        justifyContent: "center",
        borderBottom: `12px solid ${profile?.accentColor || "#a78bfa"}`,
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: 23,
          color: profile?.accentColor || "#a78bfa",
          marginBottom: 35,
        }}
      >
        vibepage / {profile?.username || "perfil"}
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 72,
          fontWeight: 700,
          maxHeight: 175,
          overflow: "hidden",
        }}
      >
        {profile?.displayName || "Seu universo, em um link."}
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 28,
          color: "#b9adc9",
          marginTop: 30,
          maxWidth: 950,
          maxHeight: 90,
          overflow: "hidden",
        }}
      >
        {profile?.bio.slice(0, 120) || "Explore esse universo no VibePage."}
      </div>
    </div>,
    {
      ...size,
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
        "X-Robots-Tag": "noindex",
      },
    },
  );
}
