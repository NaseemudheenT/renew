"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CreditCard as CardIcon, Wifi, ShieldCheck } from "lucide-react";
import { GlassSurface, GlassButton } from "@/components/ui/liquid-glass";
import { Input } from "@/components/ui/Input";

/**
 * RENEW credit-card entry — the supplied 21st.dev card, adapted to Renew's
 * champagne liquid glass. A live flip-card preview plus the method form.
 *
 * SECURITY: never store raw card details. `onSubmit` should hand the values to
 * a real payment provider (Stripe Elements / token) at the boundary — this
 * component only collects and previews. Nothing here is persisted by Renew.
 */
export interface CardValues {
  number: string;
  holder: string;
  expiry: string;
  cvc: string;
}

function groupNumber(v: string): string {
  return v
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

function detectBrand(n: string): string {
  const d = n.replace(/\D/g, "");
  if (/^4/.test(d)) return "VISA";
  if (/^5[1-5]/.test(d)) return "Mastercard";
  if (/^3[47]/.test(d)) return "Amex";
  if (/^6/.test(d)) return "RuPay";
  return "Card";
}

export function CreditCardForm({
  onSubmit,
  submitting,
}: {
  onSubmit: (v: CardValues) => void;
  submitting?: boolean;
}) {
  const [number, setNumber] = useState("");
  const [holder, setHolder] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [flipped, setFlipped] = useState(false);
  const brand = detectBrand(number);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      number: number.replace(/\s/g, ""),
      holder: holder.trim(),
      expiry,
      cvc,
    });
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Liquid-glass card preview */}
      <div className="[perspective:1200px]">
        <motion.div
          className="relative h-52 w-full [transform-style:preserve-3d]"
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 26 }}
        >
          <GlassSurface className="absolute inset-0 flex flex-col justify-between p-5 [backface-visibility:hidden]">
            <div className="flex items-start justify-between">
              <div className="h-9 w-12 rounded-md bg-gradient-to-br from-gold-200 to-gold-400" />
              <Wifi className="size-5 rotate-90 text-[var(--text-muted)]" />
            </div>
            <div className="font-mono text-xl tracking-[0.15em] text-[var(--text-strong)]">
              {groupNumber(number) || "•••• •••• •••• ••••"}
            </div>
            <div className="flex items-end justify-between text-xs">
              <div>
                <p className="text-[var(--text-muted)]">Card holder</p>
                <p className="text-[var(--text-strong)]">
                  {holder || "YOUR NAME"}
                </p>
              </div>
              <div>
                <p className="text-[var(--text-muted)]">Expires</p>
                <p className="text-[var(--text-strong)]">{expiry || "MM/YY"}</p>
              </div>
              <span className="font-brand text-sm uppercase tracking-wider text-[var(--color-gold-500)]">
                {brand}
              </span>
            </div>
          </GlassSurface>
          <GlassSurface className="absolute inset-0 flex flex-col justify-center gap-3 p-5 [transform:rotateY(180deg)] [backface-visibility:hidden]">
            <div className="-mx-5 h-9 bg-black/40" />
            <div className="flex items-center justify-end gap-2">
              <span className="text-xs text-[var(--text-muted)]">CVC</span>
              <span className="rounded bg-[var(--glass-bg-strong)] px-3 py-1 font-mono text-sm text-[var(--text-strong)]">
                {cvc || "•••"}
              </span>
            </div>
          </GlassSurface>
        </motion.div>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-4">
        <Input
          label="Card number"
          inputMode="numeric"
          autoComplete="cc-number"
          placeholder="4242 4242 4242 4242"
          value={groupNumber(number)}
          onChange={(e) => setNumber(e.target.value)}
          icon={<CardIcon className="size-[1.125rem]" />}
        />
        <Input
          label="Card holder"
          autoComplete="cc-name"
          placeholder="Your name"
          value={holder}
          onChange={(e) => setHolder(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Expiry"
            autoComplete="cc-exp"
            placeholder="MM/YY"
            value={expiry}
            onChange={(e) =>
              setExpiry(e.target.value.replace(/[^\d/]/g, "").slice(0, 5))
            }
          />
          <Input
            label="CVC"
            inputMode="numeric"
            autoComplete="cc-csc"
            placeholder="123"
            value={cvc}
            onFocus={() => setFlipped(true)}
            onBlur={() => setFlipped(false)}
            onChange={(e) =>
              setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))
            }
          />
        </div>
        <p className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
          <ShieldCheck className="size-3.5 text-emerald-500" />
          Encrypted and sent straight to the payment provider — never stored by
          Renew.
        </p>
        <GlassButton type="submit" fullWidth disabled={submitting}>
          {submitting ? "Saving…" : "Save card"}
        </GlassButton>
      </form>
    </div>
  );
}
