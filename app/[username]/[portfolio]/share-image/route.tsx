import { ImageResponse } from "next/og";
import {
  loadPublishedSnapshot,
  safePublishedImageUrl,
} from "@/lib/supabase/public-portfolio";
import type { ThemeName } from "@/lib/portfolio";

const palettes: Record<
  ThemeName,
  { background: string; text: string; soft: string; accent: string; surface: string }
> = {
  ink: {
    background: "#11141a",
    text: "#f7f8fb",
    soft: "#a6aeba",
    accent: "#9b86ff",
    surface: "#181d25",
  },
  sand: {
    background: "#f1e9d9",
    text: "#2d2722",
    soft: "#665d54",
    accent: "#a83e2a",
    surface: "#f9f3e8",
  },
  moss: {
    background: "#e5e9df",
    text: "#1d3029",
    soft: "#53635b",
    accent: "#2e6957",
    surface: "#eff2e9",
  },
  aurora: {
    background: "#0c1020",
    text: "#f5f7ff",
    soft: "#a9b5d2",
    accent: "#5ce8ff",
    surface: "#151b32",
  },
  cobalt: {
    background: "#eaf0ff",
    text: "#071b50",
    soft: "#53678e",
    accent: "#1057ff",
    surface: "#f8faff",
  },
  rose: {
    background: "#fff0f4",
    text: "#3b1320",
    soft: "#845665",
    accent: "#c5225d",
    surface: "#fff8fa",
  },
  mono: {
    background: "#f4f4f1",
    text: "#111111",
    soft: "#656565",
    accent: "#111111",
    surface: "#ffffff",
  },
  sunset: {
    background: "#24101f",
    text: "#fff5ed",
    soft: "#d8b9c5",
    accent: "#ff8a5b",
    surface: "#35152c",
  },
  ice: {
    background: "#eefaff",
    text: "#082b3a",
    soft: "#537786",
    accent: "#007898",
    surface: "#f8fdff",
  },
  noir: {
    background: "#070707",
    text: "#f6f5ef",
    soft: "#a6a49d",
    accent: "#ffffff",
    surface: "#111111",
  },
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ username: string; portfolio: string }> }
) {
  const { username, portfolio } = await context.params;
  const snapshot = await loadPublishedSnapshot(username, portfolio);

  if (!snapshot) {
    return new Response("Not found", { status: 404 });
  }

  const palette = palettes[snapshot.config.theme] || palettes.ink;
  const profile = snapshot.data.profile;
  const targetRole = snapshot.meta?.targetRole || profile.role;
  const eyebrow = snapshot.meta?.name || "Portfolio";
  const heroImage = safePublishedImageUrl(profile.heroImageUrl);
  const tagline =
    snapshot.meta?.branding?.shareDescription?.trim() ||
    profile.tagline ||
    "Professional portfolio";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background: palette.background,
          color: palette.text,
          padding: "54px 58px",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 460,
            height: 460,
            right: -130,
            top: -180,
            borderRadius: 999,
            background: palette.accent,
            opacity: 0.16,
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 340,
            height: 340,
            left: -160,
            bottom: -170,
            borderRadius: 999,
            background: palette.accent,
            opacity: 0.11,
          }}
        />

        <div
          style={{
            width: heroImage ? "68%" : "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            paddingRight: heroImage ? 44 : 0,
            position: "relative",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                fontSize: 19,
                fontWeight: 800,
                letterSpacing: 2,
                textTransform: "uppercase",
                color: palette.accent,
              }}
            >
              {eyebrow}
            </div>

            <div
              style={{
                display: "flex",
                marginTop: 24,
                fontSize: 72,
                lineHeight: 0.94,
                letterSpacing: -4,
                fontWeight: 800,
                maxWidth: heroImage ? 740 : 1020,
              }}
            >
              {profile.name || "Portfolio"}
            </div>

            <div
              style={{
                display: "flex",
                marginTop: 22,
                fontSize: 31,
                lineHeight: 1.15,
                fontWeight: 700,
                color: palette.text,
                maxWidth: heroImage ? 720 : 980,
              }}
            >
              {targetRole}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              fontSize: 20,
              lineHeight: 1.4,
              color: palette.soft,
              maxWidth: heroImage ? 700 : 900,
            }}
          >
            {tagline}
          </div>
        </div>

        {heroImage ? (
          <div
            style={{
              width: "32%",
              height: "100%",
              display: "flex",
              borderRadius: 28,
              overflow: "hidden",
              border: `2px solid ${palette.accent}33`,
              background: palette.surface,
            }}
          >
            <img
              src={heroImage}
              alt=""
              width="100%"
              height="100%"
              style={{ objectFit: "cover" }}
            />
          </div>
        ) : null}
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
