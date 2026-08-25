"use client";

import { useReducer, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User as UserIcon, Palette, Bell, CreditCard, ShieldCheck, Sun, Moon, LogOut, Trash2, Check, Sparkles, Globe, Database, Download, Upload, Briefcase, ChevronRight, Lock, Accessibility, MonitorSmartphone } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { CountrySelect } from "@/components/ui/CountrySelect";
import { LanguageSelect } from "@/components/ui/LanguageSelect";
import { CurrencySelect } from "@/components/ui/CurrencySelect";
import { Switch } from "@/components/ui/Switch";
import { AnimatedButton, AnimatedModal } from "@/components/motion";
import { CreditCardForm, type CardValues } from "@/components/finance/CreditCardForm";
import { Avatar } from "@/components/shell/Avatar";
import { toast } from "@/components/ui/toast-store";
import { useAuth } from "@/components/providers/AuthProvider";
import { useTheme } from "@/hooks/useTheme";
import { useLocale } from "@/components/providers/LocaleProvider";
import { useUserCollection } from "@/hooks/useUserCollection";
import { downloadFile, fileDateStamp } from "@/lib/export";
import type { Transaction, Budget, SavingsGoal, Investment, Payment, Account, Transfer, Subscription } from "@/lib/types";
import { useUserProfile, DEFAULT_NOTIFICATION_PREFS, type NotificationPrefs } from "@/hooks/useUserProfile";
import { updateNotificationPrefs, updateLocalePrefs } from "@/lib/firestore/profile";
import { AccountTypeControl } from "@/components/settings/AccountTypeControl";
import { AppLockControl } from "@/components/settings/AppLockControl";
import { AccessibilityControl } from "@/components/settings/AccessibilityControl";
import { DeviceLinkControl } from "@/components/settings/DeviceLinkControl";
import { useReauth } from "@/components/security/ReauthProvider";
import { REGION_CURRENCY, weekStartFor, hour12For, type WeekStart } from "@/lib/i18n/config";
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

      {/* Profile + avatar live on their own Account page (kept out of this list). */}
      <Link href="/account" className="glass flex items-center gap-4 p-4 transition-colors hover:bg-[var(--glass-bg-soft)]">
        <Avatar user={shellUser} size={52} />
        <div className="min-w-0 flex-1">
          <p className="text-strong truncate font-medium">{user?.displayName || "Your account"}</p>
          <p className="text-muted truncate text-sm">Profile, avatar &amp; account</p>
        </div>
        <ChevronRight className="size-5 shrink-0 text-[var(--text-muted)]" />
      </Link>

      <Section icon={Briefcase} title="How you use Renew">
        {uid && <AccountTypeControl uid={uid} current={profile?.accountType ?? "personal"} />}
      </Section>

      <Section id="appearance" icon={Palette} title="Appearance">
        <AppearanceControl />
      </Section>

      <Section id="region" icon={Globe} title={t("settings.region.title")}>
        {uid && <RegionLanguageControl uid={uid} />}
      </Section>

      <Section id="notifications" icon={Bell} title="Notifications">
        {uid && <NotificationPrefsControl uid={uid} prefs={{ ...DEFAULT_NOTIFICATION_PREFS, ...(profile?.notificationPrefs ?? {}) }} />}
        <BrowserNotifyControl />
      </Section>

      <Section id="billing" icon={CreditCard} title="Billing">
        <BillingControl />
      </Section>

      <Section id="data" icon={Database} title="Data">
        <DataControl />
      </Section>

      <Section id="accessibility" icon={Accessibility} title="Accessibility">
        <AccessibilityControl />
      </Section>

      <Section id="devices" icon={MonitorSmartphone} title="Linked devices">
        <DeviceLinkControl />
      </Section>

      <Section id="applock" icon={Lock} title="App lock">
        <AppLockControl />
      </Section>

      <Section icon={ShieldCheck} title="Security">
        <SecurityControl />
      </Section>

      <footer className="flex items-center justify-center gap-4 pt-2 text-xs text-[var(--text-muted)]">
        <Link href="/privacy" className="hover:text-[var(--text-strong)]">Privacy</Link>
        <span aria-hidden="true">·</span>
        <Link href="/terms" className="hover:text-[var(--text-strong)]">Terms</Link>
      </footer>
    </div>
  );
}

function Section({ id, icon: Icon, title, children }: { id?: string; icon: typeof UserIcon; title: string; children: React.ReactNode }) {
  return (
    // scroll-mt keeps the section clear of the sticky top bar when deep-linked.
    <GlassCard padded id={id} className="scroll-mt-24">
      <div className="mb-4 flex items-center gap-2.5"><Icon className="size-5 text-[var(--color-gold-500)]" /><h2 className="text-strong text-base font-medium">{title}</h2></div>
      <div className="flex flex-col gap-4">{children}</div>
    </GlassCard>
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
  { key: "payments", label: "Bills", desc: "When a bill is due soon or overdue" },
  { key: "budgets", label: "Budgets", desc: "When you're close to or over a budget" },
  { key: "savings", label: "Savings", desc: "When a savings goal is reached" },
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
        <LanguageSelect
          label={t("settings.region.language")}
          value={language}
          onChange={setLanguage}
          locale={language}
        />
        <CountrySelect
          label={t("settings.region.region")}
          value={region}
          onChange={onRegionChange}
          locale={language}
        />
        <CurrencySelect
          label={t("settings.region.currency")}
          value={currency}
          onChange={setCurrency}
          locale={language}
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

function DataControl() {
  const { t } = useLocale();
  const router = useRouter();
  const requireReauth = useReauth();
  const transactions = useUserCollection<Transaction>("transactions");
  const budgets = useUserCollection<Budget>("budgets");
  const savings = useUserCollection<SavingsGoal>("savings");
  const investments = useUserCollection<Investment>("investments");
  const payments = useUserCollection<Payment>("payments");
  const accounts = useUserCollection<Account>("accounts");
  const transfers = useUserCollection<Transfer>("transfers");
  const subscriptions = useUserCollection<Subscription>("subscriptions");

  const total =
    transactions.data.length + budgets.data.length + savings.data.length +
    investments.data.length + payments.data.length +
    accounts.data.length + transfers.data.length + subscriptions.data.length;

  async function exportData() {
    if (total === 0) return toast({ title: t("settings.data.empty") });
    if (!(await requireReauth("to download your data"))) return;
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
    downloadFile(`renew-${fileDateStamp()}.json`, JSON.stringify(payload, null, 2), "application/json");
    toast({ title: t("settings.data.exported"), variant: "success" });
  }

  const stored = [
    { n: accounts.data.length, label: "accounts" },
    { n: transactions.data.length, label: "transactions" },
    { n: payments.data.length, label: "bills" },
    { n: subscriptions.data.length, label: "subscriptions" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted text-xs">Your money data is private, encrypted and always yours.</p>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {stored.map((s) => (
          <div key={s.label} className="rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-3 py-2.5 text-center">
            <p className="text-strong text-lg font-semibold tabular-nums">{s.n}</p>
            <p className="text-muted text-[0.7rem] capitalize">{s.label}</p>
          </div>
        ))}
      </div>

      <DataAction icon={Upload} title="Import a statement" desc="Add transactions from a CSV or PDF bank statement" onClick={() => router.push("/import")} />
      <DataAction icon={Download} title="Download my data" desc="Save your own private copy of everything in Renew" onClick={exportData} />
    </div>
  );
}

function DataAction({ icon: Icon, title, desc, onClick }: { icon: typeof Download; title: string; desc: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="group flex items-center gap-3 rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-3.5 py-3 text-left transition-colors hover:border-[var(--focus-ring)]/60">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[var(--glass-bg-strong)]"><Icon className="size-4.5 text-[var(--color-gold-500)]" /></span>
      <span className="min-w-0 flex-1">
        <span className="text-strong block text-sm font-medium">{title}</span>
        <span className="text-muted block truncate text-xs">{desc}</span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-[var(--text-muted)] transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}

function SecurityControl() {
  const router = useRouter();
  const requireReauth = useReauth();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  async function onSignOut() {
    await signOutUser();
    router.replace("/sign-in");
  }
  async function onDelete() {
    // Deleting everything is irreversible — re-verify the person first.
    if (!(await requireReauth("to delete your account"))) return;
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
      <AnimatedModal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Delete your account?" description="This permanently deletes your accounts, transactions, budgets, payments and profile. This cannot be undone.">
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
