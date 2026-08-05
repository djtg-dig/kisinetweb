"use client";

import { type FormEvent, useEffect, useState } from "react";
import { PaymentSettingsLayout } from "@/components/admin/payment-settings-layout";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { LoadingBubble } from "@/components/ui/loading-bubble";
import { Modal } from "@/components/ui/modal";
import { ToastMessage } from "@/components/ui/toast";
import {
  createAdminPaymentCategory,
  deleteAdminPaymentCategory,
  getAdminPaymentCategories,
  updateAdminPaymentCategory,
  type AdminPaymentCategory,
  type AdminPaymentCategoryInput,
} from "@/lib/api/admin";

type PageState = "loading" | "ready" | "error";
type FeedbackState = { tone: "success" | "error"; text: string } | null;
type CategoryFormState = {
  name: string;
  code: string;
  description: string;
  display_order: string;
  is_active: boolean;
};

// Formulaire vide utilisé à la création d'une catégorie.
function emptyForm(): CategoryFormState {
  return { name: "", code: "", description: "", display_order: "", is_active: true };
}

// Pré-remplit le formulaire à partir d'une catégorie existante (édition).
function formFromCategory(category: AdminPaymentCategory): CategoryFormState {
  return {
    name: category.name ?? "",
    code: category.code ?? "",
    description: category.description ?? "",
    display_order: category.display_order != null ? String(category.display_order) : "",
    is_active: category.is_active ?? true,
  };
}

// Page de gestion des catégories de paiement (admin).
// Aucune donnée n'est supprimée ou modifiée sans une action explicite de
// l'utilisateur (création, édition, suppression confirmée).
export default function AdminPaymentCategoriesPage() {
  const [categories, setCategories] = useState<AdminPaymentCategory[]>([]);
  const [state, setState] = useState<PageState>("loading");
  const [message, setMessage] = useState("");
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AdminPaymentCategory | null>(null);
  const [form, setForm] = useState<CategoryFormState>(emptyForm());
  const [saving, setSaving] = useState(false);

  const [categoryToDelete, setCategoryToDelete] = useState<AdminPaymentCategory | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  // Chargement de la liste au montage et à chaque rafraîchissement demandé.
  useEffect(() => {
    let isCurrent = true;

    async function loadCategories() {
      setState("loading");
      setMessage("");

      try {
        const data = await getAdminPaymentCategories();
        if (!isCurrent) {
          return;
        }
        setCategories(data);
        setState("ready");
      } catch (error) {
        if (!isCurrent) {
          return;
        }
        setState("error");
        setMessage(error instanceof Error ? error.message : "Chargement impossible.");
      }
    }

    void loadCategories();

    return () => {
      isCurrent = false;
    };
  }, [refreshIndex]);

  function openCreate() {
    setEditingCategory(null);
    setForm(emptyForm());
    setFeedback(null);
    setModalOpen(true);
  }

  function openEdit(category: AdminPaymentCategory) {
    setEditingCategory(category);
    setForm(formFromCategory(category));
    setFeedback(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingCategory(null);
    setForm(emptyForm());
  }

  // Validation frontend avant envoi à l'API.
  function validateForm(): { name: string; code: string; display_order: number | null } | null {
    const name = form.name.trim();
    const code = form.code.trim();

    if (!name || !code) {
      setFeedback({ tone: "error", text: "Le nom et le code sont obligatoires." });
      return null;
    }

    let displayOrder: number | null = null;
    if (form.display_order.trim() !== "") {
      const parsed = Number(form.display_order);
      if (!Number.isInteger(parsed) || parsed < 0) {
        setFeedback({
          tone: "error",
          text: "L’ordre d’affichage doit être un nombre entier positif.",
        });
        return null;
      }
      displayOrder = parsed;
    }

    return { name, code, display_order: displayOrder };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validated = validateForm();
    if (!validated) {
      return;
    }

    setSaving(true);
    setFeedback(null);

    const payload: AdminPaymentCategoryInput = {
      name: validated.name,
      code: validated.code,
      description: form.description.trim(),
      is_active: form.is_active,
      display_order: validated.display_order,
    };

    try {
      if (editingCategory) {
        const updated = await updateAdminPaymentCategory(editingCategory.id, payload);
        setCategories((current) =>
          current.map((category) => (category.id === updated.id ? updated : category)),
        );
        setFeedback({ tone: "success", text: "Catégorie mise à jour." });
      } else {
        const created = await createAdminPaymentCategory(payload);
        setCategories((current) => [...current, created]);
        setFeedback({ tone: "success", text: "Catégorie créée." });
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

  // Bascule du statut actif/inactif via une mise à jour partielle (PATCH).
  async function toggleActive(category: AdminPaymentCategory) {
    setSaving(true);
    setFeedback(null);

    try {
      const updated = await updateAdminPaymentCategory(category.id, {
        is_active: !category.is_active,
      });
      setCategories((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setFeedback({
        tone: "success",
        text: updated.is_active ? "Catégorie activée." : "Catégorie désactivée.",
      });
    } catch (error) {
      setFeedback({
        tone: "error",
        text: error instanceof Error ? error.message : "Le changement de statut a échoué.",
      });
    } finally {
      setSaving(false);
    }
  }

  // Suppression uniquement après confirmation explicite de l'utilisateur.
  async function confirmDelete() {
    if (!categoryToDelete) {
      return;
    }

    setDeleting(true);
    setFeedback(null);

    try {
      await deleteAdminPaymentCategory(categoryToDelete.id);
      setCategories((current) => current.filter((category) => category.id !== categoryToDelete.id));
      setFeedback({ tone: "success", text: "Catégorie supprimée." });
      setCategoryToDelete(null);
    } catch (error) {
      setFeedback({
        tone: "error",
        text: error instanceof Error ? error.message : "La suppression a échoué.",
      });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <PaymentSettingsLayout>
      <div className="rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-primary-700">Administration</p>
            <h2 className="mt-2 text-2xl font-bold text-app-text">Catégories de paiement</h2>
            <p className="mt-2 text-sm text-app-muted">
              Gérez les catégories utilisées pour classer les paiements.
            </p>
          </div>
          <Button type="button" onClick={openCreate} className="shrink-0">
            Nouvelle catégorie
          </Button>
        </div>
      </div>

      {feedback && (
        <ToastMessage tone={feedback.tone} onClose={() => setFeedback(null)}>
          {feedback.text}
        </ToastMessage>
      )}

      {state === "loading" && (
        <div className="rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
          <LoadingBubble label="Chargement des catégories" className="min-h-[220px]" />
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
          {categories.length === 0 ? (
            <div className="p-6 text-sm text-app-muted">
              Aucune catégorie de paiement n’a été retournée par l’API.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-app-border text-left text-sm">
                <thead className="bg-app-surface text-xs font-bold uppercase text-app-muted">
                  <tr>
                    <th className="px-3 py-3">Nom</th>
                    <th className="px-3 py-3">Code</th>
                    <th className="px-3 py-3">Description</th>
                    <th className="px-3 py-3">Statut</th>
                    <th className="px-3 py-3">Ordre d’affichage</th>
                    <th className="px-3 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-app-border">
                  {categories.map((category) => (
                    <tr key={category.id} className="align-top">
                      <td className="px-3 py-3 font-semibold text-app-text">
                        {category.name || `Catégorie #${category.id}`}
                      </td>
                      <td className="px-3 py-3 font-mono text-app-muted">{category.code || "-"}</td>
                      <td className="max-w-[280px] truncate px-3 py-3 text-app-muted">
                        {category.description || "-"}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            category.is_active
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {category.is_active ? "Actif" : "Inactif"}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-app-muted">
                        {category.display_order != null ? category.display_order : "-"}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex justify-end">
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() =>
                                setOpenMenuId(openMenuId === category.id ? null : category.id)
                              }
                              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-app-border bg-app-surface text-lg text-app-text transition hover:bg-primary-50"
                              aria-label="Actions"
                            >
                              ⋯
                            </button>

                            {openMenuId === category.id && (
                              <div className="absolute right-0 z-10 mt-2 w-44 rounded-lg border border-app-border bg-app-card p-1 shadow-lg">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    openEdit(category);
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
                                    void toggleActive(category);
                                  }}
                                  disabled={saving}
                                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-app-text transition hover:bg-app-surface disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  <span aria-hidden="true">⏸️</span>
                                  <span>{category.is_active ? "Désactiver" : "Activer"}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    setCategoryToDelete(category);
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
        open={modalOpen}
        title={editingCategory ? "Modifier la catégorie" : "Nouvelle catégorie"}
        onClose={closeModal}
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-app-text" htmlFor="category-name">
              Nom
            </label>
            <input
              id="category-name"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              className="w-full rounded-md border border-app-border bg-app-surface px-3 py-2 text-sm text-app-text outline-none focus:border-primary-500"
              placeholder="Nom de la catégorie"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-app-text" htmlFor="category-code">
              Code
            </label>
            <input
              id="category-code"
              value={form.code}
              onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
              className="w-full rounded-md border border-app-border bg-app-surface px-3 py-2 text-sm text-app-text outline-none focus:border-primary-500"
              placeholder="CODE"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-app-text" htmlFor="category-description">
              Description
            </label>
            <textarea
              id="category-description"
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
              rows={3}
              className="w-full rounded-md border border-app-border bg-app-surface px-3 py-2 text-sm text-app-text outline-none focus:border-primary-500"
              placeholder="Description de la catégorie"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-app-text" htmlFor="category-order">
              Ordre d’affichage
            </label>
            <input
              id="category-order"
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

          <label className="flex items-center gap-2 text-sm font-medium text-app-text">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(event) =>
                setForm((current) => ({ ...current, is_active: event.target.checked }))
              }
              className="h-4 w-4 rounded border-app-border"
            />
            Activer cette catégorie
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
      </Modal>

      <ConfirmDialog
        open={Boolean(categoryToDelete)}
        title="Supprimer cette catégorie"
        message={`Voulez-vous vraiment supprimer ${
          categoryToDelete?.name || "cette catégorie"
        } ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setCategoryToDelete(null)}
      />
    </PaymentSettingsLayout>
  );
}
