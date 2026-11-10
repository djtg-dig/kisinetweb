"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { ToastMessage } from "@/components/ui/toast";
import {
  createPharmacy,
  getCitiesOrProvinces,
  getCountries,
  getCurrencies,
  type CityOrProvinceOption,
  type CountryOption,
  type CurrencyOption,
} from "@/lib/api";
import { setActivePharmacyId } from "@/lib/auth";
import { isPharmacyLicenseLimitError } from "@/lib/license-limit";

type FormState = {
  name: string;
  email: string;
  phoneNumber: string;
  devise: string;
  countryPhoneCode: string;
  cityOrProvinceId: string;
  street: string;
  neighborhood: string;
  invitedBy: string;
};

type FormField = keyof FormState;
type FieldErrors = Partial<Record<FormField, string>>;
type LicenseModalMode = "limit" | "unavailable";

const initialFormState: FormState = {
  name: "",
  email: "",
  phoneNumber: "",
  devise: "",
  countryPhoneCode: "",
  cityOrProvinceId: "",
  street: "",
  neighborhood: "",
  invitedBy: "",
};

// Le backend n'accepte que la référence publique du parrain au format
// USXXXXXXXX : on la contrôle côté client pour éviter un aller-retour inutile.
const referralCodePattern = /^US[A-Z0-9]{8}$/;
const referralCodeLength = 10;

// Les devises ne sont plus codées en dur : elles proviennent de l'endpoint
// public `/api/paiements/currencies/`, chargé dans `loadReferenceData`.
const currencyOptions: CurrencyOption[] = [];

export default function CreatePharmacyPage() {
  const [form, setForm] = useState<FormState>(initialFormState);
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [citiesOrProvinces, setCitiesOrProvinces] = useState<CityOrProvinceOption[]>([]);
  const [currencies, setCurrencies] = useState<CurrencyOption[]>([]);
  const [isLoadingCountries, setIsLoadingCountries] = useState(true);
  const [isLoadingCurrencies, setIsLoadingCurrencies] = useState(true);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touchedFields, setTouchedFields] = useState<Partial<Record<FormField, boolean>>>({});
  const [toast, setToast] = useState<{ tone: "error"; message: string } | null>(null);
  const [licenseModalMode, setLicenseModalMode] = useState<LicenseModalMode | null>(null);

  function updateField(field: FormField, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: validateField(field, value) }));
  }

  function validateField(field: FormField, value = form[field]) {
    const trimmedValue = value.trim();

    if (field === "name" && !trimmedValue) {
      return "Le nom de la pharmacie est obligatoire.";
    }
    if (field === "devise" && !trimmedValue) {
      return "Veuillez sélectionner une devise.";
    }
    if (field === "countryPhoneCode" && !trimmedValue) {
      return "Veuillez sélectionner un pays.";
    }
    if (field === "cityOrProvinceId" && !trimmedValue) {
      return "Veuillez sélectionner une ville ou une province.";
    }
    if (field === "street" && !trimmedValue) {
      return "Veuillez renseigner une adresse.";
    }
    if (field === "email" && trimmedValue && !/^\S+@\S+\.\S+$/.test(trimmedValue)) {
      return "Veuillez saisir une adresse e-mail valide.";
    }
    if (field === "invitedBy" && trimmedValue && !referralCodePattern.test(trimmedValue.toUpperCase())) {
      return "Le code de parrainage doit respecter le format USXXXXXXXX (10 caractères).";
    }

    return "";
  }

  function validateForm() {
    const nextErrors = (Object.keys(form) as FormField[]).reduce<FieldErrors>((errors, field) => {
      const message = validateField(field);
      if (message) {
        errors[field] = message;
      }
      return errors;
    }, {});

    setFieldErrors(nextErrors);
    setTouchedFields(
      (Object.keys(form) as FormField[]).reduce(
        (touched, field) => ({ ...touched, [field]: true }),
        {},
      ),
    );
    return nextErrors;
  }

  function focusFirstInvalidField(errors: FieldErrors) {
    const firstInvalidField = [
      "name",
      "email",
      "phoneNumber",
      "devise",
      "countryPhoneCode",
      "cityOrProvinceId",
      "street",
      "neighborhood",
      "invitedBy",
    ].find((field) => errors[field as FormField]);

    if (!firstInvalidField) {
      return;
    }

    window.requestAnimationFrame(() => {
      const element = document.getElementById(firstInvalidField);
      element?.scrollIntoView({ behavior: "smooth", block: "center" });
      if (element instanceof HTMLInputElement || element instanceof HTMLSelectElement) {
        element.focus();
      }
    });
  }

  function handleBlur(field: FormField) {
    setTouchedFields((current) => ({ ...current, [field]: true }));
    setFieldErrors((current) => ({ ...current, [field]: validateField(field) }));
  }

  function showError(message: string) {
    setToast({ tone: "error", message });
  }

  function applyBackendErrors(message: string) {
    const nextErrors: FieldErrors = {};
    const fieldMap: Record<string, FormField> = {
      name: "name",
      email: "email",
      phone_number: "phoneNumber",
      devise: "devise",
      country: "countryPhoneCode",
      city_or_province: "cityOrProvinceId",
      street: "street",
      invited_by: "invitedBy",
      "adresse.country": "countryPhoneCode",
      "adresse.city_or_province": "cityOrProvinceId",
      "adresse.street": "street",
    };

    for (const line of message.split("\n")) {
      const separatorIndex = line.indexOf(" : ");
      if (separatorIndex === -1) {
        continue;
      }
      const key = line.slice(0, separatorIndex);
      const field = fieldMap[key];
      if (field) {
        nextErrors[field] = line.slice(separatorIndex + 3);
      }
    }

    if (Object.keys(nextErrors).length) {
      setFieldErrors((current) => ({ ...current, ...nextErrors }));
      setTouchedFields((current) => ({
        ...current,
        ...Object.keys(nextErrors).reduce(
          (fields, field) => ({ ...fields, [field]: true }),
          {},
        ),
      }));
      focusFirstInvalidField(nextErrors);
    }
  }

  function getSafeSubmissionError(error: unknown) {
    const message = error instanceof Error ? error.message.trim() : "";
    const technicalMessage = /fetch failed|internal server error|traceback|exception|syntaxerror|database|sql/i.test(
      message,
    );

    return message && !technicalMessage
      ? message
      : "Impossible de créer cette pharmacie. Veuillez réessayer dans quelques instants.";
  }

  useEffect(() => {
    let isMounted = true;

    async function loadReferenceData() {
      setIsLoadingCountries(true);
      setIsLoadingCurrencies(true);
      setErrorMessage("");

      try {
        // Chargement en parallèle des pays et des devises, les deux étant
        // fournis par des endpoints publics. Les devises proviennent de
        // `/api/paiements/currencies/` (source de vérité backend).
        const [countryRows, currencyRows] = await Promise.all([
          getCountries(),
          getCurrencies(),
        ]);

        if (!isMounted) {
          return;
        }

        setCountries(countryRows);
        setCurrencies(currencyRows);

        setForm((current) => {
          const next = { ...current };

          // Devise par défaut : CDF (devise locale RDC) si présente, sinon USD,
          // sinon la première devise disponible. On évite toute valeur codée en
          // dur qui ne figurerait pas dans la base.
          if (!current.devise && currencyRows.length) {
            const preferred =
              currencyRows.find((currency) => currency.code === "CDF") ||
              currencyRows.find((currency) => currency.code === "USD") ||
              currencyRows[0];
            next.devise = preferred.code;
          }

          // Pays par défaut : RDC (+243) si présent, sinon le premier pays.
          if (!current.countryPhoneCode) {
            const defaultCountry =
              countryRows.find((country) => country.phoneCode === "+243") ||
              countryRows[0];
            next.countryPhoneCode = defaultCountry?.phoneCode || "";
          }

          return next;
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const message = error instanceof Error ? error.message : "";
        setErrorMessage(message || "Impossible de charger les données de référence.");
      } finally {
        if (isMounted) {
          setIsLoadingCountries(false);
          setIsLoadingCurrencies(false);
        }
      }
    }

    loadReferenceData();

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
    setToast(null);

    const errors = validateForm();
    if (Object.keys(errors).length) {
      const message =
        "Certains champs sont incomplets ou incorrects. Veuillez corriger les informations indiquées ci-dessous.";
      showError(message);
      focusFirstInvalidField(errors);
      return;
    }

    const invitedBy = form.invitedBy.trim().toUpperCase();
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
        invitedBy,
      });

      setActivePharmacyId(pharmacy.id);
      const params = new URLSearchParams(window.location.search);
      const returnTo = params.get("return_to");

      if (returnTo?.startsWith("/tarifs/")) {
        window.location.href = returnTo;
        return;
      }

      window.location.href = "/app/pharmacies/" + pharmacy.id + "/dashboard";
    } catch (error) {
      if (isPharmacyLicenseLimitError(error)) {
        setToast(null);
        setIsSubmitting(false);
        setLicenseModalMode("limit");
        return;
      }

      const safeMessage = getSafeSubmissionError(error);
      applyBackendErrors(safeMessage);
      showError(safeMessage);
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
              Retour
            </LinkButton>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <form
          onSubmit={handleSubmit}
          noValidate
          className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]"
        >
          <div className="rounded-lg border border-app-border bg-app-card p-5 shadow-sm sm:p-6">
            {toast && (
              <ToastMessage tone={toast.tone} onClose={() => setToast(null)}>
                {toast.message}
              </ToastMessage>
            )}
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
                onBlur={() => handleBlur("name")}
                required
                error={touchedFields.name ? fieldErrors.name : ""}
                placeholder="Ex. Pharmacie Centrale"
              />

              <div className="grid gap-5 sm:grid-cols-2">
                <TextField
                  id="email"
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(value) => updateField("email", value)}
                  onBlur={() => handleBlur("email")}
                  error={touchedFields.email ? fieldErrors.email : ""}
                  placeholder="contact@pharmacie.cd"
                />
                <TextField
                  id="phoneNumber"
                  label="Téléphone"
                  type="tel"
                  value={form.phoneNumber}
                  onChange={(value) => updateField("phoneNumber", value)}
                  onBlur={() => handleBlur("phoneNumber")}
                  error={touchedFields.phoneNumber ? fieldErrors.phoneNumber : ""}
                  placeholder="+243 ..."
                />
              </div>

              <SelectField
                id="devise"
                label="Devise"
                value={form.devise}
                onChange={(value) => updateField("devise", value)}
                onBlur={() => handleBlur("devise")}
                options={currencies}
                required
                disabled={isLoadingCurrencies}
                error={touchedFields.devise ? fieldErrors.devise : ""}
              />

              <TextField
                id="invitedBy"
                label="Code de parrainage (facultatif)"
                value={form.invitedBy}
                onChange={(value) => updateField("invitedBy", value.toUpperCase())}
                onBlur={() => handleBlur("invitedBy")}
                error={touchedFields.invitedBy ? fieldErrors.invitedBy : ""}
                placeholder="Ex. USA7K9M2Q1"
                maxLength={referralCodeLength}
                hint="Référence publique de la personne qui vous a invité, au format USXXXXXXXX. Laissez vide si vous n'avez pas de parrain."
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
                      onBlur={() => handleBlur("countryPhoneCode")}
                      options={countries.map((country) => ({
                        label: country.name + " (" + country.phoneCode + ")",
                        value: country.phoneCode,
                      }))}
                      required
                      disabled={isLoadingCountries || !countries.length}
                      error={touchedFields.countryPhoneCode ? fieldErrors.countryPhoneCode : ""}
                    />
                    <TextField
                      id="street"
                      label="Rue et numéro"
                      value={form.street}
                      onChange={(value) => updateField("street", value)}
                      onBlur={() => handleBlur("street")}
                      required
                      error={touchedFields.street ? fieldErrors.street : ""}
                      placeholder="Ex. Avenue du Commerce 12"
                    />
                  </div>
                  <SelectField
                    id="cityOrProvince"
                    label="Ville, province ou région."
                    value={form.cityOrProvinceId}
                    onChange={(value) => updateField("cityOrProvinceId", value)}
                    onBlur={() => handleBlur("cityOrProvinceId")}
                    options={citiesOrProvinces.map((cityOrProvince) => ({
                      label: cityOrProvince.name,
                      value: String(cityOrProvince.id),
                    }))}
                    required
                    disabled={isLoadingCities || !citiesOrProvinces.length}
                    error={touchedFields.cityOrProvinceId ? fieldErrors.cityOrProvinceId : ""}
                  />
                  <TextField
                    id="neighborhood"
                    label="Quartier,commune,arrondissement, secteur, village ou repère local."
                  value={form.neighborhood}
                  onChange={(value) => updateField("neighborhood", value)}
                  onBlur={() => handleBlur("neighborhood")}
                  error={touchedFields.neighborhood ? fieldErrors.neighborhood : ""}
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
                  isSubmitting
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
              tableau de bord ou vous ramènera vers la souscription en cours.
            </p>
          </aside>
        </form>
      </section>

      <LicenseModal
        mode={licenseModalMode}
        onClose={() => setLicenseModalMode(null)}
        onPurchase={() => setLicenseModalMode("unavailable")}
      />
    </MainLayout>
  );
}

function LicenseModal({
  mode,
  onClose,
  onPurchase,
}: {
  mode: LicenseModalMode | null;
  onClose: () => void;
  onPurchase: () => void;
}) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!mode) {
      previousFocusRef.current?.focus();
      previousFocusRef.current = null;
      return;
    }

    if (!previousFocusRef.current) {
      previousFocusRef.current = document.activeElement as HTMLElement | null;
    }
  }, [mode]);

  useEffect(() => {
    if (!mode) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    window.requestAnimationFrame(() => closeButtonRef.current?.focus());
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mode, onClose]);

  if (!mode) {
    return null;
  }

  const unavailable = mode === "unavailable";
  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/45 p-4">
      <button
        type="button"
        aria-label="Fermer la fenêtre"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="license-modal-title"
        className="relative w-full max-w-md rounded-xl border border-app-border bg-app-card p-6 shadow-soft"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="license-modal-title" className="text-lg font-bold text-app-text">
            {unavailable ? "Service temporairement indisponible" : "Limite de licence atteinte"}
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-md border border-app-border bg-app-surface px-2.5 py-1.5 text-sm text-app-muted transition hover:text-app-text focus:outline-none focus:ring-4 focus:ring-primary-100"
          >
            ✕
          </button>
        </div>

        {unavailable ? (
          <p className="mt-4 text-sm leading-6 text-app-muted">
            L'achat de licences supplémentaires sera disponible prochainement. Nous configurons actuellement ce service.
          </p>
        ) : (
          <>
            <p className="mt-4 text-sm leading-6 text-app-text">
              Votre licence actuelle ne permet pas de créer une pharmacie supplémentaire.
            </p>
            <p className="mt-3 text-sm leading-6 text-app-muted">
              Pour créer plus d'une pharmacie, vous devez disposer d'une licence supplémentaire.
            </p>
          </>
        )}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          {!unavailable && (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-app-border bg-app-surface px-5 py-2.5 text-sm font-semibold text-app-text transition hover:bg-primary-50 focus:outline-none focus:ring-4 focus:ring-primary-100"
            >
              Plus tard
            </button>
          )}
          <button
            type="button"
            onClick={unavailable ? onClose : onPurchase}
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700 focus:outline-none focus:ring-4 focus:ring-primary-100"
          >
            {unavailable ? "Fermer" : "Acheter une licence"}
          </button>
        </div>
      </div>
    </div>
  );
}

function TextField({
  id,
  label,
  value,
  onChange,
  onBlur,
  type = "text",
  required = false,
  placeholder,
  maxLength,
  hint,
  error,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  maxLength?: number;
  hint?: string;
  error?: string;
}) {
  const errorId = id + "-error";
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
        onBlur={onBlur}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : hint ? id + "-hint" : undefined}
        placeholder={placeholder}
        maxLength={maxLength}
        className={`mt-2 min-h-11 w-full rounded-md border bg-app-surface px-3 py-2 text-sm text-app-text outline-none transition placeholder:text-app-muted focus:ring-4 focus:ring-primary-100 ${error ? "border-red-400 focus:border-red-500" : "border-app-border focus:border-primary-500"}`}
      />
      {error && (
        <span id={errorId} className="mt-2 block text-xs font-semibold text-red-600">
          {error}
        </span>
      )}
      {hint && !error && (
        <span id={id + "-hint"} className="mt-2 block text-xs leading-5 text-app-muted">
          {hint}
        </span>
      )}
    </label>
  );
}

function SelectField({
  id,
  label,
  value,
  onChange,
  onBlur,
  options,
  required = false,
  disabled = false,
  error,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  options: { label: string; value: string }[];
  required?: boolean;
  disabled?: boolean;
  error?: string;
}) {
  const errorId = id + "-error";
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
        onBlur={onBlur}
        required={required}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={`mt-2 min-h-11 w-full rounded-md border bg-app-surface px-3 py-2 text-sm text-app-text outline-none transition focus:ring-4 disabled:cursor-not-allowed disabled:bg-app-border/30 disabled:text-app-muted ${error ? "border-red-400 focus:border-red-500" : "border-app-border focus:border-primary-500"}`}
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
      {error && (
        <span id={errorId} className="mt-2 block text-xs font-semibold text-red-600">
          {error}
        </span>
      )}
    </label>
  );
}
