import {
  BadgeCheck,
  BookUser,
  Cake,
  CalendarClock,
  Car,
  House,
  IdCard,
  Landmark,
  Pill,
  ReceiptText,
  Repeat,
  ShieldCheck,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { CategoryKey } from "@/lib/reminders/categories";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  BookUser,
  IdCard,
  ShieldCheck,
  Car,
  BadgeCheck,
  Repeat,
  Pill,
  ReceiptText,
  House,
  Landmark,
  Users,
  CalendarClock,
  Cake,
  Sparkles,
};

import { CATEGORY_MAP } from "@/lib/reminders/categories";

export function CategoryIcon({
  category,
  className,
}: {
  category: CategoryKey;
  className?: string;
}) {
  const meta = CATEGORY_MAP[category];
  const Icon = ICONS[meta?.icon] ?? Sparkles;
  return <Icon className={cn("size-5", className)} />;
}
