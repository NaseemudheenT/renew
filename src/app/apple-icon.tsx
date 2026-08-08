import { ImageResponse } from "next/og";

// Apple touch icon (iOS home-screen). Full-bleed navy; iOS applies its own mask.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          background: "#0b0e14",
        }}
      >
        <svg width="120" height="120" viewBox="0 0 120 120">
          <path
            d="M 60 18 A 42 42 0 1 0 96 78"
            fill="none"
            stroke="#d4af6a"
            strokeWidth="9"
            strokeLinecap="round"
          />
          <path
            d="M 84 92 A 42 42 0 0 0 92 66"
            fill="none"
            stroke="#d4af6a"
            strokeWidth="9"
            strokeLinecap="round"
          />
          <path
            d="M 42 60 L 56 76 L 90 34"
            fill="none"
            stroke="#f0d8a2"
            strokeWidth="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    { ...size },
  );
}
