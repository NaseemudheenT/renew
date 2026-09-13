/**
 * REN's mark — a Siri-style living glass orb. A smooth 3D sphere of fluid,
 * blended iridescence (cyan, blue, violet, magenta, peach) with an inner glow, a
 * bright specular highlight, a light pool refracting at the base, a darkened edge
 * for roundness, and a cool rim. It gently shimmers when idle so it feels alive.
 * Ren's face everywhere (launcher, voice, chat). Self-contained SVG; `idSuffix`
 * keeps gradient ids unique. `animate` (default true) enables the shimmer.
 */
export function RenLogo({
  size = 28,
  className,
  idSuffix = "",
  animate = true,
}: {
  size?: number;
  className?: string;
  idSuffix?: string;
  animate?: boolean;
}) {
  const s = idSuffix;
  const base = `ren-base-${s}`, cyan = `ren-cyan-${s}`, violet = `ren-violet-${s}`;
  const pink = `ren-pink-${s}`, peach = `ren-peach-${s}`, glow = `ren-glow-${s}`;
  const pool = `ren-pool-${s}`, vign = `ren-vign-${s}`, gloss = `ren-gloss-${s}`;
  const rim = `ren-rim-${s}`, clip = `ren-clip-${s}`;
  const soft = (id: string, color: string) => (
    <radialGradient id={id} cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stopColor={color} stopOpacity="1" />
      <stop offset="0.5" stopColor={color} stopOpacity="0.5" />
      <stop offset="1" stopColor={color} stopOpacity="0" />
    </radialGradient>
  );
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} className={className} role="img" aria-label="Ren">
      <defs>
        <radialGradient id={base} cx="0.42" cy="0.38" r="0.78">
          <stop offset="0" stopColor="#6b7cff" />
          <stop offset="0.58" stopColor="#2a2f9e" />
          <stop offset="1" stopColor="#0c0c38" />
        </radialGradient>
        {soft(cyan, "#3ce9ff")}
        {soft(violet, "#a35cff")}
        {soft(pink, "#ff5ec7")}
        {soft(peach, "#ffb27a")}
        <radialGradient id={glow} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="0.55" stopColor="#dcecff" stopOpacity="0.14" />
          <stop offset="1" stopColor="#dcecff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={pool} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#bfeaff" stopOpacity="0.85" />
          <stop offset="1" stopColor="#bfeaff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={vign} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.62" stopColor="#05052a" stopOpacity="0" />
          <stop offset="1" stopColor="#05052a" stopOpacity="0.55" />
        </radialGradient>
        <radialGradient id={gloss} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="0.7" stopColor="#ffffff" stopOpacity="0.25" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={rim} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.78" stopColor="#a5ecff" stopOpacity="0" />
          <stop offset="0.95" stopColor="#a5ecff" stopOpacity="0.7" />
          <stop offset="1" stopColor="#a5ecff" stopOpacity="0" />
        </radialGradient>
        <clipPath id={clip}><circle cx="24" cy="24" r="21" /></clipPath>
      </defs>

      <circle cx="24" cy="24" r="21" fill={`url(#${base})`} />

      <g clipPath={`url(#${clip})`}>
        {/* Fluid colour blooms — slowly drift to shimmer like Siri */}
        <g>
          {animate && (
            <animateTransform attributeName="transform" type="rotate" values="-8 24 24; 8 24 24; -8 24 24" dur="9s" repeatCount="indefinite" />
          )}
          <circle cx="15" cy="14" r="20" fill={`url(#${cyan})`} />
          <circle cx="34" cy="30" r="21" fill={`url(#${violet})`} />
          <circle cx="29" cy="37" r="16" fill={`url(#${pink})`} />
          <circle cx="36" cy="16" r="14" fill={`url(#${peach})`} />
        </g>
        {/* Inner glow, breathing */}
        <circle cx="22" cy="22" r="12" fill={`url(#${glow})`}>
          {animate && <animate attributeName="r" values="11;13.5;11" dur="4.5s" repeatCount="indefinite" />}
        </circle>
        {/* Light pool refracting at the base */}
        <ellipse cx="26" cy="40" rx="15" ry="6" fill={`url(#${pool})`} />
        {/* Edge shadow for 3D roundness */}
        <circle cx="24" cy="24" r="21" fill={`url(#${vign})`} />
        {/* Specular highlights */}
        <ellipse cx="18" cy="14" rx="9" ry="5.5" fill={`url(#${gloss})`} transform="rotate(-28 18 14)" />
        <circle cx="15.5" cy="12.5" r="1.7" fill="#ffffff" fillOpacity="0.95" />
      </g>

      <circle cx="24" cy="24" r="21" fill={`url(#${rim})`} />
    </svg>
  );
}
