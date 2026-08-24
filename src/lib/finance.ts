import {
  Briefcase, Laptop, Building2, TrendingUp, Gift, RotateCcw,
  Utensils, Car, ReceiptText, ShoppingBag, Clapperboard, HeartPulse,
  GraduationCap, Repeat, Home, ShoppingCart, Coins, Bitcoin, LineChart, PiggyBank, Landmark, Tag,
  Percent, Award, Handshake, HandCoins, Music, BadgePercent,
  Fuel, Smartphone, Shirt, Dumbbell, Plane, Shield, Sparkles, Baby, PawPrint, Heart, Banknote, Zap,
  type LucideIcon,
} from "lucide-react";
import type { TxType, InvestmentType, CustomCategory } from "@/lib/types";

export interface CatMeta {
  id: string;
  label: string;
  icon: LucideIcon;
  /** tailwind text color class for accents */
  tone: string;
  /** Optional subcategories — a finer breakdown the person can pick. */
  sub?: string[];
}

const IN = "text-emerald-400";
const EX = "text-rose-400";

export const INCOME_CATEGORIES: CatMeta[] = [
  { id: "salary", label: "Salary", icon: Briefcase, tone: IN, sub: ["Base pay", "Overtime", "Bonus", "Commission", "Tips"] },
  { id: "freelance", label: "Freelance", icon: Laptop, tone: IN, sub: ["Client project", "Consulting", "Contract", "Gig work"] },
  { id: "business", label: "Business", icon: Building2, tone: IN, sub: ["Sales", "Services", "Products", "Revenue"] },
  { id: "investment", label: "Investment", icon: TrendingUp, tone: IN, sub: ["Capital gains", "Dividends", "Interest", "Crypto"] },
  { id: "rental", label: "Rental", icon: Home, tone: IN, sub: ["Rent received", "Lease", "Deposit"] },
  { id: "interest", label: "Interest", icon: Percent, tone: IN, sub: ["Savings", "Fixed deposit", "Bonds"] },
  { id: "dividends", label: "Dividends", icon: PiggyBank, tone: IN, sub: ["Stocks", "Mutual funds", "ETFs"] },
  { id: "bonus", label: "Bonus", icon: Award, tone: IN, sub: ["Performance", "Festival", "Referral"] },
  { id: "commission", label: "Commission", icon: Handshake, tone: IN, sub: ["Sales", "Affiliate", "Brokerage"] },
  { id: "pension", label: "Pension", icon: Landmark, tone: IN, sub: ["Retirement", "Annuity"] },
  { id: "benefits", label: "Benefits & Grants", icon: HandCoins, tone: IN, sub: ["Government", "Grant", "Scholarship", "Subsidy"] },
  { id: "royalties", label: "Royalties", icon: Music, tone: IN, sub: ["Content", "Book", "Patent", "Licensing"] },
  { id: "gift", label: "Gift", icon: Gift, tone: IN, sub: ["Cash gift", "Inheritance"] },
  { id: "cashback", label: "Cashback & Rewards", icon: BadgePercent, tone: IN, sub: ["Card rewards", "App cashback", "Points"] },
  { id: "sale", label: "Sale", icon: Tag, tone: IN, sub: ["Resale", "Second-hand", "Asset sale"] },
  { id: "refund", label: "Refund", icon: RotateCcw, tone: IN, sub: ["Purchase refund", "Tax refund", "Deposit return"] },
  { id: "other_income", label: "Other", icon: Coins, tone: IN },
];

export const EXPENSE_CATEGORIES: CatMeta[] = [
  { id: "food", label: "Food & Drink", icon: Utensils, tone: EX, sub: ["Restaurants", "Cafe", "Takeaway", "Delivery", "Snacks"] },
  { id: "groceries", label: "Groceries", icon: ShoppingCart, tone: EX, sub: ["Supermarket", "Fruits & veg", "Meat & fish", "Bakery", "Household"] },
  { id: "transport", label: "Transport", icon: Car, tone: EX, sub: ["Public transport", "Taxi & ride", "Parking", "Tolls", "Maintenance"] },
  { id: "fuel", label: "Fuel", icon: Fuel, tone: EX, sub: ["Petrol", "Diesel", "EV charging"] },
  { id: "rent", label: "Rent & Home", icon: Home, tone: EX, sub: ["Rent", "Mortgage", "Maintenance", "Furniture", "Repairs"] },
  { id: "bills", label: "Utility Bills", icon: ReceiptText, tone: EX, sub: ["Electricity", "Water", "Gas", "Waste"] },
  { id: "phone", label: "Phone & Internet", icon: Smartphone, tone: EX, sub: ["Mobile", "Internet", "Cable", "Landline"] },
  { id: "shopping", label: "Shopping", icon: ShoppingBag, tone: EX, sub: ["Electronics", "Home goods", "Online", "Gadgets"] },
  { id: "clothing", label: "Clothing", icon: Shirt, tone: EX, sub: ["Clothes", "Shoes", "Accessories"] },
  { id: "entertainment", label: "Entertainment", icon: Clapperboard, tone: EX, sub: ["Movies", "Games", "Events", "Music", "Streaming"] },
  { id: "health", label: "Health", icon: HeartPulse, tone: EX, sub: ["Doctor", "Pharmacy", "Dental", "Hospital", "Therapy"] },
  { id: "fitness", label: "Fitness", icon: Dumbbell, tone: EX, sub: ["Gym", "Sports", "Supplements", "Classes"] },
  { id: "education", label: "Education", icon: GraduationCap, tone: EX, sub: ["Tuition", "Courses", "Books", "Supplies"] },
  { id: "subscriptions", label: "Subscriptions", icon: Repeat, tone: EX, sub: ["Streaming", "Software", "Memberships", "News"] },
  { id: "travel", label: "Travel", icon: Plane, tone: EX, sub: ["Flights", "Hotels", "Transport", "Activities"] },
  { id: "insurance", label: "Insurance", icon: Shield, tone: EX, sub: ["Health", "Vehicle", "Life", "Home"] },
  { id: "personal_care", label: "Personal Care", icon: Sparkles, tone: EX, sub: ["Haircut", "Beauty", "Spa", "Cosmetics"] },
  { id: "kids", label: "Kids", icon: Baby, tone: EX, sub: ["Childcare", "School", "Toys", "Activities"] },
  { id: "pets", label: "Pets", icon: PawPrint, tone: EX, sub: ["Food", "Vet", "Grooming", "Supplies"] },
  { id: "giving", label: "Gifts & Giving", icon: Heart, tone: EX, sub: ["Charity", "Donations", "Gifts", "Tips"] },
  { id: "taxes", label: "Taxes", icon: Landmark, tone: EX, sub: ["Income tax", "Property tax", "GST / VAT"] },
  { id: "fees", label: "Fees & Charges", icon: Banknote, tone: EX, sub: ["Bank fees", "Interest", "Penalties", "Service charge"] },
  { id: "utilities", label: "Other Utilities", icon: Zap, tone: EX, sub: ["Solar", "Heating", "Cooling"] },
  { id: "other_expense", label: "Other", icon: Coins, tone: EX },
];

const ALL = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];
const byId = new Map(ALL.map((c) => [c.id, c]));

export function categoriesFor(type: TxType): CatMeta[] {
  return type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
}
export function catMeta(id: string): CatMeta {
  return byId.get(id) ?? { id, label: "Other", icon: Coins, tone: "text-[var(--text-muted)]" };
}
/** The subcategory labels for a category id (empty if none / unknown). */
export function subcategoriesFor(categoryId: string): string[] {
  return byId.get(categoryId)?.sub ?? [];
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
