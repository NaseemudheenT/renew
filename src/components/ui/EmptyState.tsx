"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { FadeScale } from "@/components/motion";
import { cn } from "@/lib/utils";

/** Warm, non-dead empty state — always explains the next step. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact = false,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <FadeScale
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "gap-3 py-8" : "gap-4 py-14",
        className,
      )}
    >
      <span className="glass grid size-16 place-items-center !rounded-full">
        <Icon className="size-7 text-[var(--color-gold-500)]" />
      </span>
      <div>
        <h3 className="text-strong text-base font-medium">{title}</h3>
        {description && (
          <p className="text-muted mx-auto mt-1 max-w-sm text-sm leading-relaxed">{description}</p>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </FadeScale>
  );
}
