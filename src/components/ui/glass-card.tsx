"use client";

import { useRef } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

type GlassCardProps = Omit<HTMLMotionProps<"div">, "ref" | "children"> & {
  children?: React.ReactNode;
  /** Pointer-following gold spotlight (default on). */
  spotlight?: boolean;
  /** Gold hairline border glow (default on). */
  glow?: boolean;
};

/**
 * Premium glass surface with an optional pointer-following gold spotlight and a
 * soft hairline glow. Reused for auth, onboarding, and dashboard panels.
 */
export function GlassCard({
  children,
  className,
  spotlight = true,
  glow = true,
  ...props
}: GlassCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!spotlight || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    ref.current.style.setProperty("--spot-x", `${e.clientX - rect.left}px`);
    ref.current.style.setProperty("--spot-y", `${e.clientY - rect.top}px`);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      className={cn(
        "group glass relative overflow-hidden rounded-[var(--radius-2xl)]",
        glow &&
          "shadow-[0_1px_0_0_color-mix(in_oklab,var(--gold)_20%,transparent)_inset,0_30px_80px_-40px_rgba(0,0,0,0.6)]",
        className,
      )}
      {...props}
    >
      {spotlight && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{
            background:
              "radial-gradient(340px circle at var(--spot-x, 50%) var(--spot-y, 0%), color-mix(in oklab, var(--gold) 14%, transparent), transparent 60%)",
          }}
        />
      )}
      <div className="relative z-[1]">{children}</div>
    </motion.div>
  );
}
