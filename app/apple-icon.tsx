import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// iOS masks and rounds the artwork itself, so this one is full-bleed rather
// than the rounded tile used in icon.svg.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: "#0e1116",
        }}
      >
        {[45, -45].map((rotate) => (
          <div
            key={rotate}
            style={{
              position: "absolute",
              left: 42,
              top: 81,
              width: 96,
              height: 18,
              borderRadius: 9,
              background: rotate > 0 ? "#2563eb" : "#f5f4ef",
              transform: `rotate(${rotate}deg)`,
            }}
          />
        ))}
      </div>
    ),
    size
  );
}
