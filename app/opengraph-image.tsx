import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { siteOrigin } from "@/lib/site-url";

export const alt =
  "DevFolioX — A live portfolio link. No code. See every open, and where it came from.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// next/og only bundles Geist Regular; the site's type is Inter, so the card
// loads the two weights it needs from assets/fonts (SIL OFL 1.1).
const [interMedium, interBold] = await Promise.all([
  readFile(join(process.cwd(), "assets/fonts/Inter-500.ttf")),
  readFile(join(process.cwd(), "assets/fonts/Inter-700.ttf")),
]);

const INK = "#111827";
const MUTED = "#5f6571";
const FAINT = "#8a8d93";
const RULE = "#e5e7eb";
const ACCENT = "#2563eb";
const ACCENT_SOFT = "#bfd3fb";
const LIVE = "#16a34a";
const LIVE_TINT = "#e8f6ee";

// Illustrative numbers, as on the landing page's example card.
const BARS = [4, 7, 5, 12, 9, 18, 14, 22, 16, 27, 21, 31, 24, 29];
const STEPS = ["Fill details", "Publish", "Share URL", "See every open"];

function Mark() {
  return (
    <div
      style={{
        position: "relative",
        width: 44,
        height: 44,
        borderRadius: 11,
        background: INK,
        display: "flex",
      }}
    >
      {[45, -45].map((rotate) => (
        <div
          key={rotate}
          style={{
            position: "absolute",
            left: 10,
            top: 19,
            width: 24,
            height: 6,
            borderRadius: 3,
            background: rotate > 0 ? ACCENT : "#ffffff",
            transform: `rotate(${rotate}deg)`,
          }}
        />
      ))}
    </div>
  );
}

export default function Image() {
  const host = siteOrigin().replace(/^https?:\/\//, "");
  const maxBar = Math.max(...BARS);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px 72px",
          background: "#ffffff",
          color: INK,
          fontFamily: "Inter",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Mark />
            <div style={{ display: "flex", fontSize: 34, fontWeight: 700, letterSpacing: "-0.04em" }}>
              <span>DevFolio</span>
              <span style={{ color: ACCENT }}>X</span>
            </div>
          </div>
          <div style={{ display: "flex", fontSize: 22, fontWeight: 500, color: FAINT }}>{host}</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 48 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              minWidth: 0,
              fontSize: 54,
              fontWeight: 700,
              lineHeight: 1.08,
              letterSpacing: "-0.035em",
            }}
          >
            <span>A live portfolio link.</span>
            <span>No code.</span>
            <span style={{ color: MUTED }}>See every open,</span>
            <span style={{ color: MUTED }}>and where it came from.</span>
          </div>

          <div
            style={{
              width: 320,
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              gap: 16,
              padding: 22,
              border: `1px solid ${RULE}`,
              borderRadius: 16,
              background: "#ffffff",
              boxShadow: "0 18px 40px rgba(17,24,39,0.10)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 17, fontWeight: 500, color: MUTED }}>
                <div style={{ width: 10, height: 10, borderRadius: 5, background: LIVE, display: "flex" }} />
                <span>your-name/portfolio</span>
              </div>
              <div
                style={{
                  display: "flex",
                  padding: "4px 10px",
                  borderRadius: 999,
                  background: LIVE_TINT,
                  color: LIVE,
                  fontSize: 15,
                  fontWeight: 700,
                }}
              >
                Live
              </div>
            </div>
            <div style={{ display: "flex", gap: 28 }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: 44, fontWeight: 700, letterSpacing: "-0.03em" }}>238</span>
                <span style={{ fontSize: 16, fontWeight: 500, color: MUTED }}>views</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: 44, fontWeight: 700, letterSpacing: "-0.03em" }}>37</span>
                <span style={{ fontSize: 16, fontWeight: 500, color: MUTED }}>résumé opens</span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 64 }}>
              {BARS.map((value, index) => (
                <div
                  key={index}
                  style={{
                    flex: 1,
                    height: Math.round((value / maxBar) * 64),
                    borderRadius: "3px 3px 0 0",
                    background: index === BARS.length - 1 ? ACCENT : ACCENT_SOFT,
                    display: "flex",
                  }}
                />
              ))}
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                paddingTop: 12,
                borderTop: `1px solid ${RULE}`,
                fontSize: 16,
                fontWeight: 500,
                color: MUTED,
              }}
            >
              <span>Top source</span>
              <span style={{ color: INK }}>LinkedIn (your link)</span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 24, fontWeight: 500, color: MUTED }}>
          {STEPS.map((step, index) => (
            <div key={step} style={{ display: "flex", alignItems: "center", gap: 14 }}>
              {index > 0 ? <span style={{ color: FAINT }}>→</span> : null}
              <span style={{ color: index === STEPS.length - 1 ? ACCENT : MUTED }}>{step}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Inter", data: interMedium, style: "normal", weight: 500 },
        { name: "Inter", data: interBold, style: "normal", weight: 700 },
      ],
    }
  );
}
