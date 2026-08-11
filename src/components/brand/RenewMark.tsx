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
 * The Renew mark: a broken champagne-gold ring cradling a checkmark.
 * Rendered as crisp vector with a metallic gradient + soft edge light.
 */
export function RenewMark({
  className,
  size = 96,
  idSuffix = "default",
  title = "Renew",
}: RenewMarkProps) {
  const gold = `renew-gold-${idSuffix}`;
  const goldSoft = `renew-gold-soft-${idSuffix}`;
  const glow = `renew-glow-${idSuffix}`;

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
        <linearGradient id={gold} x1="22" y1="14" x2="80" y2="88">
          <stop offset="0" stopColor="#F3DCA4" />
          <stop offset="0.35" stopColor="#E4C88A" />
          <stop offset="0.7" stopColor="#C6A15B" />
          <stop offset="1" stopColor="#A5824A" />
        </linearGradient>
        <linearGradient id={goldSoft} x1="30" y1="20" x2="72" y2="82">
          <stop offset="0" stopColor="#F6E6BE" />
          <stop offset="1" stopColor="#C9A45E" />
        </linearGradient>
        <filter id={glow} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="1.1" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g filter={`url(#${glow})`} strokeLinecap="round" strokeLinejoin="round">
        {/* Broken ring — a near-full circle with a calm gap at the base. */}
        <circle
          cx="50"
          cy="50"
          r="33"
          stroke={`url(#${gold})`}
          strokeWidth="7"
          strokeDasharray="171 36"
          strokeDashoffset="103"
          transform="rotate(90 50 50)"
        />
        {/* Checkmark cradled within, its long arm sweeping beyond the ring. */}
        <path
          d="M35 51 L45.5 61.5 L76 24"
          stroke={`url(#${goldSoft})`}
          strokeWidth="7.5"
        />
      </g>
    </svg>
  );
}
