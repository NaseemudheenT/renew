"use client";

import { useReducer, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { User as UserIcon, Palette, Bell, CreditCard, ShieldCheck, Sun, Moon, LogOut, Trash2, Check, Sparkles, Globe, Database, Download, Upload, Tags, X } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import { AnimatedButton, AnimatedModal } from "@/components/motion";
import { CreditCardForm, type CardValues } from "@/components/finance/CreditCardForm";
import { Avatar } from "@/components/shell/Avatar";
import { toast } from "@/components/ui/toast-store";
import { useAuth } from "@/components/providers/AuthProvider";
import { useTheme } from "@/hooks/useTheme";
import { useLocale } from "@/components/providers/LocaleProvider";
import { useUserCollection } from "@/hooks/useUserCollection";
import { toCSV, downloadFile, fileDateStamp } from "@/lib/export";
import { parseCSV, rowsToTransactions } from "@/lib/import";
import { importTransactions } from "@/lib/firestore/transactions";
import type { Transaction, Budget, SavingsGoal, Investment, Payment, Account, Transfer, Subscription } from "@/lib/types";
import { useUserProfile, DEFAULT_NOTIFICATION_PREFS, type NotificationPrefs } from "@/hooks/useUserProfile";
import { updateDisplayName, updateNotificationPrefs, updateLocalePrefs, removeCustomCategory } from "@/lib/firestore/profile";
import { useCategories } from "@/hooks/useCategories";
import { LANGUAGES, REGIONS, CURRENCY_CODES, REGION_CURRENCY, weekStartFor, hour12For, type WeekStart } from "@/lib/i18n/config";
import { signOutUser } from "@/lib/auth/client";
import { browserNotifyStatus, requestBrowserNotify, type NotifyStatus } from "@/lib/notify";
import { cn } from "@/lib/utils";

const noopSubscribe = () => () => {};

export function SettingsView() {
  const { user } = useAuth();
  const { t } = useLocale();
  const { profile, uid } = useUserProfile();
  const shellUser = { uid: user?.uid ?? "", email: user?.email ?? null, displayName: user?.displayName ?? null, photoURL: user?.photoURL ?? null };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <PageHeader title={t("settings.title")} subtitle={t("settings.subtitle")} />

      <Section icon={UserIcon} title="Profile">
        <div className="flex items-center gap-4">
          <Avatar user={shellUser} size={56} />
          <div className="min-w-0">
            <p className="text-strong truncate font-medium">{user?.displayName || "Your account"}</p>
            <p className="text-muted truncate text-sm">{user?.email}</p>
          </div>
        </div>
        {uid && <NameEditor uid={uid} initial={user?.displayName ?? ""} />}
      </Section>

      <Section icon={Palette} title="Appearance">
        <AppearanceControl />
      </Section>

      <Section icon={Globe} title={t("settings.region.title")}>
        {uid && <RegionLanguageControl uid={uid} />}
      </Section>

      <Section icon={Bell} title="Notifications">
        {uid && <NotificationPrefsControl uid={uid} prefs={{ ...DEFAULT_NOTIFICATION_PREFS, ...(profile?.notificationPrefs ?? {}) }} />}
        <BrowserNotifyControl />
      </Section>

      <Section icon={CreditCard} title="Billing">
        <BillingControl />
      </Section>

      <Section icon={Tags} title="Categories">
        {uid && <CategoriesControl uid={uid} />}
      </Section>

      <Section icon={Database} title="Data">
        {uid && <DataControl uid={uid} />}
      </Section>

      <Section icon={ShieldCheck} title="Security">
        <SecurityControl />
      </Section>
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: typeof UserIcon; title: string; children: React.ReactNode }) {
  return (
    <GlassCard padded>
      <div className="mb-4 flex items-center gap-2.5"><Icon className="size-5 text-[var(--color-gold-500)]" /><h2 className="text-strong text-base font-medium">{title}</h2></div>
      <div className="flex flex-col gap-4">{children}</div>
    </GlassCard>
  );
}

function NameEditor({ uid, initial }: { uid: string; initial: string }) {
  const router = useRouter();
  const [name, setName] = useState(initial);
  const [saving, setSaving] = useState(false);
  const dirty = name.trim() !== initial.trim() && name.trim().length > 0;
  async function save() {
    setSaving(true);
    try {
      await updateDisplayName(uid, name);
      toast({ title: "Profile updated", variant: "success" });
      router.refresh();
    } catch {
      toast({ title: "Couldn't save", variant: "error" });
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="flex items-end gap-3">
      <Input label="Display name" value={name} onChange={(e) => setName(e.target.value)} />
      <AnimatedButton onClick={save} loading={saving} disabled={!dirty}>Save</AnimatedButton>
    </div>
  );
}

function AppearanceControl() {
  const { theme, setTheme } = useTheme();
  return (
    <div>
      <p className="text-muted mb-3 text-sm">Light is a bright, futuristic daytime world; dark is the same world at night.</p>
      <div className="grid grid-cols-2 gap-3">
        {(["light", "dark"] as const).map((t) => (
          <button key={t} type="button" onClick={() => setTheme(t)} aria-pressed={theme === t}
            className={cn("flex items-center gap-3 rounded-2xl border p-3.5 text-start transition-all", theme === t ? "border-[var(--focus-ring)] bg-[var(--glass-bg-strong)]" : "border-[var(--field-border)] bg-[var(--field-bg)] hover:border-[var(--focus-ring)]/50")}>
            {t === "light" ? <Sun className="size-5 text-[var(--color-gold-500)]" /> : <Moon className="size-5 text-[var(--color-gold-500)]" />}
            <span className="text-body flex-1 text-sm font-medium capitalize">{t}</span>
            {theme === t && <Check className="size-4 text-[var(--color-gold-600)]" />}
          </button>
        ))}
      </div>
    </div>
  );
}

const PREF_ROWS: { key: keyof NotificationPrefs; label: string; desc: string }[] = [
  { key: "reminders", label: "Reminders", desc: "When a reminder is due or overdue" },
  { key: "tasks", label: "Tasks", desc: "When a task is due or overdue" },
  { key: "payments", label: "Bills", desc: "When a bill is due soon or overdue" },
  { key: "budgets", label: "Budgets", desc: "When you're close to or over a budget" },
  { key: "savings", label: "Savings", desc: "When a savings goal is reached" },
  { key: "documents", label: "Documents", desc: "When a document is expiring" },
];

function NotificationPrefsControl({ uid, prefs }: { uid: string; prefs: NotificationPrefs }) {
  async function toggle(key: keyof NotificationPrefs, value: boolean) {
    try {
      await updateNotificationPrefs(uid, { ...prefs, [key]: value });
    } catch {
      toast({ title: "Couldn't update", variant: "error" });
    }
  }
  return (
    <div className="flex flex-col divide-y divide-[var(--glass-border)]">
      {PREF_ROWS.map((row) => (
        <div key={row.key} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
          <div><p className="text-body text-sm font-medium">{row.label}</p><p className="text-muted text-xs">{row.desc}</p></div>
          <Switch label={row.label} checked={prefs[row.key]} onChange={(v) => toggle(row.key, v)} />
        </div>
      ))}
    </div>
  );
}

const COMMON_TIMEZONES = [
  "UTC", "America/New_York", "America/Chicago", "America/Denver",
  "America/Los_Angeles", "America/Sao_Paulo", "America/Mexico_City",
  "Europe/London", "Europe/Paris", "Europe/Berlin", "Europe/Madrid",
  "Europe/Moscow", "Africa/Cairo", "Africa/Lagos", "Africa/Johannesburg",
  "Asia/Dubai", "Asia/Karachi", "Asia/Kolkata", "Asia/Dhaka", "Asia/Bangkok",
  "Asia/Singapore", "Asia/Shanghai", "Asia/Tokyo", "Asia/Seoul",
  "Australia/Sydney", "Pacific/Auckland",
];

function RegionLanguageControl({ uid }: { uid: string }) {
  const { prefs, t } = useLocale();
  const [language, setLanguage] = useState(prefs.language);
  const [region, setRegion] = useState(prefs.region);
  const [currency, setCurrency] = useState(prefs.currency);
  const [timezone, setTimezone] = useState(prefs.timezone);
  const [weekStart, setWeekStart] = useState<WeekStart>(prefs.weekStart);
  const [saving, setSaving] = useState(false);

  // Re-sync the form when the resolved prefs change (e.g. the saved profile
  // arrives after a cold load) so we never persist stale, browser-detected
  // values over the user's real saved preferences. This is React's
  // "adjust state during render" pattern — not a setState-in-effect.
  const prefsSig = `${prefs.language}|${prefs.region}|${prefs.currency}|${prefs.timezone}|${prefs.weekStart}`;
  const [seed, setSeed] = useState(prefsSig);
  if (seed !== prefsSig) {
    setSeed(prefsSig);
    setLanguage(prefs.language);
    setRegion(prefs.region);
    setCurrency(prefs.currency);
    setTimezone(prefs.timezone);
    setWeekStart(prefs.weekStart);
  }

  // When the region changes, follow its conventional currency + week start
  // (the user can still override currency below).
  function onRegionChange(next: string) {
    setRegion(next);
    setCurrency(REGION_CURRENCY[next] ?? currency);
    setWeekStart(weekStartFor(next));
  }

  const tzOptions = Array.from(new Set([prefs.timezone, ...COMMON_TIMEZONES]))
    .filter(Boolean)
    .map((z) => ({ value: z, label: z.replace(/_/g, " ") }));

  async function save() {
    setSaving(true);
    try {
      await updateLocalePrefs(uid, {
        locale: language,
        region,
        currency,
        timezone,
        weekStart,
        hour12: hour12For(region),
      });
      toast({ title: t("settings.region.saved"), variant: "success" });
    } catch {
      toast({ title: "Couldn't save preferences", variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label={t("settings.region.language")}
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          options={LANGUAGES.map((l) => ({ value: l.code, label: `${l.native} · ${l.label}` }))}
        />
        <Select
          label={t("settings.region.region")}
          value={region}
          onChange={(e) => onRegionChange(e.target.value)}
          options={REGIONS.map((r) => ({ value: r.code, label: r.label }))}
        />
        <Select
          label={t("settings.region.currency")}
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          options={CURRENCY_CODES.map((c) => ({ value: c, label: c }))}
        />
        <Select
          label={t("settings.region.timezone")}
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          options={tzOptions}
        />
        <Select
          label={t("settings.region.weekStart")}
          value={String(weekStart)}
          onChange={(e) => setWeekStart(Number(e.target.value) === 1 ? 1 : 0)}
          options={[
            { value: "0", label: t("settings.region.weekStart.sunday") },
            { value: "1", label: t("settings.region.weekStart.monday") },
          ]}
        />
      </div>
      <p className="text-muted text-xs">{t("settings.region.hint")}</p>
      <div className="flex justify-end">
        <AnimatedButton onClick={save} loading={saving}>
          <Check className="size-4" />
          {t("common.save")}
        </AnimatedButton>
      </div>
    </div>
  );
}

function BillingControl() {
  const [methodOpen, setMethodOpen] = useState(false);

  function handleSaveCard(_values: CardValues) {
    // Provider boundary: raw card details are NEVER stored by Renew. When a live
    // Stripe publishable key + checkout are configured, this hands the values to
    // Stripe Elements to tokenize. Until then, we do not persist anything.
    setMethodOpen(false);
    toast({
      title: "Payment provider not connected yet",
      description: "Card details are never stored by Renew. Paid plans arrive with secure Stripe checkout.",
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] p-4">
        <div className="flex items-center gap-3">
          <span className="glass grid size-10 place-items-center !rounded-2xl"><Sparkles className="size-5 text-[var(--color-gold-500)]" /></span>
          <div><p className="text-strong text-sm font-medium">Free plan</p><p className="text-muted text-xs">All of Renew, at no cost during this phase.</p></div>
        </div>
        <span className="rounded-full bg-[var(--glass-bg-strong)] px-3 py-1 text-xs font-medium text-[var(--text-strong)]">Current</span>
      </div>
      <p className="text-muted text-xs">You&apos;re all set — there&apos;s nothing to pay. Paid plans will appear here when they launch; you&apos;ll never be charged without opting in.</p>
      <AnimatedButton variant="glass" onClick={() => setMethodOpen(true)}>
        <CreditCard className="size-4" />
        Add payment method
      </AnimatedButton>
      <AnimatedModal
        open={methodOpen}
        onClose={() => setMethodOpen(false)}
        title="Payment method"
        description="Saved securely with our payment provider. Renew never stores your card number or CVC."
      >
        <CreditCardForm onSubmit={handleSaveCard} />
      </AnimatedModal>
    </div>
  );
}

function CategoriesControl({ uid }: { uid: string }) {
  const { custom } = useCategories();

  async function remove(cat: (typeof custom)[number]) {
    try {
      await removeCustomCategory(uid, cat);
      toast({ title: "Category removed", variant: "success" });
    } catch {
      toast({ title: "Couldn't remove category", variant: "error" });
    }
  }

  if (custom.length === 0) {
    return (
      <p className="text-muted text-xs">
        You haven&apos;t added any custom categories yet. Create one from the
        &ldquo;New category&rdquo; option when adding a transaction.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {custom.map((c) => (
        <span
          key={c.id}
          className="glass inline-flex items-center gap-2 !rounded-full py-1.5 ps-3.5 pe-2 text-sm text-[var(--text-strong)]"
        >
          <span className={cn("size-1.5 rounded-full", c.type === "income" ? "bg-emerald-400" : "bg-rose-400")} />
          {c.label}
          <button
            type="button"
            onClick={() => remove(c)}
            aria-label={`Remove ${c.label}`}
            className="grid size-5 place-items-center rounded-full text-[var(--text-muted)] transition-colors hover:bg-[var(--glass-bg-strong)] hover:text-[var(--text-strong)]"
          >
            <X className="size-3.5" />
          </button>
        </span>
      ))}
    </div>
  );
}

function BrowserNotifyControl() {
  const { t } = useLocale();
  const status = useSyncExternalStore<NotifyStatus>(noopSubscribe, browserNotifyStatus, () => "unsupported");
  const [, force] = useReducer((x: number) => x + 1, 0);

  async function enable() {
    await requestBrowserNotify();
    force();
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] p-3.5">
      <div className="min-w-0">
        <p className="text-body text-sm font-medium">{t("settings.notify.browser")}</p>
        <p className="text-muted text-xs">
          {status === "denied" ? t("settings.notify.browser.blocked")
            : status === "unsupported" ? t("settings.notify.browser.unsupported")
            : t("settings.notify.browser.hint")}
        </p>
      </div>
      {status === "granted" ? (
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-500"><Check className="size-4" />{t("settings.notify.browser.on")}</span>
      ) : status === "default" ? (
        <AnimatedButton size="sm" variant="glass" onClick={enable}>{t("settings.notify.browser.enable")}</AnimatedButton>
      ) : null}
    </div>
  );
}

function DataControl({ uid }: { uid: string }) {
  const { t, prefs } = useLocale();
  const transactions = useUserCollection<Transaction>("transactions");
  const budgets = useUserCollection<Budget>("budgets");
  const savings = useUserCollection<SavingsGoal>("savings");
  const investments = useUserCollection<Investment>("investments");
  const payments = useUserCollection<Payment>("payments");
  const accounts = useUserCollection<Account>("accounts");
  const transfers = useUserCollection<Transfer>("transfers");
  const subscriptions = useUserCollection<Subscription>("subscriptions");

  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<ReturnType<typeof rowsToTransactions> | null>(null);
  const [importing, setImporting] = useState(false);

  const total =
    transactions.data.length + budgets.data.length + savings.data.length +
    investments.data.length + payments.data.length +
    accounts.data.length + transfers.data.length + subscriptions.data.length;

  function exportJson() {
    if (total === 0) return toast({ title: t("settings.data.empty") });
    const payload = {
      app: "Renew",
      exportedAt: new Date().toISOString(),
      accounts: accounts.data,
      transactions: transactions.data,
      transfers: transfers.data,
      budgets: budgets.data,
      savings: savings.data,
      investments: investments.data,
      payments: payments.data,
      subscriptions: subscriptions.data,
    };
    downloadFile(`renew-export-${fileDateStamp()}.json`, JSON.stringify(payload, null, 2), "application/json");
    toast({ title: t("settings.data.exported"), variant: "success" });
  }

  function exportCsv() {
    if (transactions.data.length === 0) return toast({ title: t("settings.data.empty") });
    const csv = toCSV(transactions.data as unknown as Record<string, unknown>[]);
    downloadFile(`renew-transactions-${fileDateStamp()}.csv`, csv, "text/csv");
    toast({ title: t("settings.data.exported"), variant: "success" });
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    try {
      const text = await file.text();
      const result = rowsToTransactions(parseCSV(text), transactions.data, prefs.currency);
      if (result.valid.length === 0) {
        toast({ title: t("settings.data.import.none") });
        return;
      }
      setPreview(result);
    } catch {
      toast({ title: t("settings.data.import.failed"), variant: "error" });
    }
  }

  async function confirmImport() {
    if (!preview) return;
    setImporting(true);
    try {
      const count = await importTransactions(uid, preview.valid);
      toast({ title: t("settings.data.import.done", { count }), variant: "success" });
      setPreview(null);
    } catch {
      toast({ title: t("settings.data.import.failed"), variant: "error" });
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted text-xs">{t("settings.data.hint")}</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <AnimatedButton variant="glass" fullWidth onClick={exportJson}>
          <Download className="size-4" />
          {t("settings.data.exportJson")}
        </AnimatedButton>
        <AnimatedButton variant="glass" fullWidth onClick={exportCsv}>
          <Download className="size-4" />
          {t("settings.data.exportCsv")}
        </AnimatedButton>
      </div>
      <AnimatedButton variant="glass" fullWidth onClick={() => fileRef.current?.click()}>
        <Upload className="size-4" />
        {t("settings.data.import")}
      </AnimatedButton>
      <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={onFile} />

      <AnimatedModal
        open={preview !== null}
        onClose={() => setPreview(null)}
        title={t("settings.data.import.title")}
        description={preview ? t("settings.data.import.summary", { valid: preview.valid.length, duplicates: preview.duplicates, invalid: preview.invalid }) : undefined}
      >
        <div className="flex items-center justify-end gap-3">
          <AnimatedButton variant="ghost" onClick={() => setPreview(null)} disabled={importing}>
            {t("common.cancel")}
          </AnimatedButton>
          <AnimatedButton onClick={confirmImport} loading={importing}>
            <Upload className="size-4" />
            {preview ? t("settings.data.import.confirm", { valid: preview.valid.length }) : t("common.add")}
          </AnimatedButton>
        </div>
      </AnimatedModal>
    </div>
  );
}

function SecurityControl() {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  async function onSignOut() {
    await signOutUser();
    router.replace("/sign-in");
  }
  async function onDelete() {
    setDeleting(true);
    try {
      const res = await fetch("/api/account/delete", { method: "POST" });
      if (!res.ok) throw new Error();
      await signOutUser().catch(() => {});
      router.replace("/sign-up");
    } catch {
      toast({ title: "Couldn't delete account", variant: "error" });
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <button type="button" onClick={onSignOut} className="flex items-center gap-3 rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] p-3.5 text-start transition-colors hover:border-[var(--focus-ring)]/50">
        <LogOut className="size-5 text-[var(--color-gold-500)]" />
        <div className="flex-1"><p className="text-body text-sm font-medium">Sign out</p><p className="text-muted text-xs">End your session on this device.</p></div>
      </button>
      <button type="button" onClick={() => setConfirmOpen(true)} className="flex items-center gap-3 rounded-2xl border border-rose-400/40 bg-rose-500/5 p-3.5 text-start transition-colors hover:bg-rose-500/10">
        <Trash2 className="size-5 text-rose-500" />
        <div className="flex-1"><p className="text-sm font-medium text-rose-600 dark:text-rose-300">Delete account</p><p className="text-muted text-xs">Permanently remove your account and all data.</p></div>
      </button>
      <AnimatedModal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Delete your account?" description="This permanently deletes your reminders, tasks, documents, payments and profile. This cannot be undone.">
        <div className="flex flex-col gap-4">
          <Input label='Type "DELETE" to confirm' value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="DELETE" />
          <div className="flex items-center justify-end gap-3">
            <AnimatedButton variant="ghost" onClick={() => setConfirmOpen(false)} disabled={deleting}>Cancel</AnimatedButton>
            <AnimatedButton variant="danger" onClick={onDelete} loading={deleting} disabled={confirmText.trim().toUpperCase() !== "DELETE"}><Trash2 className="size-4" />Delete forever</AnimatedButton>
          </div>
        </div>
      </AnimatedModal>
    </div>
  );
}
