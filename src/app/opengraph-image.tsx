import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Renew — a calm, premium personal finance companion";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** The social share card every Renew link shows — the wordmark, on the brand
 *  night sky. Next wires this as the Open Graph + Twitter image automatically. */
export default function OpengraphImage() {
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
          background: "linear-gradient(135deg, #04060f 0%, #0b1128 55%, #0e1736 100%)",
          fontFamily: "sans-serif",
        }}
      >
        {/* soft glow */}
        <div
          style={{
            position: "absolute",
            top: 120,
            width: 620,
            height: 620,
            borderRadius: 620,
            background: "radial-gradient(circle, rgba(90,134,245,0.35), transparent 62%)",
            display: "flex",
          }}
        />
        <div style={{ display: "flex", fontSize: 132, fontWeight: 800, letterSpacing: 22, color: "#eaf0ff" }}>
          RENEW
        </div>
        <div style={{ display: "flex", marginTop: 26, width: 220, height: 6, borderRadius: 6, background: "linear-gradient(90deg, #8fadff, #5a86f5)" }} />
        <div style={{ display: "flex", marginTop: 40, fontSize: 42, color: "#c7d2ee" }}>
          Your money, clear and effortless.
        </div>
        <div style={{ display: "flex", marginTop: 22, fontSize: 26, color: "#8792b5" }}>
          See what you have · where it&apos;s going · what&apos;s coming next
        </div>
      </div>
    ),
    { ...size },
  );
}
