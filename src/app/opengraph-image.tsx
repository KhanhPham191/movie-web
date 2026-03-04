import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "MovPey - Phim xịn mỗi ngày";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0D0D0D 0%, #191b24 50%, #0D0D0D 100%)",
          fontFamily: "sans-serif",
        }}
      >
        {/* Gold accent line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: "linear-gradient(90deg, transparent, #F6C453, #D3A13A, transparent)",
          }}
        />

        {/* Brand name */}
        <div
          style={{
            fontSize: 120,
            fontWeight: 900,
            color: "#F6C453",
            letterSpacing: -2,
            textShadow: "0 0 40px rgba(246, 196, 83, 0.4)",
          }}
        >
          MovPey
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 36,
            color: "#d1d5db",
            marginTop: 8,
            letterSpacing: 4,
          }}
        >
          Phim xịn mỗi ngày
        </div>

        {/* Bottom accent line */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 4,
            background: "linear-gradient(90deg, transparent, #D3A13A, #F6C453, transparent)",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
