import type { LucideIcon } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";

/**
 * Temporary scaffold for sections that are wired into navigation but whose full
 * implementation lands in a later build part. Keeps navigation honest (no dead
 * links, no fake buttons) until the real feature replaces this page.
 */
export function ComingTogether({
  title,
  icon,
  note,
}: {
  title: string;
  icon: LucideIcon;
  note: string;
}) {
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title={title} />
      <GlassCard padded>
        <EmptyState icon={icon} title={`${title} is coming together`} description={note} />
      </GlassCard>
    </div>
  );
}
