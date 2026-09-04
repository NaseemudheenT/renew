/**
 * REN's mark — a champagne orb holding a voice waveform. Ren's own identity:
 * evokes a spoken assistant (the wave) in Renew's champagne-on-midnight style,
 * distinct from the RenewMark. Pure SVG, theme-aware via the gold tokens.
 * `idSuffix` keeps gradient ids unique when several render on one page.
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
  const g = `ren-grad-${idSuffix}`;
  const gloss = `ren-gloss-${idSuffix}`;
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
        <linearGradient id={g} x1="10" y1="4" x2="40" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="var(--color-gold-300)" />
          <stop offset="1" stopColor="var(--color-gold-500)" />
        </linearGradient>
        <radialGradient id={gloss} cx="0.32" cy="0.26" r="0.7">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.5" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Orb */}
      <circle cx="24" cy="24" r="22" fill={`url(#${g})`} />
      <circle cx="24" cy="24" r="22" fill={`url(#${gloss})`} />
      {/* Voice waveform — four rounded bars, short→tall→mid→short */}
      <g fill="#ffffff" fillOpacity="0.96">
        <rect x="12.5" y="19.5" width="3.6" height="9" rx="1.8" />
        <rect x="19.2" y="14" width="3.6" height="20" rx="1.8" />
        <rect x="25.9" y="17" width="3.6" height="14" rx="1.8" />
        <rect x="32.6" y="20.5" width="3.6" height="7" rx="1.8" />
      </g>
    </svg>
  );
}
