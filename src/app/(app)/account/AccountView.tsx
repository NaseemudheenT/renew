"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  RefreshCw, ReceiptText, Sparkles, Fingerprint,
  Globe, Palette, Bell, Accessibility, Upload, Database,
  ChevronRight, LogOut, BadgeCheck,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Avatar } from "@/components/shell/Avatar";
import { Input } from "@/components/ui/Input";
import { AnimatedAmount } from "@/components/finance/AnimatedAmount";
import { AnimatedButton } from "@/components/motion";
import { toast } from "@/components/ui/toast-store";
import { AVATARS } from "@/lib/avatars";
import { updateDisplayName, updateAvatar } from "@/lib/firestore/profile";
import { useAuth } from "@/components/providers/AuthProvider";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useScopedUserCollection } from "@/hooks/useScopedUserCollection";
import { useLocale } from "@/components/providers/LocaleProvider";
import { subscriptionTotals } from "@/lib/accounts";
import { signOutUser, AuthError } from "@/lib/auth/client";
import { registerPasskey, usePasskeySupport } from "@/lib/auth/passkey-client";
import type { Subscription } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * "Your Renew Account" — one premium, branded home for the whole account:
 * identity, plan, subscriptions and security at a glance, with calm routes into
 * every management area. Passwordless by design (Google / Passkey / QR). Real
 * data only; deeper controls live on their own pages, linked from here.
 */
export function AccountView() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile, uid } = useUserProfile();
  const { prefs } = useLocale();
  const { data: subs } = useScopedUserCollection<Subscription>("subscriptions");
  const passkeySupported = usePasskeySupport();
  const [addingPasskey, setAddingPasskey] = useState(false);
  const [name, setName] = useState(user?.displayName ?? "");
  const [savingName, setSavingName] = useState(false);
  const dirtyName = name.trim().length > 0 && name.trim() !== (user?.displayName ?? "").trim();

  async function saveName() {
    if (!uid || !dirtyName) return;
    setSavingName(true);
    try {
      await updateDisplayName(uid, name.trim());
      toast({ title: "Profile updated", variant: "success" });
      router.refresh();
    } catch {
      toast({ title: "Couldn't save", variant: "error" });
    } finally {
      setSavingName(false);
    }
  }
  async function pickAvatar(id: string) {
    if (!uid) return;
    try { await updateAvatar(uid, id); } catch { toast({ title: "Couldn't update", variant: "error" }); }
  }

  const shellUser = {
    uid: user?.uid ?? "",
    email: user?.email ?? null,
    displayName: user?.displayName ?? null,
    photoURL: user?.photoURL ?? null,
  };

  const active = useMemo(() => subs.filter((s) => s.status === "active"), [subs]);
  const totals = useMemo(() => subscriptionTotals(subs, prefs.currency), [subs, prefs.currency]);
  const nextUp = useMemo(() => {
    const upcoming = active
      .filter((s) => Number.isFinite(s.nextBillingAt))
      .sort((a, b) => a.nextBillingAt - b.nextBillingAt);
    return upcoming[0] ?? null;
  }, [active]);

  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString(undefined, { month: "long", year: "numeric" })
    : null;

  async function onSignOut() {
    await signOutUser();
    router.replace("/sign-in");
  }

  async function onAddPasskey() {
    setAddingPasskey(true);
    try {
      await registerPasskey();
      toast({ title: "Passkey added", description: "You can now unlock with Face ID.", variant: "success" });
    } catch (err) {
      toast({ title: "Couldn't add passkey", description: err instanceof AuthError ? err.message : undefined, variant: "error" });
    } finally {
      setAddingPasskey(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      {/* Identity hero */}
      <GlassCard padded>
        <div className="flex items-center gap-4">
          <Avatar user={shellUser} size={64} />
          <div className="min-w-0 flex-1">
            <h1 className="text-strong truncate text-lg font-semibold">{user?.displayName || "Your account"}</h1>
            <p className="text-muted truncate text-sm">{user?.email}</p>
            {memberSince && <p className="text-muted mt-0.5 text-xs">Renew member since {memberSince}</p>}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Chip icon={Sparkles} tone="gold">Free plan</Chip>
          <Chip icon={BadgeCheck} tone="calm">Passwordless</Chip>
        </div>
      </GlassCard>

      {/* Profile — name + avatar, in its own space (not buried in Settings) */}
      <GlassCard padded>
        <div className="flex items-end gap-3">
          <Input label="Your name" value={name} onChange={(e) => setName(e.target.value)} />
          <AnimatedButton onClick={saveName} loading={savingName} disabled={!dirtyName}>Save</AnimatedButton>
        </div>
        <p className="text-muted mb-2 mt-4 text-sm font-medium">Your look</p>
        <div className="-mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1">
          {AVATARS.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => pickAvatar(a.id)}
              aria-label={a.id}
              aria-pressed={profile?.avatar === a.id}
              className={cn(
                "size-10 shrink-0 rounded-full ring-2 ring-offset-2 ring-offset-[var(--bg-base)] transition-all",
                profile?.avatar === a.id ? "ring-[var(--focus-ring)]" : "ring-transparent hover:ring-[var(--field-border)]",
              )}
              style={{ background: a.css }}
            />
          ))}
        </div>
      </GlassCard>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Subscriptions" value={String(active.length)} hint="active" />
        <Stat
          label="Monthly on subs"
          value={<AnimatedAmount value={totals.monthly} currency={prefs.currency} />}
          hint="active plans"
        />
        <Stat
          label="Next renewal"
          value={nextUp ? relativeDays(nextUp.nextBillingAt) : "—"}
          hint={nextUp ? nextUp.name : "nothing due"}
        />
      </div>

      {/* Membership */}
      <Group title="Membership">
        <Row icon={Sparkles} title="Plan & billing" desc="You're on the free plan" href="/settings#billing" />
        <Row icon={RefreshCw} title="Subscriptions" desc={`${active.length} active · manage & track renewals`} href="/payments#subscriptions" />
        <Row icon={ReceiptText} title="Bills" desc="Upcoming and paid bills" href="/payments" />
      </Group>

      {/* Security & sign-in */}
      {passkeySupported && (
        <Group title="Security & sign-in">
          <RowButton icon={Fingerprint} title="Add a passkey" desc="Sign in with Face ID / Touch ID — no passwords" onClick={onAddPasskey} loading={addingPasskey} />
        </Group>
      )}

      {/* Preferences */}
      <Group title="Preferences">
        <Row icon={Globe} title="Language & region" desc="Currency, timezone, week start" href="/settings#region" />
        <Row icon={Palette} title="Appearance" desc="Light or dark world" href="/settings#appearance" />
        <Row icon={Bell} title="Notifications" desc="Bills, budgets and savings alerts" href="/settings#notifications" />
        <Row icon={Accessibility} title="Accessibility" desc="Text size, contrast, motion" href="/settings#accessibility" />
      </Group>

      {/* Data */}
      <Group title="Your data">
        <Row icon={Upload} title="Add money data" desc="Scan a receipt or import a statement" href="/import" />
        <Row icon={Database} title="Download & manage data" desc="Your private copy — export or delete" href="/settings#data" />
      </Group>

      {/* Sign out */}
      <AnimatedButton variant="glass" fullWidth onClick={onSignOut}>
        <LogOut className="size-4" /> Sign out
      </AnimatedButton>

      <footer className="flex items-center justify-center gap-4 pb-2 text-xs text-[var(--text-muted)]">
        <Link href="/privacy" className="hover:text-[var(--text-strong)]">Privacy</Link>
        <span aria-hidden="true">·</span>
        <Link href="/terms" className="hover:text-[var(--text-strong)]">Terms</Link>
      </footer>
    </div>
  );
}

/* ---- pieces --------------------------------------------------------------- */

function Chip({ icon: Icon, tone, children }: { icon: typeof Sparkles; tone: "gold" | "calm" | "muted"; children: React.ReactNode }) {
  const tones = {
    gold: "bg-[var(--color-gold-500)]/12 text-[var(--color-gold-600)]",
    calm: "bg-[var(--glass-bg-strong)] text-[var(--text-strong)]",
    muted: "bg-[var(--field-bg)] text-[var(--text-muted)]",
  } as const;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", tones[tone])}>
      <Icon className="size-3.5" />{children}
    </span>
  );
}

function Stat({ label, value, hint }: { label: string; value: React.ReactNode; hint: string }) {
  return (
    <div className="rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-3 py-3 text-center">
      <p className="text-strong truncate text-base font-semibold tabular-nums">{value}</p>
      <p className="text-muted mt-0.5 truncate text-[0.7rem]">{label}</p>
      <p className="text-muted truncate text-[0.65rem] opacity-70">{hint}</p>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-muted mb-2 px-1 text-xs font-medium uppercase tracking-wide">{title}</h2>
      <GlassCard>
        <div className="flex flex-col divide-y divide-[var(--glass-border)]">{children}</div>
      </GlassCard>
    </section>
  );
}

const rowInner =
  "group flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[var(--glass-bg-soft)]";
const rowIcon =
  "grid size-9 shrink-0 place-items-center rounded-xl bg-[var(--glass-bg-strong)]";

function Row({ icon: Icon, title, desc, href }: { icon: typeof Sparkles; title: string; desc: string; href: string }) {
  return (
    <Link href={href} className={rowInner}>
      <span className={rowIcon}><Icon className="size-4.5 text-[var(--color-gold-500)]" /></span>
      <span className="min-w-0 flex-1">
        <span className="text-strong block text-sm font-medium">{title}</span>
        <span className="text-muted block truncate text-xs">{desc}</span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-[var(--text-muted)] transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

function RowButton({ icon: Icon, title, desc, onClick, loading }: { icon: typeof Sparkles; title: string; desc: string; onClick: () => void; loading?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={loading} className={cn(rowInner, "disabled:opacity-60")}>
      <span className={rowIcon}><Icon className="size-4.5 text-[var(--color-gold-500)]" /></span>
      <span className="min-w-0 flex-1">
        <span className="text-strong block text-sm font-medium">{loading ? "Setting up…" : title}</span>
        <span className="text-muted block truncate text-xs">{desc}</span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-[var(--text-muted)] transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}


function relativeDays(at: number): string {
  const days = Math.round((at - Date.now()) / 86_400_000);
  if (days <= 0) return "due";
  if (days === 1) return "1 day";
  if (days < 30) return `${days} days`;
  const months = Math.round(days / 30);
  return months === 1 ? "1 month" : `${months} months`;
}
