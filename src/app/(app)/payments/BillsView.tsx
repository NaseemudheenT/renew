"use client";

import { useEffect, useState } from "react";
import { ReceiptText, RefreshCw } from "lucide-react";
import { PaymentsView } from "./PaymentsView";
import { SubscriptionsView } from "../subscriptions/SubscriptionsView";
import { cn } from "@/lib/utils";

type Tab = "bills" | "subscriptions";

const TABS: { id: Tab; label: string; icon: typeof ReceiptText }[] = [
  { id: "bills", label: "Bills", icon: ReceiptText },
  { id: "subscriptions", label: "Subscriptions", icon: RefreshCw },
];

/**
 * Bills & Recurring on ONE page — bills and subscriptions share the same idea
 * (recurring obligations), switched by a segmented control. Both are the same
 * fully-working views, unchanged.
 */
export function BillsView() {
  const [tab, setTab] = useState<Tab>("bills");

  // Deep link: /payments#subscriptions opens the Subscriptions tab directly.
  useEffect(() => {
    const h = typeof window !== "undefined" ? window.location.hash.replace("#", "") : "";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (h === "subscriptions") setTab("subscriptions");
  }, []);

  return (
    <div>
      <div className="mb-5 flex justify-center lg:justify-start">
        <div className="glass inline-flex !rounded-full p-1 text-sm">
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                aria-pressed={active}
                className={cn(
                  "flex items-center gap-2 rounded-full px-4 py-2 font-medium transition-colors",
                  active ? "bg-[var(--glass-bg-strong)] text-[var(--text-strong)]" : "text-[var(--text-muted)] hover:text-[var(--text-strong)]",
                )}
              >
                <Icon className={cn("size-4", active && "text-[var(--color-gold-500)]")} />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {tab === "bills" ? <PaymentsView /> : <SubscriptionsView />}
    </div>
  );
}
