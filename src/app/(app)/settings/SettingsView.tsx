"use client";

import { useEffect, useReducer, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Palette, Bell, CreditCard, ShieldCheck, Sun, Moon, LogOut, Trash2, Check, Sparkles, Globe, Database, Download, Upload, Briefcase, ChevronRight, ChevronLeft, Accessibility, Crown, Lock, MessageSquareText } from "lucide-react";
import { isOwnerEmail } from "@/lib/auth/owner";
import { GlassCard } from "@/components/ui/GlassCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { CountrySelect } from "@/components/ui/CountrySelect";
import { LanguageSelect } from "@/components/ui/LanguageSelect";
import { CurrencySelect } from "@/components/ui/CurrencySelect";
import { Switch } from "@/components/ui/Switch";
import { AnimatedButton, AnimatedModal } from "@/components/motion";
import { PlanControl } from "@/components/settings/PlanControl";
import { Avatar } from "@/components/shell/Avatar";
import { toast } from "@/components/ui/toast-store";
import { useAuth } from "@/components/providers/AuthProvider";
import { useTheme } from "@/hooks/useTheme";
import { useLocale } from "@/components/providers/LocaleProvider";
import { useUserCollection } from "@/hooks/useUserCollection";
import { downloadFile, fileDateStamp } from "@/lib/export";
import type { Transaction, Budget, SavingsGoal, Investment, Payment, Account, Transfer, Subscription, Reminder } from "@/lib/types";
import { useUserProfile, DEFAULT_NOTIFICATION_PREFS, type NotificationPrefs } from "@/hooks/useUserProfile";
import { updateNotificationPrefs, updateLocalePrefs, updateDataRetention, updateRenPrefs, setSecurity, clearSecurity, setBiometricEnabled } from "@/lib/firestore/profile";
import { makePasscodeRecord, isValidPasscode } from "@/lib/security/passcode";
import { isPasskeySupported } from "@/lib/auth/passkey-client";
import { speechOutputSupported } from "@/lib/voice";
import { RETENTION_OPTIONS } from "@/lib/retention";
import { APP_UPDATE_NAME } from "@/lib/setup-version";
import { RenewMark } from "@/components/brand/RenewMark";
import { RenLogo } from "@/components/brand/RenLogo";
import { RenChat } from "@/components/finance/RenChat";
import { useRenContext } from "@/hooks/useRenContext";
import { AccountTypeControl } from "@/components/settings/AccountTypeControl";
import { AccessibilityControl } from "@/components/settings/AccessibilityControl";
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
  const [active, setActive] = useState<string | null>(null);

  // Each category is a row you tap into (Apple-style), never everything at once.
  // `tone` gives each a distinct coloured icon tile, like iOS Settings.
  const categories = [
    { id: "account", icon: Briefcase, tone: "#5b6cff", title: "How you use Renew", sub: "Personal or business", render: () => (uid ? <AccountTypeControl uid={uid} current={profile?.accountType ?? "personal"} /> : null) },
    { id: "ren", icon: Sparkles, tone: "#a15cff", title: "Ren", sub: "Your assistant — voice & spoken replies", render: () => (uid ? <RenControl uid={uid} /> : null) },
    { id: "appearance", icon: Palette, tone: "#f5a623", title: "Appearance", sub: "Light or dark theme", render: () => <AppearanceControl /> },
    { id: "region", icon: Globe, tone: "#14b8a6", title: t("settings.region.title"), sub: "Language, region & currency", render: () => (uid ? <RegionLanguageControl uid={uid} /> : null) },
    { id: "notifications", icon: Bell, tone: "#ff5e8a", title: "Notifications", sub: "Reminders and nudges", render: () => <>{uid && <NotificationPrefsControl uid={uid} prefs={{ ...DEFAULT_NOTIFICATION_PREFS, ...(profile?.notificationPrefs ?? {}) }} />}<BrowserNotifyControl /></> },
    { id: "billing", icon: CreditCard, tone: "#d4a24a", title: "Plan & billing", sub: "Free & Premium", render: () => <PlanControl /> },
    { id: "data", icon: Database, tone: "#4a7bff", title: "Data", sub: "Import, export & delete", render: () => <DataControl /> },
    { id: "accessibility", icon: Accessibility, tone: "#34c759", title: "Accessibility", sub: "Text, contrast, motion & more", render: () => <AccessibilityControl /> },
    { id: "security", icon: ShieldCheck, tone: "#8a8f98", title: "Security", sub: "Sign out & delete account", render: () => <SecurityControl /> },
    { id: "software", icon: Download, tone: "#0aa3ff", title: "Software update", sub: `Renew · ${APP_UPDATE_NAME}`, render: () => <SoftwareUpdateControl /> },
  ] as const;

  // Grouped like a phone's Settings — related rows sit together under a heading.
  const sections: { title: string; ids: string[] }[] = [
    { title: "You", ids: ["account", "ren"] },
    { title: "Preferences", ids: ["appearance", "region", "notifications", "accessibility"] },
    { title: "Money", ids: ["billing", "data"] },
    { title: "Privacy & security", ids: ["security"] },
    { title: "About", ids: ["software"] },
  ];

  // Deep links like /settings#billing open that category directly.
  useEffect(() => {
    const h = typeof window !== "undefined" ? window.location.hash.replace("#", "") : "";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (h && categories.some((c) => c.id === h)) setActive(h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const current = categories.find((c) => c.id === active);

  if (current) {
    const Icon = current.icon;
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <button type="button" onClick={() => setActive(null)} className="text-muted -ms-1 flex w-fit items-center gap-1 text-sm font-medium transition-colors hover:text-[var(--text-strong)]">
          <ChevronLeft className="size-4" />{t("settings.title")}
        </button>
        <div className="flex items-center gap-2.5 px-1">
          {current.id === "ren"
            ? <RenLogo size={32} idSuffix="sethdr" />
            : <span className="grid size-8 shrink-0 place-items-center rounded-[0.65rem] shadow-sm" style={{ background: current.tone }}><Icon className="size-4.5 text-white" /></span>}
          <h1 className="text-strong text-xl font-medium">{current.title}</h1>
        </div>
        <GlassCard padded>
          <div className="flex flex-col gap-4">{current.render()}</div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <PageHeader title={t("settings.title")} subtitle={t("settings.subtitle")} />

      {/* Profile + avatar live on their own Account page. */}
      <Link href="/account" className="glass flex items-center gap-4 p-4 transition-colors hover:bg-[var(--glass-bg-soft)]">
        <Avatar user={shellUser} size={52} />
        <div className="min-w-0 flex-1">
          <p className="text-strong truncate font-medium">{user?.displayName || "Your account"}</p>
          <p className="text-muted truncate text-sm">Profile, avatar &amp; account</p>
        </div>
        <ChevronRight className="size-5 shrink-0 text-[var(--text-muted)]" />
      </Link>

      {/* Owner console — only ever rendered for the single owner account. */}
      {isOwnerEmail(user?.email) && (
        <Link href="/owner" className="glass flex items-center gap-4 border border-[var(--color-gold-500)]/25 p-4 transition-colors hover:bg-[var(--glass-bg-soft)]">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[var(--color-gold-500)]/15"><Crown className="size-4.5 text-[var(--color-gold-500)]" /></span>
          <span className="min-w-0 flex-1">
            <span className="text-strong block text-sm font-medium">Owner console</span>
            <span className="text-muted block truncate text-xs">Users, sign-ins &amp; security — just for you</span>
          </span>
          <ChevronRight className="size-5 shrink-0 text-[var(--text-muted)]" />
        </Link>
      )}

      {/* Grouped, phone-Settings style — related rows under a quiet heading. */}
      {sections.map((sec) => (
        <section key={sec.title}>
          <h2 className="text-muted mb-2 px-1 text-xs font-medium uppercase tracking-wide">{sec.title}</h2>
          <div className="glass flex flex-col divide-y divide-[var(--glass-border)] overflow-hidden !p-0">
            {sec.ids.map((id, i) => {
              const c = categories.find((x) => x.id === id);
              if (!c) return null;
              const Icon = c.icon;
              return (
                <button key={c.id} type="button" onClick={() => setActive(c.id)} className="group flex items-center gap-4 p-4 text-left transition-colors hover:bg-[var(--glass-bg-soft)] active:bg-[var(--glass-bg-strong)]">
                  {c.id === "ren"
                    ? <RenLogo size={36} idSuffix="setrow" className="shrink-0" />
                    : <span className="tile-sheen grid size-9 shrink-0 place-items-center rounded-[0.7rem] shadow-sm transition-transform duration-300 group-hover:scale-[1.06] group-active:scale-95" style={{ background: c.tone, ["--sheen-delay" as string]: `${i * 0.5}s` }}><Icon className="size-4.5 text-white" /></span>}
                  <span className="min-w-0 flex-1">
                    <span className="text-strong block text-sm font-medium">{c.title}</span>
                    <span className="text-muted block truncate text-xs">{c.sub}</span>
                  </span>
                  <ChevronRight className="size-5 shrink-0 text-[var(--text-muted)]" />
                </button>
              );
            })}
          </div>
        </section>
      ))}

      <footer className="flex items-center justify-center gap-4 pt-2 text-xs text-[var(--text-muted)]">
        <Link href="/privacy" className="hover:text-[var(--text-strong)]">Privacy</Link>
        <span aria-hidden="true">·</span>
        <Link href="/terms" className="hover:text-[var(--text-strong)]">Terms</Link>
      </footer>
    </div>
  );
}

function SoftwareUpdateControl() {
  const [checking, setChecking] = useState(false);
  const [storage, setStorage] = useState<string | null>(null);
  const whatsNew = [
    "Renew Financial OS — the launch build (fOS)",
    "Sharper receipt scanning: reads the amount, merchant and date, and asks when it's unsure",
    "One clean Add button per screen — no more duplicates",
    "Smoother swiping — swiping an item no longer flips the whole page",
    "Renew updates itself automatically — you never have to reinstall",
  ];
  // Real on-device footprint (not a made-up number) via the Storage API.
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.storage?.estimate) return;
    navigator.storage.estimate().then((est) => {
      const mb = (est.usage ?? 0) / (1024 * 1024);
      setStorage(mb < 0.1 ? "under 0.1 MB" : `${mb.toFixed(1)} MB`);
    }).catch(() => {});
  }, []);
  async function check() {
    setChecking(true);
    try {
      const reg = typeof navigator !== "undefined" && "serviceWorker" in navigator
        ? await navigator.serviceWorker.getRegistration()
        : null;
      await reg?.update();
      const pending = reg?.installing || reg?.waiting;
      if (pending) {
        toast({ title: "Updating Renew…", description: "The newest version is installing — the app will refresh in a moment.", variant: "success" });
      } else {
        toast({ title: "Renew is up to date", description: `You're on ${APP_UPDATE_NAME}.`, variant: "success" });
      }
    } catch {
      toast({ title: "Couldn't check right now", variant: "error" });
    } finally {
      setChecking(false);
    }
  }
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] p-5 text-center">
        <RenewMark size={44} idSuffix="update" />
        <div>
          <p className="text-strong text-base font-medium">Renew</p>
          <p className="text-muted text-sm">Version {APP_UPDATE_NAME}</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/12 px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-300">
          <Check className="size-3.5" strokeWidth={3} />Renew is up to date
        </span>
        <p className="text-muted max-w-xs text-xs">Renew updates itself automatically — new versions install the next time you open it. No download, no reinstall.</p>
        {storage && <p className="text-muted text-xs tabular-nums">Using {storage} on this device</p>}
      </div>
      <div>
        <p className="text-body mb-2 text-sm font-medium">What&apos;s new in {APP_UPDATE_NAME}</p>
        <ul className="flex flex-col gap-1.5">
          {whatsNew.map((w) => (
            <li key={w} className="text-body flex items-start gap-2 text-sm">
              <Check className="mt-0.5 size-4 shrink-0 text-[var(--color-gold-500)]" strokeWidth={3} />{w}
            </li>
          ))}
        </ul>
      </div>
      <AnimatedButton variant="glass" fullWidth loading={checking} onClick={check}>Check for updates</AnimatedButton>
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

function RenControl({ uid }: { uid: string }) {
  const { profile } = useUserProfile();
  const { ctx, uid: ctxUid } = useRenContext();
  const [chatOpen, setChatOpen] = useState(false);
  const autoSpeak = profile?.renAutoSpeak ?? true;
  const voiceOut = speechOutputSupported();

  return (
    <div className="flex flex-col gap-5">
      <p className="text-muted text-sm">Tap the orb anywhere in Renew and just talk — say &ldquo;Hey Ren&rdquo; and ask about your money. Ren understands and replies in your language.</p>

      {/* Full conversation — the one place with the complete text chat */}
      <button type="button" onClick={() => setChatOpen(true)}
        className="flex items-center gap-3 rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-3.5 py-3 text-start transition-colors hover:border-[var(--focus-ring)]/50">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[var(--color-gold-500)]/15"><MessageSquareText className="size-4.5 text-[var(--color-gold-500)]" /></span>
        <span className="min-w-0 flex-1">
          <span className="text-body block text-sm font-medium">Open the full conversation</span>
          <span className="text-muted block text-xs">Type or speak, with your history in view</span>
        </span>
        <ChevronRight className="size-5 shrink-0 text-[var(--text-muted)]" />
      </button>
      <RenChat open={chatOpen} onClose={() => setChatOpen(false)} ctx={ctx} uid={ctxUid} />

      {/* Spoken responses — the single Siri-style control */}
      {voiceOut && (
        <div className="flex items-center justify-between rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-3.5 py-3">
          <span className="min-w-0">
            <span className="text-body block text-sm font-medium">Spoken responses</span>
            <span className="text-muted block text-xs">Ren reads its answers aloud in its voice.</span>
          </span>
          <Switch checked={autoSpeak} onChange={(on) => { updateRenPrefs(uid, { renAutoSpeak: on }).catch(() => {}); }} label="Spoken responses" />
        </div>
      )}
    </div>
  );
}

function DataControl() {
  const { t } = useLocale();
  const router = useRouter();
  const requireReauth = useReauth();
  const { profile, uid } = useUserProfile();
  const retentionDays = profile?.dataRetentionDays ?? 0;
  const transactions = useUserCollection<Transaction>("transactions");
  const budgets = useUserCollection<Budget>("budgets");
  const savings = useUserCollection<SavingsGoal>("savings");
  const investments = useUserCollection<Investment>("investments");
  const payments = useUserCollection<Payment>("payments");
  const accounts = useUserCollection<Account>("accounts");
  const transfers = useUserCollection<Transfer>("transfers");
  const subscriptions = useUserCollection<Subscription>("subscriptions");
  const reminders = useUserCollection<Reminder>("reminders");

  const total =
    transactions.data.length + budgets.data.length + savings.data.length +
    investments.data.length + payments.data.length +
    accounts.data.length + transfers.data.length + subscriptions.data.length +
    reminders.data.length;

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
      reminders: reminders.data,
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

      {/* Auto-clean — keep Renew tidy by removing old entries automatically. */}
      <div className="rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] p-3.5">
        <p className="text-body text-sm font-medium">Auto-clean old entries</p>
        <p className="text-muted mb-3 text-xs">Automatically remove transactions older than the time you choose. Off by default — your data is kept forever unless you pick a window.</p>
        <div className="grid grid-cols-2 gap-2">
          {RETENTION_OPTIONS.map((o) => {
            const active = retentionDays === o.days;
            return (
              <button
                key={o.days}
                type="button"
                onClick={async () => {
                  if (!uid || active) return;
                  if (o.days > 0 && !(await requireReauth("to turn on auto-delete of old entries"))) return;
                  try { await updateDataRetention(uid, o.days); toast({ title: o.days === 0 ? "Auto-clean off — keeping everything" : `Auto-clean on — ${o.label}`, variant: "success" }); }
                  catch { toast({ title: "Couldn't save", variant: "error" }); }
                }}
                aria-pressed={active}
                className={cn(
                  "flex flex-col items-start rounded-xl border p-3 text-left transition-all",
                  active ? "border-[var(--focus-ring)] bg-[var(--glass-bg-strong)]" : "border-[var(--field-border)] bg-[var(--field-bg)] hover:border-[var(--focus-ring)]/50",
                )}
              >
                <span className="text-strong flex items-center gap-1.5 text-sm font-medium">{o.label}{active && <Check className="size-3.5 text-[var(--color-gold-600)]" />}</span>
                <span className="text-muted text-[0.7rem]">{o.sub}</span>
              </button>
            );
          })}
        </div>
        {retentionDays > 0 && (
          <p className="mt-3 flex items-start gap-1.5 text-xs text-amber-600 dark:text-amber-400">
            <Trash2 className="mt-0.5 size-3.5 shrink-0" />
            Entries older than {RETENTION_OPTIONS.find((o) => o.days === retentionDays)?.label.toLowerCase()} are permanently removed when you open Renew. This can&apos;t be undone.
          </p>
        )}
      </div>
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

/** iPhone-style passcode (PIN) — a local lock on top of the Firebase session. */
function PasscodeControl() {
  const { profile, uid } = useUserProfile();
  const hasPin = !!profile?.security;
  const bioOn = profile?.security?.biometricEnabled ?? false;
  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function close() { setOpen(false); setPin(""); setConfirm(""); setErr(null); }
  async function save() {
    if (!uid) return;
    if (!isValidPasscode(pin, "pin")) return setErr("Use 4–8 digits.");
    if (pin !== confirm) return setErr("The passcodes don't match.");
    setSaving(true);
    try {
      await setSecurity(uid, await makePasscodeRecord(pin, "pin", isPasskeySupported()));
      try { sessionStorage.setItem("renew_unlocked", "1"); } catch { /* ignore */ }
      toast({ title: "Passcode set", variant: "success" });
      close();
    } catch { setErr("Couldn't save. Please try again."); }
    finally { setSaving(false); }
  }
  async function turnOff() {
    if (!uid) return;
    try {
      await clearSecurity(uid);
      try { sessionStorage.removeItem("renew_unlocked"); } catch { /* ignore */ }
      toast({ title: "Passcode turned off", variant: "success" });
    } catch { toast({ title: "Couldn't update", variant: "error" }); }
  }
  const onlyDigits = (v: string) => v.replace(/\D/g, "").slice(0, 8);

  return (
    <div className="rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] p-3.5">
      <div className="flex items-center gap-3">
        <Lock className="size-5 text-[var(--color-gold-500)]" />
        <div className="min-w-0 flex-1">
          <p className="text-body text-sm font-medium">Passcode</p>
          <p className="text-muted text-xs">{hasPin ? "A PIN is asked when you open Renew." : "Add a PIN to lock Renew on this device."}</p>
        </div>
        <AnimatedButton size="sm" variant={hasPin ? "glass" : "primary"} onClick={() => setOpen(true)}>{hasPin ? "Change" : "Set up"}</AnimatedButton>
      </div>
      {hasPin && (
        <div className="mt-3 flex flex-col gap-3 border-t border-[var(--glass-border)] pt-3">
          {isPasskeySupported() && uid && profile?.security && (
            <div className="flex items-center justify-between">
              <span className="text-body text-sm">Unlock with Face ID</span>
              <Switch checked={bioOn} onChange={(on) => { setBiometricEnabled(uid, profile.security!, on).catch(() => {}); }} label="Unlock with Face ID" />
            </div>
          )}
          <button type="button" onClick={turnOff} className="text-start text-sm text-rose-600 hover:underline dark:text-rose-300">Turn off passcode</button>
        </div>
      )}

      <AnimatedModal open={open} onClose={close} title={hasPin ? "Change passcode" : "Set a passcode"} description="4–8 digits. You'll enter it when you open Renew.">
        <div className="flex flex-col gap-4">
          <Input label="New passcode" type="text" inputMode="numeric" autoFocus value={pin} onChange={(e) => { setErr(null); setPin(onlyDigits(e.target.value)); }} placeholder="••••" />
          <Input label="Confirm passcode" type="text" inputMode="numeric" value={confirm} onChange={(e) => { setErr(null); setConfirm(onlyDigits(e.target.value)); }} placeholder="••••" error={err ?? undefined} />
          <div className="flex items-center justify-end gap-3">
            <AnimatedButton variant="ghost" onClick={close} disabled={saving}>Cancel</AnimatedButton>
            <AnimatedButton onClick={save} loading={saving} disabled={pin.length < 4 || confirm.length < 4}>Save passcode</AnimatedButton>
          </div>
        </div>
      </AnimatedModal>
    </div>
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
      <PasscodeControl />
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
