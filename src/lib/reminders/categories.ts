/**
 * Reminder categories — the intelligence behind "minimal typing, maximum
 * intelligence". Each category knows what it usually needs and a sensible
 * default reminder schedule, so the user rarely has to think.
 */
export type CategoryKey =
  | "passport"
  | "license"
  | "insurance"
  | "vehicle"
  | "warranty"
  | "subscription"
  | "medicine"
  | "bills"
  | "rent"
  | "emi"
  | "membership"
  | "appointment"
  | "birthday"
  | "custom";

export interface CategoryMeta {
  key: CategoryKey;
  label: string;
  /** lucide-react icon name (resolved in the UI icon map). */
  icon: string;
  /** What the date represents — guides the field label. */
  dateLabel: string;
  /** Smart default: notify this many days before the date. */
  defaultNotifyDaysBefore: number[];
  recurring?: "yearly" | "monthly";
}

export const CATEGORIES: CategoryMeta[] = [
  { key: "passport", label: "Passport", icon: "BookUser", dateLabel: "Expiry date", defaultNotifyDaysBefore: [90, 30, 7] },
  { key: "license", label: "Driving License", icon: "IdCard", dateLabel: "Expiry date", defaultNotifyDaysBefore: [60, 30, 7] },
  { key: "insurance", label: "Insurance", icon: "ShieldCheck", dateLabel: "Renewal date", defaultNotifyDaysBefore: [30, 15, 3, 1] },
  { key: "vehicle", label: "Vehicle Service", icon: "Car", dateLabel: "Service due", defaultNotifyDaysBefore: [14, 3, 1] },
  { key: "warranty", label: "Warranty", icon: "BadgeCheck", dateLabel: "Warranty ends", defaultNotifyDaysBefore: [30, 7] },
  { key: "subscription", label: "Subscription", icon: "Repeat", dateLabel: "Renews on", defaultNotifyDaysBefore: [7, 1], recurring: "monthly" },
  { key: "medicine", label: "Medicine", icon: "Pill", dateLabel: "Refill / dose date", defaultNotifyDaysBefore: [3, 1] },
  { key: "bills", label: "Bills", icon: "ReceiptText", dateLabel: "Due date", defaultNotifyDaysBefore: [7, 3, 1] },
  { key: "rent", label: "Rent", icon: "House", dateLabel: "Due date", defaultNotifyDaysBefore: [5, 2, 1], recurring: "monthly" },
  { key: "emi", label: "EMI / Loan", icon: "Landmark", dateLabel: "Due date", defaultNotifyDaysBefore: [5, 2, 1], recurring: "monthly" },
  { key: "membership", label: "Membership", icon: "Users", dateLabel: "Renewal date", defaultNotifyDaysBefore: [30, 7] },
  { key: "appointment", label: "Appointment", icon: "CalendarClock", dateLabel: "Appointment date", defaultNotifyDaysBefore: [3, 1] },
  { key: "birthday", label: "Birthday", icon: "Cake", dateLabel: "Date", defaultNotifyDaysBefore: [7, 1], recurring: "yearly" },
  { key: "custom", label: "Custom", icon: "Sparkles", dateLabel: "Date", defaultNotifyDaysBefore: [7, 1] },
];

export const CATEGORY_MAP: Record<CategoryKey, CategoryMeta> = CATEGORIES.reduce(
  (acc, c) => ((acc[c.key] = c), acc),
  {} as Record<CategoryKey, CategoryMeta>,
);
