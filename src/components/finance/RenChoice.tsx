"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AudioLines, MessageSquareText } from "lucide-react";
import { RenLogo } from "@/components/brand/RenLogo";
import { useUserProfile } from "@/hooks/useUserProfile";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * The Ren entry moment: choose to SPEAK with Ren (the Siri-style voice) or CHAT
 * with Ren (text). A calm, futuristic overlay — the orb breathes at the top,
 * two large cards rise in. Tap outside to dismiss (no close button).
 */
export function RenChoice({
  open, onSpeak, onChat, onClose,
}: {
  open: boolean;
  onSpeak: () => void;
  onChat: () => void;
  onClose: () => void;
}) {
  const { profile } = useUserProfile();
  const first = (profile?.displayName ?? "").trim().split(/\s+/)[0] ?? "";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog" aria-modal="true" aria-label="Ren"
          className="fixed inset-0 z-[120] flex flex-col items-center justify-center px-6"
          style={{ background: "color-mix(in oklab, var(--bg-base) 82%, transparent)", backdropFilter: "blur(30px) saturate(1.3)" }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
        >
          {/* soft golden glow */}
          <div aria-hidden className="pointer-events-none absolute left-1/2 top-[34%] size-[46vmax] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[110px]"
            style={{ background: "radial-gradient(circle, rgba(212,175,110,0.22), transparent 66%)" }} />

          <div className="relative flex w-full max-w-sm flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <motion.div
              initial={{ scale: 0.6, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              style={{ filter: "drop-shadow(0 12px 40px rgba(212,175,110,0.4))" }}
            >
              <motion.div animate={{ scale: [1, 1.04, 1] }} transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}>
                <RenLogo size={120} idSuffix="choice" />
              </motion.div>
            </motion.div>

            <motion.p
              className="text-strong mt-7 text-center text-xl font-light"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.3, ease: EASE }}
            >
              {first ? `Hi ${first}, how can I help?` : "Hi, I'm Ren. How can I help?"}
            </motion.p>

            <div className="mt-8 grid w-full grid-cols-2 gap-3">
              {[
                { key: "speak", label: "Speak with Ren", sub: "Talk, hands-free", icon: AudioLines, onClick: onSpeak },
                { key: "chat", label: "Chat with Ren", sub: "Type it out", icon: MessageSquareText, onClick: onChat },
              ].map((c, i) => {
                const Icon = c.icon;
                return (
                  <motion.button
                    key={c.key} type="button" onClick={c.onClick}
                    className="glass flex flex-col items-center gap-2 rounded-2xl p-5 text-center"
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.14 + i * 0.07, duration: 0.32, ease: EASE }}
                    whileHover={{ y: -3 }} whileTap={{ scale: 0.97 }}
                  >
                    <span className="grid size-12 place-items-center rounded-full bg-[var(--color-gold-500)]/15">
                      <Icon className="size-6 text-[var(--color-gold-500)]" />
                    </span>
                    <span className="text-strong text-sm font-medium">{c.label}</span>
                    <span className="text-muted text-xs">{c.sub}</span>
                  </motion.button>
                );
              })}
            </div>

            <p className="text-muted mt-6 text-center text-xs">Tap anywhere to close</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
