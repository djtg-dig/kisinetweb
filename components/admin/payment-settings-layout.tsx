import type { ReactNode } from "react";
import { PaymentSettingsNav } from "@/components/admin/payment-settings-nav";

// Layout de la section "Paramètres de paiement".
// Il affiche un en-tête commun et la navigation interne, puis le contenu de la
// sous-page active. Il évite de dupliquer l'en-tête dans chaque page.
export function PaymentSettingsLayout({ children }: { children: ReactNode }) {
  return (
    <section className="space-y-4">
      <div className="rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
        <p className="text-sm font-semibold text-primary-700">Administration</p>
        <h2 className="mt-2 text-2xl font-bold text-app-text">Paramètres de paiement</h2>
        <p className="mt-2 text-sm text-app-muted">
          Gérez les catégories, les fournisseurs et les comptes de paiement.
        </p>
      </div>

      <PaymentSettingsNav />

      {children}
    </section>
  );
}
