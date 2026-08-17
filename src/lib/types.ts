/**
 * Shared domain types used across client and server. Firestore timestamps are
 * normalised to epoch millis when they cross the client boundary.
 */

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  onboarded: boolean;
  timezone: string;
  /** ISO country/region or free text used to tailor reminder defaults. */
  focus?: string[];
  createdAt: number;
  updatedAt: number;
}

/* ---- Shared domain enums ------------------------------------------------- */

export type Priority = "low" | "normal" | "high";

export type RepeatRule =
  | "none"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly";

/** Life-management category shared by reminders & payments for consistency. */
export type Category =
  | "insurance"
  | "documents"
  | "subscriptions"
  | "bills"
  | "licenses"
  | "vehicle"
  | "health"
  | "home"
  | "other";

/* ---- Reminders ----------------------------------------------------------- */

export interface Reminder {
  id: string;
  title: string;
  notes?: string;
  /** Epoch millis for the due moment (date + optional time). */
  dueAt: number;
  /** Whether a specific time-of-day was set (vs. all-day). */
  hasTime: boolean;
  repeat: RepeatRule;
  category: Category;
  priority: Priority;
  completed: boolean;
  completedAt?: number | null;
  createdAt: number;
  updatedAt: number;
}

/* ---- Tasks --------------------------------------------------------------- */

export interface Task {
  id: string;
  title: string;
  notes?: string;
  /** Optional due date (epoch millis, all-day). */
  dueAt?: number | null;
  priority: Priority;
  completed: boolean;
  completedAt?: number | null;
  order: number;
  createdAt: number;
  updatedAt: number;
}

/* ---- Documents ----------------------------------------------------------- */

export interface DocItem {
  id: string;
  name: string;
  category: Category;
  /** Cloudinary secure URL. */
  url: string;
  /** Cloudinary public_id, used for deletion. */
  publicId: string;
  format: string;
  bytes: number;
  /** Optional expiry the doc relates to (e.g. passport expiry). */
  expiresAt?: number | null;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

/* ---- Payments ------------------------------------------------------------ */

export type PaymentStatus = "upcoming" | "paid" | "overdue";

export interface Payment {
  id: string;
  name: string;
  /** Minor units are avoided — store a decimal amount + currency code. */
  amount: number;
  currency: string;
  dueAt: number;
  status: PaymentStatus;
  category: Category;
  repeat: RepeatRule;
  notes?: string;
  paidAt?: number | null;
  createdAt: number;
  updatedAt: number;
}

/* ---- Notifications ------------------------------------------------------- */

export type NotificationType =
  | "reminder"
  | "task"
  | "payment"
  | "document"
  | "account";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body?: string;
  /** Deep link within the app. */
  href?: string;
  read: boolean;
  /** Id of the source entity, for navigation/dedupe. */
  sourceId?: string;
  createdAt: number;
}

/* ---- Finance domain ------------------------------------------------------ */

export type TxType = "income" | "expense";

/** A user-defined category stored on their profile (see lib/finance). */
export interface CustomCategory {
  id: string;
  label: string;
  type: TxType;
}

export interface Transaction {
  id: string;
  type: TxType;
  amount: number; // positive magnitude
  currency: string;
  category: string; // category id (see lib/finance)
  note?: string;
  date: number; // epoch millis when it occurred
  createdAt: number;
  updatedAt: number;
}

export interface Budget {
  id: string;
  category: string; // expense category id
  amount: number; // monthly limit
  currency: string;
  createdAt: number;
  updatedAt: number;
}

export interface SavingsGoal {
  id: string;
  name: string;
  target: number;
  current: number;
  currency: string;
  targetDate?: number | null;
  createdAt: number;
  updatedAt: number;
}

export type InvestmentType = "stock" | "mutual_fund" | "etf" | "crypto" | "other";

export interface Investment {
  id: string;
  name: string;
  itype: InvestmentType;
  quantity: number;
  buyPrice: number; // per unit
  currentPrice: number; // per unit
  currency: string;
  createdAt: number;
  updatedAt: number;
}
