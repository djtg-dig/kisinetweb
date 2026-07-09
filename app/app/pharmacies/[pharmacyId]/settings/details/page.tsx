"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import {
  getPharmacyDetail,
  getPharmacyPermissions,
  updatePharmacy,
  type PharmacyDetail,
  type PharmacyPermissions,
  type UpdatePharmacyInput,
} from "@/lib/api";

type SettingsDetailsPageProps = {
  params: Promise<{ pharmacyId: string }>;
};

type PageState = "loading" | "error" | "ready";

const currencyOptions = [
  { value: "USD", label: "USD (Dollar américain)" },
  { value: "CDF", label: "CDF (Franc congolais)" },
];

export default function SettingsDetailsPage({ params }: SettingsDetailsPageProps) {
  const [pharmacyId, setPharmacyId] = useState("");
  const [pharmacy, setPharmacy] = useState<PharmacyDetail | null>(null);
  const [permissions, setPermissions] = useState<PharmacyPermissions>({});
  const [state, setState] = useState<PageState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<UpdatePharmacyInput>({});
  const [isSaving, setIsSaving] = useState(false);

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

    async function loadDetails() {
      setState("loading");
      setErrorMessage("");
      setSuccessMessage("");

      try {
        // Charge les informations complètes de la pharmacie.
        const loadedPharmacy = await getPharmacyDetail(pharmacyId);
        setPharmacy(loadedPharmacy);
        setState("ready");

        // Charge les permissions pour afficher (ou non) le bouton Modifier.
        try {
          const currentPermissions = await getPharmacyPermissions(pharmacyId);
          setPermissions(currentPermissions);
        } catch {
          // Sans permission active, on considère simplement l'édition désactivée.
          setPermissions({});
        }
      } catch (error) {
        // Le message vient directement de l'API (ex : permission refusée).
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Impossible de charger les informations de la pharmacie.",
        );
        setState("error");
      }
    }

    loadDetails();
  }, [pharmacyId]);

  function startEditing() {
    if (!pharmacy) {
      return;
    }

    setSuccessMessage("");
    setForm({
      name: pharmacy.name ?? "",
      email: pharmacy.email ?? "",
      phoneNumber: pharmacy.phoneNumber ?? "",
      devise: pharmacy.devise ?? "USD",
    });
    setIsEditing(true);
  }

  function cancelEditing() {
    setIsEditing(false);
    setForm({});
    setErrorMessage("");
  }

  function handleField(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function saveChanges() {
    if (!pharmacyId) {
      return;
    }

    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const updatedPharmacy = await updatePharmacy(pharmacyId, form);
      setPharmacy(updatedPharmacy);
      setIsEditing(false);
      setForm({});
      setSuccessMessage("Informations de la pharmacie mises à jour.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Impossible de modifier la pharmacie.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  const canEdit = Boolean(permissions.pharmacy_update) && !pharmacy?.isArchivedAt;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <a
        href={pharmacyId ? "/app/pharmacies/" + pharmacyId + "/settings" : "#"}
        className="text-sm font-semibold text-primary-700 transition hover:text-primary-800"
      >
        Retour aux paramètres
      </a>

      <section className="mt-6 rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
        <p className="text-sm font-semibold text-primary-700">Détails pharmacie</p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-app-text">Informations générales</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-app-muted">
              Consultez et modifiez les informations générales de la pharmacie.
            </p>
          </div>
          {!isEditing && canEdit && (
            <button
              type="button"
              onClick={startEditing}
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-app-border bg-app-card px-5 py-2.5 text-sm font-semibold text-app-text transition hover:bg-primary-50 focus:outline-none focus:ring-4 focus:ring-primary-100"
            >
              Modifier
            </button>
          )}
        </div>
      </section>

      {errorMessage && (
        <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold leading-6 text-red-700">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="mt-5 rounded-lg border border-success-100 bg-success-50 p-4 text-sm font-semibold leading-6 text-success-700">
          {successMessage}
        </div>
      )}

      {state === "loading" && (
        <section className="mt-6 rounded-lg border border-app-border bg-app-card p-8 text-center text-sm font-semibold text-app-muted">
          Chargement des informations...
        </section>
      )}

      {state === "error" && (
        <section className="mt-6 rounded-lg border border-app-border bg-app-card p-8 text-center text-sm font-semibold text-app-muted">
          Informations indisponibles.
        </section>
      )}

      {state === "ready" && pharmacy && (
        <DetailBody
          pharmacy={pharmacy}
          isEditing={isEditing}
          form={form}
          isSaving={isSaving}
          onFieldChange={handleField}
          onSave={saveChanges}
          onCancel={cancelEditing}
        />
      )}
    </main>
  );
}

function DetailBody({
  pharmacy,
  isEditing,
  form,
  isSaving,
  onFieldChange,
  onSave,
  onCancel,
}: {
  pharmacy: PharmacyDetail;
  isEditing: boolean;
  form: UpdatePharmacyInput;
  isSaving: boolean;
  onFieldChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <section className="mt-6 grid gap-4">
      <article className="rounded-lg border border-app-border bg-app-card p-5">
        <h2 className="text-lg font-bold text-app-text">Identité</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Detail label="Référence" value={pharmacy.reference} />
          <Detail label="Statut" value={pharmacy.isArchivedAt ? "Archivée" : "Active"} />
          <Detail label="Référence propriétaire" value={pharmacy.ownerReference} />
          <Detail label="Parrain" value={pharmacy.invitedByReference} />
          <Detail label="Slug" value={pharmacy.slug} />
          <Detail label="Créée le" value={pharmacy.createdAt} />
          <Detail label="Mise à jour le" value={pharmacy.updatedAt} />
        </div>
      </article>

      <article className="rounded-lg border border-app-border bg-app-card p-5">
        <h2 className="text-lg font-bold text-app-text">Coordonnées</h2>

        {isEditing ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <TextField
              label="Nom"
              name="name"
              value={form.name ?? ""}
              onChange={onFieldChange}
            />
            <TextField
              label="Email"
              name="email"
              type="email"
              value={form.email ?? ""}
              onChange={onFieldChange}
            />
            <TextField
              label="Téléphone"
              name="phoneNumber"
              value={form.phoneNumber ?? ""}
              onChange={onFieldChange}
            />
            <SelectField
              label="Devise"
              name="devise"
              value={form.devise ?? "USD"}
              options={currencyOptions}
              onChange={onFieldChange}
            />
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Detail label="Nom" value={pharmacy.name} />
            <Detail label="Email" value={pharmacy.email} />
            <Detail label="Téléphone" value={pharmacy.phoneNumber} />
            <Detail label="Devise" value={pharmacy.devise} />
          </div>
        )}

        {isEditing && (
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSaving}
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-app-border bg-app-card px-5 py-2.5 text-sm font-semibold text-app-text transition hover:bg-primary-50 focus:outline-none focus:ring-4 focus:ring-primary-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={isSaving}
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700 focus:outline-none focus:ring-4 focus:ring-primary-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        )}
      </article>

      {pharmacy.address && (
        <article className="rounded-lg border border-app-border bg-app-card p-5">
          <h2 className="text-lg font-bold text-app-text">Adresse</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Detail label="Pays" value={pharmacy.address.country} />
            <Detail label="Ville ou province" value={pharmacy.address.cityOrProvince} />
            <Detail label="Quartier" value={pharmacy.address.neighborhood} />
            <Detail label="Rue" value={pharmacy.address.street} />
            <Detail label="Complément" value={pharmacy.address.complementAdresse} />
            <Detail label="Code postal" value={pharmacy.address.postalCode} />
            <Detail label="Proximité transports" value={pharmacy.address.proximiteTransports} />
            <Detail label="Adresse formatée" value={pharmacy.address.formattedAddress} />
          </div>
        </article>
      )}
    </section>
  );
}

function Detail({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-app-muted">{label}</p>
      <p className="mt-1 text-sm font-semibold text-app-text">
        {value && String(value).trim() ? value : "—"}
      </p>
    </div>
  );
}

function TextField({
  label,
  name,
  value,
  type = "text",
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  type?: string;
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-wide text-app-muted">{label}</span>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className="mt-1 min-h-10 w-full rounded-md border border-app-border bg-app-background px-3 text-sm font-medium text-app-text outline-none transition focus:border-primary-600 focus:ring-4 focus:ring-primary-100"
      />
    </label>
  );
}

function SelectField({
  label,
  name,
  value,
  options,
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-wide text-app-muted">{label}</span>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="mt-1 min-h-10 w-full rounded-md border border-app-border bg-app-background px-3 text-sm font-medium text-app-text outline-none transition focus:border-primary-600 focus:ring-4 focus:ring-primary-100"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
