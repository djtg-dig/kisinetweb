"use client";

import { useEffect, useState } from "react";
import { JoinRequestModal } from "@/components/pharmacies/join-request-modal";
import type { PharmacySummary } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

type PublicPharmacyDetailProps = {
  pharmacy: PharmacySummary;
};

export function PublicPharmacyDetail({ pharmacy }: PublicPharmacyDetailProps) {
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [loginToast, setLoginToast] = useState("");

  useEffect(() => {
    if (!loginToast) {
      return;
    }

    const timer = setTimeout(() => {
      setLoginToast("");
    }, 3500);

    return () => clearTimeout(timer);
  }, [loginToast]);

  function openJoinRequest() {
    if (!getAccessToken()) {
      setLoginToast("Veuillez d'abord vous connecter.");
      return;
    }

    setIsJoinModalOpen(true);
  }

  return (
    <>
      {loginToast && (
        <ToastMessage onClose={() => setLoginToast("")}>{loginToast}</ToastMessage>
      )}

      <main className="bg-app-background">
        <section className="border-b border-app-border bg-app-surface">
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
            <a
              href="/pharmacies"
              className="text-sm font-semibold text-primary-700 transition hover:text-primary-800"
            >
              Retour
            </a>
            <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-primary-700">
                  {pharmacy.reference}
                </p>
                <h1 className="mt-3 max-w-3xl text-3xl font-bold text-app-text sm:text-4xl">
                  {pharmacy.name}
                </h1>
                <p className="mt-4 max-w-3xl text-sm leading-6 text-app-muted sm:text-base">
                  {pharmacy.addressLine ||
                    "Les informations d'adresse de cette pharmacie ne sont pas encore renseignées."}
                </p>
              </div>

              <div className="rounded-lg border border-app-border bg-app-card p-5 shadow-soft">
                <p className="text-sm font-semibold text-app-text">
                  Rejoindre cette pharmacie
                </p>
                <p className="mt-2 text-sm leading-6 text-app-muted">
                  Envoyez une demande d'intégration à l'équipe de cette pharmacie.
                </p>
                <button
                  type="button"
                  onClick={openJoinRequest}
                  className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-md bg-success-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-success-700 focus:outline-none focus:ring-4 focus:ring-success-100"
                >
                  Devenir employé
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
          <div className="grid gap-4">
            <article className="rounded-lg border border-app-border bg-app-card p-5">
              <h2 className="text-lg font-bold text-app-text">Coordonnées</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Detail label="Email" value={pharmacy.email} />
                <Detail label="Téléphone" value={pharmacy.phoneNumber} />
                <Detail label="Pays" value={pharmacy.country} />
                <Detail label="Ville ou province" value={pharmacy.cityOrProvince} />
              </div>
            </article>

            <article className="rounded-lg border border-app-border bg-app-card p-5">
              <h2 className="text-lg font-bold text-app-text">Adresse</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Detail label="Quartier" value={pharmacy.neighborhood} />
                <Detail label="Rue" value={pharmacy.street} />
                <Detail label="Latitude" value={pharmacy.latitude} />
                <Detail label="Longitude" value={pharmacy.longitude} />
              </div>
            </article>
          </div>

          <aside className="h-fit rounded-lg border border-app-border bg-app-card p-5">
            <h2 className="text-lg font-bold text-app-text">Informations</h2>
            <div className="mt-5 grid gap-4">
              <Detail label="Référence" value={pharmacy.reference} />
              <Detail label="Devise" value={pharmacy.devise} />
            </div>
          </aside>
        </section>
      </main>

      <JoinRequestModal
        pharmacy={isJoinModalOpen ? pharmacy : null}
        onClose={() => setIsJoinModalOpen(false)}
      />
    </>
  );
}

function Detail({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-app-muted">
        {label}
      </p>
      <p className="mt-1 font-medium text-app-text">{value || "Non renseigné"}</p>
    </div>
  );
}

function ToastMessage({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-x-3 top-20 z-[1200] sm:left-auto sm:right-5 sm:w-[min(420px,calc(100vw-40px))] lg:top-24">
      <div
        role="status"
        aria-live="polite"
        className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-800 shadow-soft"
      >
        <p className="min-w-0 flex-1">{children}</p>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-md px-2 py-1 text-xs font-bold transition hover:bg-white/60 focus:outline-none focus:ring-2 focus:ring-primary-100"
          aria-label="Fermer le message"
        >
          X
        </button>
      </div>
    </div>
  );
}
