"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Download, Share, Plus } from "lucide-react";
import { AnimatedModal } from "@/components/motion";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { useLocale } from "@/components/providers/LocaleProvider";

/**
 * "Install Renew" affordance for the top bar. Uses the native Chromium prompt
 * when available; on iOS Safari it opens a short Add-to-Home-Screen guide.
 * Renders nothing when the app is already installed or install isn't offered.
 */
export function InstallRenew() {
  const { canPrompt, isIOS, installed, promptInstall } = useInstallPrompt();
  const { t } = useLocale();
  const [iosOpen, setIosOpen] = useState(false);

  const show = !installed && (canPrompt || isIOS);

  return (
    <>
      <AnimatePresence>
        {show && (
          <motion.button
            type="button"
            onClick={() => (isIOS ? setIosOpen(true) : promptInstall())}
            aria-label={t("install.cta")}
            title={t("install.cta")}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            whileTap={{ scale: 0.94 }}
            className="glass inline-flex h-9 items-center gap-1.5 !rounded-full px-3 text-xs font-medium text-[var(--text-strong)]"
          >
            <Download className="size-4 text-[var(--color-gold-500)]" />
            <span className="hidden sm:inline">{t("install.cta")}</span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatedModal
        open={iosOpen}
        onClose={() => setIosOpen(false)}
        title={t("install.ios.title")}
      >
        <div className="flex flex-col gap-4">
          <p className="text-body text-sm leading-relaxed">{t("install.ios.body")}</p>
          <div className="flex items-center justify-center gap-6 text-[var(--text-muted)]">
            <span className="flex flex-col items-center gap-1 text-xs">
              <Share className="size-6 text-[var(--color-gold-500)]" />
              Share
            </span>
            <span className="flex flex-col items-center gap-1 text-xs">
              <Plus className="size-6 text-[var(--color-gold-500)]" />
              Add to Home Screen
            </span>
          </div>
        </div>
      </AnimatedModal>
    </>
  );
}
