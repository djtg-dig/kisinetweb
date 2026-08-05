"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Navigation interne de la section "Paramètres de paiement".
// Les liens pointent vers les routes de la section, jamais vers une URL d'API.
const paymentSettingsTabs = [
  { label: "Catégories de paiement", href: "/admin/settings/payment-categories" },
  { label: "Fournisseurs de paiement", href: "/admin/settings/payment-providers" },
  { label: "Comptes de paiement", href: "/admin/settings/user-payment-accounts" },
];

// Barre d'onglets permettant de naviguer entre les sous-sections de paiement.
// L'onglet actif est déterminé à partir du chemin courant.
export function PaymentSettingsNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigation des paramètres de paiement"
      className="flex flex-wrap gap-2 rounded-lg border border-app-border bg-app-surface p-2 shadow-sm"
    >
      {paymentSettingsTabs.map((tab) => {
        const isActive = pathname === tab.href;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={isActive ? "page" : undefined}
            className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
              isActive
                ? "bg-primary-600 text-white"
                : "text-app-text hover:bg-primary-50"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
