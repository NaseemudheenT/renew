"use client";

import { useEffect } from "react";

/**
 * Last-resort boundary for errors in the root layout itself. It must render its
 * own <html>/<body> (the normal layout has failed). Kept minimal and inline so
 * it works even if styles/tokens didn't load.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          background: "#14161f",
          color: "#f2ede3",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div style={{ maxWidth: 380, padding: 24, textAlign: "center" }}>
          <h1 style={{ fontSize: 20, fontWeight: 500 }}>Something went wrong</h1>
          <p style={{ marginTop: 8, fontSize: 14, color: "#cec8bd" }}>
            Please reload the page. If it persists, try again shortly.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: 20,
              padding: "10px 20px",
              borderRadius: 9999,
              border: "none",
              cursor: "pointer",
              fontWeight: 500,
              color: "#2a2113",
              background: "linear-gradient(180deg,#f4e9cf,#d0a959)",
            }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
