import type { CategoryKey } from "@/lib/reminders/categories";

export interface Reminder {
  id: string;
  title: string;
  category: CategoryKey;
  /** ISO date (yyyy-mm-dd) for the thing being remembered. */
  dueDate: string;
  notes?: string;
  notifyDaysBefore: number[];
  recurring?: "yearly" | "monthly" | null;
  completed: boolean;
  createdAt: number;
  updatedAt: number;
}

/** Fields provided when creating a reminder (the rest are filled in). */
export type NewReminder = Pick<
  Reminder,
  "title" | "category" | "dueDate" | "notes" | "notifyDaysBefore" | "recurring"
>;

export interface UserProfile {
  name?: string;
  language?: string;
  country?: string;
  timezone?: string;
  currency?: string;
  avatarUrl?: string;
  notificationsEnabled?: boolean;
  acceptedTermsAt?: number;
  onboardedAt?: number;
  createdAt?: number;
  updatedAt?: number;
}
