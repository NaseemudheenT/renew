import {
  Briefcase, Laptop, Building2, TrendingUp, Gift, RotateCcw,
  Utensils, Car, ReceiptText, ShoppingBag, Clapperboard, HeartPulse,
  GraduationCap, Repeat, Home, ShoppingCart, Coins, Bitcoin, LineChart, PiggyBank, Landmark, Tag,
  type LucideIcon,
} from "lucide-react";
import type { TxType, InvestmentType, CustomCategory } from "@/lib/types";

export interface CatMeta {
  id: string;
  label: string;
  icon: LucideIcon;
  /** tailwind text color class for accents */
  tone: string;
}

export const INCOME_CATEGORIES: CatMeta[] = [
  { id: "salary", label: "Salary", icon: Briefcase, tone: "text-emerald-400" },
  { id: "freelance", label: "Freelance", icon: Laptop, tone: "text-emerald-400" },
  { id: "business", label: "Business", icon: Building2, tone: "text-emerald-400" },
  { id: "investment", label: "Investment", icon: TrendingUp, tone: "text-emerald-400" },
  { id: "gift", label: "Gift", icon: Gift, tone: "text-emerald-400" },
  { id: "refund", label: "Refund", icon: RotateCcw, tone: "text-emerald-400" },
  { id: "other_income", label: "Other", icon: Coins, tone: "text-emerald-400" },
];

export const EXPENSE_CATEGORIES: CatMeta[] = [
  { id: "food", label: "Food & Drink", icon: Utensils, tone: "text-rose-400" },
  { id: "groceries", label: "Groceries", icon: ShoppingCart, tone: "text-rose-400" },
  { id: "transport", label: "Transport", icon: Car, tone: "text-rose-400" },
  { id: "rent", label: "Rent & Home", icon: Home, tone: "text-rose-400" },
  { id: "bills", label: "Bills", icon: ReceiptText, tone: "text-rose-400" },
  { id: "shopping", label: "Shopping", icon: ShoppingBag, tone: "text-rose-400" },
  { id: "entertainment", label: "Entertainment", icon: Clapperboard, tone: "text-rose-400" },
  { id: "health", label: "Health", icon: HeartPulse, tone: "text-rose-400" },
  { id: "education", label: "Education", icon: GraduationCap, tone: "text-rose-400" },
  { id: "subscriptions", label: "Subscriptions", icon: Repeat, tone: "text-rose-400" },
  { id: "other_expense", label: "Other", icon: Coins, tone: "text-rose-400" },
];

const ALL = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];
const byId = new Map(ALL.map((c) => [c.id, c]));

export function categoriesFor(type: TxType): CatMeta[] {
  return type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
}
export function catMeta(id: string): CatMeta {
  return byId.get(id) ?? { id, label: "Other", icon: Coins, tone: "text-[var(--text-muted)]" };
}

/** Meta for a user-defined category. */
export function customCatMeta(cat: CustomCategory): CatMeta {
  return {
    id: cat.id,
    label: cat.label,
    icon: Tag,
    tone: cat.type === "income" ? "text-emerald-400" : "text-rose-400",
  };
}

/** Resolve any category id — built-in first, then the user's custom set. */
export function resolveCatMeta(
  id: string,
  custom: CustomCategory[] = [],
): CatMeta {
  const builtin = byId.get(id);
  if (builtin) return builtin;
  const c = custom.find((x) => x.id === id);
  if (c) return customCatMeta(c);
  return { id, label: "Other", icon: Coins, tone: "text-[var(--text-muted)]" };
}

/** A short, filesystem/id-safe slug for generating custom category ids. */
export function makeCustomCategoryId(label: string, type: TxType): string {
  const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 24) || "cat";
  return `custom_${type}_${slug}_${Math.random().toString(36).slice(2, 7)}`;
}

export const INVESTMENT_TYPES: { value: InvestmentType; label: string; icon: LucideIcon }[] = [
  { value: "stock", label: "Stock", icon: LineChart },
  { value: "mutual_fund", label: "Mutual Fund", icon: Landmark },
  { value: "etf", label: "ETF", icon: TrendingUp },
  { value: "crypto", label: "Crypto", icon: Bitcoin },
  { value: "other", label: "Other", icon: PiggyBank },
];
export function investmentMeta(t: InvestmentType) {
  return INVESTMENT_TYPES.find((x) => x.value === t) ?? INVESTMENT_TYPES[4]!;
}

/* ---- Date helpers -------------------------------------------------------- */
export function monthRange(ref = new Date()): { start: number; end: number } {
  const start = new Date(ref.getFullYear(), ref.getMonth(), 1).getTime();
  const end = new Date(ref.getFullYear(), ref.getMonth() + 1, 1).getTime();
  return { start, end };
}
