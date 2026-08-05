"use client";

import { type FormEvent, useEffect, useState } from "react";
import { PaymentSettingsLayout } from "@/components/admin/payment-settings-layout";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { LoadingBubble } from "@/components/ui/loading-bubble";
import {
  deleteAdminPaymentProvider,
  getAdminPaymentProviders,
  patchAdminPaymentProvider,
  type AdminPaymentProvider,
} from "@/lib/api/admin";

type PageState = "loading" | "ready" | "error";
type ModalType = "details" | "edit" | null;
type FeedbackState = { type: "success" | "error"; text: string } | null;
type ProviderFormState = {
  name: string;
  code: string;
  country: string;
  display_name: string;
  is_active: boolean;
};

type ModalShellProps = {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
};

function ModalShell({ title, onClose, children }: ModalShellProps) {
  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/45 p-4">
      <div className="absolute inset-0" aria-hidden="true" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-xl border border-app-border bg-app-card p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-lg font-semibold text-app-text">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-app-border bg-app-surface px-2.5 py-1.5 text-sm text-app-muted transition hover:text-app-text"
          >
            ✕
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}

function emptyForm(provider: AdminPaymentProvider): ProviderFormState {
  return {
    name: provider.name ?? "",
    code: provider.code ?? "",
    display_name: provider.display_name ?? "",
    country: typeof provider.country === "string" ? provider.country : "",
    is_active: provider.is_active ?? true,
  };
}

// Page dédiée à la liste des fournisseurs de paiement disponibles côté administration.
export default function AdminPaymentProvidersPage() {
  const [providers, setProviders] = useState<AdminPaymentProvider[]>([]);
  const [state, setState] = useState<PageState>("loading");
  const [message, setMessage] = useState("");
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [activeProvider, setActiveProvider] = useState<AdminPaymentProvider | null>(null);
  const [form, setForm] = useState<ProviderFormState>({
    name: "",
    code: "",
    display_name: "",
    country: "",
    is_active: true,
  });
  const [saving, setSaving] = useState(false);
  const [providerToDelete, setProviderToDelete] = useState<AdminPaymentProvider | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  useEffect(() => {
    let isCurrent = true;

    async function loadProviders() {
      setState("loading");
      setMessage("");
      setFeedback(null);

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

  function openDetails(provider: AdminPaymentProvider) {
    setActiveProvider(provider);
    setModalType("details");
    setFeedback(null);
  }

  function openEdit(provider: AdminPaymentProvider) {
    setActiveProvider(provider);
    setForm(emptyForm(provider));
    setModalType("edit");
    setFeedback(null);
  }

  function closeModal() {
    setModalType(null);
    setActiveProvider(null);
    setForm({ name: "", code: "", display_name: "", country: "", is_active: true });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeProvider) {
      return;
    }

    setSaving(true);
    setFeedback(null);

    try {
      const updatedProvider = await patchAdminPaymentProvider(activeProvider.id, {
        name: form.name.trim(),
        code: form.code.trim(),
        display_name: form.display_name.trim(),
        country: form.country.trim(),
        is_active: form.is_active,
      });

      setProviders((current) =>
        current.map((provider) => (provider.id === updatedProvider.id ? updatedProvider : provider)),
      );
      setActiveProvider(updatedProvider);
      setFeedback({ type: "success", text: "Fournisseur mis à jour." });
    } catch (error) {
      setFeedback({
        type: "error",
        text: error instanceof Error ? error.message : "La mise à jour a échoué.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(provider: AdminPaymentProvider) {
    setSaving(true);
    setFeedback(null);

    try {
      const updatedProvider = await patchAdminPaymentProvider(provider.id, {
        is_active: !provider.is_active,
      });

      setProviders((current) =>
        current.map((item) => (item.id === updatedProvider.id ? updatedProvider : item)),
      );
      setFeedback({
        type: "success",
        text: updatedProvider.is_active ? "Fournisseur activé." : "Fournisseur désactivé.",
      });
    } catch (error) {
      setFeedback({
        type: "error",
        text: error instanceof Error ? error.message : "Le changement de statut a échoué.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!providerToDelete) {
      return;
    }

    setDeleting(true);
    setFeedback(null);

    try {
      await deleteAdminPaymentProvider(providerToDelete.id);
      setProviders((current) => current.filter((provider) => provider.id !== providerToDelete.id));
      setFeedback({ type: "success", text: "Fournisseur supprimé." });
      setProviderToDelete(null);
    } catch (error) {
      setFeedback({
        type: "error",
        text: error instanceof Error ? error.message : "La suppression a échoué.",
      });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <PaymentSettingsLayout>
      {message && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {message}
        </div>
      )}

      {feedback && (
        <div
          className={`rounded-lg border p-4 text-sm ${
            feedback.type === "success"
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {feedback.text}
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
                    <th className="px-3 py-3">Pays</th>
                    <th className="px-3 py-3">Statut</th>
                    <th className="px-3 py-3 text-right">Action</th>
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
                      <td className="px-3 py-3">
                        <div className="flex justify-end">
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setOpenMenuId(openMenuId === provider.id ? null : provider.id)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-app-border bg-app-surface text-lg text-app-text transition hover:bg-primary-50"
                              aria-label="Actions"
                            >
                              ⋯
                            </button>

                            {openMenuId === provider.id && (
                              <div className="absolute right-0 z-10 mt-2 w-44 rounded-lg border border-app-border bg-app-card p-1 shadow-lg">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    openDetails(provider);
                                  }}
                                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-app-text transition hover:bg-app-surface"
                                >
                                  <span aria-hidden="true">👁️</span>
                                  <span>Details</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    setProviderToDelete(provider);
                                  }}
                                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-red-700 transition hover:bg-red-50"
                                >
                                  <span aria-hidden="true">🗑️</span>
                                  <span>Supprimer</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    openEdit(provider);
                                  }}
                                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-app-text transition hover:bg-app-surface"
                                >
                                  <span aria-hidden="true">✏️</span>
                                  <span>Modifier</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    void toggleActive(provider);
                                  }}
                                  disabled={saving}
                                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-app-text transition hover:bg-app-surface disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  <span aria-hidden="true">⏸️</span>
                                  <span>{provider.is_active ? "Désactiver" : "Activer"}</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {modalType && activeProvider && (
        <ModalShell
          title={modalType === "details" ? "Détails du fournisseur" : "Modifier le fournisseur"}
          onClose={closeModal}
        >
          {modalType === "details" ? (
            <div className="space-y-3 text-sm text-app-muted">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-app-muted">Nom</p>
                <p className="mt-1 font-semibold text-app-text">
                  {activeProvider.display_name || activeProvider.name || "-"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-app-muted">Code</p>
                <p className="mt-1 font-mono text-app-text">{activeProvider.code || "-"}</p>
              </div>
               <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-app-muted">Country</p>
                <p className="mt-1 font-mono text-app-text">
                  {typeof activeProvider.country === "string" ? activeProvider.country : "-"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-app-muted">Statut</p>
                <p className="mt-1 text-app-text">
                  {activeProvider.is_active ? "Actif" : "Inactif"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-app-muted">Slug</p>
                <p className="mt-1 text-app-text">{activeProvider.slug || "-"}</p>
              </div>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-app-text" htmlFor="display_name">
                  Nom affiché
                </label>
                <input
                  id="display_name"
                  value={form.display_name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, display_name: event.target.value }))
                  }
                  className="w-full rounded-md border border-app-border bg-app-surface px-3 py-2 text-sm text-app-text outline-none focus:border-primary-500"
                  placeholder="Nom du fournisseur"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-app-text" htmlFor="name">
                  Nom technique
                </label>
                <input
                  id="name"
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  className="w-full rounded-md border border-app-border bg-app-surface px-3 py-2 text-sm text-app-text outline-none focus:border-primary-500"
                  placeholder="Nom technique"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-app-text" htmlFor="code">
                  Code
                </label>
                <input
                  id="code"
                  value={form.code}
                  onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
                  className="w-full rounded-md border border-app-border bg-app-surface px-3 py-2 text-sm text-app-text outline-none focus:border-primary-500"
                  placeholder="Code du fournisseur"
                />
              </div>

              <label className="flex items-center gap-2 text-sm font-medium text-app-text">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, is_active: event.target.checked }))
                  }
                  className="h-4 w-4 rounded border-app-border"
                />
                Activer ce fournisseur
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-md border border-app-border bg-app-surface px-4 py-2 text-sm font-medium text-app-text"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </form>
          )}
        </ModalShell>
      )}

      <ConfirmDialog
        open={Boolean(providerToDelete)}
        title="Supprimer ce fournisseur"
        message={`Voulez-vous vraiment supprimer ${providerToDelete?.display_name || providerToDelete?.name || "ce fournisseur"} ?`}
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setProviderToDelete(null)}
      />
    </PaymentSettingsLayout>
  );
}
