"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Crown, Check, Sparkles, BellRing } from "lucide-react";
import { AnimatedButton, AnimatedModal } from "@/components/motion";
import { toast } from "@/components/ui/toast-store";
import { useUserProfile } from "@/hooks/useUserProfile";
import { usePremium } from "@/hooks/usePremium";
import { useLocale } from "@/components/providers/LocaleProvider";
import { setPremiumInterest } from "@/lib/firestore/profile";
import {
  FREE_LIMITS, planPricing, yearlySavingPct, formatPlanPrice,
  type BillingPeriod,
} from "@/lib/plan";
import { cn } from "@/lib/utils";

// Kept short and professional on purpose — a couple of lines each, not a wall.
const BASIC_FEATURES = [
  "Track spending in seconds",
  `${FREE_LIMITS.scansPerMonth} receipt scans a month`,
  "Budgets, goals & insights",
];
const PREMIUM_FEATURES = [
  "Unlimited receipt scanning",
  "Auto-import from bank & SMS",
  "Unlimited budgets, goals & reports",
  "Priority sync & support",
];

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
      {premium ? (
        /* Premium member — a calm thank-you, no upsell. */
        <div className="flex items-center justify-between rounded-3xl border border-[var(--color-gold-500)]/40 bg-[var(--color-gold-500)]/8 p-4">
          <div className="flex items-center gap-3">
            <span className="glass grid size-10 place-items-center !rounded-2xl"><Crown className="size-5 text-[var(--color-gold-500)]" /></span>
            <div>
              <p className="text-strong text-sm font-medium">Renew Premium</p>
              <p className="text-muted text-xs">Thank you — you have everything Renew offers.</p>
            </div>
          </div>
          <span className="rounded-full bg-[var(--glass-bg-strong)] px-3 py-1 text-xs font-medium text-[var(--text-strong)]">Active</span>
        </div>
      ) : (
        <>
          {/* Two clean plan cards — Basic and Premium, side by side. */}
          {/* Billing period applies to the Premium card. */}
          <div className="relative grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* ---- BASIC ---- */}
            <div className="glass relative flex flex-col p-5">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <Sparkles className="size-4.5 text-[var(--color-gold-500)]" />
                  <span className="text-strong text-sm font-semibold">Basic</span>
                </span>
                <span className="rounded-full bg-[var(--glass-bg-strong)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--text-body)]">Your plan</span>
              </div>
              <p className="text-muted mt-1 text-xs">Genuinely useful, free forever.</p>
              <div className="mt-4 flex items-baseline gap-1.5">
                <span className="text-strong num text-3xl font-bold">Free</span>
              </div>
              <p className="text-muted mt-0.5 text-xs">No card, no catch.</p>
              <div className="my-4 h-px bg-[var(--glass-border)]" />
              <ul className="flex flex-col gap-2">
                {BASIC_FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="size-4 shrink-0 text-[var(--color-gold-500)]" strokeWidth={3} />
                    <span className="text-body">{f}</span>
                  </li>
                ))}
              </ul>
              <AnimatedButton size="lg" variant="glass" fullWidth className="mt-5" disabled>
                Current plan
              </AnimatedButton>
            </div>

            {/* ---- PREMIUM ---- */}
            <div className="glass relative flex flex-col overflow-hidden p-5 ring-2 ring-[var(--color-gold-500)]/45">
              <div aria-hidden className="pointer-events-none absolute -right-12 -top-12 size-44 rounded-full bg-[radial-gradient(circle,rgba(212,175,110,0.22),transparent_65%)] blur-2xl" />
              <div className="relative flex flex-1 flex-col">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <Crown className="size-4.5 text-[var(--color-gold-500)]" />
                    <span className="text-strong text-sm font-semibold">Premium</span>
                  </span>
                  <span className="rounded-full bg-[var(--color-gold-500)]/15 px-2.5 py-0.5 text-[11px] font-semibold text-[var(--color-gold-600)]">Most popular</span>
                </div>
                <p className="text-muted mt-1 text-xs">Everything, unlimited.</p>

                {/* Monthly / Annual toggle */}
                <div className="relative mt-3 grid grid-cols-2 rounded-full border border-[var(--field-border)] bg-[var(--field-bg)] p-1 text-sm">
                  {(["monthly", "yearly"] as BillingPeriod[]).map((p) => (
                    <button key={p} type="button" onClick={() => setPeriod(p)} aria-pressed={period === p}
                      className={cn("relative z-10 rounded-full py-1.5 text-xs font-medium capitalize transition-colors", period === p ? "text-[var(--btn-gold-text)]" : "text-[var(--text-muted)]")}>
                      {p === "yearly" ? "Annual" : "Monthly"}
                      {p === "yearly" && saving > 0 && (
                        <span className={cn("ml-1 rounded-full px-1 py-0.5 text-[9px] font-semibold", period === "yearly" ? "bg-black/15 text-[var(--btn-gold-text)]" : "bg-[var(--color-gold-500)]/15 text-[var(--color-gold-600)]")}>-{saving}%</span>
                      )}
                    </button>
                  ))}
                  <motion.span layout aria-hidden className={cn("absolute inset-y-1 z-0 w-[calc(50%-0.25rem)] rounded-full bg-[var(--color-gold-500)]", period === "yearly" ? "left-[calc(50%+0.125rem)]" : "left-1")} transition={{ type: "spring", stiffness: 400, damping: 32 }} />
                </div>

                <div className="mt-4 flex items-baseline gap-1.5">
                  <span className="text-strong num text-3xl font-bold">{formatPlanPrice(price, period === "yearly" ? price.yearly : price.monthly)}</span>
                  <span className="text-muted text-sm">{period === "yearly" ? "/year" : "/month"}</span>
                </div>
                <p className="text-muted mt-0.5 text-xs">{period === "yearly" ? `≈ ${formatPlanPrice(price, Math.round(monthlyEquivalent))}/mo, billed yearly` : "Cancel anytime"}</p>

                <div className="my-4 h-px bg-[var(--glass-border)]" />
                <ul className="flex flex-1 flex-col gap-2">
                  {PREMIUM_FEATURES.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className="size-4 shrink-0 text-emerald-500" strokeWidth={3} />
                      <span className="text-body">{f}</span>
                    </li>
                  ))}
                </ul>
                <AnimatedButton size="lg" fullWidth className="mt-5" onClick={() => setOpen(true)} disabled={interested}>
                  <Crown className="size-4" />{interested ? "You're on the list" : "Get Premium"}
                </AnimatedButton>
              </div>
            </div>
          </div>

          <p className="text-muted text-center text-[11px]">No charge until secure checkout is live and you choose to subscribe. A one-time {formatPlanPrice(price, price.oneTimeReport)} report will also be available — no subscription.</p>
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
