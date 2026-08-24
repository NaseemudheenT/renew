"use client";

import { User, Briefcase } from "lucide-react";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import type { WorkspaceMode } from "@/lib/types";
import { cn } from "@/lib/utils";

const MODES: { value: WorkspaceMode; label: string; icon: typeof User }[] = [
  { value: "personal", label: "Personal", icon: User },
  { value: "business", label: "Business", icon: Briefcase },
];

/**
 * Personal / Business switch. Flipping it swaps the whole app to that
 * workspace's data — every list, total and chart only shows the active one.
 * The choice is remembered on this device.
 */
export function WorkspaceSwitch({ className }: { className?: string }) {
  const { mode, setMode } = useWorkspace();

  return (
    <div
      role="tablist"
      aria-label="Workspace"
      className={cn(
        "inline-flex shrink-0 rounded-full border border-[var(--field-border)] bg-[var(--field-bg)] p-0.5",
        className,
      )}
    >
      {MODES.map((m) => {
        const Icon = m.icon;
        const active = mode === m.value;
        return (
          <button
            key={m.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => setMode(m.value)}
            title={`${m.label} workspace`}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              active
                ? "bg-[var(--glass-bg-strong)] text-[var(--text-strong)] shadow-[inset_0_1px_0_var(--glass-edge)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-strong)]",
            )}
          >
            <Icon className="size-3.5" />
            <span className="hidden sm:inline">{m.label}</span>
          </button>
        );
      })}
    </div>
  );
}
