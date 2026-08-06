"use client";

import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";

type Theme = "light" | "dark" | "system";

const THEME_KEY = "kisinet:theme";
// Cookie de thème lu par le serveur (SSR) afin de rendre le HTML avec la bonne
// classe dès le premier octet. Il est en miroir de localStorage pour rester
// synchronisé avec la logique côté client existante.
const THEME_COOKIE = "kisinet-theme";

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
  // Miroir dans localStorage : conserve le comportement client existant
  // (réactivité, synchronisation inter-onglets via l'événement "storage").
  window.localStorage.setItem(THEME_KEY, next);
  // Miroir dans un cookie : permet au serveur (SSR) de connaître le thème
  // choisi et de rendre le HTML avec la bonne classe dès le premier rendu,
  // ce qui supprime le flash de thème. Le cookie est non sensible (thème
  // uniquement), accessible en lecture côté serveur et en écriture côté client.
  document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
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
