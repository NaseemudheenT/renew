/**
 * RENEW — locale-aware presentation formatters.
 *
 * All money/number/date/time output flows through here so a single locale
 * change reformats the whole product consistently. Values are always stored raw
 * (numbers + ISO currency codes + epoch millis); these functions only present.
 * Every call is defensive: an unknown currency or timezone falls back to a
 * readable string rather than throwing.
 */

import type { LocalePrefs } from "./config";

/** BCP-47 tag from prefs, e.g. "en-US", used for all Intl constructors. */
function localeTag(prefs: LocalePrefs): string {
  return `${prefs.language}-${prefs.region}`;
}

/** Locale-aware currency. Whole amounts drop the decimals for calm display. */
export function formatMoney(
  amount: number,
  currency: string,
  prefs: LocalePrefs,
): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  try {
    return new Intl.NumberFormat(localeTag(prefs), {
      style: "currency",
      currency,
      maximumFractionDigits: safe % 1 === 0 ? 0 : 2,
    }).format(safe);
  } catch {
    return `${currency} ${safe.toLocaleString()}`;
  }
}

/** Currency with forced 2-dp precision (statements, inputs, exact figures). */
export function formatMoneyPrecise(
  amount: number,
  currency: string,
  prefs: LocalePrefs,
): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  try {
    return new Intl.NumberFormat(localeTag(prefs), {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(safe);
  } catch {
    return `${currency} ${safe.toFixed(2)}`;
  }
}

/** The bare currency symbol for the given code, e.g. "$", "€", "₹". */
export function currencySymbol(currency: string, prefs: LocalePrefs): string {
  try {
    const parts = new Intl.NumberFormat(localeTag(prefs), {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).formatToParts(0);
    return parts.find((p) => p.type === "currency")?.value ?? currency;
  } catch {
    return currency;
  }
}

export function formatNumber(value: number, prefs: LocalePrefs): string {
  const safe = Number.isFinite(value) ? value : 0;
  try {
    return new Intl.NumberFormat(localeTag(prefs)).format(safe);
  } catch {
    return safe.toLocaleString();
  }
}

export function formatPercent(
  ratio: number,
  prefs: LocalePrefs,
  fractionDigits = 0,
): string {
  const safe = Number.isFinite(ratio) ? ratio : 0;
  try {
    return new Intl.NumberFormat(localeTag(prefs), {
      style: "percent",
      maximumFractionDigits: fractionDigits,
    }).format(safe);
  } catch {
    return `${Math.round(safe * 100)}%`;
  }
}

type DateInput = number | Date;

export function formatDate(
  value: DateInput,
  prefs: LocalePrefs,
  opts: Intl.DateTimeFormatOptions = { dateStyle: "medium" },
): string {
  try {
    return new Intl.DateTimeFormat(localeTag(prefs), {
      timeZone: prefs.timezone,
      ...opts,
    }).format(value);
  } catch {
    return new Date(value).toLocaleDateString();
  }
}

export function formatTime(value: DateInput, prefs: LocalePrefs): string {
  try {
    return new Intl.DateTimeFormat(localeTag(prefs), {
      timeZone: prefs.timezone,
      hour: "numeric",
      minute: "2-digit",
      hour12: prefs.hour12,
    }).format(value);
  } catch {
    return new Date(value).toLocaleTimeString();
  }
}

export function formatDateTime(value: DateInput, prefs: LocalePrefs): string {
  return `${formatDate(value, prefs)} · ${formatTime(value, prefs)}`;
}

const RELATIVE_STEPS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 1000 * 60 * 60 * 24 * 365],
  ["month", 1000 * 60 * 60 * 24 * 30],
  ["week", 1000 * 60 * 60 * 24 * 7],
  ["day", 1000 * 60 * 60 * 24],
  ["hour", 1000 * 60 * 60],
  ["minute", 1000 * 60],
];

/** "in 3 days", "2 hours ago", localized. */
export function formatRelative(
  value: DateInput,
  prefs: LocalePrefs,
  now: number = Date.now(),
): string {
  const target = value instanceof Date ? value.getTime() : value;
  const diff = target - now;
  try {
    const rtf = new Intl.RelativeTimeFormat(localeTag(prefs), {
      numeric: "auto",
    });
    for (const [unit, ms] of RELATIVE_STEPS) {
      if (Math.abs(diff) >= ms) return rtf.format(Math.round(diff / ms), unit);
    }
    return rtf.format(Math.round(diff / 1000), "second");
  } catch {
    return formatDate(target, prefs);
  }
}
