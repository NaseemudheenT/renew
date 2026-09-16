/**
 * RENEW — the app ground. Professional midnight blue wrapped in a soft golden
 * fog: a calm, STATIC atmosphere (no live motion, no moving field) built from a
 * few large, feathered gold glows over the deep navy, a soft vignette and the
 * faintest film grain. Gold + midnight blue, premium and quiet, content-first.
 *
 * Fixed behind everything, never intercepts pointers. Fully theme-aware via
 * tokens, so light mode gets its own warm daylight ground automatically.
 */
export function RenewBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{ background: "var(--bg-base)" }}
    >
      {/* A gentle top-to-bottom deepening across the midnight ground. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(165deg, var(--bg-tint-1) 0%, var(--bg-tint-2) 55%, var(--bg-tint-3) 100%)",
        }}
      />

      {/* Soft, static golden fog — three large feathered glows for premium depth. */}
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(120% 85% at 50% -14%, var(--bokeh-1), transparent 60%)" }}
      />
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(95% 75% at 110% 112%, var(--bokeh-2), transparent 62%)" }}
      />
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(80% 70% at -10% 55%, var(--bokeh-3), transparent 64%)" }}
      />

      {/* Vignette — settles focus toward the centre. */}
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(125% 120% at 50% 30%, transparent 55%, var(--vignette) 100%)" }}
      />

      {/* Fine film grain so the flat ground reads as a rich material. */}
      <div
        className="absolute inset-0 mix-blend-soft-light"
        style={{
          opacity: "var(--grain-opacity)",
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundSize: "180px 180px",
        }}
      />
    </div>
  );
}
