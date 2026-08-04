"use client";

import { useState } from "react";

// Les onglets principaux du module de configuration de l'administration.
type SettingsTab = "payments";

const settingsTabs: Array<{ id: SettingsTab; label: string }> = [
  { id: "payments", label: "Systèmes de paiements" },
];

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("payments");

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
          {settingsTabs.map((tab) => {
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
                  isActive
                    ? "bg-primary-600 text-white"
                    : "bg-app-surface text-app-text hover:bg-primary-50"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Contenu minimal du panneau de configuration pour le premier onglet. */}
        <div className="mt-6 space-y-4">
          {activeTab === "payments" && (
            <>
              <div className="rounded-lg border border-app-border bg-app-surface p-4">
                <h3 className="text-lg font-semibold text-app-text">Systèmes de paiements</h3>
                <p className="mt-2 text-sm text-app-muted">
                  Cette section regroupe les options principales liées aux paiements et aux
                  intégrations associées.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-app-border bg-app-surface p-4">
                  <p className="text-sm font-semibold text-primary-700">État actuel</p>
                  <p className="mt-2 text-sm text-app-muted">
                    Les réglages de paiement sont prêts à être complétés selon les besoins métier.
                  </p>
                </div>
                <div className="rounded-lg border border-app-border bg-app-surface p-4">
                  <p className="text-sm font-semibold text-primary-700">Prochaine étape</p>
                  <p className="mt-2 text-sm text-app-muted">
                    Ajouter ici les fournisseurs, les clés de configuration et les règles de
                    validation.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
