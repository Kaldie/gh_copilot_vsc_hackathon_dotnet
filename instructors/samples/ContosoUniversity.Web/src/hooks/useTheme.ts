import { useCallback, useEffect, useSyncExternalStore } from "react";

export type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "theme";

function getSystemTheme(): "light" | "dark" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getStoredTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") return stored;
  return "system";
}

function applyTheme(theme: Theme) {
  const resolved = theme === "system" ? getSystemTheme() : theme;
  document.documentElement.classList.toggle("dark", resolved === "dark");
}

let currentTheme: Theme = getStoredTheme();
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): Theme {
  return currentTheme;
}

function setThemeInternal(theme: Theme) {
  currentTheme = theme;
  if (theme === "system") {
    localStorage.removeItem(STORAGE_KEY);
  } else {
    localStorage.setItem(STORAGE_KEY, theme);
  }
  applyTheme(theme);
  for (const l of listeners) l();
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot);

  const resolvedTheme: "light" | "dark" =
    theme === "system" ? getSystemTheme() : theme;

  const setTheme = useCallback((t: Theme) => {
    setThemeInternal(t);
  }, []);

  useEffect(() => {
    applyTheme(theme);

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (currentTheme === "system") {
        applyTheme("system");
        for (const l of listeners) l();
      }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  return { theme, resolvedTheme, setTheme } as const;
}
