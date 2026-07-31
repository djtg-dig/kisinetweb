"use client";

import { useTheme } from "@/components/theme/theme-provider";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  function handleToggle() {
    if (theme === "system") {
      setTheme("light");
      return;
    }
    setTheme(theme === "dark" ? "light" : "dark");
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={
        theme === "dark"
          ? "Passer en mode clair"
          : theme === "light"
            ? "Passer en mode sombre"
            : "Utiliser le thème système"
      }
      className="inline-flex min-h-11 items-center justify-center rounded-md border border-app-border bg-app-card px-3 py-2.5 text-sm font-semibold text-app-text transition hover:bg-primary-50 focus:outline-none focus:ring-4 focus:ring-primary-100"
    >
      {theme === "dark" ? "Clair" : theme === "light" ? "Sombre" : "Auto"}
    </button>
  );
}
