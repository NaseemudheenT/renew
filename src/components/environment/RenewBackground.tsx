/**
 * RENEW — the app ground. A plain, professional midnight-blue backdrop: a calm,
 * static deep-navy field with two very subtle depth glows, a soft vignette and
 * the faintest film grain so it never looks like flat plastic. No live fog, no
 * moving field, no animation — deliberately quiet so the content leads.
 *
 * Fixed behind everything, never intercepts pointers. Fully theme-aware via
 * tokens, so light mode gets its own suitable ground automatically.
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

      {/* Two soft, static depth glows — quiet dimension, never a colour splash. */}
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(115% 80% at 50% -12%, var(--bokeh-1), transparent 58%)" }}
      />
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(90% 70% at 108% 112%, var(--bokeh-2), transparent 60%)" }}
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
