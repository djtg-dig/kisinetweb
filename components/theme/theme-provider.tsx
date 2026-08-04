"use client";

import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";

type Theme = "light" | "dark" | "system";

const THEME_KEY = "kisinet:theme";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: "system",
  setTheme: () => {},
});

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") {
    return "light";
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function resolveTheme(theme: Theme): "light" | "dark" {
  if (theme === "system") {
    return getSystemTheme();
  }
  return theme;
}

function readStoredTheme(): Theme {
  if (typeof window === "undefined") {
    return "system";
  }
  const stored = window.localStorage.getItem(THEME_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }
  return "system";
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const resolved = resolveTheme(theme);
  if (resolved === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

let currentTheme: Theme = "system";
const listeners = new Set<() => void>();
let initialized = false;

function emit() {
  listeners.forEach((listener) => listener());
}

function ensureInitialized() {
  if (initialized || typeof window === "undefined") {
    return;
  }
  initialized = true;

  currentTheme = readStoredTheme();
  applyTheme(currentTheme);

  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", () => {
    if (currentTheme === "system") {
      applyTheme(currentTheme);
    }
    emit();
  });

  window.addEventListener("storage", (event) => {
    if (event.key === THEME_KEY && event.newValue !== null) {
      const next = event.newValue as Theme;
      if (next === "light" || next === "dark" || next === "system") {
        currentTheme = next;
        applyTheme(next);
        emit();
      }
    }
  });
}

function subscribe(callback: () => void) {
  ensureInitialized();
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function getSnapshot(): Theme {
  return currentTheme;
}

function getServerSnapshot(): Theme {
  return "system";
}

function setTheme(next: Theme) {
  if (typeof window === "undefined") {
    return;
  }
  currentTheme = next;
  window.localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
  emit();
}

export function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, setTheme }),
    [theme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
