/**
 * REN's mark — a luminous glass orb: a deep blue sphere with a glossy highlight
 * and an iridescent cyan→violet→peach wave threading through its centre. This is
 * Ren's face everywhere (the floating launcher, the voice screen, the chat
 * header). It replaces the old waveform mark — no microphone, no bars, just the
 * living sphere, matching the founder's Ren logo (the round centre, in Renew's
 * palette). Pure self-contained SVG; `idSuffix` keeps gradient ids unique when
 * several render on one page.
 */
export function RenLogo({
  size = 28,
  className,
  idSuffix = "",
}: {
  size?: number;
  className?: string;
  idSuffix?: string;
}) {
  const body = `ren-body-${idSuffix}`;
  const gloss = `ren-gloss-${idSuffix}`;
  const rim = `ren-rim-${idSuffix}`;
  const wave = `ren-wave-${idSuffix}`;
  const clip = `ren-clip-${idSuffix}`;
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Ren"
    >
      <defs>
        {/* Deep glass sphere — royal navy core lifting to a bright rim. */}
        <radialGradient id={body} cx="0.38" cy="0.34" r="0.75">
          <stop offset="0" stopColor="#3b6fe0" />
          <stop offset="0.45" stopColor="#1e3aa8" />
          <stop offset="0.82" stopColor="#101a5c" />
          <stop offset="1" stopColor="#4aa8ff" />
        </radialGradient>
        {/* Top-left specular highlight. */}
        <radialGradient id={gloss} cx="0.32" cy="0.24" r="0.55">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="0.4" stopColor="#ffffff" stopOpacity="0.14" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        {/* Cool rim light around the edge. */}
        <radialGradient id={rim} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.78" stopColor="#7fd0ff" stopOpacity="0" />
          <stop offset="0.95" stopColor="#8fe0ff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#8fe0ff" stopOpacity="0" />
        </radialGradient>
        {/* Iridescent wave — cyan through violet to warm peach. */}
        <linearGradient id={wave} x1="10" y1="26" x2="38" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#37e6ff" />
          <stop offset="0.4" stopColor="#4a7bff" />
          <stop offset="0.7" stopColor="#c05cff" />
          <stop offset="1" stopColor="#ff9d6c" />
        </linearGradient>
        <clipPath id={clip}><circle cx="24" cy="24" r="21" /></clipPath>
      </defs>

      {/* Sphere */}
      <circle cx="24" cy="24" r="21" fill={`url(#${body})`} />

      {/* Iridescent S-wave through the middle (clipped to the sphere) */}
      <g clipPath={`url(#${clip})`}>
        <path
          d="M6 27 C 13 20, 19 20, 24 24 C 29 28, 35 28, 42 21"
          fill="none"
          stroke={`url(#${wave})`}
          strokeWidth="4.2"
          strokeLinecap="round"
          opacity="0.95"
        />
        <path
          d="M6 27 C 13 20, 19 20, 24 24 C 29 28, 35 28, 42 21"
          fill="none"
          stroke="#ffffff"
          strokeOpacity="0.5"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </g>

      {/* Glass finish */}
      <circle cx="24" cy="24" r="21" fill={`url(#${gloss})`} />
      <circle cx="24" cy="24" r="21" fill={`url(#${rim})`} />
    </svg>
  );
}
