/**
 * Liquid-glass refraction filter (adapted from the supplied reference). Mounted
 * once globally; elements opt in via `filter: url(#renew-glass)` on a blur
 * layer. Displacement is kept subtle so surfaces refract the background without
 * looking broken. Purely decorative, hidden from the a11y tree.
 */
export function GlassFilter() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      style={{ position: "absolute", width: 0, height: 0, pointerEvents: "none" }}
    >
      <filter
        id="renew-glass"
        x="0%"
        y="0%"
        width="100%"
        height="100%"
        filterUnits="objectBoundingBox"
      >
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.0015 0.006"
          numOctaves="1"
          seed="17"
          result="turbulence"
        />
        <feGaussianBlur in="turbulence" stdDeviation="3" result="softMap" />
        <feDisplacementMap
          in="SourceGraphic"
          in2="softMap"
          scale="42"
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
    </svg>
  );
}
