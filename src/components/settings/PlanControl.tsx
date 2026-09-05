"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Crown, Check, Wallet, Sparkles, ShieldCheck, Download, TrendingUp, Bell, Landmark, Heart, BellRing } from "lucide-react";
import { AnimatedButton, AnimatedModal } from "@/components/motion";
import { toast } from "@/components/ui/toast-store";
import { useUserProfile } from "@/hooks/useUserProfile";
import { usePremium } from "@/hooks/usePremium";
import { setPremiumInterest } from "@/lib/firestore/profile";
import { PERKS, PREMIUM_PERKS, PREMIUM_PRICE } from "@/lib/plan";
import { cn } from "@/lib/utils";

const ICONS: Record<string, typeof Wallet> = {
  Wallet, Sparkles, ShieldCheck, Download, TrendingUp, Bell, Landmark, Heart,
};

/**
 * Renew's plan surface — the Free-vs-Premium comparison and the upgrade path.
 * Honest by design: no charge happens here (a payment provider isn't connected),
 * so the CTA registers interest instead of faking a purchase. Premium is
 * additive — it only ever unlocks more.
 */
export function PlanControl() {
  const { uid, profile } = useUserProfile();
  const { premium } = usePremium();
  const [open, setOpen] = useState(false);
  const interested = !!profile?.premiumInterest;

  function notifyMe() {
    if (!uid) return;
    setPremiumInterest(uid, true).catch(() => {});
    setOpen(false);
    toast({ title: "You're on the list", description: "We'll tell you the moment Premium checkout is ready — no charge until you opt in.", variant: "success" });
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Current plan */}
      <div className={cn("flex items-center justify-between rounded-2xl border p-4", premium ? "border-[var(--color-gold-500)]/40 bg-[var(--color-gold-500)]/8" : "border-[var(--field-border)] bg-[var(--field-bg)]")}>
        <div className="flex items-center gap-3">
          <span className="glass grid size-10 place-items-center !rounded-2xl">
            {premium ? <Crown className="size-5 text-[var(--color-gold-500)]" /> : <Sparkles className="size-5 text-[var(--color-gold-500)]" />}
          </span>
          <div>
            <p className="text-strong text-sm font-medium">{premium ? "Renew Premium" : "Free plan"}</p>
            <p className="text-muted text-xs">{premium ? "Thank you — you have everything Renew offers." : "Everything that makes Renew genuinely useful, at no cost."}</p>
          </div>
        </div>
        <span className="rounded-full bg-[var(--glass-bg-strong)] px-3 py-1 text-xs font-medium text-[var(--text-strong)]">Current</span>
      </div>

      {!premium && (
        <>
          {/* Premium pitch */}
          <div className="relative overflow-hidden rounded-2xl border border-[var(--color-gold-500)]/30 p-4">
            <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-[radial-gradient(circle,rgba(212,175,110,0.22),transparent_65%)] blur-2xl" />
            <div className="relative">
              <div className="flex items-center gap-2">
                <Crown className="size-4.5 text-[var(--color-gold-500)]" />
                <p className="text-strong text-sm font-semibold">Renew Premium</p>
              </div>
              <p className="text-muted mt-1 text-xs">Deeper insights, a proactive Ren, and bank sync — as they land, they&apos;re yours.</p>
              <ul className="mt-3 flex flex-col gap-2">
                {PREMIUM_PERKS.map((p) => {
                  const Icon = ICONS[p.icon] ?? Sparkles;
                  return (
                    <li key={p.id} className="flex items-start gap-2.5">
                      <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg bg-[var(--color-gold-500)]/15"><Icon className="size-3.5 text-[var(--color-gold-500)]" /></span>
                      <span className="min-w-0">
                        <span className="text-body block text-sm font-medium">{p.title}{!p.live && <span className="text-muted ml-1.5 text-[10px] font-medium uppercase tracking-wide">soon</span>}</span>
                        <span className="text-muted block text-xs">{p.desc}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-strong text-2xl font-light">{PREMIUM_PRICE.amountText}</span>
                <span className="text-muted text-sm">{PREMIUM_PRICE.period}</span>
              </div>
              <AnimatedButton size="lg" fullWidth className="mt-3" onClick={() => setOpen(true)} disabled={interested}>
                <Crown className="size-4" />{interested ? "You're on the list" : "Upgrade to Premium"}
              </AnimatedButton>
              <p className="text-muted mt-2 text-center text-[11px]">{PREMIUM_PRICE.note}</p>
            </div>
          </div>

          {/* Everything in Free (so nobody fears losing anything) */}
          <div>
            <p className="text-muted mb-2 text-xs font-medium uppercase tracking-wide">Included free, always</p>
            <ul className="flex flex-col gap-1.5">
              {PERKS.filter((p) => p.free).map((p) => (
                <li key={p.id} className="text-body flex items-center gap-2 text-sm">
                  <Check className="size-4 shrink-0 text-[var(--color-gold-500)]" strokeWidth={3} />{p.title}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      <AnimatedModal open={open} onClose={() => setOpen(false)} title="Renew Premium is almost here"
        description="Secure checkout is being finished. We'll never charge you without you opting in first.">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] p-3.5">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--color-gold-500)]/15"><BellRing className="size-5 text-[var(--color-gold-500)]" /></span>
            <p className="text-body text-sm">Want to be first in line? We&apos;ll let you know the moment Premium is ready to buy — no commitment.</p>
          </div>
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
            <AnimatedButton size="lg" fullWidth onClick={notifyMe}><BellRing className="size-4" />Notify me at launch</AnimatedButton>
          </motion.div>
        </div>
      </AnimatedModal>
    </div>
  );
}
