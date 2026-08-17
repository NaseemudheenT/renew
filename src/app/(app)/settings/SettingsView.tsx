"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User as UserIcon, Palette, Bell, CreditCard, ShieldCheck, Sun, Moon, LogOut, Trash2, Check, Sparkles } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { AnimatedButton, AnimatedModal } from "@/components/motion";
import { Avatar } from "@/components/shell/Avatar";
import { toast } from "@/components/ui/toast-store";
import { useAuth } from "@/components/providers/AuthProvider";
import { useTheme } from "@/hooks/useTheme";
import { useUserProfile, DEFAULT_NOTIFICATION_PREFS, type NotificationPrefs } from "@/hooks/useUserProfile";
import { updateDisplayName, updateNotificationPrefs } from "@/lib/firestore/profile";
import { signOutUser } from "@/lib/auth/client";
import { cn } from "@/lib/utils";

export function SettingsView() {
  const { user } = useAuth();
  const { profile, uid } = useUserProfile();
  const shellUser = { uid: user?.uid ?? "", email: user?.email ?? null, displayName: user?.displayName ?? null, photoURL: user?.photoURL ?? null };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <PageHeader title="Settings" subtitle="Make Renew feel like yours." />

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

      <Section icon={Bell} title="Notifications">
        {uid && <NotificationPrefsControl uid={uid} prefs={profile?.notificationPrefs ?? DEFAULT_NOTIFICATION_PREFS} />}
      </Section>

      <Section icon={CreditCard} title="Billing">
        <BillingControl />
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
            className={cn("flex items-center gap-3 rounded-2xl border p-3.5 text-left transition-all", theme === t ? "border-[var(--focus-ring)] bg-[var(--glass-bg-strong)]" : "border-[var(--field-border)] bg-[var(--field-bg)] hover:border-[var(--focus-ring)]/50")}>
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
  { key: "payments", label: "Payments", desc: "When a payment is due soon or overdue" },
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

function BillingControl() {
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
      <button type="button" onClick={onSignOut} className="flex items-center gap-3 rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] p-3.5 text-left transition-colors hover:border-[var(--focus-ring)]/50">
        <LogOut className="size-5 text-[var(--color-gold-500)]" />
        <div className="flex-1"><p className="text-body text-sm font-medium">Sign out</p><p className="text-muted text-xs">End your session on this device.</p></div>
      </button>
      <button type="button" onClick={() => setConfirmOpen(true)} className="flex items-center gap-3 rounded-2xl border border-rose-400/40 bg-rose-500/5 p-3.5 text-left transition-colors hover:bg-rose-500/10">
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
