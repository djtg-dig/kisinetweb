"use client";

import { useEffect, useState } from "react";
import { LoadingBubble } from "@/components/ui/loading-bubble";
import { getAdminPaymentProviders, type AdminPaymentProvider } from "@/lib/api/admin";

type PageState = "loading" | "ready" | "error";

// Page dédiée à la liste des fournisseurs de paiement disponibles côté administration.
export default function AdminPaymentProvidersPage() {
  const [providers, setProviders] = useState<AdminPaymentProvider[]>([]);
  const [state, setState] = useState<PageState>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let isCurrent = true;

    async function loadProviders() {
      setState("loading");
      setMessage("");

      try {
        const data = await getAdminPaymentProviders();
        if (!isCurrent) {
          return;
        }
        setProviders(data);
        setState("ready");
      } catch (error) {
        if (!isCurrent) {
          return;
        }
        setState("error");
        setMessage(error instanceof Error ? error.message : "Chargement impossible.");
      }
    }

    void loadProviders();

    return () => {
      isCurrent = false;
    };
  }, []);

  return (
    <section className="space-y-4">
      <div className="rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
        <p className="text-sm font-semibold text-primary-700">Administration</p>
        <h2 className="mt-2 text-2xl font-bold text-app-text">Systèmes de paiements</h2>
        <p className="mt-2 text-sm text-app-muted">
          Liste des fournisseurs de paiement disponibles et accessibles depuis l’API admin.
        </p>
      </div>

      {message && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {message}
        </div>
      )}

      {state === "loading" && (
        <div className="rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
          <LoadingBubble label="Chargement des fournisseurs" className="min-h-[220px]" />
        </div>
      )}

      {state === "error" && (
        <div className="rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
          <p className="text-sm font-semibold text-red-700">Chargement impossible</p>
          <p className="mt-2 text-sm text-app-muted">{message}</p>
        </div>
      )}

      {state === "ready" && (
        <div className="overflow-hidden rounded-lg border border-app-border bg-app-card shadow-sm">
          {providers.length === 0 ? (
            <div className="p-6 text-sm text-app-muted">
              Aucun fournisseur de paiement n’a été retourné par l’API.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-app-border text-left text-sm">
                <thead className="bg-app-surface text-xs font-bold uppercase text-app-muted">
                  <tr>
                    <th className="px-3 py-3">Nom</th>
                    <th className="px-3 py-3">Code</th>
                    <th className="px-3 py-3">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-app-border">
                  {providers.map((provider) => (
                    <tr key={provider.id} className="align-top">
                      <td className="px-3 py-3 font-semibold text-app-text">
                        {provider.display_name || provider.name || `Fournisseur #${provider.id}`}
                      </td>
                      <td className="px-3 py-3 font-mono text-app-muted">
                        {provider.code || provider.slug || "-"}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            provider.is_active
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {provider.is_active ? "Actif" : "Inactif"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
