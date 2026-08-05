"use client";

import { type FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { PaymentSettingsLayout } from "@/components/admin/payment-settings-layout";
import {
  DetailRow,
} from "@/components/admin/user-payment-account-view";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { LoadingBubble } from "@/components/ui/loading-bubble";
import { Modal } from "@/components/ui/modal";
import { ToastMessage } from "@/components/ui/toast";
import {
  findAccountProvider,
  formatDateTime,
  resolveProviderLabel,
  resolveUserLabel,
} from "@/lib/admin/user-payment-accounts";
import {
  activateAdminUserPaymentAccount,
  createAdminUserPaymentAccount,
  deactivateAdminUserPaymentAccount,
  deleteAdminUserPaymentAccount,
  getAdminCountries,
  getAdminPaymentProviders,
  getAdminUserPaymentAccountsManagement,
  getAdminUsersDirectory,
  patchAdminUserPaymentAccount,
  updateAdminUserPaymentAccount,
  type AdminCountryOption,
  type AdminPaymentProvider,
  type AdminProfile,
  type AdminUserPaymentAccount,
  type AdminUserPaymentAccountInput,
} from "@/lib/api/admin";

type PageState = "loading" | "ready" | "error";
type ModalMode = "details" | "create" | "edit" | null;
type FeedbackState = { tone: "success" | "error"; text: string } | null;

// Formulaire de création/édition d'un compte de paiement.
// `user` et `provider` sont stockés en chaîne (valeurs des <select>).
type AccountFormState = {
  user: string;
  provider: string;
  account_identifier: string;
  account_name: string;
  is_active: boolean;
  is_default: boolean;
};

// Formulaire vide à la création.
function emptyForm(): AccountFormState {
  return {
    user: "",
    provider: "",
    account_identifier: "",
    account_name: "",
    is_active: true,
    is_default: false,
  };
}

// Pré-remplit le formulaire à partir d'un compte existant (édition).
function formFromAccount(account: AdminUserPaymentAccount): AccountFormState {
  return {
    user: account.user,
    provider: String(account.provider),
    account_identifier: account.account_identifier,
    account_name: account.account_name,
    is_active: account.is_active,
    is_default: account.is_default,
  };
}

// Page de gestion des comptes de paiement utilisateurs (admin).
// Toute modification, activation/désactivation et suppression nécessitent une
// action explicite de l'utilisateur (modale pour le formulaire, confirmation
// pour l'activation/désactivation et la suppression).
export default function AdminUserPaymentAccountsManagementPage() {
  const [accounts, setAccounts] = useState<AdminUserPaymentAccount[]>([]);
  const [state, setState] = useState<PageState>("loading");
  const [message, setMessage] = useState("");
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Données de référence servant à afficher des libellés lisibles (l'API des
  // comptes ne renvoie que des identifiants).
  const [users, setUsers] = useState<AdminProfile[]>([]);
  const [providers, setProviders] = useState<AdminPaymentProvider[]>([]);
  const [countries, setCountries] = useState<AdminCountryOption[]>([]);

  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingAccount, setEditingAccount] = useState<AdminUserPaymentAccount | null>(null);
  const [form, setForm] = useState<AccountFormState>(emptyForm());
  const [saving, setSaving] = useState(false);

  const [accountToToggle, setAccountToToggle] = useState<AdminUserPaymentAccount | null>(null);
  const [toggling, setToggling] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<AdminUserPaymentAccount | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  // Recherche envoyée au backend après une courte pause de saisie.
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 450);

    return () => window.clearTimeout(timeoutId);
  }, [search]);

  // Liste principale des comptes (gestion).
  useEffect(() => {
    let isCurrent = true;

    async function loadAccounts() {
      setState("loading");
      setMessage("");

      try {
        const data = await getAdminUserPaymentAccountsManagement();
        if (!isCurrent) {
          return;
        }
        setAccounts(data);
        setState("ready");
      } catch (error) {
        if (!isCurrent) {
          return;
        }
        setState("error");
        setMessage(error instanceof Error ? error.message : "Chargement impossible.");
      }
    }

    void loadAccounts();

    return () => {
      isCurrent = false;
    };
  }, [debouncedSearch, refreshIndex]);

  // Données de référence chargées une seule fois. Les échecs sont isolés.
  useEffect(() => {
    let isCurrent = true;

    async function loadReferenceData() {
      const [usersData, providersData, countriesData] = await Promise.allSettled([
        getAdminUsersDirectory(),
        getAdminPaymentProviders(),
        getAdminCountries(),
      ]);

      if (!isCurrent) {
        return;
      }

      if (usersData.status === "fulfilled") {
        setUsers(usersData.value);
      }
      if (providersData.status === "fulfilled") {
        setProviders(providersData.value);
      }
      if (countriesData.status === "fulfilled") {
        setCountries(countriesData.value);
      }
    }

    void loadReferenceData();

    return () => {
      isCurrent = false;
    };
  }, []);

  // Liste filtrée côté frontend à partir de la recherche backend.
  const visibleAccounts = accounts.filter((account) => {
    if (!debouncedSearch) {
      return true;
    }
    const needle = debouncedSearch.toLowerCase();
    const holder = account.account_name.toLowerCase();
    const number = account.account_identifier.toLowerCase();
    return holder.includes(needle) || number.includes(needle);
  });

  function openCreate() {
    setEditingAccount(null);
    setForm(emptyForm());
    setFeedback(null);
    setModalMode("create");
  }

  function openEdit(account: AdminUserPaymentAccount) {
    setEditingAccount(account);
    setForm(formFromAccount(account));
    setFeedback(null);
    setModalMode("edit");
  }

  function closeModal() {
    setModalMode(null);
    setEditingAccount(null);
    setForm(emptyForm());
  }

  // Validation frontend avant envoi à l'API.
  function validateForm(): AdminUserPaymentAccountInput | null {
    const accountIdentifier = form.account_identifier.trim();
    const accountName = form.account_name.trim();

    if (!form.user) {
      setFeedback({ tone: "error", text: "L’utilisateur est obligatoire." });
      return null;
    }
    if (!form.provider) {
      setFeedback({ tone: "error", text: "Le fournisseur est obligatoire." });
      return null;
    }
    if (!accountIdentifier) {
      setFeedback({ tone: "error", text: "Le numéro de compte est obligatoire." });
      return null;
    }
    if (!accountName) {
      setFeedback({ tone: "error", text: "Le titulaire est obligatoire." });
      return null;
    }
    if (form.is_default && !form.is_active) {
      setFeedback({
        tone: "error",
        text: "Un compte inactif ne peut pas être défini comme principal.",
      });
      return null;
    }

    return {
      user: form.user,
      provider: Number(form.provider),
      account_identifier: accountIdentifier,
      account_name: accountName,
      is_active: form.is_active,
      is_default: form.is_default,
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Empêche le double envoi pendant une requête en cours.
    if (saving) {
      return;
    }

    const payload = validateForm();
    if (!payload) {
      return;
    }

    setSaving(true);
    setFeedback(null);

    try {
      if (editingAccount) {
        const updated = await updateAdminUserPaymentAccount(editingAccount.id, payload);
        setAccounts((current) =>
          current.map((account) => (account.id === updated.id ? updated : account)),
        );
        setFeedback({ tone: "success", text: "Compte mis à jour." });
      } else {
        const created = await createAdminUserPaymentAccount(payload);
        setAccounts((current) => [created, ...current]);
        setFeedback({ tone: "success", text: "Compte créé." });
      }
      closeModal();
    } catch (error) {
      setFeedback({
        tone: "error",
        text: error instanceof Error ? error.message : "L’enregistrement a échoué.",
      });
    } finally {
      setSaving(false);
    }
  }

  // Activation ou désactivation via l'action dédiée du backend.
  async function confirmToggle() {
    if (!accountToToggle) {
      return;
    }

    setToggling(true);
    setFeedback(null);

    try {
      const updated = accountToToggle.is_active
        ? await deactivateAdminUserPaymentAccount(accountToToggle.id)
        : await activateAdminUserPaymentAccount(accountToToggle.id);
      setAccounts((current) =>
        current.map((account) => (account.id === updated.id ? updated : account)),
      );
      setFeedback({
        tone: "success",
        text: updated.is_active ? "Compte activé." : "Compte désactivé.",
      });
      setAccountToToggle(null);
    } catch (error) {
      // Le backend refuse par exemple la désactivation d'un compte principal :
      // le message d'erreur est affiché tel quel dans le toast.
      setFeedback({
        tone: "error",
        text: error instanceof Error ? error.message : "L’action a échoué.",
      });
      setAccountToToggle(null);
    } finally {
      setToggling(false);
    }
  }

  // Suppression uniquement après confirmation explicite de l'utilisateur.
  async function confirmDelete() {
    if (!accountToDelete) {
      return;
    }

    setDeleting(true);
    setFeedback(null);

    try {
      await deleteAdminUserPaymentAccount(accountToDelete.id);
      setAccounts((current) =>
        current.filter((account) => account.id !== accountToDelete.id),
      );
      setFeedback({ tone: "success", text: "Compte supprimé." });
      setAccountToDelete(null);
    } catch (error) {
      setFeedback({
        tone: "error",
        text: error instanceof Error ? error.message : "La suppression a échoué.",
      });
      setAccountToDelete(null);
    } finally {
      setDeleting(false);
    }
  }

  const providerNameByForm = form.provider
    ? resolveProviderLabel(Number(form.provider), providers)
    : "-";

  return (
    <PaymentSettingsLayout>
      <div className="rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
        <p className="text-sm font-semibold text-primary-700">Administration</p>
        <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-app-text">
              Comptes de paiement utilisateurs
            </h2>
            <p className="mt-2 text-sm text-app-muted">
              Gérez les comptes de paiement des utilisateurs (création, modification,
              activation, désactivation, suppression).
            </p>
          </div>
          <Button type="button" onClick={openCreate} className="shrink-0">
            Nouveau compte
          </Button>
        </div>

        <div className="mt-4 flex w-full flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex w-full flex-col gap-2 sm:w-80">
            <label
              className="text-xs font-semibold uppercase tracking-wide text-app-muted"
              htmlFor="account-search"
            >
              Recherche
            </label>
            <input
              id="account-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Numéro ou titulaire du compte"
              className="min-h-11 rounded-md border border-app-border bg-app-surface px-3 text-sm text-app-text outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
            />
          </div>
        </div>
        <p className="mt-4 text-xs text-app-muted">
          La recherche est automatique après une courte pause et porte sur le numéro et le
          titulaire du compte.
        </p>
      </div>

      {feedback && (
        <ToastMessage tone={feedback.tone} onClose={() => setFeedback(null)}>
          {feedback.text}
        </ToastMessage>
      )}

      {state === "loading" && (
        <div className="rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
          <LoadingBubble label="Chargement des comptes de paiement" className="min-h-[220px]" />
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
          {visibleAccounts.length === 0 ? (
            <div className="p-6 text-sm text-app-muted">
              Aucun compte de paiement ne correspond à cette recherche.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[1000px] divide-y divide-app-border text-left text-xs">
                <thead className="bg-app-surface text-xs font-bold uppercase text-app-muted">
                  <tr>
                    <th className="px-3 py-3">Utilisateur</th>
                    <th className="px-3 py-3">Fournisseur</th>
                    <th className="px-3 py-3">Numéro</th>
                    <th className="px-3 py-3">Statut</th>
                    <th className="px-3 py-3">Principal</th>
                    <th className="px-3 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-app-border">
                  {visibleAccounts.map((account) => (
                    <tr key={account.id} className="align-top">
                      <td className="max-w-[240px] truncate px-3 py-3 text-app-text">
                        {resolveUserLabel(account.user, users)}
                      </td>
                      <td className="px-3 py-3 text-app-text">
                        {resolveProviderLabel(account.provider, providers)}
                      </td>
                      <td className="px-3 py-3 font-mono text-app-text">
                        {account.account_identifier || "-"}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex rounded-md px-2.5 py-1 text-xs font-bold ${
                            account.is_active
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {account.is_active ? "Actif" : "Inactif"}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-app-muted">
                        {account.is_default ? "Oui" : "Non"}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex justify-end">
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() =>
                                setOpenMenuId(openMenuId === account.id ? null : account.id)
                              }
                              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-app-border bg-app-surface text-lg text-app-text transition hover:bg-primary-50"
                              aria-label="Actions"
                            >
                              ⋯
                            </button>

                            {openMenuId === account.id && (
                              <div className="absolute right-0 z-10 mt-2 w-48 rounded-lg border border-app-border bg-app-card p-1 shadow-lg">
                                <Link
                                  href={`/admin/settings/user-payment-accounts/${account.id}`}
                                  onClick={() => setOpenMenuId(null)}
                                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-app-text transition hover:bg-app-surface"
                                >
                                  <span aria-hidden="true">👁️</span>
                                  <span>Voir le détail</span>
                                </Link>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    openEdit(account);
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
                                    setAccountToToggle(account);
                                  }}
                                  disabled={toggling}
                                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-app-text transition hover:bg-app-surface disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  <span aria-hidden="true">⏸️</span>
                                  <span>{account.is_active ? "Désactiver" : "Activer"}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    setAccountToDelete(account);
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
            ? "Détail du compte"
            : modalMode === "edit"
              ? "Modifier le compte"
              : "Nouveau compte"
        }
        onClose={closeModal}
      >
        {modalMode === "details" && editingAccount ? (
          <div className="space-y-3 text-sm text-app-muted">
            <DetailRow label="Utilisateur" value={resolveUserLabel(editingAccount.user, users)} />
            <DetailRow
              label="Fournisseur"
              value={resolveProviderLabel(editingAccount.provider, providers)}
            />
            <DetailRow label="Titulaire" value={editingAccount.account_name || "-"} />
            <DetailRow
              label="Numéro"
              value={
                <span className="font-mono">{editingAccount.account_identifier || "-"}</span>
              }
            />
            <DetailRow
              label="Devise"
              value={editingAccount.currency_code || "-"}
            />
            <DetailRow
              label="Statut"
              value={editingAccount.is_active ? "Actif" : "Inactif"}
            />
            <DetailRow label="Principal" value={editingAccount.is_default ? "Oui" : "Non"} />
            <DetailRow label="Vérifié" value={editingAccount.is_verified ? "Oui" : "Non"} />
            <DetailRow label="Création" value={formatDateTime(editingAccount.created_at)} />
            <DetailRow label="Mise à jour" value={formatDateTime(editingAccount.updated_at)} />
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-app-text" htmlFor="account-user">
                Utilisateur
              </label>
              <select
                id="account-user"
                value={form.user}
                onChange={(event) =>
                  setForm((current) => ({ ...current, user: event.target.value }))
                }
                className="w-full rounded-md border border-app-border bg-app-surface px-3 py-2 text-sm text-app-text outline-none focus:border-primary-500"
              >
                <option value="">Sélectionner un utilisateur</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.email || user.reference}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-app-text" htmlFor="account-provider">
                Fournisseur
              </label>
              <select
                id="account-provider"
                value={form.provider}
                onChange={(event) =>
                  setForm((current) => ({ ...current, provider: event.target.value }))
                }
                className="w-full rounded-md border border-app-border bg-app-surface px-3 py-2 text-sm text-app-text outline-none focus:border-primary-500"
              >
                <option value="">Sélectionner un fournisseur</option>
                {providers.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.display_name || provider.name || provider.code || `Fournisseur #${provider.id}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label
                className="text-sm font-medium text-app-text"
                htmlFor="account-identifier"
              >
                Numéro de compte
              </label>
              <input
                id="account-identifier"
                value={form.account_identifier}
                onChange={(event) =>
                  setForm((current) => ({ ...current, account_identifier: event.target.value }))
                }
                placeholder="Numéro ou identifiant du compte"
                className="w-full rounded-md border border-app-border bg-app-surface px-3 py-2 text-sm text-app-text outline-none focus:border-primary-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-app-text" htmlFor="account-name">
                Titulaire
              </label>
              <input
                id="account-name"
                value={form.account_name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, account_name: event.target.value }))
                }
                placeholder="Nom du titulaire"
                className="w-full rounded-md border border-app-border bg-app-surface px-3 py-2 text-sm text-app-text outline-none focus:border-primary-500"
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
              Compte actif
            </label>

            <label className="flex items-center gap-2 text-sm font-medium text-app-text">
              <input
                type="checkbox"
                checked={form.is_default}
                onChange={(event) =>
                  setForm((current) => ({ ...current, is_default: event.target.checked }))
                }
                className="h-4 w-4 rounded border-app-border"
              />
              Compte principal (par défaut)
            </label>

            <p className="text-xs text-app-muted">
              Fournisseur sélectionné : <span className="font-semibold">{providerNameByForm}</span>
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={closeModal} disabled={saving}>
                Annuler
              </Button>
              <Button type="submit" disabled={saving}>
                {saving
                  ? "Enregistrement..."
                  : modalMode === "edit"
                    ? "Enregistrer"
                    : "Créer"}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(accountToToggle)}
        title={accountToToggle?.is_active ? "Désactiver ce compte" : "Activer ce compte"}
        message={`Voulez-vous vraiment ${
          accountToToggle?.is_active ? "désactiver" : "activer"
        } le compte ${accountToToggle?.account_identifier || ""} ?`}
        confirmLabel={accountToToggle?.is_active ? "Désactiver" : "Activer"}
        cancelLabel="Annuler"
        loading={toggling}
        onConfirm={confirmToggle}
        onCancel={() => setAccountToToggle(null)}
      />

      <ConfirmDialog
        open={Boolean(accountToDelete)}
        title="Supprimer ce compte"
        message={`Voulez-vous vraiment supprimer le compte ${
          accountToDelete?.account_identifier || ""
        } ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setAccountToDelete(null)}
      />
    </PaymentSettingsLayout>
  );
}
