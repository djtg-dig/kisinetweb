"use client";

import { FormEvent, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { createPharmacy } from "@/lib/api";
import { LAST_PHARMACY_KEY } from "@/lib/auth";

type FormState = {
  name: string;
  email: string;
  phoneNumber: string;
  countryPhoneCode: string;
  street: string;
  neighborhood: string;
};

const countryOptions = [
  { label: "Congo (République démocratique)", value: "+243" },
  { label: "Congo", value: "+242" },
  { label: "Angola", value: "+244" },
  { label: "Burundi", value: "+257" },
  { label: "Cameroun", value: "+237" },
  { label: "Centrafrique", value: "+236" },
  { label: "Côte d'Ivoire", value: "+225" },
  { label: "France", value: "+33" },
  { label: "Gabon", value: "+241" },
  { label: "Rwanda", value: "+250" },
  { label: "Sénégal", value: "+221" },
  { label: "Tanzanie", value: "+255" },
  { label: "Ouganda", value: "+256" },
  { label: "Zambie", value: "+260" },
];

const initialFormState: FormState = {
  name: "",
  email: "",
  phoneNumber: "",
  countryPhoneCode: "+243",
  street: "",
  neighborhood: "",
};

export default function CreatePharmacyPage() {
  const [form, setForm] = useState<FormState>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const pharmacy = await createPharmacy({
        name: form.name.trim(),
        email: form.email.trim(),
        phoneNumber: form.phoneNumber.trim(),
        country: form.countryPhoneCode,
        street: form.street.trim(),
        neighborhood: form.neighborhood.trim(),
      });

      localStorage.setItem(LAST_PHARMACY_KEY, pharmacy.id);
      window.location.href = "/app/pharmacies/" + pharmacy.id + "/dashboard";
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      setErrorMessage(message || "Impossible de créer cette pharmacie.");
      setIsSubmitting(false);
    }
  }

  return (
    <MainLayout>
      <section className="border-b border-app-border bg-app-surface">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold text-primary-700">Pharmacie</p>
          <div className="mt-2 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-app-text">Créer une pharmacie</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-app-muted">
                Renseignez les informations principales de la pharmacie. Vous pourrez
                compléter les détails depuis le tableau de bord.
              </p>
            </div>
            <LinkButton href="/app/select-pharmacy" variant="secondary">
              Retour à la sélection
            </LinkButton>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <form
          onSubmit={handleSubmit}
          className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]"
        >
          <div className="rounded-lg border border-app-border bg-app-card p-5 shadow-sm sm:p-6">
            {errorMessage && (
              <div
                role="alert"
                className="mb-5 whitespace-pre-line rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
              >
                {errorMessage}
              </div>
            )}

            <div className="grid gap-5">
              <TextField
                id="name"
                label="Nom de la pharmacie"
                value={form.name}
                onChange={(value) => updateField("name", value)}
                required
                placeholder="Ex. Pharmacie Centrale"
              />

              <div className="grid gap-5 sm:grid-cols-2">
                <TextField
                  id="email"
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(value) => updateField("email", value)}
                  placeholder="contact@pharmacie.cd"
                />
                <TextField
                  id="phoneNumber"
                  label="Téléphone"
                  type="tel"
                  value={form.phoneNumber}
                  onChange={(value) => updateField("phoneNumber", value)}
                  placeholder="+243 ..."
                />
              </div>

              <div className="border-t border-app-border pt-5">
                <h2 className="text-lg font-bold text-app-text">Adresse</h2>
                <div className="mt-4 grid gap-5">
                  <div className="grid gap-5 sm:grid-cols-[180px_1fr]">
                    <SelectField
                      id="country"
                      label="Pays"
                      value={form.countryPhoneCode}
                      onChange={(value) => updateField("countryPhoneCode", value)}
                      options={countryOptions}
                      required
                    />
                    <TextField
                      id="street"
                      label="Rue et numéro"
                      value={form.street}
                      onChange={(value) => updateField("street", value)}
                      required
                      placeholder="Ex. Avenue du Commerce 12"
                    />
                  </div>
                  <TextField
                    id="neighborhood"
                    label="Quartier ou commune"
                    value={form.neighborhood}
                    onChange={(value) => updateField("neighborhood", value)}
                    placeholder="Ex. Gombe"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 border-t border-app-border pt-5 sm:flex-row sm:justify-end">
              <LinkButton href="/app/select-pharmacy" variant="secondary">
                Annuler
              </LinkButton>
              <Button
                type="submit"
                disabled={
                  isSubmitting ||
                  !form.name.trim() ||
                  !form.countryPhoneCode.trim() ||
                  !form.street.trim()
                }
              >
                {isSubmitting ? "Création en cours..." : "Créer la pharmacie"}
              </Button>
            </div>
          </div>

          <aside className="rounded-lg border border-app-border bg-app-surface p-5">
            <p className="text-sm font-semibold text-primary-700">Après création</p>
            <p className="mt-2 text-sm leading-6 text-app-muted">
              La pharmacie sera associée à votre compte, puis Kisinet ouvrira son
              tableau de bord automatiquement.
            </p>
          </aside>
        </form>
      </section>
    </MainLayout>
  );
}

function TextField({
  id,
  label,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label htmlFor={id} className="block">
      <span className="text-sm font-semibold text-app-text">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </span>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        placeholder={placeholder}
        className="mt-2 min-h-11 w-full rounded-md border border-app-border bg-app-surface px-3 py-2 text-sm text-app-text outline-none transition placeholder:text-app-muted focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
      />
    </label>
  );
}

function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  required = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  required?: boolean;
}) {
  return (
    <label htmlFor={id} className="block">
      <span className="text-sm font-semibold text-app-text">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </span>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        className="mt-2 min-h-11 w-full rounded-md border border-app-border bg-app-surface px-3 py-2 text-sm text-app-text outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
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
