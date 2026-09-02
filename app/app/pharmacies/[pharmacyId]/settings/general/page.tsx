"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { LoadingBubble } from "@/components/ui/loading-bubble";
import { ToastMessage } from "@/components/ui/toast";
import {
  getPharmacyGeneralSettings,
  getPharmacyPermissions,
  updatePharmacyGeneralSettings,
  type PharmacyGeneralSettings,
  type PharmacyPermissions,
  type ReceiptPaperWidth,
} from "@/lib/api";

type GeneralSettingsPageProps = {
  params: Promise<{ pharmacyId: string }>;
};

type PageState = "loading" | "ready" | "error";

type ToastState = {
  tone: "success" | "error";
  text: string;
};

const paperWidthOptions = [
  {
    value: 58,
    label: "58 mm",
    description: "Convient aux imprimantes POS compactes.",
  },
  {
    value: 80,
    label: "80 mm",
    description: "Recommandé pour les imprimantes de caisse standard.",
  },
] satisfies { value: ReceiptPaperWidth; label: string; description: string }[];

export default function GeneralSettingsPage({ params }: GeneralSettingsPageProps) {
  const [pharmacyId, setPharmacyId] = useState("");
  const [state, setState] = useState<PageState>("loading");
  const [settings, setSettings] = useState<PharmacyGeneralSettings | null>(null);
  const [selectedWidth, setSelectedWidth] = useState<ReceiptPaperWidth>(80);
  const [permissions, setPermissions] = useState<PharmacyPermissions>({});
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    async function readParams() {
      const resolvedParams = await params;
      setPharmacyId(resolvedParams.pharmacyId);
    }

    readParams();
  }, [params]);

  useEffect(() => {
    if (!pharmacyId) {
      return;
    }

    let isCurrent = true;

    async function loadGeneralSettings() {
      setState("loading");
      setErrorMessage("");

      try {
        // Le backend reste la source de vérité pour l'accès à la page.
        const [currentPermissions, currentSettings] = await Promise.all([
          getPharmacyPermissions(pharmacyId),
          getPharmacyGeneralSettings(pharmacyId),
        ]);

        if (!isCurrent) {
          return;
        }

        setPermissions(currentPermissions);
        setSettings(currentSettings);
        setSelectedWidth(currentSettings.receiptPaperWidth);
        setState("ready");
      } catch (error) {
        if (!isCurrent) {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Impossible de charger les paramètres généraux de la pharmacie.",
        );
        setState("error");
      }
    }

    loadGeneralSettings();

    return () => {
      isCurrent = false;
    };
  }, [pharmacyId]);

  const basePath = "/app/pharmacies/" + pharmacyId;
  const canEdit = Boolean(permissions.pharmacy_update);
  const hasChanged = Boolean(settings && settings.receiptPaperWidth !== selectedWidth);

  async function saveSettings() {
    if (!pharmacyId || !canEdit || isSaving) {
      return;
    }

    setIsSaving(true);
    setToast(null);

    try {
      // La requête PATCH n'envoie que le choix de largeur modifiable.
      const updatedSettings = await updatePharmacyGeneralSettings(pharmacyId, {
        receiptPaperWidth: selectedWidth,
      });
      setSettings(updatedSettings);
      setSelectedWidth(updatedSettings.receiptPaperWidth);
      setToast({
        tone: "success",
        text: "Les paramètres généraux de la pharmacie ont été mis à jour.",
      });
    } catch (error) {
      setToast({
        tone: "error",
        text:
          error instanceof Error
            ? error.message
            : "Impossible d'enregistrer les paramètres généraux.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-7xl px-4 py-8 text-app-text sm:px-6 lg:min-h-[calc(100vh-4.5rem)] lg:px-8">
      {toast && (
        <ToastMessage tone={toast.tone} onClose={() => setToast(null)}>
          {toast.text}
        </ToastMessage>
      )}

      <section className="rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-primary-700">Paramètres</p>
            <h1 className="mt-2 text-3xl font-bold text-app-text">
              Paramètres généraux
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-app-muted">
              Configurez les préférences générales de la pharmacie, notamment
              l’impression des tickets et factures.
            </p>
          </div>
          <a
            href={pharmacyId ? basePath + "/settings" : "#"}
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-md border border-app-border bg-app-surface px-4 py-2.5 text-sm font-semibold text-app-text transition hover:bg-primary-50 hover:text-primary-700 focus:outline-none focus:ring-4 focus:ring-primary-100"
          >
            Retour
          </a>
        </div>
      </section>

      {state === "loading" && (
        <section className="mt-6 rounded-lg border border-app-border bg-app-card p-8">
          <LoadingBubble label="Chargement des paramètres généraux" className="min-h-[180px]" />
        </section>
      )}

      {state === "error" && (
        <section className="mt-6 rounded-lg border border-red-200 bg-red-50 p-5">
          <p className="font-semibold text-red-700">Impossible de charger les paramètres</p>
          <p className="mt-2 text-sm text-red-700">{errorMessage}</p>
        </section>
      )}

      {state === "ready" && settings && (
        <section className="mt-6 rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-primary-700">Impression</p>
            <h2 className="mt-2 text-xl font-bold text-app-text">
              Largeur du papier thermique
            </h2>
            <p className="mt-3 text-sm leading-6 text-app-muted">
              Sélectionnez la largeur du rouleau utilisé par l’imprimante POS de
              cette pharmacie.
            </p>
            <p className="mt-2 text-sm leading-6 text-app-muted">
              80 mm est recommandé pour les imprimantes de caisse standard. 58 mm
              convient aux imprimantes POS compactes.
            </p>
          </div>

          {!canEdit && (
            <p className="mt-5 rounded-md border border-app-border bg-app-surface px-4 py-3 text-sm text-app-muted">
              Vous disposez d’un accès en lecture seule à ces paramètres.
            </p>
          )}

          <fieldset className="mt-6 grid gap-3 sm:grid-cols-2" disabled={!canEdit || isSaving}>
            <legend className="sr-only">Largeur du papier thermique</legend>
            {paperWidthOptions.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-start gap-3 rounded-md border border-app-border bg-app-surface px-4 py-3 transition hover:border-primary-300 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-70"
              >
                <input
                  type="radio"
                  name="receipt_paper_width"
                  value={option.value}
                  checked={selectedWidth === option.value}
                  onChange={() => setSelectedWidth(option.value)}
                  className="mt-1 h-4 w-4 accent-primary-600"
                />
                <span>
                  <span className="block text-sm font-bold text-app-text">
                    {option.label}
                  </span>
                  <span className="mt-1 block text-sm leading-5 text-app-muted">
                    {option.description}
                  </span>
                </span>
              </label>
            ))}
          </fieldset>

          {canEdit && (
            <div className="mt-6 flex justify-end">
              <Button
                type="button"
                onClick={saveSettings}
                disabled={!hasChanged || isSaving}
                className="disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Enregistrement..." : "Enregistrer les modifications"}
              </Button>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
