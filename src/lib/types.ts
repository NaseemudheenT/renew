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

/** Renew runs as two separate workspaces the person switches between. */
export type WorkspaceMode = "personal" | "business";

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

/** How a bill/payment is settled — a tracking label, Renew never moves money. */
export type PaymentMethod =
  | "cash" | "bank" | "card" | "upi" | "netbanking" | "wallet"
  | "cheque" | "autopay" | "other";

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
  /** How it's paid (tracking only). */
  method?: PaymentMethod;
  /** Remind this many days before it's due (0 = on the day). */
  remindDaysBefore?: number;
  paidAt?: number | null;
  createdAt: number;
  updatedAt: number;
}

/* ---- Business / Freelancer: Invoices & Clients --------------------------- */

/** An invoice is either still owed or settled. "Overdue" is derived at read
 *  time (unpaid + past its due date), never a stored state that can go stale. */
export type InvoiceStatus = "unpaid" | "paid";

export interface Invoice {
  id: string;
  /** Human invoice number/reference, e.g. "INV-014". */
  number: string;
  /** Client/company the invoice is billed to (display name). */
  client: string;
  /** Optional link to a saved Client record (client tagging, next piece). */
  clientId?: string;
  amount: number;
  currency: string;
  /** Date the invoice was issued (epoch millis). */
  issuedAt: number;
  /** Date payment is due (epoch millis). */
  dueAt: number;
  status: InvoiceStatus;
  /** When it was marked paid (epoch millis), if ever. */
  paidAt?: number | null;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

/** A saved client/project to tag invoices and expenses against. */
export interface Client {
  id: string;
  name: string;
  email?: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

/* ---- Notifications ------------------------------------------------------- */

export type NotificationType =
  | "reminder"
  | "task"
  | "payment"
  | "document"
  | "account"
  | "budget"
  | "savings"
  | "subscription";

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
  subcategory?: string; // optional finer label (see subcategoriesFor)
  note?: string;
  date: number; // epoch millis when it occurred
  /** Optional account this transaction belongs to. */
  accountId?: string;
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

/* ---- Accounts ------------------------------------------------------------ */

export type AccountType =
  | "cash"
  | "bank"
  | "savings"
  | "credit"
  | "investment"
  | "other";

export type AccountStatus = "active" | "archived";

export interface Account {
  id: string;
  name: string;
  atype: AccountType;
  /** Optional institution/provider name. */
  institution?: string;
  currency: string;
  /** Starting balance; the current balance is derived (opening + tx + transfers). */
  openingBalance: number;
  status: AccountStatus;
  createdAt: number;
  updatedAt: number;
}

/* ---- Transfers ----------------------------------------------------------- */

/** Money moved between two of the user's own accounts. Never income/expense. */
export interface Transfer {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  /** Both accounts must share this currency (no exchange-rate invention). */
  currency: string;
  date: number;
  note?: string;
  createdAt: number;
  updatedAt: number;
}

/* ---- Subscriptions ------------------------------------------------------- */

export type BillingCycle = "weekly" | "monthly" | "quarterly" | "yearly";
export type SubscriptionStatus = "active" | "cancelled";

export interface Subscription {
  id: string;
  name: string;
  price: number;
  currency: string;
  cycle: BillingCycle;
  /** Epoch millis of the next renewal. */
  nextBillingAt: number;
  category: string;
  /** Optional account the subscription is billed to. */
  accountId?: string;
  status: SubscriptionStatus;
  notes?: string;
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
