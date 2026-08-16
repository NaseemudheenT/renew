import {
  Shield,
  IdCard,
  CreditCard,
  Receipt,
  FileText,
  Car,
  HeartPulse,
  Home,
  Tag,
  type LucideIcon,
} from "lucide-react";
import type { Category, RepeatRule, Priority } from "@/lib/types";

export interface CategoryMeta {
  id: Category;
  label: string;
  icon: LucideIcon;
}

export const CATEGORIES: CategoryMeta[] = [
  { id: "insurance", label: "Insurance", icon: Shield },
  { id: "documents", label: "Documents", icon: IdCard },
  { id: "subscriptions", label: "Subscriptions", icon: CreditCard },
  { id: "bills", label: "Bills", icon: Receipt },
  { id: "licenses", label: "Licenses", icon: FileText },
  { id: "vehicle", label: "Vehicle", icon: Car },
  { id: "health", label: "Health", icon: HeartPulse },
  { id: "home", label: "Home", icon: Home },
  { id: "other", label: "Other", icon: Tag },
];

const byId = new Map(CATEGORIES.map((c) => [c.id, c]));
export function categoryMeta(id: Category): CategoryMeta {
  return byId.get(id) ?? CATEGORIES[CATEGORIES.length - 1]!;
}

export const REPEAT_OPTIONS: { value: RepeatRule; label: string }[] = [
  { value: "none", label: "Does not repeat" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

export const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
];
