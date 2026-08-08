import { ImageResponse } from "next/og";

// Generated app icon (also used for the manifest / PWA install).
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          background: "linear-gradient(145deg, #12161f, #0b0e14)",
        }}
      >
        {/* The mark sits within the inner ~70% safe zone for maskable icons. */}
        <svg width="320" height="320" viewBox="0 0 120 120">
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
