import { cn } from "@/lib/utils";

export interface RenewMarkProps {
  className?: string;
  /** Pixel size (width & height). */
  size?: number;
  /** Unique id suffix so multiple marks can share a page without gradient clashes. */
  idSuffix?: string;
  title?: string;
}

/**
 * The Renew mark: a broken champagne-gold ring cradling a checkmark. Refined,
 * metallic vector — a warm gold gradient with a bright top-left specular
 * highlight on both the ring and the check, and a soft depth glow. Every colour
 * is theme-aware (CSS vars) so it stays crisp on the dark night world and the
 * warm champagne daylight alike.
 */
export function RenewMark({
  className,
  size = 96,
  idSuffix = "default",
  title = "Renew",
}: RenewMarkProps) {
  const gold = `renew-gold-${idSuffix}`;
  const goldSoft = `renew-gold-soft-${idSuffix}`;
  const spec = `renew-spec-${idSuffix}`;
  const glow = `renew-glow-${idSuffix}`;
  const inner = `renew-inner-${idSuffix}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      role="img"
      aria-label={title}
      className={cn("select-none", className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Metallic champagne — brighter at the top-left where the light lands. */}
        <linearGradient id={gold} x1="22" y1="14" x2="80" y2="88">
          <stop offset="0" stopColor="var(--mark-gold-1, #F7E7BD)" />
          <stop offset="0.18" stopColor="var(--mark-gold-2, #E9D3A3)" />
          <stop offset="0.52" stopColor="var(--mark-gold-3, #C6A15B)" />
          <stop offset="0.82" stopColor="var(--mark-gold-4, #A5824A)" />
          <stop offset="1" stopColor="var(--mark-gold-3, #B58F4C)" />
        </linearGradient>
        <linearGradient id={goldSoft} x1="30" y1="20" x2="72" y2="82">
          <stop offset="0" stopColor="var(--mark-gold-1, #FBF0D2)" />
          <stop offset="0.5" stopColor="var(--mark-gold-2, #E9D3A3)" />
          <stop offset="1" stopColor="var(--mark-gold-4, #C9A45E)" />
        </linearGradient>
        {/* Bright specular sheen fading out — the light on polished metal. */}
        <linearGradient id={spec} x1="20" y1="18" x2="58" y2="58">
          <stop offset="0" stopColor="var(--mark-gold-1, #FCF3DA)" stopOpacity="0.95" />
          <stop offset="1" stopColor="var(--mark-gold-2, #E9D3A3)" stopOpacity="0" />
        </linearGradient>
        {/* Soft warm glow behind the check for depth. */}
        <radialGradient id={inner} cx="50%" cy="46%" r="46%">
          <stop offset="0" stopColor="var(--mark-gold-2, #E9D3A3)" stopOpacity="0.28" />
          <stop offset="1" stopColor="var(--mark-gold-2, #E9D3A3)" stopOpacity="0" />
        </radialGradient>
        <filter id={glow} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="0.9" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* depth glow */}
      <circle cx="50" cy="48" r="30" fill={`url(#${inner})`} />

      <g filter={`url(#${glow})`} strokeLinecap="round" strokeLinejoin="round">
        {/* Broken ring — a near-full circle with a calm gap at the base. */}
        <circle
          cx="50"
          cy="50"
          r="33"
          stroke={`url(#${gold})`}
          strokeWidth="6.6"
          strokeDasharray="171 36"
          strokeDashoffset="103"
          transform="rotate(90 50 50)"
        />
        {/* Specular highlight arc on the upper-left of the ring. */}
        <path
          d="M18.1 41.5 A33 33 0 0 1 38.7 19"
          stroke={`url(#${spec})`}
          strokeWidth="2.3"
          strokeOpacity="0.85"
        />
        {/* Checkmark cradled within, its long arm sweeping beyond the ring. */}
        <path
          d="M35 51 L45.5 61.5 L76 24"
          stroke={`url(#${goldSoft})`}
          strokeWidth="7.4"
        />
        {/* Thin specular sheen along the top edge of the check. */}
        <path
          d="M35.6 50 L45.6 60.4 L75.2 25"
          stroke={`url(#${spec})`}
          strokeWidth="1.7"
          strokeOpacity="0.7"
        />
      </g>
    </svg>
  );
}
