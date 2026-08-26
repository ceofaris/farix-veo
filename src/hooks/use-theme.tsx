import { useCallback, useEffect, useSyncExternalStore } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "farix-theme";

let current: Theme = "dark";
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function apply(theme: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot(): Theme {
  return current;
}

function getServerSnapshot(): Theme {
  return "dark";
}

function setThemeGlobal(next: Theme) {
  current = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* ignore */
  }
  apply(next);
  emit();
}

let initialized = false;

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    if (initialized) return;
    initialized = true;
    let stored: Theme | null = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    } catch {
      /* ignore */
    }
    const initial: Theme =
      stored ??
      (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
    current = initial;
    apply(initial);
    emit();
  }, []);

  const setTheme = useCallback((next: Theme) => setThemeGlobal(next), []);
  const toggle = useCallback(
    () => setThemeGlobal(current === "dark" ? "light" : "dark"),
    [],
  );

  return { theme, setTheme, toggle };
}
