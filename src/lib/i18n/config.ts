/**
 * RENEW — internationalization configuration.
 *
 * Renew is a global product: language, region, currency, timezone and
 * week-start are all first-class and independently overridable. Everything is
 * auto-detected from the browser on first run, then persisted to the user's
 * profile so their choices follow them across devices. India is one supported
 * region among many — never the underlying default.
 *
 * Financial DATA is always stored region-neutral (raw numbers + ISO currency
 * codes). Only PRESENTATION is localized (see ./format).
 */

export type Direction = "ltr" | "rtl";

export interface LanguageMeta {
  /** BCP-47 language subtag, e.g. "en", "pt", "zh". */
  code: string;
  /** English name. */
  label: string;
  /** Endonym (name in its own language). */
  native: string;
  dir: Direction;
}

/** Supported UI languages. English is the always-available fallback. */
export const LANGUAGES: LanguageMeta[] = [
  { code: "en", label: "English", native: "English", dir: "ltr" },
  { code: "es", label: "Spanish", native: "Español", dir: "ltr" },
  { code: "fr", label: "French", native: "Français", dir: "ltr" },
  { code: "de", label: "German", native: "Deutsch", dir: "ltr" },
  { code: "pt", label: "Portuguese", native: "Português", dir: "ltr" },
  { code: "it", label: "Italian", native: "Italiano", dir: "ltr" },
  { code: "nl", label: "Dutch", native: "Nederlands", dir: "ltr" },
  { code: "pl", label: "Polish", native: "Polski", dir: "ltr" },
  { code: "tr", label: "Turkish", native: "Türkçe", dir: "ltr" },
  { code: "ru", label: "Russian", native: "Русский", dir: "ltr" },
  { code: "uk", label: "Ukrainian", native: "Українська", dir: "ltr" },
  { code: "hi", label: "Hindi", native: "हिन्दी", dir: "ltr" },
  { code: "bn", label: "Bengali", native: "বাংলা", dir: "ltr" },
  { code: "id", label: "Indonesian", native: "Indonesia", dir: "ltr" },
  { code: "vi", label: "Vietnamese", native: "Tiếng Việt", dir: "ltr" },
  { code: "th", label: "Thai", native: "ไทย", dir: "ltr" },
  { code: "ja", label: "Japanese", native: "日本語", dir: "ltr" },
  { code: "ko", label: "Korean", native: "한국어", dir: "ltr" },
  { code: "zh", label: "Chinese", native: "中文", dir: "ltr" },
  { code: "ar", label: "Arabic", native: "العربية", dir: "rtl" },
  { code: "he", label: "Hebrew", native: "עברית", dir: "rtl" },
  { code: "fa", label: "Persian", native: "فارسی", dir: "rtl" },
  { code: "ur", label: "Urdu", native: "اردو", dir: "rtl" },
  { code: "sw", label: "Swahili", native: "Kiswahili", dir: "ltr" },
  { code: "ms", label: "Malay", native: "Melayu", dir: "ltr" },
];

export const RTL_LANGUAGES = new Set(
  LANGUAGES.filter((l) => l.dir === "rtl").map((l) => l.code),
);

export function directionFor(language: string): Direction {
  return RTL_LANGUAGES.has(language.split("-")[0] ?? language) ? "rtl" : "ltr";
}

/** ISO-3166 region → ISO-4217 currency. Covers the major markets; extend freely. */
export const REGION_CURRENCY: Record<string, string> = {
  US: "USD", CA: "CAD", MX: "MXN", BR: "BRL", AR: "ARS", CL: "CLP", CO: "COP",
  GB: "GBP", IE: "EUR", FR: "EUR", DE: "EUR", ES: "EUR", IT: "EUR", NL: "EUR",
  BE: "EUR", AT: "EUR", PT: "EUR", GR: "EUR", FI: "EUR", PL: "PLN", CZ: "CZK",
  SE: "SEK", NO: "NOK", DK: "DKK", CH: "CHF", RU: "RUB", UA: "UAH", TR: "TRY",
  IN: "INR", PK: "PKR", BD: "BDT", LK: "LKR", NP: "NPR", CN: "CNY", HK: "HKD",
  TW: "TWD", JP: "JPY", KR: "KRW", SG: "SGD", MY: "MYR", ID: "IDR", TH: "THB",
  VN: "VND", PH: "PHP", AU: "AUD", NZ: "NZD", AE: "AED", SA: "SAR", QA: "QAR",
  KW: "KWD", IL: "ILS", EG: "EGP", ZA: "ZAR", NG: "NGN", KE: "KES", GH: "GHS",
  MA: "MAD",
};

/** A short, friendly region list for the Settings picker (label ⇄ ISO code). */
export interface RegionMeta {
  code: string;
  label: string;
}
export const REGIONS: RegionMeta[] = [
  { code: "US", label: "United States" }, { code: "CA", label: "Canada" },
  { code: "GB", label: "United Kingdom" }, { code: "IE", label: "Ireland" },
  { code: "FR", label: "France" }, { code: "DE", label: "Germany" },
  { code: "ES", label: "Spain" }, { code: "IT", label: "Italy" },
  { code: "NL", label: "Netherlands" }, { code: "PT", label: "Portugal" },
  { code: "PL", label: "Poland" }, { code: "SE", label: "Sweden" },
  { code: "CH", label: "Switzerland" }, { code: "RU", label: "Russia" },
  { code: "UA", label: "Ukraine" }, { code: "TR", label: "Türkiye" },
  { code: "BR", label: "Brazil" }, { code: "MX", label: "Mexico" },
  { code: "AR", label: "Argentina" }, { code: "IN", label: "India" },
  { code: "PK", label: "Pakistan" }, { code: "BD", label: "Bangladesh" },
  { code: "CN", label: "China" }, { code: "JP", label: "Japan" },
  { code: "KR", label: "South Korea" }, { code: "SG", label: "Singapore" },
  { code: "MY", label: "Malaysia" }, { code: "ID", label: "Indonesia" },
  { code: "TH", label: "Thailand" }, { code: "VN", label: "Vietnam" },
  { code: "PH", label: "Philippines" }, { code: "AU", label: "Australia" },
  { code: "NZ", label: "New Zealand" }, { code: "AE", label: "UAE" },
  { code: "SA", label: "Saudi Arabia" }, { code: "IL", label: "Israel" },
  { code: "ZA", label: "South Africa" }, { code: "NG", label: "Nigeria" },
  { code: "KE", label: "Kenya" },
];

/** ISO-4217 codes offered when a user overrides currency manually. */
export const CURRENCY_CODES: string[] = Array.from(
  new Set(Object.values(REGION_CURRENCY)),
).sort();

/** Regions whose calendars start the week on Sunday; everyone else on Monday. */
const SUNDAY_START = new Set([
  "US", "CA", "JP", "IN", "PH", "BR", "IL", "ZA", "KE", "AU", "NZ", "SA", "AE",
]);
export type WeekStart = 0 | 1; // 0 = Sunday, 1 = Monday
export function weekStartFor(region: string): WeekStart {
  return SUNDAY_START.has(region) ? 0 : 1;
}

/** Regions that conventionally use a 12-hour clock. */
const TWELVE_HOUR = new Set(["US", "CA", "AU", "NZ", "IN", "PH", "PK", "EG"]);
export function hour12For(region: string): boolean {
  return TWELVE_HOUR.has(region);
}

/** The user's fully-resolved locale preferences. */
export interface LocalePrefs {
  language: string;
  region: string;
  currency: string;
  timezone: string;
  weekStart: WeekStart;
  hour12: boolean;
}

const DEFAULT_TIMEZONE = "UTC";
/** Neutral fallback when nothing can be detected — deliberately NOT India. */
export const FALLBACK_PREFS: LocalePrefs = {
  language: "en",
  region: "US",
  currency: "USD",
  timezone: DEFAULT_TIMEZONE,
  weekStart: 0,
  hour12: true,
};

function supportedLanguage(code: string): string {
  const base = (code.split("-")[0] ?? "en").toLowerCase();
  return LANGUAGES.some((l) => l.code === base) ? base : "en";
}

/**
 * Best-effort detection from the browser. Region comes from the language's
 * region subtag when present (e.g. "en-GB" → GB); currency and week-start are
 * derived from region; timezone from the Intl runtime. Safe on the server
 * (returns the neutral fallback).
 */
export function detectPrefs(): LocalePrefs {
  if (typeof navigator === "undefined") return FALLBACK_PREFS;

  const nav = navigator.language || "en-US";
  const regionSub = nav.split("-")[1];
  const language = supportedLanguage(nav);
  const region =
    regionSub && regionSub.length === 2
      ? regionSub.toUpperCase()
      : FALLBACK_PREFS.region;

  let timezone = DEFAULT_TIMEZONE;
  try {
    timezone =
      Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_TIMEZONE;
  } catch {
    /* keep fallback */
  }

  const currency = REGION_CURRENCY[region] ?? FALLBACK_PREFS.currency;
  return {
    language,
    region,
    currency,
    timezone,
    weekStart: weekStartFor(region),
    hour12: hour12For(region),
  };
}

/** Merge a partial saved override onto detected defaults, keeping consistency. */
export function resolvePrefs(
  detected: LocalePrefs,
  saved?: Partial<LocalePrefs> | null,
): LocalePrefs {
  if (!saved) return detected;
  const region = saved.region ?? detected.region;
  return {
    language: saved.language
      ? supportedLanguage(saved.language)
      : detected.language,
    region,
    currency: saved.currency ?? REGION_CURRENCY[region] ?? detected.currency,
    timezone: saved.timezone ?? detected.timezone,
    weekStart: saved.weekStart ?? weekStartFor(region),
    hour12: saved.hour12 ?? hour12For(region),
  };
}
