"use client";

import { useTheme } from "@/components/theme/theme-provider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"}
      className="inline-flex min-h-11 items-center justify-center rounded-md border border-app-border bg-app-card px-3 py-2.5 text-sm font-semibold text-app-text transition hover:bg-primary-50 focus:outline-none focus:ring-4 focus:ring-primary-100"
    >
      {theme === "dark" ? "Clair" : "Sombre"}
    </button>
  );
}
