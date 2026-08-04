"use client";

import { createContext, useContext, useEffect, useState } from "react";

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
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
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

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("system");
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const storedTheme = readStoredTheme();
    setTheme(storedTheme);
    setIsHydrated(true);
    applyTheme(storedTheme);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    const root = document.documentElement;
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const updateTheme = () => {
      applyTheme(theme);
    };

    updateTheme();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === THEME_KEY && e.newValue !== null) {
        setTheme(e.newValue as Theme);
        applyTheme(e.newValue as Theme);
      }
    };
    window.addEventListener("storage", handleStorageChange);

    const handleSystemChange = () => {
      if (theme === "system") {
        updateTheme();
      }
    };
    media.addEventListener("change", handleSystemChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      media.removeEventListener("change", handleSystemChange);
    };
  }, [theme, isHydrated]);

  if (!isHydrated) {
    return (
      <ThemeContext.Provider value={{ theme: "system", setTheme }}>
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
