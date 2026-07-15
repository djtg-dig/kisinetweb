"use client";

import { useEffect, useMemo, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { LoadingBubble } from "@/components/ui/loading-bubble";
import { getUserPharmacies, type PharmacySummary } from "@/lib/api";
import {
  getAccessToken,
  getActivePharmacyId,
  logout,
  saveTokensFromUrlHash,
} from "@/lib/auth";
import { carriAccountLoginUrl } from "@/lib/carri-account";

type PageState = "loading" | "anonymous" | "ready";

export default function AccountSettingsPage() {
  const [state, setState] = useState<PageState>("loading");
  const [activePharmacyId, setActivePharmacyId] = useState("");
  const [activePharmacy, setActivePharmacy] = useState<PharmacySummary | null>(null);
  const [pharmacyCount, setPharmacyCount] = useState(0);
  const [pharmacyLoadMessage, setPharmacyLoadMessage] = useState("");

  useEffect(() => {
    async function loadSettingsContext() {
      saveTokensFromUrlHash();

      const accessToken = getAccessToken();
      if (!accessToken) {
        setState("anonymous");
        return;
      }

      const storedPharmacyId = getActivePharmacyId();
      setActivePharmacyId(storedPharmacyId);

      try {
        const pharmacies = await getUserPharmacies();
        setPharmacyCount(pharmacies.length);
        setActivePharmacy(
          pharmacies.find((pharmacy) => pharmacy.id === storedPharmacyId) || null,
        );
      } catch {
        setPharmacyLoadMessage(
          "Les informations de pharmacie ne sont pas disponibles pour le moment.",
        );
      } finally {
        setState("ready");
      }
    }

    loadSettingsContext();
  }, []);

  const activePharmacySettingsHref = useMemo(() => {
    if (!activePharmacyId) {
      return "";
    }

    return "/app/pharmacies/" + activePharmacyId + "/settings";
  }, [activePharmacyId]);

  return (
    <MainLayout>
      <section className="border-b border-app-border bg-app-surface">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-8 sm:px-6 lg:px-8">
          <div>
            <p className="text-sm font-semibold text-primary-700">Compte</p>
            <h1 className="mt-2 text-3xl font-bold text-app-text">Paramètres généraux</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-app-muted">
              Gérez les préférences liées à votre compte Kisinet, sans modifier les
              paramètres métier d'une pharmacie précise.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto min-h-[calc(100vh-235px)] max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {state === "loading" && (
          <section className="rounded-lg border border-app-border bg-app-card p-8 shadow-sm">
            <LoadingBubble label="Chargement des paramètres" className="min-h-[220px]" />
          </section>
        )}

        {state === "anonymous" && <AnonymousState />}

        {state === "ready" && (
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <section className="space-y-6">
              <ActivePharmacyPanel
                activePharmacy={activePharmacy}
                activePharmacyId={activePharmacyId}
                activePharmacySettingsHref={activePharmacySettingsHref}
                pharmacyCount={pharmacyCount}
                message={pharmacyLoadMessage}
              />

              <section className="rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
                <p className="text-sm font-semibold text-primary-700">Préférences</p>
                <h2 className="mt-2 text-xl font-bold text-app-text">Confort d'utilisation</h2>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <InfoTile label="Langue" value="Français" />
                  <InfoTile label="Connexion" value="Carri Account" />
                  <InfoTile label="Thème" value="Compatible clair et sombre" />
                  <InfoTile label="Espace actif" value={activePharmacyId || "Non sélectionné"} />
                </div>
              </section>
            </section>

            <aside className="space-y-6">
              <section className="rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
                <p className="text-sm font-semibold text-primary-700">Raccourcis</p>
                <h2 className="mt-2 text-xl font-bold text-app-text">Accès rapides</h2>
                <div className="mt-5 grid gap-3">
                  <SettingsLink
                    href="/app/profile"
                    title="Mon profil"
                    description="Consulter les informations de votre compte."
                  />
                  <SettingsLink
                    href="/app/select-pharmacy"
                    title="Mes pharmacies"
                    description="Changer de pharmacie ou ouvrir un espace de travail."
                  />
                  <SettingsLink
                    href="/app/pharmacies/create"
                    title="Créer une pharmacie"
                    description="Ajouter une nouvelle pharmacie à votre compte."
                  />
                  <SettingsLink
                    href="/tarifs"
                    title="Tarifs"
                    description="Consulter les offres disponibles."
                  />
                  <SettingsLink
                    href="/help"
                    title="Aide"
                    description="Trouver une assistance ou une information utile."
                  />
                </div>
              </section>

              <section className="rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
                <p className="text-sm font-semibold text-primary-700">Sécurité</p>
                <h2 className="mt-2 text-xl font-bold text-app-text">Session</h2>
                <p className="mt-3 text-sm leading-6 text-app-muted">
                  La connexion à Kisinet passe par Carri Account. Vous pouvez fermer
                  votre session sur cet appareil.
                </p>
                <Button onClick={logout} variant="secondary" className="mt-5 w-full sm:w-auto">
                  Déconnexion
                </Button>
              </section>
            </aside>
          </div>
        )}
      </section>
    </MainLayout>
  );
}

function AnonymousState() {
  return (
    <section className="max-w-2xl rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
      <p className="text-sm font-semibold text-primary-700">Connexion requise</p>
      <h2 className="mt-2 text-xl font-bold text-app-text">Paramètres indisponibles</h2>
      <p className="mt-2 text-sm leading-6 text-app-muted">
        Connectez-vous avec Carri Account pour accéder aux paramètres de votre
        compte Kisinet.
      </p>
      <LinkButton href={carriAccountLoginUrl} className="mt-5">
        Se connecter
      </LinkButton>
    </section>
  );
}

function ActivePharmacyPanel({
  activePharmacy,
  activePharmacyId,
  activePharmacySettingsHref,
  pharmacyCount,
  message,
}: {
  activePharmacy: PharmacySummary | null;
  activePharmacyId: string;
  activePharmacySettingsHref: string;
  pharmacyCount: number;
  message: string;
}) {
  return (
    <section className="rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
      <p className="text-sm font-semibold text-primary-700">Pharmacie active</p>
      <h2 className="mt-2 text-xl font-bold text-app-text">
        {activePharmacy?.name || "Aucune pharmacie active"}
      </h2>
      <p className="mt-3 text-sm leading-6 text-app-muted">
        {activePharmacy
          ? "Les paramètres métier restent disponibles depuis l'espace de cette pharmacie."
          : "Sélectionnez une pharmacie pour accéder à ses paramètres métier."}
      </p>

      {message && (
        <p className="mt-4 rounded-md border border-app-border bg-app-surface px-4 py-3 text-sm text-app-muted">
          {message}
        </p>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <InfoTile label="Pharmacies accessibles" value={String(pharmacyCount)} />
        <InfoTile label="Référence active" value={activePharmacyId || "Non sélectionnée"} />
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <LinkButton href="/app/select-pharmacy" variant="secondary">
          Changer de pharmacie
        </LinkButton>
        {activePharmacySettingsHref && (
          <LinkButton href={activePharmacySettingsHref}>
            Paramètres de la pharmacie
          </LinkButton>
        )}
      </div>
    </section>
  );
}

function SettingsLink({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <a
      href={href}
      className="block rounded-md border border-app-border bg-app-surface px-4 py-3 transition hover:border-primary-200 hover:bg-primary-50"
    >
      <span className="block text-sm font-semibold text-app-text">{title}</span>
      <span className="mt-1 block text-sm leading-5 text-app-muted">{description}</span>
    </a>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-app-border bg-app-surface px-4 py-3">
      <p className="text-xs font-semibold text-app-muted">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-app-text">{value}</p>
    </div>
  );
}
