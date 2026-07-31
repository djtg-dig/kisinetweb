"use client";

import { useTheme } from "@/components/theme/theme-provider";
import { useEffect, useRef, useState } from "react";

const themes = [
  { value: "light", label: "Clair", icon: "☀️" },
  { value: "dark", label: "Sombre", icon: "🌙" },
  { value: "system", label: "Système", icon: "💻" },
] as const;

export function ThemeSwitcher({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const current = themes.find((item) => item.value === theme) ?? themes[2];

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className={`relative ${className ?? ""}`} ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Changer le thème"
        title="Changer le thème"
        className="inline-flex items-center justify-center rounded-full border border-app-border bg-app-card p-2 shadow-sm transition hover:bg-app-surface"
      >
        <span aria-hidden="true">{current.icon}</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute bottom-full left-0 mb-2 w-40 overflow-hidden rounded-lg border border-app-border bg-app-card py-1 shadow-sm"
        >
          {themes.map((item) => {
            const isActive = theme === item.value;
            return (
              <button
                key={item.value}
                type="button"
                role="menuitem"
                onClick={() => {
                  setTheme(item.value);
                  setOpen(false);
                }}
                aria-pressed={isActive}
                className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition ${
                  isActive
                    ? "bg-primary-50 text-primary-700"
                    : "text-app-text hover:bg-app-surface"
                }`}
              >
                <span aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}