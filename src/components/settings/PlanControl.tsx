"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Crown, Check, Wallet, Sparkles, ShieldCheck, Download, TrendingUp, Bell,
  Landmark, Heart, BellRing, ScanLine, Tags, Target, PiggyBank, FileText,
} from "lucide-react";
import { AnimatedButton, AnimatedModal } from "@/components/motion";
import { toast } from "@/components/ui/toast-store";
import { useUserProfile } from "@/hooks/useUserProfile";
import { usePremium } from "@/hooks/usePremium";
import { useLocale } from "@/components/providers/LocaleProvider";
import { setPremiumInterest } from "@/lib/firestore/profile";
import {
  FREE_PERKS, PREMIUM_PERKS, planPricing, yearlySavingPct, formatPlanPrice,
  type BillingPeriod,
} from "@/lib/plan";
import { cn } from "@/lib/utils";

const ICONS: Record<string, typeof Wallet> = {
  Wallet, Sparkles, ShieldCheck, Download, TrendingUp, Bell, Landmark, Heart,
  ScanLine, Tags, Target, PiggyBank,
};

/**
 * Renew's plan surface — the Free-vs-Premium comparison, real region-aware
 * pricing (monthly / annual), and the one-time report add-on.
 *
 * Honest by design: no charge happens here (the payment provider isn't
 * connected yet), so the CTA enrols early access instead of faking a purchase.
 * Premium is additive — it only ever unlocks more.
 */
export function PlanControl() {
  const { uid, profile } = useUserProfile();
  const { premium } = usePremium();
  const { prefs } = useLocale();
  const [period, setPeriod] = useState<BillingPeriod>("yearly");
  const [open, setOpen] = useState(false);
  const interested = !!profile?.premiumInterest;

  const price = planPricing(prefs.currency);
  const saving = yearlySavingPct(price);
  const monthlyEquivalent = price.yearly / 12;

  function joinEarlyAccess() {
    if (!uid) return;
    setPremiumInterest(uid, true, period).catch(() => {});
    setOpen(false);
    toast({
      title: "You're on the early-access list",
      description: "We'll tell you the moment Premium checkout is ready — no charge until you choose to subscribe.",
      variant: "success",
    });
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
          {/* Premium pitch + real pricing */}
          <div className="relative overflow-hidden rounded-2xl border border-[var(--color-gold-500)]/30 p-4">
            <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-[radial-gradient(circle,rgba(0,229,214,0.18),transparent_65%)] blur-2xl" />
            <div className="relative">
              <div className="flex items-center gap-2">
                <Crown className="size-4.5 text-[var(--color-gold-500)]" />
                <p className="text-strong text-sm font-semibold">Renew Premium</p>
              </div>
              <p className="text-muted mt-1 text-xs">Unlimited scanning, auto-import, unlimited budgets &amp; goals, and clean reports.</p>

              {/* Monthly / Annual toggle */}
              <div className="relative mt-3 grid grid-cols-2 rounded-full border border-[var(--field-border)] bg-[var(--field-bg)] p-1 text-sm">
                {(["monthly", "yearly"] as BillingPeriod[]).map((p) => (
                  <button key={p} type="button" onClick={() => setPeriod(p)} aria-pressed={period === p}
                    className={cn("relative z-10 rounded-full py-1.5 font-medium capitalize transition-colors", period === p ? "text-[var(--text-onGold)]" : "text-[var(--text-muted)]")}>
                    {p === "yearly" ? "Annual" : "Monthly"}
                    {p === "yearly" && saving > 0 && (
                      <span className={cn("ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold", period === "yearly" ? "bg-[var(--text-onGold)]/15 text-[var(--text-onGold)]" : "bg-[var(--color-gold-500)]/15 text-[var(--color-gold-600)]")}>
                        Save {saving}%
                      </span>
                    )}
                  </button>
                ))}
                <motion.span layout aria-hidden className={cn("absolute inset-y-1 z-0 w-[calc(50%-0.25rem)] rounded-full bg-[var(--color-gold-500)]", period === "yearly" ? "left-[calc(50%+0.125rem)]" : "left-1")} transition={{ type: "spring", stiffness: 400, damping: 32 }} />
              </div>

              {/* Price */}
              <div className="mt-4 flex items-baseline gap-1.5">
                <span className="text-strong text-3xl font-light num">
                  {formatPlanPrice(price, period === "yearly" ? price.yearly : price.monthly)}
                </span>
                <span className="text-muted text-sm">{period === "yearly" ? "/year" : "/month"}</span>
              </div>
              {period === "yearly" && (
                <p className="text-muted mt-0.5 text-xs">
                  That&apos;s just {formatPlanPrice(price, Math.round(monthlyEquivalent))}/month, billed yearly.
                </p>
              )}

              <ul className="mt-4 flex flex-col gap-2">
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

              <AnimatedButton size="lg" fullWidth className="mt-4" onClick={() => setOpen(true)} disabled={interested}>
                <Crown className="size-4" />{interested ? "You're on the list" : "Get Premium"}
              </AnimatedButton>
              <p className="text-muted mt-2 text-center text-[11px]">Cancel anytime. No charge until secure checkout is live and you choose to subscribe.</p>
            </div>
          </div>

          {/* One-time report add-on — for free users who don't want a subscription */}
          <div className="flex items-center gap-3 rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] p-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--glass-bg-strong)]"><FileText className="size-5 text-[var(--color-gold-500)]" /></span>
            <div className="min-w-0 flex-1">
              <p className="text-strong text-sm font-medium">Just need one report?</p>
              <p className="text-muted text-xs">A one-time clean PDF/CSV summary — {formatPlanPrice(price, price.oneTimeReport)}, no subscription. Coming with checkout.</p>
            </div>
          </div>

          {/* Everything in Free (so nobody fears losing anything) */}
          <div>
            <p className="text-muted mb-2 text-xs font-medium uppercase tracking-wide">Included free, always</p>
            <ul className="flex flex-col gap-1.5">
              {FREE_PERKS.map((p) => (
                <li key={p.id} className="text-body flex items-center gap-2 text-sm">
                  <Check className="size-4 shrink-0 text-[var(--color-gold-500)]" strokeWidth={3} />{p.title}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      <AnimatedModal open={open} onClose={() => setOpen(false)} title="Renew Premium is almost here"
        description="Secure checkout is being finished. We'll never charge you without you choosing to subscribe first.">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] p-3.5">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--color-gold-500)]/15"><BellRing className="size-5 text-[var(--color-gold-500)]" /></span>
            <p className="text-body text-sm">
              Join early access and you&apos;ll be first to switch on the {period === "yearly" ? "annual" : "monthly"} plan the moment it&apos;s ready — at {formatPlanPrice(price, period === "yearly" ? price.yearly : price.monthly)}{period === "yearly" ? "/year" : "/month"}. No commitment.
            </p>
          </div>
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
            <AnimatedButton size="lg" fullWidth onClick={joinEarlyAccess}><BellRing className="size-4" />Join early access</AnimatedButton>
          </motion.div>
        </div>
      </AnimatedModal>
    </div>
  );
}
