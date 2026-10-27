/* eslint-disable @next/next/no-img-element -- Server-rendered PNG uses only normalized upload bytes and locally generated QR. */
import QRCode from "qrcode";
import sharp from "sharp";
import { ImageResponse } from "next/og";
import { db } from "@/lib/db";
import { appOrigin } from "@/lib/public-profile";
import { usernameSchema, type ProfileInput } from "@/lib/validation";
import { vibeCardStyles } from "@/lib/studio-schema";
export function canonicalProfileURL(username: string) {
  return `${appOrigin()}/${usernameSchema.parse(username)}`;
}
export async function qrPNG(username: string) {
  return QRCode.toBuffer(canonicalProfileURL(username), {
    type: "png",
    width: 300,
    margin: 4,
    errorCorrectionLevel: "M",
    color: { dark: "#000000", light: "#ffffff" },
  });
}
export async function vibeCardPNG(
  profile: ProfileInput,
  style: (typeof vibeCardStyles)[number],
) {
  const palettes = {
    neon: ["#0e0920", "#b99aff"],
    holographic: ["#19132c", "#a7eee7"],
    minimal: ["#101014", "#dedee8"],
    galaxy: ["#120a28", "#c2a4ff"],
    retro: ["#101b20", "#95ffd2"],
  };
  const [background] = palettes[style];
  const accent = profile.accentColor;
  const qr = await QRCode.toDataURL(canonicalProfileURL(profile.username), {
    width: 220,
    margin: 4,
    errorCorrectionLevel: "M",
  });
  let avatar: string | undefined;
  if (profile.avatarKey) {
    const image = await db.upload.findFirst({
      where: {
        id: profile.avatarKey,
        kind: "avatar",
        user: { profile: { username: profile.username } },
      },
    });
    if (image)
      avatar =
        "data:image/png;base64," +
        (await sharp(image.content).resize(128, 128).png().toBuffer()).toString(
          "base64",
        );
  }
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background,
        backgroundImage:
          style === "holographic"
            ? "linear-gradient(120deg,#44334f,#143d48,#472c48)"
            : style === "galaxy"
              ? "radial-gradient(ellipse at 70% 20%,#482667,#120a28)"
              : `linear-gradient(0deg,${background},${background})`,
        color: "#fff",
        padding: 64,
        fontFamily: style === "retro" ? "monospace" : "sans-serif",
        position: "relative",
        border: `3px solid ${accent}`,
      }}
    >
      {style === "galaxy" &&
        Array.from({ length: 16 }, (_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: (i * 137) % 1250,
              top: (i * 79) % 690,
              width: 3,
              height: 3,
              background: "#ffffff80",
              borderRadius: 4,
            }}
          />
        ))}
      <div style={{ display: "flex", flexDirection: "column", width: 790 }}>
        <div
          style={{
            display: "flex",
            color: accent,
            fontSize: 23,
            letterSpacing: 5,
          }}
        >
          VIBEPAGE · VIBECARD
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 28,
            marginTop: 72,
          }}
        >
          {avatar ? (
            <img
              src={avatar}
              width={128}
              height={128}
              alt=""
              style={{ borderRadius: 32 }}
            />
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 128,
                height: 128,
                background: accent,
                color: background,
                borderRadius: 32,
                fontSize: 60,
              }}
            >
              {profile.displayName.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                fontSize: 52,
                maxWidth: 600,
                overflow: "hidden",
              }}
            >
              {profile.displayName.slice(0, 35)}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 28,
                color: accent,
                marginTop: 12,
              }}
            >
              @{profile.username}
            </div>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 27,
            lineHeight: 1.5,
            marginTop: 44,
            maxWidth: 740,
          }}
        >
          {profile.bio.slice(0, 140)}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 21,
            color: accent,
            marginTop: 40,
          }}
        >
          {profile.themeId} · {style}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          position: "absolute",
          left: 966,
          top: 230,
          flexDirection: "column",
          alignItems: "center",
          gap: 24,
        }}
      >
        <img src={qr} width={220} height={220} alt="" />
        <div style={{ display: "flex", fontSize: 19, color: accent }}>
          Explore minha vibe ↗
        </div>
      </div>
    </div>,
    {
      width: 1280,
      height: 720,
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition": `attachment; filename="vibecard-${profile.username}.png"`,
      },
    },
  );
}
