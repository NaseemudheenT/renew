"use client";

import { Landmark, Smartphone, CreditCard, Building2, ChevronRight, ShieldCheck, type LucideIcon } from "lucide-react";
import { AnimatedModal } from "@/components/motion";
import type { Payment } from "@/lib/types";

interface Method {
  id: string;
  label: string;
  desc: string;
  icon: LucideIcon;
}

const METHODS: Method[] = [
  { id: "renew", label: "Pay from Renew", desc: "Your linked bank balance — one tap", icon: Landmark },
  { id: "upi", label: "UPI", desc: "Google Pay · PhonePe · Paytm · any app", icon: Smartphone },
  { id: "card", label: "Debit / Credit card", desc: "Visa · Mastercard · RuPay · Amex", icon: CreditCard },
  { id: "netbanking", label: "Net banking", desc: "All major banks", icon: Building2 },
];

/**
 * A calm "how would you like to pay?" sheet. Renew records the payment against
 * the chosen method and keeps the recurring bill rolling; the live money rail
 * (UPI / card via the payment provider) activates once payment keys are set —
 * the choices here stay the same.
 */
export function PayMethodModal({
  open,
  payment,
  money,
  onClose,
  onConfirm,
}: {
  open: boolean;
  payment: Payment | null;
  money: (n: number, c: string) => string;
  onClose: () => void;
  onConfirm: (methodLabel: string) => void;
}) {
  return (
    <AnimatedModal open={open} onClose={onClose} title={payment ? `Pay ${payment.name}` : "Pay"}>
      {payment && (
        <div className="flex flex-col">
          <div className="mb-4 flex items-baseline justify-between rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-4 py-3">
            <span className="text-muted text-sm">Amount</span>
            <span className="text-strong text-xl font-semibold tabular-nums">{money(payment.amount, payment.currency)}</span>
          </div>
          <p className="text-muted mb-3 text-sm">Choose how you want to pay.</p>
          <div className="flex flex-col gap-2">
            {METHODS.map((m) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onConfirm(m.label)}
                  className="group flex items-center gap-3 rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-3.5 py-3 text-left transition-colors hover:border-[var(--focus-ring)]/60"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[var(--glass-bg-strong)]"><Icon className="size-4.5 text-[var(--color-gold-500)]" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="text-strong block text-sm font-medium">{m.label}</span>
                    <span className="text-muted block truncate text-xs">{m.desc}</span>
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-[var(--text-muted)] transition-transform group-hover:translate-x-0.5" />
                </button>
              );
            })}
          </div>
          <p className="text-muted mt-4 flex items-start gap-2 text-xs">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-[var(--color-gold-500)]" />
            <span>Encrypted end-to-end. Renew never stores your card or UPI PIN.</span>
          </p>
        </div>
      )}
    </AnimatedModal>
  );
}
