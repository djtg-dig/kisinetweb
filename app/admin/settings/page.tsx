"use client";

import Link from "next/link";

export default function AdminSettingsPage() {
  return (
    <section className="space-y-4">
      <div className="rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
        <p className="text-sm font-semibold text-primary-700">Administration</p>
        <h2 className="mt-2 text-2xl font-bold text-app-text">Paramètres</h2>
        <p className="mt-2 text-sm text-app-muted">
          Gérez les principaux réglages de l’espace d’administration.
        </p>
      </div>

      <div className="rounded-lg border border-app-border bg-app-card p-4 shadow-sm sm:p-6">
        <div className="flex flex-wrap gap-2 border-b border-app-border pb-4">
          <Link
            href="/admin/settings/payment-providers"
            className="rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-primary-700"
          >
            Systèmes de paiements
          </Link>
        </div>

        <div className="mt-6 space-y-4">
          <div className="rounded-lg border border-app-border bg-app-surface p-4">
            <h3 className="text-lg font-semibold text-app-text">Configuration générale</h3>
            <p className="mt-2 text-sm text-app-muted">
              Sélectionnez un module pour ouvrir la page de configuration dédiée.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-app-border bg-app-surface p-4">
              <p className="text-sm font-semibold text-primary-700">État actuel</p>
              <p className="mt-2 text-sm text-app-muted">
                Les réglages de paiement sont accessibles depuis une page dédiée.
              </p>
            </div>
            <div className="rounded-lg border border-app-border bg-app-surface p-4">
              <p className="text-sm font-semibold text-primary-700">Prochaine étape</p>
              <p className="mt-2 text-sm text-app-muted">
                La liste des fournisseurs de paiement est chargée depuis l’API admin.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
