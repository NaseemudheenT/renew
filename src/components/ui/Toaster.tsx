"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { useToastStore, type Toast } from "./toast-store";
import { cn } from "@/lib/utils";

const icons = { default: Info, success: CheckCircle2, error: AlertCircle } as const;

function ToastRow({ toast }: { toast: Toast }) {
  const dismiss = useToastStore((s) => s.dismiss);
  const Icon = icons[toast.variant ?? "default"];

  useEffect(() => {
    const t = setTimeout(() => dismiss(toast.id), toast.duration);
    return () => clearTimeout(t);
  }, [toast.id, toast.duration, dismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.96, transition: { duration: 0.16 } }}
      transition={{ type: "spring", stiffness: 340, damping: 30 }}
      className="glass glass-strong pointer-events-auto flex w-[min(92vw,24rem)] items-start gap-3 !rounded-2xl p-3.5"
      role="status"
    >
      <Icon
        className={cn(
          "mt-0.5 size-5 shrink-0",
          toast.variant === "success" && "text-emerald-500",
          toast.variant === "error" && "text-rose-500",
          (!toast.variant || toast.variant === "default") && "text-[var(--color-gold-500)]",
        )}
      />
      <div className="min-w-0 flex-1">
        <p className="text-strong text-sm font-medium">{toast.title}</p>
        {toast.description && <p className="text-muted mt-0.5 text-xs">{toast.description}</p>}
      </div>
      {toast.action && (
        <button
          type="button"
          onClick={() => {
            toast.action!.onClick();
            dismiss(toast.id);
          }}
          className="shrink-0 rounded-full px-3 py-1 text-xs font-medium text-[var(--color-gold-600)] hover:bg-[var(--glass-bg-soft)]"
        >
          {toast.action.label}
        </button>
      )}
      <button
        type="button"
        onClick={() => dismiss(toast.id)}
        aria-label="Dismiss"
        className="shrink-0 rounded-full p-1 text-[var(--text-muted)] hover:text-[var(--text-strong)]"
      >
        <X className="size-4" />
      </button>
    </motion.div>
  );
}

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[200] flex flex-col items-center gap-2 p-4 pb-24 sm:pb-4">
      <AnimatePresence>
        {toasts.map((t) => (
          <ToastRow key={t.id} toast={t} />
        ))}
      </AnimatePresence>
    </div>
  );
}
