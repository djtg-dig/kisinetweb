"use client";

import { FormEvent, useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import {
  createPharmacy,
  getCitiesOrProvinces,
  getCountries,
  type CityOrProvinceOption,
  type CountryOption,
} from "@/lib/api";
import { LAST_PHARMACY_KEY } from "@/lib/auth";

type FormState = {
  name: string;
  email: string;
  phoneNumber: string;
  devise: string;
  countryPhoneCode: string;
  cityOrProvinceId: string;
  street: string;
  neighborhood: string;
};

const initialFormState: FormState = {
  name: "",
  email: "",
  phoneNumber: "",
  devise: "USD",
  countryPhoneCode: "",
  cityOrProvinceId: "",
  street: "",
  neighborhood: "",
};

const currencyOptions = [
  { label: "USD", value: "USD" },
  { label: "CDF", value: "CDF" },
];

export default function CreatePharmacyPage() {
  const [form, setForm] = useState<FormState>(initialFormState);
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [citiesOrProvinces, setCitiesOrProvinces] = useState<CityOrProvinceOption[]>([]);
  const [isLoadingCountries, setIsLoadingCountries] = useState(true);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  useEffect(() => {
    let isMounted = true;

    async function loadCountries() {
      setIsLoadingCountries(true);
      setErrorMessage("");

      try {
        const rows = await getCountries();
        if (!isMounted) {
          return;
        }

        setCountries(rows);
        setForm((current) => {
          if (current.countryPhoneCode || !rows.length) {
            return current;
          }

          const defaultCountry = rows.find((country) => country.phoneCode === "+243") || rows[0];
          return { ...current, countryPhoneCode: defaultCountry.phoneCode };
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const message = error instanceof Error ? error.message : "";
        setErrorMessage(message || "Impossible de charger les pays.");
      } finally {
        if (isMounted) {
          setIsLoadingCountries(false);
        }
      }
    }

    loadCountries();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadCitiesOrProvinces() {
      if (!form.countryPhoneCode) {
        setCitiesOrProvinces([]);
        setForm((current) => ({ ...current, cityOrProvinceId: "" }));
        return;
      }

      setIsLoadingCities(true);

      try {
        const rows = await getCitiesOrProvinces(form.countryPhoneCode);
        if (!isMounted) {
          return;
        }

        setCitiesOrProvinces(rows);
        setForm((current) => {
          const selectedCityExists = rows.some(
            (cityOrProvince) => String(cityOrProvince.id) === current.cityOrProvinceId,
          );
          if (selectedCityExists) {
            return current;
          }

          return {
            ...current,
            cityOrProvinceId: rows.length ? String(rows[0].id) : "",
          };
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setCitiesOrProvinces([]);
        setForm((current) => ({ ...current, cityOrProvinceId: "" }));
        const message = error instanceof Error ? error.message : "";
        setErrorMessage(message || "Impossible de charger les villes ou provinces.");
      } finally {
        if (isMounted) {
          setIsLoadingCities(false);
        }
      }
    }

    loadCitiesOrProvinces();

    return () => {
      isMounted = false;
    };
  }, [form.countryPhoneCode]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const pharmacy = await createPharmacy({
        name: form.name.trim(),
        email: form.email.trim(),
        phoneNumber: form.phoneNumber.trim(),
        devise: form.devise,
        country: form.countryPhoneCode,
        cityOrProvince: form.cityOrProvinceId,
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

              <SelectField
                id="devise"
                label="Devise"
                value={form.devise}
                onChange={(value) => updateField("devise", value)}
                options={currencyOptions}
                required
              />

              <div className="border-t border-app-border pt-5">
                <h2 className="text-lg font-bold text-app-text">Adresse</h2>
                <div className="mt-4 grid gap-5">
                  <div className="grid gap-5 sm:grid-cols-[180px_1fr]">
                    <SelectField
                      id="country"
                      label="Pays"
                      value={form.countryPhoneCode}
                      onChange={(value) => {
                        setForm((current) => ({
                          ...current,
                          countryPhoneCode: value,
                          cityOrProvinceId: "",
                        }));
                      }}
                      options={countries.map((country) => ({
                        label: country.name + " (" + country.phoneCode + ")",
                        value: country.phoneCode,
                      }))}
                      required
                      disabled={isLoadingCountries || !countries.length}
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
                  <SelectField
                    id="cityOrProvince"
                    label="Ville ou province"
                    value={form.cityOrProvinceId}
                    onChange={(value) => updateField("cityOrProvinceId", value)}
                    options={citiesOrProvinces.map((cityOrProvince) => ({
                      label: cityOrProvince.name,
                      value: String(cityOrProvince.id),
                    }))}
                    required
                    disabled={isLoadingCities || !citiesOrProvinces.length}
                  />
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
                  !form.cityOrProvinceId.trim() ||
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
  disabled = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  required?: boolean;
  disabled?: boolean;
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
        disabled={disabled}
        className="mt-2 min-h-11 w-full rounded-md border border-app-border bg-app-surface px-3 py-2 text-sm text-app-text outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100 disabled:cursor-not-allowed disabled:bg-app-border/30 disabled:text-app-muted"
      >
        {!options.length && (
          <option value="">
            {disabled ? "Chargement..." : "Aucune option disponible"}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
