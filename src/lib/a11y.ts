/**
 * Accessibility preferences the person controls in Settings — text size, high
 * contrast, and reduce-motion. They're applied to <html> as data attributes
 * (data-text-size / data-contrast / data-reduce-motion) that globals.css reacts
 * to, and persisted in localStorage. Mirrors the theme system so there's no
 * flash on load.
 */

export type TextSize = "normal" | "large" | "larger";

export const A11Y_TEXT_KEY = "renew-text-size";
export const A11Y_CONTRAST_KEY = "renew-contrast";
export const A11Y_MOTION_KEY = "renew-reduce-motion";
export const A11Y_BOLD_KEY = "renew-bold-text";
export const A11Y_UNDERLINE_KEY = "renew-underline-links";
const A11Y_EVENT = "renew-a11y-change";

/** Inline, run-before-hydration script: apply saved a11y prefs with no flash. */
export const a11yNoFlashScript = `
(function () {
  try {
    var el = document.documentElement;
    var ts = localStorage.getItem("${A11Y_TEXT_KEY}");
    if (ts === "large" || ts === "larger") el.setAttribute("data-text-size", ts);
    if (localStorage.getItem("${A11Y_CONTRAST_KEY}") === "1") el.setAttribute("data-contrast", "1");
    if (localStorage.getItem("${A11Y_MOTION_KEY}") === "1") el.setAttribute("data-reduce-motion", "1");
    if (localStorage.getItem("${A11Y_BOLD_KEY}") === "1") el.setAttribute("data-bold-text", "1");
    if (localStorage.getItem("${A11Y_UNDERLINE_KEY}") === "1") el.setAttribute("data-underline-links", "1");
  } catch (e) {}
})();
`;

/** Generic on/off pref backed by a data-attribute on <html> + localStorage. */
function getFlag(attr: string): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.getAttribute(attr) === "1";
}
function setFlag(attr: string, key: string, on: boolean): void {
  if (typeof document === "undefined") return;
  if (on) document.documentElement.setAttribute(attr, "1");
  else document.documentElement.removeAttribute(attr);
  try { localStorage.setItem(key, on ? "1" : "0"); } catch {}
  window.dispatchEvent(new Event(A11Y_EVENT));
}

export function getBoldText(): boolean { return getFlag("data-bold-text"); }
export function setBoldText(on: boolean): void { setFlag("data-bold-text", A11Y_BOLD_KEY, on); }
export function getUnderlineLinks(): boolean { return getFlag("data-underline-links"); }
export function setUnderlineLinks(on: boolean): void { setFlag("data-underline-links", A11Y_UNDERLINE_KEY, on); }

export function getTextSize(): TextSize {
  if (typeof document === "undefined") return "normal";
  const v = document.documentElement.getAttribute("data-text-size");
  return v === "large" || v === "larger" ? v : "normal";
}
export function setTextSize(v: TextSize): void {
  if (typeof document === "undefined") return;
  if (v === "normal") document.documentElement.removeAttribute("data-text-size");
  else document.documentElement.setAttribute("data-text-size", v);
  try { localStorage.setItem(A11Y_TEXT_KEY, v); } catch {}
  window.dispatchEvent(new Event(A11Y_EVENT));
}

export function getContrast(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.getAttribute("data-contrast") === "1";
}
export function setContrast(on: boolean): void {
  if (typeof document === "undefined") return;
  if (on) document.documentElement.setAttribute("data-contrast", "1");
  else document.documentElement.removeAttribute("data-contrast");
  try { localStorage.setItem(A11Y_CONTRAST_KEY, on ? "1" : "0"); } catch {}
  window.dispatchEvent(new Event(A11Y_EVENT));
}

export function getReduceMotion(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.getAttribute("data-reduce-motion") === "1";
}
export function setReduceMotion(on: boolean): void {
  if (typeof document === "undefined") return;
  if (on) document.documentElement.setAttribute("data-reduce-motion", "1");
  else document.documentElement.removeAttribute("data-reduce-motion");
  try { localStorage.setItem(A11Y_MOTION_KEY, on ? "1" : "0"); } catch {}
  window.dispatchEvent(new Event(A11Y_EVENT));
}

export function subscribeA11y(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(A11Y_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(A11Y_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}
