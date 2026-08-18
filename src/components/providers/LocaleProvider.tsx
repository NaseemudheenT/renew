"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  detectPrefs,
  resolvePrefs,
  directionFor,
  FALLBACK_PREFS,
  type LocalePrefs,
} from "@/lib/i18n/config";
import {
  formatMoney as fmtMoney,
  formatMoneyPrecise as fmtMoneyPrecise,
  currencySymbol as fmtSymbol,
  formatNumber as fmtNumber,
  formatPercent as fmtPercent,
  formatDate as fmtDate,
  formatTime as fmtTime,
  formatDateTime as fmtDateTime,
  formatRelative as fmtRelative,
} from "@/lib/i18n/format";
import { translate, type MessageKey } from "@/lib/i18n/messages";
import { useUserProfile } from "@/hooks/useUserProfile";

export interface LocaleContextValue {
  prefs: LocalePrefs;
  /** True once browser detection has run (post-hydration). */
  ready: boolean;
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
  money: (amount: number, currency?: string) => string;
  moneyPrecise: (amount: number, currency?: string) => string;
  symbol: (currency?: string) => string;
  number: (value: number) => string;
  percent: (ratio: number, fractionDigits?: number) => string;
  date: (value: number | Date, opts?: Intl.DateTimeFormatOptions) => string;
  time: (value: number | Date) => string;
  dateTime: (value: number | Date) => string;
  relative: (value: number | Date, now?: number) => string;
  /** Localized Today / Tomorrow / Yesterday / "Mon, 4 Aug", optional time. */
  dueLabel: (value: number | Date, hasTime?: boolean) => string;
  /** Localized short date, e.g. "4 Aug 2026". */
  shortDate: (value: number | Date) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

/**
 * Browser detection is read via useSyncExternalStore so SSR renders the neutral
 * fallback and the client swaps to the detected prefs on hydration — no
 * setState-in-effect, no hydration mismatch. The snapshot is memoized so its
 * reference stays stable across renders.
 */
const noopSubscribe = () => () => {};
let cachedDetected: LocalePrefs | null = null;
function clientDetected(): LocalePrefs {
  if (!cachedDetected) cachedDetected = detectPrefs();
  return cachedDetected;
}
function serverDetected(): LocalePrefs {
  return FALLBACK_PREFS;
}

/**
 * Binds browser detection with the user's saved profile override and exposes
 * locale-aware formatters + translation. Detection runs client-side after mount
 * (SSR uses the neutral fallback), then the profile's saved prefs win. Also
 * reflects language/direction onto <html> for correct RTL.
 */
export function LocaleProvider({ children }: { children: ReactNode }) {
  const { profile } = useUserProfile();
  const detected = useSyncExternalStore(
    noopSubscribe,
    clientDetected,
    serverDetected,
  );
  const ready = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

  const prefs = useMemo(
    () =>
      resolvePrefs(detected, {
        language: profile?.locale,
        region: profile?.region,
        currency: profile?.currency,
        timezone: profile?.timezone,
        weekStart: profile?.weekStart,
        hour12: profile?.hour12,
      }),
    [detected, profile],
  );

  useEffect(() => {
    const root = document.documentElement;
    root.lang = prefs.language;
    root.dir = directionFor(prefs.language);
  }, [prefs.language]);

  const value = useMemo<LocaleContextValue>(() => {
    const fallbackCurrency = prefs.currency;
    return {
      prefs,
      ready,
      t: (key, vars) => translate(prefs.language, key, vars),
      money: (amount, currency) =>
        fmtMoney(amount, currency ?? fallbackCurrency, prefs),
      moneyPrecise: (amount, currency) =>
        fmtMoneyPrecise(amount, currency ?? fallbackCurrency, prefs),
      symbol: (currency) => fmtSymbol(currency ?? fallbackCurrency, prefs),
      number: (v) => fmtNumber(v, prefs),
      percent: (ratio, fractionDigits) => fmtPercent(ratio, prefs, fractionDigits),
      date: (v, opts) => fmtDate(v, prefs, opts),
      time: (v) => fmtTime(v, prefs),
      dateTime: (v) => fmtDateTime(v, prefs),
      relative: (v, now) => fmtRelative(v, prefs, now),
      dueLabel: (v, hasTime = false) => {
        const d = v instanceof Date ? v : new Date(v);
        const suffix = hasTime ? ` · ${fmtTime(d, prefs)}` : "";
        // Decide Today/Tomorrow/Yesterday by the calendar day in the profile
        // timezone — the SAME frame the formatted date uses — so the word and
        // the date never disagree near midnight across timezones.
        const dayInTz = new Intl.DateTimeFormat("en-CA", {
          timeZone: prefs.timezone,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        });
        const nowMs = new Date().getTime();
        const target = dayInTz.format(d);
        if (target === dayInTz.format(nowMs)) return translate(prefs.language, "date.today") + suffix;
        if (target === dayInTz.format(nowMs + 86_400_000)) return translate(prefs.language, "date.tomorrow") + suffix;
        if (target === dayInTz.format(nowMs - 86_400_000)) return translate(prefs.language, "date.yesterday") + suffix;
        return (
          fmtDate(d, prefs, { weekday: "short", day: "numeric", month: "short" }) +
          suffix
        );
      },
      shortDate: (v) =>
        fmtDate(v, prefs, { day: "numeric", month: "short", year: "numeric" }),
    };
  }, [prefs, ready]);

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

/** Access locale-aware formatters, translation and the resolved prefs. */
export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within <LocaleProvider>");
  }
  return ctx;
}
