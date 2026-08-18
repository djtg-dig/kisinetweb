// Navigation horizontale de la section « IA » du tableau de bord admin.
//
// Sous-pages (section 9 du cahier des charges) accessibles uniquement aux
// administrateurs, regroupées sous /admin/dashboard. Réutilise le design
// system (liens primaires actifs sur fond primary-600).

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const aiNavItems = [
  { label: "Vue générale", href: "/admin/dashboard" },
  { label: "Analyses", href: "/admin/dashboard/analyses" },
  { label: "Statistiques", href: "/admin/dashboard/statistiques" },
  { label: "Erreurs", href: "/admin/dashboard/erreurs" },
  { label: "Logs", href: "/admin/dashboard/logs" },
  { label: "Consommation", href: "/admin/dashboard/consommation" },
  { label: "Coûts", href: "/admin/dashboard/couts" },
];

export function AdminAiNav() {
  const pathname = usePathname();

  function isActive(href: string): boolean {
    if (href === "/admin/dashboard") {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <nav
      aria-label="Sections du tableau de bord IA"
      className="flex flex-wrap gap-2 rounded-lg border border-app-border bg-app-card p-2 shadow-sm"
    >
      {aiNavItems.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
              active
                ? "bg-primary-600 text-white"
                : "bg-app-surface text-app-text hover:bg-primary-50"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
