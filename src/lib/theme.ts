export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "renew-theme";
const THEME_EVENT = "renew-theme-change";

/**
 * The inline script string injected before hydration to set the theme on
 * <html data-theme> so there is NO flash and NO hydration mismatch.
 * The deep champagne-gold dark world is the primary/default experience;
 * users can switch to light in Settings.
 */
export const themeNoFlashScript = `
(function () {
  try {
    var stored = localStorage.getItem("${THEME_STORAGE_KEY}");
    var theme = stored === "dark" || stored === "light" ? stored : "dark";
    document.documentElement.setAttribute("data-theme", theme);
  } catch (e) {
    document.documentElement.setAttribute("data-theme", "dark");
  }
})();
`;

/** Read the current theme from the DOM (source of truth after the script runs). */
function readTheme(): Theme {
  if (typeof document === "undefined") return "dark";
  const attr = document.documentElement.getAttribute("data-theme");
  return attr === "light" ? "light" : "dark";
}

/** Apply + persist a theme and notify subscribers. */
export function setTheme(theme: Theme): void {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* ignore storage errors (private mode) */
  }
  window.dispatchEvent(new Event(THEME_EVENT));
}

export function toggleTheme(): void {
  setTheme(readTheme() === "dark" ? "light" : "dark");
}

/* --- useSyncExternalStore wiring (SSR-safe, client-only detection) -------- */
export function subscribeTheme(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(THEME_EVENT, callback);
  const onStorage = (e: StorageEvent) => {
    if (e.key === THEME_STORAGE_KEY) callback();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(THEME_EVENT, callback);
    window.removeEventListener("storage", onStorage);
  };
}

export function getThemeSnapshot(): Theme {
  return readTheme();
}

export function getThemeServerSnapshot(): Theme {
  return "dark";
}
