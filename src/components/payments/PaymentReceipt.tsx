"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { RenewMark } from "@/components/brand/RenewMark";
import { GlassButton } from "@/components/ui/liquid-glass";
import { useLocale } from "@/components/providers/LocaleProvider";
import { cn } from "@/lib/utils";

/**
 * RENEW — payment receipt. The calm, professional "bill" a person gets the
 * moment a payment succeeds: a soft glow-burst + spring check (delight without
 * confetti), the amount, and the details worth keeping. Liquid-glass midnight,
 * multi-currency, reduced-motion aware. Render inside an AnimatePresence so the
 * dismiss animates out.
 */

export interface PaymentReceiptProps {
  amount: number;
  currency: string;
  name: string;
  date: Date;
  method?: string;
  reference: string;
  onDone: () => void;
}

export function PaymentReceipt({
  amount,
  currency,
  name,
  date,
  method,
  reference,
  onDone,
}: PaymentReceiptProps) {
  const reduced = useReducedMotion();
  const { money, dateTime } = useLocale();

  // Format in the USER's locale (currency + date), not the browser's.
  const amountStr = money(amount, currency);
  const dateStr = dateTime(date);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.button
        type="button"
        aria-label="Close receipt"
        onClick={onDone}
        className="absolute inset-0 backdrop-blur-md"
        style={{ background: "rgba(2,5,16,0.6)" }}
      />

      <motion.div
        role="dialog"
        aria-label="Payment receipt"
        className="glass relative w-full max-w-sm overflow-hidden !rounded-[1.75rem]"
        initial={{ opacity: 0, y: 24, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 260, damping: 26 }}
      >
        <div className="flex flex-col items-center px-8 pb-6 pt-9 text-center">
          <span className="relative grid place-items-center">
            {!reduced && (
              <motion.span
                aria-hidden="true"
                className="absolute size-24 rounded-full"
                style={{ background: "radial-gradient(circle, var(--bokeh-3), transparent 60%)" }}
                initial={{ scale: 0.4, opacity: 0.85 }}
                animate={{ scale: 1.9, opacity: 0 }}
                transition={{ duration: 1.1, ease: "easeOut", delay: 0.15 }}
              />
            )}
            <motion.span
              className="grid size-16 place-items-center rounded-full"
              style={{
                background:
                  "linear-gradient(to bottom, var(--glass-gold-hi), var(--glass-gold-lo)), var(--glass-bg-strong)",
                boxShadow: "var(--glass-shadow)",
              }}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 360, damping: 18, delay: 0.1 }}
            >
              <motion.span
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 16, delay: 0.32 }}
              >
                <Check className="size-8 text-[var(--text-strong)]" strokeWidth={2.5} />
              </motion.span>
            </motion.span>
          </span>

          <motion.h2
            className="text-strong mt-5 text-xl font-semibold"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            Payment complete
          </motion.h2>
          <motion.p
            className="text-muted mt-1 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.32 }}
          >
            Paid to {name}
          </motion.p>
          <motion.p
            className="text-strong mt-4 text-4xl font-semibold tracking-tight"
            style={{ fontVariantNumeric: "tabular-nums" }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.38 }}
          >
            {amountStr}
          </motion.p>
        </div>

        {/* Receipt perforation. */}
        <div className="relative">
          <span
            className="absolute -left-3 top-1/2 size-6 -translate-y-1/2 rounded-full"
            style={{ background: "var(--bg-base)" }}
          />
          <span
            className="absolute -right-3 top-1/2 size-6 -translate-y-1/2 rounded-full"
            style={{ background: "var(--bg-base)" }}
          />
          <div
            className="mx-8 border-t-2 border-dashed"
            style={{ borderColor: "var(--glass-border)" }}
          />
        </div>

        <div className="flex flex-col gap-3.5 px-8 pb-4 pt-6 text-left">
          <Row label="Date & time" value={dateStr} />
          {method ? <Row label="Method" value={method} /> : null}
          <Row label="Reference" value={reference} mono />
        </div>

        <div className="px-8 pb-8 pt-2">
          <GlassButton
            type="button"
            variant="primary"
            fullWidth
            onClick={onDone}
            className="h-12 font-semibold"
          >
            Done
          </GlassButton>
          <div className="mt-5 flex items-center justify-center gap-2 opacity-70">
            <RenewMark size={16} idSuffix="receipt" />
            <span className="text-xs font-medium tracking-wide text-[var(--text-muted)]">
              Paid with Renew
            </span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted text-[0.7rem] uppercase tracking-wide">{label}</span>
      <span className={cn("text-body font-medium", mono && "font-mono text-xs")}>
        {value}
      </span>
    </div>
  );
}
