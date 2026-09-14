"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  RefreshCw, ReceiptText, Sparkles, Fingerprint,
  Globe, Palette, Bell, Accessibility, Upload, Database,
  ChevronRight, LogOut, Crown, Pencil, Check,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Avatar } from "@/components/shell/Avatar";
import { Input } from "@/components/ui/Input";
import { AnimatedButton, AnimatedModal } from "@/components/motion";
import { toast } from "@/components/ui/toast-store";
import { AVATARS } from "@/lib/avatars";
import { APP_UPDATE_NAME } from "@/lib/setup-version";
import { updateDisplayName, updateAvatar } from "@/lib/firestore/profile";
import { useAuth } from "@/components/providers/AuthProvider";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useScopedUserCollection } from "@/hooks/useScopedUserCollection";
import { signOutUser, AuthError } from "@/lib/auth/client";
import { registerPasskey, usePasskeySupport } from "@/lib/auth/passkey-client";
import type { Subscription } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * "Your Renew Account" — a clean, Apple-style profile: a centred identity with
 * edit-in-a-sheet, then calm iOS-grouped lists into every management area. Only
 * the essentials live here; deeper controls are on their own pages. Passwordless
 * by design. Real data only.
 */
export function AccountView() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile, uid } = useUserProfile();
  const isPremiumPlan = profile?.plan === "premium";
  const { data: subs } = useScopedUserCollection<Subscription>("subscriptions");
  const passkeySupported = usePasskeySupport();
  const [addingPasskey, setAddingPasskey] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState(user?.displayName ?? "");
  const [savingName, setSavingName] = useState(false);

  const activeCount = subs.filter((s) => s.status === "active").length;
  const shellUser = {
    uid: user?.uid ?? "",
    email: user?.email ?? null,
    displayName: user?.displayName ?? null,
    photoURL: user?.photoURL ?? null,
  };

  async function saveProfile() {
    const trimmed = name.trim();
    if (uid && trimmed && trimmed !== (user?.displayName ?? "").trim()) {
      setSavingName(true);
      try {
        await updateDisplayName(uid, trimmed);
        toast({ title: "Profile updated", variant: "success" });
        router.refresh();
      } catch {
        toast({ title: "Couldn't save", variant: "error" });
      } finally {
        setSavingName(false);
      }
    }
    setEditOpen(false);
  }
  function pickAvatar(id: string) {
    if (!uid) return;
    updateAvatar(uid, id).catch(() => toast({ title: "Couldn't update", variant: "error" }));
  }

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
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      {/* Identity — centred, tap to edit (Apple-style) */}
      <div className="flex flex-col items-center pt-3 text-center">
        <button type="button" onClick={() => { setName(user?.displayName ?? ""); setEditOpen(true); }} aria-label="Edit profile" className="relative rounded-full outline-none transition-transform active:scale-95">
          <Avatar user={shellUser} size={92} />
          <span className="absolute -bottom-0.5 -right-0.5 grid size-7 place-items-center rounded-full bg-[var(--glass-bg-strong)] text-[var(--text-strong)] shadow ring-2 ring-[var(--bg-base)]">
            <Pencil className="size-3.5" />
          </span>
        </button>
        <h1 className="text-strong mt-4 text-2xl font-semibold">{user?.displayName || "Your account"}</h1>
        <span className={cn("mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", isPremiumPlan ? "bg-[var(--color-gold-500)]/12 text-[var(--color-gold-600)]" : "bg-[var(--glass-bg-strong)] text-[var(--text-body)]")}>
          {isPremiumPlan ? <Crown className="size-3.5" /> : <Sparkles className="size-3.5" />}{isPremiumPlan ? "Premium" : "Free plan"}
        </span>
      </div>

      {/* Membership */}
      <Group title="Membership">
        <Row icon={isPremiumPlan ? Crown : Sparkles} title="Plan & billing" desc={isPremiumPlan ? "You're on Renew Premium" : "Free plan · see Premium"} href="/settings#billing" />
        <Row icon={RefreshCw} title="Subscriptions" desc={`${activeCount} active · renewals`} href="/payments#subscriptions" />
        <Row icon={ReceiptText} title="Bills" desc="Upcoming and paid" href="/payments" />
      </Group>

      {/* Security & sign-in */}
      {passkeySupported && (
        <Group title="Security & sign-in">
          <RowButton icon={Fingerprint} title="Add a passkey" desc="Unlock with Face ID or Touch ID" onClick={onAddPasskey} loading={addingPasskey} />
        </Group>
      )}

      {/* Preferences */}
      <Group title="Preferences">
        <Row icon={Globe} title="Language & region" desc="Currency, timezone, week start" href="/settings#region" />
        <Row icon={Palette} title="Appearance" desc="Light or dark" href="/settings#appearance" />
        <Row icon={Bell} title="Notifications" desc="Bills, budgets & savings alerts" href="/settings#notifications" />
        <Row icon={Accessibility} title="Accessibility" desc="Text size, contrast, motion" href="/settings#accessibility" />
      </Group>

      {/* Data */}
      <Group title="Your data">
        <Row icon={Upload} title="Add money data" desc="Scan a receipt or import a statement" href="/import" />
        <Row icon={Database} title="Download & manage data" desc="Export or delete your data" href="/settings#data" />
      </Group>

      <AnimatedButton variant="glass" fullWidth onClick={onSignOut}>
        <LogOut className="size-4" /> Sign out
      </AnimatedButton>

      <footer className="flex flex-col items-center gap-1.5 pb-2 text-xs text-[var(--text-muted)]">
        <div className="flex items-center gap-4">
          <Link href="/privacy" className="hover:text-[var(--text-strong)]">Privacy</Link>
          <span aria-hidden="true">·</span>
          <Link href="/terms" className="hover:text-[var(--text-strong)]">Terms</Link>
        </div>
        <span className="opacity-70">Renew · {APP_UPDATE_NAME}</span>
      </footer>

      {/* Edit profile sheet */}
      <AnimatedModal open={editOpen} onClose={() => setEditOpen(false)} title="Edit profile">
        <div className="flex flex-col gap-5">
          <div className="flex justify-center">
            <Avatar user={{ ...shellUser, displayName: name || shellUser.displayName }} size={72} />
          </div>
          <Input label="Your name" value={name} autoFocus onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void saveProfile(); }} placeholder="e.g. Alex" />
          <div>
            <p className="text-body mb-2 text-sm font-medium">Your look</p>
            <div className="grid grid-cols-8 gap-2.5">
              {AVATARS.map((a) => (
                <button key={a.id} type="button" onClick={() => pickAvatar(a.id)} aria-label={a.id} aria-pressed={profile?.avatar === a.id}
                  className={cn("relative grid aspect-square place-items-center rounded-full ring-2 ring-offset-2 ring-offset-[var(--bg-base)] transition-all active:scale-90",
                    profile?.avatar === a.id ? "ring-[var(--focus-ring)]" : "ring-transparent hover:ring-[var(--field-border)]")}
                  style={{ background: a.css }}>
                  {profile?.avatar === a.id && <Check className="size-4 text-white drop-shadow" strokeWidth={3} />}
                </button>
              ))}
            </div>
          </div>
          <AnimatedButton size="lg" fullWidth loading={savingName} onClick={saveProfile}>Done</AnimatedButton>
        </div>
      </AnimatedModal>
    </div>
  );
}

/* ---- iOS-style grouped list pieces --------------------------------------- */

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

const rowInner = "group flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[var(--glass-bg-soft)]";
const rowIcon = "grid size-9 shrink-0 place-items-center rounded-xl bg-[var(--glass-bg-strong)]";

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
