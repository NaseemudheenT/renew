"use client";

import { useSyncExternalStore } from "react";
import {
  getThemeSnapshot,
  getThemeServerSnapshot,
  subscribeTheme,
  setTheme,
  toggleTheme,
  type Theme,
} from "@/lib/theme";

/** SSR-safe theme hook. Reads from <html data-theme>; never causes a flash. */
export function useTheme(): {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
} {
  const theme = useSyncExternalStore(
    subscribeTheme,
    getThemeSnapshot,
    getThemeServerSnapshot,
  );
  return { theme, setTheme, toggle: toggleTheme };
}
