/**
 * Live amount grouping as the user types. Uses the region's own digit grouping —
 * India groups in lakhs/crores (1,00,000), most others in thousands (100,000) —
 * while always keeping "." as the decimal point and "," as the group separator,
 * so the value parses back cleanly regardless of the user's OS locale.
 */

/** Which grouping style to use for a region/currency. India-first. */
export function groupingLocale(region?: string, currency?: string): string {
  return region === "IN" || currency === "INR" ? "en-IN" : "en-US";
}

/**
 * Format a raw input string as the person types.
 * Returns the display string (grouped) and the numeric value.
 * Accepts messy input (letters, extra dots) and never throws.
 */
export function formatAmountTyping(raw: string, locale: string): { display: string; value: number } {
  const cleaned = (raw ?? "").replace(/[^\d.]/g, "");
  if (cleaned === "") return { display: "", value: 0 };

  const firstDot = cleaned.indexOf(".");
  const hasDot = firstDot !== -1;
  let intDigits = (hasDot ? cleaned.slice(0, firstDot) : cleaned).replace(/^0+(?=\d)/, "");
  const decDigits = hasDot ? cleaned.slice(firstDot + 1).replace(/\./g, "").slice(0, 2) : null;

  const groupedInt =
    intDigits === "" ? (hasDot ? "0" : "") : new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(Number(intDigits));

  const display = decDigits === null ? groupedInt : `${groupedInt}.${decDigits}`;
  const value = Number(`${intDigits === "" ? "0" : intDigits}.${decDigits ?? "0"}`);
  return { display, value: Number.isFinite(value) ? value : 0 };
}

/** Turn a grouped display string back into a number (strips separators). */
export function parseAmount(display: string): number {
  const n = Number((display ?? "").replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

/** Seed the field from a stored number, grouped for the given locale. */
export function displayFromValue(value: number | undefined, locale: string): string {
  if (value === undefined || value === null || !Number.isFinite(value) || value === 0) return "";
  return formatAmountTyping(String(value), locale).display;
}
