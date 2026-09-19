"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Wallet, ScanLine, LineChart, ShieldCheck, ArrowRight } from "lucide-react";
import { RenewMark } from "@/components/brand/RenewMark";
import { RenLogo } from "@/components/brand/RenLogo";
import { AnimatedButton } from "@/components/motion";

const EASE = [0.22, 1, 0.36, 1] as const;
const HOLD_MS = 3000; // each scene holds this long before auto-advancing

type Scene = {
  key: string;
  render: (size: number) => React.ReactNode;
  title: string;
  body: string;
};

const SCENES: Scene[] = [
  { key: "welcome", render: (s) => <RenewMark size={s} idSuffix="intro" />, title: "Welcome to Renew", body: "Your money — clear, calm and completely private." },
  { key: "track", render: () => <SceneIcon icon={Wallet} />, title: "Track it in seconds", body: "Add an expense in a tap. Renew keeps every account in one place." },
  { key: "scan", render: () => <SceneIcon icon={ScanLine} />, title: "Just snap a receipt", body: "Renew reads the amount, merchant and date for you — no typing." },
  { key: "understand", render: () => <SceneIcon icon={LineChart} />, title: "See where it really goes", body: "Honest, simple insight — income vs spend, month by month." },
  { key: "ren", render: (s) => <RenLogo size={s} idSuffix="intro" />, title: "Meet Ren", body: "Your finance assistant. Ask about your money — speak or type." },
  { key: "secure", render: () => <SceneIcon icon={ShieldCheck} />, title: "Private by design", body: "Face ID lock and hidden balances. Your money stays yours." },
];

function SceneIcon({ icon: Icon }: { icon: typeof Wallet }) {
  return (
    <span className="grid size-[104px] place-items-center rounded-full bg-[var(--color-gold-500)]/12 ring-1 ring-[var(--color-gold-500)]/25">
      <Icon className="size-12 text-[var(--color-gold-500)]" strokeWidth={1.5} />
    </span>
  );
}

/**
 * The cinematic first-run walkthrough — a short "film" about Renew that plays
 * before setup. Scenes auto-advance with a golden glow behind the void; tap to
 * skip ahead, or Skip to jump straight in. Fully stills under reduced-motion.
 */
export function RenewIntro({ onDone }: { onDone: () => void }) {
  const reduced = useReducedMotion();
  const [i, setI] = useState(0);
  const last = i >= SCENES.length - 1;

  useEffect(() => {
    if (reduced || last) return;
    const t = setTimeout(() => setI((n) => Math.min(n + 1, SCENES.length - 1)), HOLD_MS);
    return () => clearTimeout(t);
  }, [i, reduced, last]);

  const scene = SCENES[i]!;

  return (
    <div className="fixed inset-0 z-30 flex flex-col items-center justify-center px-6" onClick={() => !last && setI((n) => n + 1)}>
      {/* breathing golden glow */}
      <motion.div aria-hidden className="pointer-events-none absolute left-1/2 top-[40%] size-[60vmax] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]"
        style={{ background: "radial-gradient(circle, rgba(212,175,110,0.2), transparent 66%)" }}
        animate={reduced ? {} : { opacity: [0.5, 0.85, 0.5], scale: [1, 1.08, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      <button type="button" onClick={(e) => { e.stopPropagation(); onDone(); }}
        className="text-muted absolute end-5 top-[calc(env(safe-area-inset-top,0px)+1.25rem)] text-sm font-medium transition-colors hover:text-[var(--text-strong)]">
        Skip
      </button>

      <div className="relative flex w-full max-w-sm flex-col items-center text-center" onClick={(e) => e.stopPropagation()}>
        <AnimatePresence mode="wait">
          <motion.div key={scene.key} className="flex flex-col items-center"
            initial={{ opacity: 0, y: 18, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -18, filter: "blur(6px)" }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            <motion.div style={{ filter: "drop-shadow(0 12px 40px rgba(212,175,110,0.35))" }}
              animate={reduced ? {} : { scale: [1, 1.03, 1] }} transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}>
              {scene.render(104)}
            </motion.div>
            <h1 className="text-strong mt-8 text-2xl font-light tracking-tight">{scene.title}</h1>
            <p className="text-muted mt-2 max-w-xs text-sm leading-relaxed">{scene.body}</p>
          </motion.div>
        </AnimatePresence>

        {/* progress dots */}
        <div className="mt-10 flex items-center gap-2" aria-hidden>
          {SCENES.map((s, n) => (
            <span key={s.key} className={`h-1.5 rounded-full transition-all duration-300 ${n === i ? "w-6 bg-[var(--color-gold-500)]" : "w-1.5 bg-[var(--text-muted)]/30"}`} />
          ))}
        </div>

        <AnimatePresence>
          {last && (
            <motion.div className="mt-8 w-full" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE }}>
              <AnimatedButton size="lg" fullWidth onClick={(e) => { e.stopPropagation(); onDone(); }}>
                Get started <ArrowRight className="size-4" />
              </AnimatedButton>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
