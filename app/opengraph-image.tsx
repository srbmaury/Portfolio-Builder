import { ImageResponse } from "next/og";
import { siteOrigin } from "@/lib/site-url";

export const alt =
  "DevFolioX — build a portfolio from pieces you love";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// next/og ships Geist Regular and nothing else, so weight cannot carry the
// hierarchy here the way font-weight 760 does on the site. Scale, colour and
// the brand's tight letter-spacing do it instead.
const INK = "#0e1116";
const PAPER = "#f5f4ef";
const ACCENT = "#7c5cff";
const MUTED = "#a6aeba";
const STROKE = "rgba(255,255,255,0.14)";

const SECTIONS = ["Hero", "About", "Experience", "Projects", "Résumé"];

function Bar({ rotate }: { rotate: number }) {
  return (
    <div
      style={{
        position: "absolute",
        left: 19,
        top: 38,
        width: 48,
        height: 9,
        borderRadius: 5,
        background: rotate > 0 ? ACCENT : PAPER,
        transform: `rotate(${rotate}deg)`,
      }}
    />
  );
}

export default function Image() {
  const domain = siteOrigin().replace(/^https?:\/\//, "");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 76,
          background: INK,
          backgroundImage:
            "radial-gradient(900px 520px at 8% -14%, rgba(124,92,255,0.30), transparent 62%), radial-gradient(760px 460px at 104% 112%, rgba(124,92,255,0.16), transparent 60%)",
          color: PAPER,
          fontFamily: "Geist",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              position: "relative",
              width: 86,
              height: 86,
              borderRadius: 21,
              background: "#151a22",
              border: `1px solid ${STROKE}`,
              display: "flex",
            }}
          >
            <Bar rotate={45} />
            <Bar rotate={-45} />
          </div>
          <div style={{ display: "flex", fontSize: 24, color: MUTED }}>
            {domain}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 104,
              letterSpacing: "-0.05em",
              lineHeight: 1,
            }}
          >
            <span>DevFolio</span>
            <span style={{ color: ACCENT }}>X</span>
          </div>
          <div
            style={{
              marginTop: 26,
              fontSize: 38,
              color: MUTED,
            }}
          >
            Build a portfolio from pieces you love
          </div>
        </div>

        <div style={{ display: "flex" }}>
          <div style={{ display: "flex" }}>
            {SECTIONS.map((section) => (
              <div
                key={section}
                style={{
                  display: "flex",
                  marginRight: 14,
                  padding: "12px 26px",
                  border: `1px solid ${STROKE}`,
                  borderRadius: 999,
                  fontSize: 24,
                  color: "#c6ccd8",
                }}
              >
                {section}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    size
  );
}
