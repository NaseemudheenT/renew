"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Users, UserPlus, Activity, ShieldCheck, ShieldAlert, Ban,
  RefreshCw, KeyRound, Fingerprint, Mail, Smartphone, Apple, Globe, Circle,
  Search, TrendingUp, TrendingDown, LineChart, Crown, BellRing,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { relativeTime, shortDate } from "@/lib/dates";
import { cn } from "@/lib/utils";

interface OwnerUserRow {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  providers: string[];
  createdAt: number | null;
  lastSignInAt: number | null;
  emailVerified: boolean;
  disabled: boolean;
}

interface OwnerOverview {
  totalUsers: number;
  onboardedUsers: number;
  premiumUsers: number;
  waitlistUsers: number;
  newLast7d: number;
  newLast30d: number;
  activeLast24h: number;
  activeLast7d: number;
  disabledUsers: number;
  unverifiedUsers: number;
  providerBreakdown: Record<string, number>;
  recentUsers: OwnerUserRow[];
  signupsByDay: { day: number; count: number }[];
  weekOverWeekPct: number | null;
  truncated: boolean;
  generatedAt: number;
}

/** Friendly name + icon for a sign-in method. */
const PROVIDER_META: Record<string, { label: string; icon: typeof KeyRound }> = {
  "google.com": { label: "Google", icon: Globe },
  "apple.com": { label: "Apple", icon: Apple },
  passkey: { label: "Passkey", icon: Fingerprint },
  password: { label: "Password", icon: KeyRound },
  phone: { label: "Phone", icon: Smartphone },
  other: { label: "Other", icon: Circle },
};

function providerMeta(id: string) {
  return PROVIDER_META[id] ?? { label: id, icon: Circle };
}

function initialOf(row: OwnerUserRow): string {
  const s = (row.displayName || row.email || "?").trim();
  return (s[0] || "?").toUpperCase();
}

const REFRESH_MS = 30_000; // Live refresh cadence while the tab is visible.

export function OwnerConsole() {
  const [data, setData] = useState<OwnerOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  // A 1s ticker so "updated Ns ago" stays truthful between refreshes.
  const [, setTick] = useState(0);

  // `silent` polls don't flash the spinner/skeleton — the console just updates.
  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/owner/overview", { cache: "no-store" });
      if (!res.ok) throw new Error(res.status === 404 ? "Not authorized." : "Could not load.");
      setData((await res.json()) as OwnerOverview);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetch once on mount. The leading setLoading is a deliberate load state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  // Live: refresh on a timer while the tab is visible, and immediately when the
  // owner returns to the tab. Paused in the background so it never wastes reads.
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    const start = () => { timer ??= setInterval(() => { if (!document.hidden) void load(true); }, REFRESH_MS); };
    const stop = () => { if (timer) { clearInterval(timer); timer = undefined; } };
    const onVisible = () => { if (document.hidden) { stop(); } else { void load(true); start(); } };
    start();
    document.addEventListener("visibilitychange", onVisible);
    return () => { stop(); document.removeEventListener("visibilitychange", onVisible); };
  }, [load]);

  // Tick every second so the relative "updated" label counts up live.
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const providerRows = data
    ? Object.entries(data.providerBreakdown).sort((a, b) => b[1] - a[1])
    : [];
  const providerMax = providerRows.reduce((m, [, n]) => Math.max(m, n), 0) || 1;

  const q = query.trim().toLowerCase();
  const filteredUsers = useMemo(() => {
    const rows = data?.recentUsers ?? [];
    if (!q) return rows;
    return rows.filter((u) =>
      (u.email ?? "").toLowerCase().includes(q) ||
      (u.displayName ?? "").toLowerCase().includes(q) ||
      u.uid.toLowerCase().includes(q),
    );
  }, [data?.recentUsers, q]);
  const signupMax = data ? Math.max(1, ...data.signupsByDay.map((d) => d.count)) : 1;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Owner console"
        subtitle="Renew at a glance — visible only to you."
        action={
          <div className="flex items-center gap-2">
            {data && !error && (
              <span className="text-muted inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300" title={`Auto-refreshing every ${REFRESH_MS / 1000}s`}>
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
                </span>
                Live
              </span>
            )}
            <button
              onClick={() => void load()}
              disabled={loading}
              className="text-muted hover:text-strong inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-sm transition disabled:opacity-50"
            >
              <RefreshCw size={15} className={cn(loading && "animate-spin")} />
              Refresh
            </button>
          </div>
        }
      />

      {error && (
        <GlassCard padded className="mb-6 border border-rose-500/30">
          <p className="text-sm text-rose-300">{error}</p>
        </GlassCard>
      )}

      {loading && !data ? (
        <GridSkeleton />
      ) : data ? (
        <>
          {/* Headline numbers */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat icon={Users} label="Total users" value={data.totalUsers} tone="gold" />
            <Stat icon={ShieldCheck} label="Onboarded" value={data.onboardedUsers} tone="emerald" />
            <Stat icon={Activity} label="Active · 24h" value={data.activeLast24h} tone="sky" />
            <Stat icon={Activity} label="Active · 7d" value={data.activeLast7d} tone="sky" />
            <Stat icon={UserPlus} label="New · 7d" value={data.newLast7d} tone="emerald" />
            <Stat icon={UserPlus} label="New · 30d" value={data.newLast30d} tone="emerald" />
            <Stat icon={ShieldAlert} label="Unverified" value={data.unverifiedUsers} tone="amber" />
            <Stat icon={Ban} label="Disabled" value={data.disabledUsers} tone="rose" />
          </div>

          {/* Monetization */}
          <GlassCard padded className="mt-6">
            <h2 className="text-strong mb-4 flex items-center gap-2 text-sm font-medium">
              <Crown size={16} className="text-[var(--color-gold-400)]" />
              Monetization
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Stat icon={Crown} label="Premium members" value={data.premiumUsers} tone="gold" />
              <Stat icon={BellRing} label="Upgrade interest" value={data.waitlistUsers} tone="emerald" />
              <Stat icon={TrendingUp} label="Premium rate" value={data.totalUsers > 0 ? Math.round((data.premiumUsers / data.totalUsers) * 100) : 0} suffix="%" tone="sky" />
            </div>
          </GlassCard>

          {/* How people sign in */}
          <GlassCard padded className="mt-6">
            <h2 className="text-strong mb-4 flex items-center gap-2 text-sm font-medium">
              <Fingerprint size={16} className="text-[var(--color-gold-400)]" />
              How people sign in
            </h2>
            {providerRows.length === 0 ? (
              <p className="text-muted text-sm">No sign-in data yet.</p>
            ) : (
              <ul className="space-y-3">
                {providerRows.map(([id, n]) => {
                  const meta = providerMeta(id);
                  const Icon = meta.icon;
                  return (
                    <li key={id} className="flex items-center gap-3">
                      <span className="text-muted flex w-24 shrink-0 items-center gap-2 text-sm">
                        <Icon size={15} /> {meta.label}
                      </span>
                      <span className="relative h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                        <motion.span
                          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[var(--color-gold-400)] to-[var(--color-gold-500)]"
                          initial={{ width: 0 }}
                          animate={{ width: `${(n / providerMax) * 100}%` }}
                          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        />
                      </span>
                      <span className="text-strong w-8 shrink-0 text-right text-sm tabular-nums">{n}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </GlassCard>

          {/* Sign-ups over time */}
          <GlassCard padded className="mt-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-strong flex items-center gap-2 text-sm font-medium">
                <LineChart size={16} className="text-[var(--color-gold-400)]" />
                New sign-ups <span className="text-muted font-normal">· last 14 days</span>
              </h2>
              {data.weekOverWeekPct != null && (
                <span className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs",
                  data.weekOverWeekPct >= 0 ? "bg-emerald-500/15 text-emerald-300" : "bg-rose-500/15 text-rose-300",
                )}>
                  {data.weekOverWeekPct >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {Math.abs(data.weekOverWeekPct)}% wk/wk
                </span>
              )}
            </div>
            <div className="flex h-28 items-end gap-1.5">
              {data.signupsByDay.map((d) => (
                <div key={d.day} className="group flex h-full flex-1 flex-col items-center justify-end gap-1" title={`${d.count} on ${new Date(d.day).toLocaleDateString()}`}>
                  <span className="text-muted text-[10px] tabular-nums opacity-0 transition-opacity group-hover:opacity-100">{d.count}</span>
                  <motion.span
                    className="w-full rounded-t bg-gradient-to-t from-[var(--color-gold-500)] to-[var(--color-gold-300)]"
                    initial={{ height: 0 }}
                    animate={{ height: `${(d.count / signupMax) * 100}%` }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              ))}
            </div>
            <div className="text-muted mt-2 flex justify-between text-[10px]">
              <span>14 days ago</span><span>today</span>
            </div>
          </GlassCard>

          {/* People */}
          <GlassCard padded className="mt-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-strong flex items-center gap-2 text-sm font-medium">
                <Users size={16} className="text-[var(--color-gold-400)]" />
                People
                <span className="text-muted font-normal">· newest first</span>
              </h2>
              <div className="relative">
                <Search size={14} className="text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search email or name"
                  className="text-body w-56 max-w-full rounded-full border border-white/10 bg-white/5 py-1.5 pl-8 pr-3 text-sm outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--focus-ring)]"
                />
              </div>
            </div>

            {filteredUsers.length === 0 ? (
              <p className="text-muted text-sm">{q ? "No one matches that search." : "No users yet."}</p>
            ) : (
              <ul className="divide-y divide-white/5">
                {filteredUsers.map((u) => (
                  <li key={u.uid} className="flex items-center gap-3 py-3">
                    <span
                      className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-gold-300 to-gold-500 text-sm font-medium text-white"
                      aria-hidden
                    >
                      {initialOf(u)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-strong truncate text-sm">
                          {u.displayName || u.email || u.uid.slice(0, 8)}
                        </p>
                        {u.disabled && (
                          <span className="rounded-full bg-rose-500/15 px-1.5 py-0.5 text-[10px] text-rose-300">Disabled</span>
                        )}
                        {!u.emailVerified && !u.disabled && (
                          <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] text-amber-300">Unverified</span>
                        )}
                      </div>
                      <div className="text-muted mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                        {u.email && u.displayName && <span className="inline-flex items-center gap-1"><Mail size={11} />{u.email}</span>}
                        <span>Joined {u.createdAt ? shortDate(u.createdAt) : "—"}</span>
                        <span aria-hidden>·</span>
                        <span>{u.lastSignInAt ? `active ${relativeTime(u.lastSignInAt)}` : "never active"}</span>
                      </div>
                    </div>
                    <div className="hidden shrink-0 items-center gap-1 sm:flex">
                      {u.providers.map((p) => {
                        const meta = providerMeta(p);
                        const Icon = meta.icon;
                        return (
                          <span key={p} title={meta.label} className="text-muted grid size-6 place-items-center rounded-full bg-white/5">
                            <Icon size={13} />
                          </span>
                        );
                      })}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </GlassCard>

          <p className="text-muted mt-6 text-center text-xs">
            Account &amp; security data only — Renew never shows anyone&apos;s money here.
            Updated {relativeTime(data.generatedAt)}.
          </p>
        </>
      ) : null}
    </div>
  );
}

const TONE: Record<string, string> = {
  gold: "text-[var(--color-gold-400)]",
  emerald: "text-emerald-400",
  sky: "text-sky-400",
  amber: "text-amber-400",
  rose: "text-rose-400",
};

function Stat({
  icon: Icon, label, value, tone, suffix,
}: { icon: typeof Users; label: string; value: number; tone: keyof typeof TONE; suffix?: string }) {
  return (
    <GlassCard padded={false} className="p-4">
      <Icon size={18} className={cn("mb-2", TONE[tone])} />
      <p className="text-strong text-2xl font-light tabular-nums">{value.toLocaleString()}{suffix}</p>
      <p className="text-muted mt-0.5 text-xs">{label}</p>
    </GlassCard>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="glass h-24 animate-pulse rounded-2xl" />
      ))}
    </div>
  );
}
