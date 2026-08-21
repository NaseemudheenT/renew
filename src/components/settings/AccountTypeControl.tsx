"use client";

import { useState } from "react";
import { User, Briefcase, Layers, type LucideIcon } from "lucide-react";
import { updateAccountType } from "@/lib/firestore/profile";
import { toast } from "@/components/ui/toast-store";
import { cn } from "@/lib/utils";
import type { AccountType } from "@/hooks/useUserProfile";

const OPTIONS: { value: AccountType; label: string; desc: string; icon: LucideIcon }[] = [
  { value: "personal", label: "Personal", desc: "Your own money — spending, bills, savings.", icon: User },
  { value: "business", label: "Business", desc: "Revenue and expenses for your work.", icon: Briefcase },
  { value: "both", label: "Both", desc: "Personal and business, one calm place.", icon: Layers },
];

export function AccountTypeControl({
  uid,
  current,
}: {
  uid: string;
  current: AccountType;
}) {
  const [value, setValue] = useState<AccountType>(current);
  const [saving, setSaving] = useState(false);

  async function choose(next: AccountType) {
    if (next === value || saving) return;
    const prev = value;
    setValue(next);
    setSaving(true);
    try {
      await updateAccountType(uid, next);
      toast({ title: "Saved", variant: "success" });
    } catch {
      setValue(prev);
      toast({ title: "Couldn't save", variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {OPTIONS.map((o) => {
        const Icon = o.icon;
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => choose(o.value)}
            disabled={saving}
            aria-pressed={active}
            className={cn(
              "rounded-2xl border p-3.5 text-left transition-colors disabled:opacity-60",
              active
                ? "border-[var(--focus-ring)] bg-[var(--glass-bg-strong)]"
                : "border-[var(--field-border)] bg-[var(--field-bg)] hover:border-[var(--focus-ring)]/50",
            )}
          >
            <Icon
              className={cn(
                "size-5",
                active ? "text-[var(--color-gold-500)]" : "text-[var(--text-muted)]",
              )}
            />
            <p className="text-strong mt-2 text-sm font-medium">{o.label}</p>
            <p className="text-muted mt-0.5 text-xs">{o.desc}</p>
          </button>
        );
      })}
    </div>
  );
}
