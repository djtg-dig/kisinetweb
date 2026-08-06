"use client";

import { type FormEvent, useEffect, useState } from "react";
import { PaymentSettingsLayout } from "@/components/admin/payment-settings-layout";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { LoadingBubble } from "@/components/ui/loading-bubble";
import { Modal } from "@/components/ui/modal";
import { ToastMessage } from "@/components/ui/toast";
import { type ToastFeedback, type ToastFeedbackTone } from "@/lib/admin/toast-feedback";
import {
  createAdminPaymentProvider,
  deleteAdminPaymentProvider,
  getAdminCountries,
  getAdminPaymentCategories,
  getAdminPaymentCurrencies,
  getAdminPaymentProviders,
  patchAdminPaymentProvider,
  type AdminCountryOption,
  type AdminPaymentCategory,
  type AdminPaymentCurrency,
  type AdminPaymentProvider,
  type AdminPaymentProviderInput,
} from "@/lib/api/admin";

type PageState = "loading" | "ready" | "error";
type ModalMode = "details" | "create" | "edit" | null;

type ProviderFormState = {
  country: string;
  currency: string;
  category: string;
  name: string;
  code: string;
  description: string;
  is_active: boolean;
  display_order: string;
};

// Formulaire vide utilisé à la création d'un fournisseur.
function emptyForm(): ProviderFormState {
  return {
    country: "",
    currency: "",
    category: "",
    name: "",
    code: "",
    description: "",
    is_active: true,
    display_order: "",
  };
}

// Résout la valeur d'un champ de sélection à partir de la forme renvoyée par le
// backend vers la `value` exacte utilisée par les <option> du formulaire.
// Le sérialiseur Django peut renvoyer ces champs sous plusieurs formes (code
// ISO2 / code devise / clé primaire numérique, ou objet imbriqué). Sans
// résolution, la <select> contrôlé ne trouve aucune <option> correspondante et
// affiche le placeholder (d'où la nécessité de resélectionner à chaque édition).
// Priorité : correspondance directe (insensible à la casse), puis recherche
// par clé primaire, puis extraction depuis un objet imbriqué. Renvoie "" si
// rien ne correspond (comportement inchangé hors pré-sélection).
function resolveSelectValue(
  raw: unknown,
  items: { id: number; [key: string]: unknown }[],
  keyField: string,
): string {
  if (raw === null || raw === undefined || raw === "") {
    return "";
  }

  // Correspondance directe : la chaîne renvoyée est déjà la clé utilisée en
  // `value` des options (ex. code ISO2 ou code devise).
  if (typeof raw === "string") {
    const needle = raw.toLowerCase();
    const found = items.find(
      (item) => String(item[keyField]).toLowerCase() === needle,
    );
    if (found) {
      return String(found[keyField]);
    }
  }

  // Clé primaire numérique, ou chaîne la représentant.
  const id =
    typeof raw === "number"
      ? raw
      : typeof raw === "string" && /^\d+$/.test(raw)
        ? Number(raw)
        : undefined;
  if (id !== undefined) {
    const found = items.find((item) => item.id === id);
    if (found && found[keyField] !== undefined && found[keyField] !== null) {
      return String(found[keyField]);
    }
  }

  // Objet imbriqué renvoyé par un sérialiseur Django (related field imbriqué).
  if (typeof raw === "object") {
    const obj = raw as { id?: unknown; [key: string]: unknown };
    const direct = obj[keyField];
    if (typeof direct === "string") {
      return direct;
    }
    if (typeof obj.id === "number") {
      const found = items.find((item) => item.id === obj.id);
      if (found && found[keyField] !== undefined && found[keyField] !== null) {
        return String(found[keyField]);
      }
    }
  }

  return "";
}

// Pré-remplit le formulaire à partir d'un fournisseur existant (édition).
// Les champs pays/devise/catégorie sont résolus vers la `value` exacte des
// <option> (à partir des listes chargées) afin que le modal présélectionne
// correctement l'élément existant.
function formFromProvider(
  provider: AdminPaymentProvider,
  countries: AdminCountryOption[],
  currencies: AdminPaymentCurrency[],
  categories: AdminPaymentCategory[],
): ProviderFormState {
  return {
    country: resolveSelectValue(provider.country, countries, "iso2"),
    currency: resolveSelectValue(provider.currency, currencies, "code"),
    category: resolveSelectValue(provider.category, categories, "id"),
    name: provider.name ?? "",
    code: provider.code ?? "",
    description: provider.description ?? "",
    is_active: provider.is_active ?? true,
    display_order: provider.display_order != null ? String(provider.display_order) : "",
  };
}

// Page de gestion des fournisseurs de paiement (admin).
// Aucune donnée (pays, devise, opérateur) n'est codée en dur : les listes
// proviennent de l'API. Toute modification nécessite une action utilisateur.
export default function AdminPaymentProvidersPage() {
  const [providers, setProviders] = useState<AdminPaymentProvider[]>([]);
  const [state, setState] = useState<PageState>("loading");
  const [message, setMessage] = useState("");
  const [refreshIndex, setRefreshIndex] = useState(0);

  const [categories, setCategories] = useState<AdminPaymentCategory[]>([]);
  const [currencies, setCurrencies] = useState<AdminPaymentCurrency[]>([]);
  const [countries, setCountries] = useState<AdminCountryOption[]>([]);

  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingProvider, setEditingProvider] = useState<AdminPaymentProvider | null>(null);
  const [form, setForm] = useState<ProviderFormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  // Toast global (succès / erreur / avertissement) affiché automatiquement et
  // disparaissant sans clic via le composant ToastMessage.
  const [toast, setToast] = useState<ToastFeedback>(null);

  function showToast(tone: ToastFeedbackTone, text: string) {
    setToast({ tone, text, key: Date.now() });
  }

  const [providerToDelete, setProviderToDelete] = useState<AdminPaymentProvider | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  // Liste principale des fournisseurs.
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
  }, [refreshIndex]);

  // Chargement des données des listes (pays, devises, catégories) pour le modal.
  // Les échecs sont isolés : un appel en erreur n'empêche pas les autres.
  useEffect(() => {
    async function loadOptions() {
      const [cats, curs, countriesData] = await Promise.allSettled([
        getAdminPaymentCategories(),
        getAdminPaymentCurrencies(),
        getAdminCountries(),
      ]);

      if (cats.status === "fulfilled") {
        setCategories(cats.value);
      }
      if (curs.status === "fulfilled") {
        setCurrencies(curs.value);
      }
      if (countriesData.status === "fulfilled") {
        setCountries(countriesData.value);
      }
    }

    void loadOptions();
  }, []);

  // Index de recherche pour l'affichage (pays, catégorie) depuis les listes.
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const countryByCode = new Map(countries.map((country) => [country.iso2, country]));

  function resolveCategoryLabel(provider: AdminPaymentProvider): string {
    const category = provider.category;
    if (category && typeof category === "object") {
      return category.name || category.code || "-";
    }
    if (typeof category === "number") {
      const found = categoryById.get(category);
      return found ? found.name || found.code || `-` : `Catégorie #${category}`;
    }
    return "-";
  }

  function resolveCountryLabel(provider: AdminPaymentProvider): string {
    const raw = provider.country;
    if (!raw) {
      return "-";
    }
    const found = countryByCode.get(raw);
    return found ? found.name : raw;
  }

  function openCreate() {
    setEditingProvider(null);
    setForm(emptyForm());
    setModalMode("create");
  }

  function openEdit(provider: AdminPaymentProvider) {
    setEditingProvider(provider);
    setForm(formFromProvider(provider, countries, currencies, categories));
    setModalMode("edit");
  }

  function openDetails(provider: AdminPaymentProvider) {
    setEditingProvider(provider);
    setModalMode("details");
  }

  function closeModal() {
    // La fermeture est refusée pendant la sauvegarde (gérée aussi côté Modal).
    if (saving) {
      return;
    }
    setModalMode(null);
    setEditingProvider(null);
    setForm(emptyForm());
  }

  // Validation frontend avant envoi à l'API.
  function validateForm(): AdminPaymentProviderInput | null {
    const name = form.name.trim();
    const code = form.code.trim();

    if (!form.country || !form.currency || !form.category || !name || !code) {
      showToast("error", "Pays, devise, catégorie, nom et code sont obligatoires.");
      return null;
    }

    let displayOrder: number | null = null;
    if (form.display_order.trim() !== "") {
      const parsed = Number(form.display_order);
      if (!Number.isInteger(parsed) || parsed < 0) {
        showToast("error", "L’ordre doit être un nombre entier positif.");
        return null;
      }
      displayOrder = parsed;
    }

    return {
      country: form.country,
      currency: form.currency,
      category: Number(form.category),
      name,
      code,
      description: form.description.trim(),
      is_active: form.is_active,
      display_order: displayOrder,
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload = validateForm();
    if (!payload) {
      return;
    }

    setSaving(true);

    try {
      if (editingProvider) {
        const updated = await patchAdminPaymentProvider(editingProvider.id, payload);
        setProviders((current) =>
          current.map((provider) => (provider.id === updated.id ? updated : provider)),
        );
        showToast("success", "Fournisseur mis à jour.");
      } else {
        const created = await createAdminPaymentProvider(payload);
        setProviders((current) => [...current, created]);
        showToast("success", "Fournisseur créé.");
      }
      closeModal();
    } catch (error) {
      showToast(
        "error",
        error instanceof Error ? error.message : "L’enregistrement a échoué.",
      );
    } finally {
      setSaving(false);
    }
  }

  // Bascule du statut actif/inactif via une mise à jour partielle (PATCH).
  // La désactivation utilise un ton « avertissement » pour signaler clairement
  // la perte de disponibilité du fournisseur ; la réactivation confirme en
  // succès.
  async function toggleActive(provider: AdminPaymentProvider) {
    setSaving(true);

    try {
      const updated = await patchAdminPaymentProvider(provider.id, {
        is_active: !provider.is_active,
      });
      setProviders((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      showToast(
        updated.is_active ? "success" : "warning",
        updated.is_active ? "Fournisseur activé." : "Fournisseur désactivé.",
      );
    } catch (error) {
      showToast(
        "error",
        error instanceof Error ? error.message : "Le changement de statut a échoué.",
      );
    } finally {
      setSaving(false);
    }
  }

  // Suppression uniquement après confirmation explicite de l'utilisateur.
  async function confirmDelete() {
    if (!providerToDelete) {
      return;
    }

    setDeleting(true);

    try {
      await deleteAdminPaymentProvider(providerToDelete.id);
      setProviders((current) =>
        current.filter((provider) => provider.id !== providerToDelete.id),
      );
      showToast("success", "Fournisseur supprimé.");
      setProviderToDelete(null);
    } catch (error) {
      showToast(
        "error",
        error instanceof Error ? error.message : "La suppression a échoué.",
      );
    } finally {
      setDeleting(false);
    }
  }

  const isFormModal = modalMode === "create" || modalMode === "edit";

  return (
    <PaymentSettingsLayout>
      <div className="rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-primary-700">Administration</p>
            <h2 className="mt-2 text-2xl font-bold text-app-text">Fournisseurs de paiement</h2>
            <p className="mt-2 text-sm text-app-muted">
              Gérez les opérateurs de paiement (mobile money, cartes, etc.).
            </p>
          </div>
          <Button type="button" onClick={openCreate} className="shrink-0">
            Nouveau fournisseur
          </Button>
        </div>
      </div>

      {toast && (
        <ToastMessage
          key={toast.key}
          tone={toast.tone}
          onClose={() => setToast(null)}
        >
          {toast.text}
        </ToastMessage>
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
          <Button onClick={() => setRefreshIndex((current) => current + 1)} className="mt-5">
            Réessayer
          </Button>
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
                    <th className="px-3 py-3">Pays</th>
                    <th className="px-3 py-3">Devise</th>
                    <th className="px-3 py-3">Catégorie</th>
                    <th className="px-3 py-3">Nom fournisseur</th>
                    <th className="px-3 py-3">Actif</th>
                    <th className="px-3 py-3">Ordre</th>
                    <th className="px-3 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-app-border">
                  {providers.map((provider) => (
                    <tr key={provider.id} className="align-top">
                      <td className="px-3 py-3 text-app-muted">{resolveCountryLabel(provider)}</td>
                      <td className="px-3 py-3 font-mono text-app-muted">
                        {provider.currency || "-"}
                      </td>
                      <td className="px-3 py-3 text-app-muted">
                        {resolveCategoryLabel(provider)}
                      </td>
                      <td className="px-3 py-3 font-semibold text-app-text">
                        {provider.display_name || provider.name || `Fournisseur #${provider.id}`}
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
                      <td className="px-3 py-3 text-app-muted">
                        {provider.display_order != null ? provider.display_order : "-"}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex justify-end">
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() =>
                                setOpenMenuId(openMenuId === provider.id ? null : provider.id)
                              }
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
                                  <span>Détails</span>
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

      <Modal
        open={modalMode !== null}
        title={
          modalMode === "details"
            ? "Détails du fournisseur"
            : modalMode === "edit"
              ? "Modifier le fournisseur"
              : "Nouveau fournisseur"
        }
        onClose={closeModal}
        saving={saving}
      >
        {modalMode === "details" && editingProvider ? (
          <div className="space-y-3 text-sm text-app-muted">
            <DetailRow label="Nom" value={editingProvider.display_name || editingProvider.name || "-"} />
            <DetailRow label="Code" value={editingProvider.code || "-"} />
            <DetailRow label="Pays" value={resolveCountryLabel(editingProvider)} />
            <DetailRow label="Devise" value={editingProvider.currency || "-"} />
            <DetailRow label="Catégorie" value={resolveCategoryLabel(editingProvider)} />
            <DetailRow label="Description" value={editingProvider.description || "-"} />
            <DetailRow label="Statut" value={editingProvider.is_active ? "Actif" : "Inactif"} />
            <DetailRow
              label="Ordre"
              value={editingProvider.display_order != null ? String(editingProvider.display_order) : "-"}
            />
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-app-text" htmlFor="provider-country">
                Pays
              </label>
              <select
                id="provider-country"
                name="country"
                value={form.country}
                onChange={(event) =>
                  setForm((current) => ({ ...current, country: event.target.value }))
                }
                className="w-full rounded-md border border-app-border bg-app-surface px-3 py-2 text-sm text-app-text outline-none focus:border-primary-500"
              >
                <option value="">Sélectionner un pays</option>
                {countries.map((country) => (
                  <option key={country.id} value={country.iso2}>
                    {country.name} ({country.iso2})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-app-text" htmlFor="provider-currency">
                Devise
              </label>
              <select
                id="provider-currency"
                name="currency"
                value={form.currency}
                onChange={(event) =>
                  setForm((current) => ({ ...current, currency: event.target.value }))
                }
                className="w-full rounded-md border border-app-border bg-app-surface px-3 py-2 text-sm text-app-text outline-none focus:border-primary-500"
              >
                <option value="">Sélectionner une devise</option>
                {currencies.map((currency) => (
                  <option key={currency.id} value={currency.code}>
                    {currency.code} — {currency.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-app-text" htmlFor="provider-category">
                Catégorie
              </label>
              <select
                id="provider-category"
                name="category"
                value={form.category}
                onChange={(event) =>
                  setForm((current) => ({ ...current, category: event.target.value }))
                }
                className="w-full rounded-md border border-app-border bg-app-surface px-3 py-2 text-sm text-app-text outline-none focus:border-primary-500"
              >
                <option value="">Sélectionner une catégorie</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name} ({category.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-app-text" htmlFor="provider-name">
                Nom
              </label>
              <input
                id="provider-name"
                name="name"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                className="w-full rounded-md border border-app-border bg-app-surface px-3 py-2 text-sm text-app-text outline-none focus:border-primary-500"
                placeholder="Nom de l’opérateur"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-app-text" htmlFor="provider-code">
                Code
              </label>
              <input
                id="provider-code"
                name="code"
                value={form.code}
                onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
                className="w-full rounded-md border border-app-border bg-app-surface px-3 py-2 text-sm text-app-text outline-none focus:border-primary-500"
                placeholder="CODE"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-app-text" htmlFor="provider-description">
                Description
              </label>
              <textarea
                id="provider-description"
                name="description"
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
                rows={3}
                className="w-full rounded-md border border-app-border bg-app-surface px-3 py-2 text-sm text-app-text outline-none focus:border-primary-500"
                placeholder="Description du fournisseur"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-app-text" htmlFor="provider-order">
                Ordre
              </label>
              <input
                id="provider-order"
                type="number"
                min={0}
                step={1}
                value={form.display_order}
                onChange={(event) =>
                  setForm((current) => ({ ...current, display_order: event.target.value }))
                }
                className="w-full rounded-md border border-app-border bg-app-surface px-3 py-2 text-sm text-app-text outline-none focus:border-primary-500"
                placeholder="0"
              />
            </div>

            <label
              htmlFor="provider-is-active"
              className="flex items-center gap-2 text-sm font-medium text-app-text"
            >
              <input
                id="provider-is-active"
                name="is_active"
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
              <Button type="button" variant="secondary" onClick={closeModal}>
                Annuler
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(providerToDelete)}
        title="Supprimer ce fournisseur"
        message={`Voulez-vous vraiment supprimer ${
          providerToDelete?.display_name || providerToDelete?.name || "ce fournisseur"
        } ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setProviderToDelete(null)}
      />
    </PaymentSettingsLayout>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-app-muted">{label}</p>
      <p className="mt-1 font-semibold text-app-text">{value}</p>
    </div>
  );
}
