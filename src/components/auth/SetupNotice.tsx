"use client";

import { Info } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";

/**
 * Shown on entry screens when Firebase isn't configured yet (e.g. a fresh clone
 * without real env values). Prevents a cryptic runtime error and points the
 * developer at the setup step. Renders nothing once configured.
 */
export function SetupNotice() {
  const { configured } = useAuth();
  if (configured) return null;
  return (
    <div className="mb-4 flex items-start gap-2 rounded-2xl border border-[var(--field-border)] bg-[var(--glass-bg-soft)] px-4 py-3 text-sm text-[var(--text-body)]">
      <Info className="mt-0.5 size-4 shrink-0 text-[var(--color-gold-500)]" />
      <span>
        Connect Firebase to sign in — copy{" "}
        <code className="text-[var(--text-strong)]">.env.example</code> to{" "}
        <code className="text-[var(--text-strong)]">.env.local</code> and add your
        project keys. See the README.
      </span>
    </div>
  );
}
