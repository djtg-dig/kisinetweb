"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { LoadingBubble } from "@/components/ui/loading-bubble";
import { ToastMessage } from "@/components/ui/toast";
import {
  createPharmacy,
  createOPTGatewayUserLicensePurchase,
  getSafeOPTGatewayCheckoutUrl,
  getMyUserLicense,
  getUserLicensePlans,
  getCitiesOrProvinces,
  getCountries,
  getCurrencies,
  updatePharmacyGeneralSettings,
  type CityOrProvinceOption,
  type CountryOption,
  type CurrencyOption,
  type UserLicensePlan,
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
type LicenseAccessState = "checking" | "allowed" | "limited" | "error";

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
  const [isPublic, setIsPublic] = useState(false);
  const [createdPharmacyId, setCreatedPharmacyId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touchedFields, setTouchedFields] = useState<Partial<Record<FormField, boolean>>>({});
  const [toast, setToast] = useState<{ tone: "error"; message: string } | null>(null);
  const [licenseModalMode, setLicenseModalMode] = useState<LicenseModalMode | null>(null);
  const [licenseAccessState, setLicenseAccessState] = useState<LicenseAccessState>("checking");
  const [licenseAccessError, setLicenseAccessError] = useState("");
  const [licensePlans, setLicensePlans] = useState<UserLicensePlan[]>([]);
  const [licensePlansLoading, setLicensePlansLoading] = useState(false);
  const [licensePurchaseError, setLicensePurchaseError] = useState("");
  const [licensePurchaseLoading, setLicensePurchaseLoading] = useState(false);

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

    async function verifyLicenseAccess() {
      setLicenseAccessState("checking");
      setLicenseAccessError("");
      try {
        const license = await getMyUserLicense();
        if (!isMounted) {
          return;
        }
        if (license.canCreatePharmacy) {
          setLicenseModalMode(null);
          setLicenseAccessState("allowed");
        } else {
          setLicenseModalMode("limit");
          setLicenseAccessState("limited");
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }
        setLicenseAccessState("error");
        setLicenseAccessError(error instanceof Error ? error.message : "Impossible de vérifier votre licence.");
      }
    }

    void verifyLicenseAccess();
    return () => {
      isMounted = false;
    };
  }, []);

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

  useEffect(() => {
    if (licenseModalMode !== "limit" || licensePlans.length) {
      return;
    }
    setLicensePlansLoading(true);
    getUserLicensePlans()
      .then((plans) => setLicensePlans(plans))
      .catch((error) => setLicensePurchaseError(error instanceof Error ? error.message : "Impossible de charger les licences."))
      .finally(() => setLicensePlansLoading(false));
  }, [licenseModalMode, licensePlans.length]);

  function retryLicenseAccess() {
    setLicenseAccessState("checking");
    setLicenseAccessError("");
    window.location.reload();
  }

  if (licenseAccessState === "checking") {
    return (
      <MainLayout>
        <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
          <LoadingBubble label="Vérification de votre capacité de création" className="min-h-[220px]" />
        </main>
      </MainLayout>
    );
  }

  if (licenseAccessState === "error") {
    return (
      <MainLayout>
        <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
          <section className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
            <h1 className="text-xl font-bold text-red-800">Vérification impossible</h1>
            <p className="mt-3 text-sm text-red-700">{licenseAccessError}</p>
            <Button type="button" className="mt-5" onClick={retryLicenseAccess}>Réessayer</Button>
          </section>
        </main>
      </MainLayout>
    );
  }

  if (licenseAccessState === "limited") {
    return (
      <MainLayout>
        <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
          <LicenseModal
            mode="limit"
            inline
            onClose={() => { window.location.href = "/app/select-pharmacy"; }}
            plans={licensePlans}
            plansLoading={licensePlansLoading}
            purchaseError={licensePurchaseError}
            purchaseLoading={licensePurchaseLoading}
            onPurchase={async (planCode) => {
              setLicensePurchaseLoading(true);
              setLicensePurchaseError("");
              try {
                const purchase = await createOPTGatewayUserLicensePurchase(planCode, "license-" + crypto.randomUUID());
                window.location.assign(getSafeOPTGatewayCheckoutUrl(purchase.checkoutUrl));
              } catch (error) {
                setLicensePurchaseError(error instanceof Error ? error.message : "Impossible de démarrer le paiement.");
              } finally {
                setLicensePurchaseLoading(false);
              }
            }}
          />
        </main>
      </MainLayout>
    );
  }

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

      // `is_public` n'est pas accepté par l'API de création. Le backend crée
      // volontairement une pharmacie privée, puis cette préférence est mise à
      // jour par son endpoint dédié si l'utilisateur a donné son accord.
      if (isPublic) {
        try {
          await updatePharmacyGeneralSettings(pharmacy.id, { isPublic: true });
        } catch {
          setCreatedPharmacyId(pharmacy.id);
          setErrorMessage(
            "La pharmacie a été créée, mais sa visibilité dans l'annuaire n'a pas pu être enregistrée. Vous pouvez la modifier depuis ses détails.",
          );
          setIsSubmitting(false);
          return;
        }
      }

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
        setLicenseAccessState("limited");
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

              <div className="rounded-md border border-app-border bg-app-surface px-4 py-3">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    id="isPublic"
                    type="checkbox"
                    checked={isPublic}
                    onChange={(event) => setIsPublic(event.target.checked)}
                    disabled={isSubmitting || Boolean(createdPharmacyId)}
                    className="mt-1 h-4 w-4 accent-primary-600"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-app-text">
                      Visible dans l&apos;annuaire public
                    </span>
                    <span className="mt-1 block text-sm leading-6 text-app-muted">
                      Autorisez l&apos;apparition de cette pharmacie dans l&apos;annuaire public Kisinet et sur sa fiche publique indexable.
                    </span>
                  </span>
                </label>
              </div>

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
                disabled={isSubmitting || Boolean(createdPharmacyId)}
              >
                {isSubmitting
                  ? "Création en cours..."
                  : createdPharmacyId
                    ? "Pharmacie créée"
                    : "Créer la pharmacie"}
              </Button>
            </div>
            {createdPharmacyId && (
              <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <a
                  href={"/app/pharmacies/" + createdPharmacyId + "/settings/details"}
                  className="font-semibold underline underline-offset-2 focus:outline-none focus:ring-4 focus:ring-primary-100"
                >
                  Gérer la visibilité de la pharmacie
                </a>
              </div>
            )}
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
        plans={licensePlans}
        plansLoading={licensePlansLoading}
        purchaseError={licensePurchaseError}
        purchaseLoading={licensePurchaseLoading}
        onPurchase={async (planCode) => {
          setLicensePurchaseLoading(true);
          setLicensePurchaseError("");
          try {
            const purchase = await createOPTGatewayUserLicensePurchase(
              planCode,
              "license-" + crypto.randomUUID(),
            );
            window.location.assign(getSafeOPTGatewayCheckoutUrl(purchase.checkoutUrl));
          } catch (error) {
            setLicensePurchaseError(error instanceof Error ? error.message : "Impossible de démarrer le paiement.");
          } finally {
            setLicensePlansLoading(false);
            setLicensePurchaseLoading(false);
          }
        }}
      />
    </MainLayout>
  );
}

function LicenseModal({
  mode,
  inline = false,
  onClose,
  onPurchase,
  plans,
  plansLoading,
  purchaseError,
  purchaseLoading,
}: {
  mode: LicenseModalMode | null;
  inline?: boolean;
  onClose: () => void;
  plans: UserLicensePlan[];
  plansLoading: boolean;
  purchaseError: string;
  purchaseLoading: boolean;
  onPurchase: (planCode: string) => Promise<void>;
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
  const paidPlans = plans.filter((plan) => Number(plan.price) > 0);
  const paymentProviderUnavailable = isPaymentProviderUnavailable(purchaseError);
  const purchaseUnavailable = purchaseLoading || paymentProviderUnavailable;
  return (
    <div className={inline ? "w-full" : "fixed inset-0 z-[1200] flex items-center justify-center bg-black/45 p-4"}>
      {!inline && <button
        type="button"
        aria-label="Fermer la fenêtre"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="license-modal-title"
        className={(inline ? "mx-auto " : "relative ") + "w-full max-w-md rounded-xl border border-app-border bg-app-card p-6 shadow-soft"}
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
              Choisissez une licence disponible. Le paiement est sécurisé par OPTGateway et utilise Mobile Money uniquement.
            </p>
            <div className="mt-5 space-y-3">
              {plansLoading && <p className="text-sm text-app-muted">Chargement des licences...</p>}
              {!plansLoading && !paidPlans.length && <p className="text-sm text-app-muted">Aucune licence payante disponible.</p>}
              {purchaseError && (
                <div
                  role="alert"
                  aria-live="assertive"
                  className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-700 dark:border-red-900/70 dark:bg-red-950/30 dark:text-red-300"
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="mt-0.5 h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 3h.01M10.3 3.3 2.5 17a2 2 0 0 0 1.74 3h15.52A2 2 0 0 0 21.5 17L13.7 3.3a2 2 0 0 0-3.4 0Z" />
                  </svg>
                  <div>
                    <p className="font-semibold">Impossible de poursuivre le paiement</p>
                    <p>{purchaseError}</p>
                    {!paymentProviderUnavailable && <p className="mt-1">Vous pouvez réessayer en sélectionnant une licence.</p>}
                  </div>
                </div>
              )}
              {paidPlans.map((plan) => (
                <button
                  key={plan.code}
                  type="button"
                  disabled={purchaseUnavailable}
                  onClick={() => onPurchase(plan.code)}
                  className="group w-full rounded-xl border border-app-border bg-app-surface p-4 text-left shadow-sm transition duration-200 hover:border-primary-500 hover:bg-primary-50 focus:outline-none focus:ring-4 focus:ring-primary-100 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-primary-100"
                >
                  <span className="flex items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-700 dark:bg-primary-200 dark:text-primary-800">
                      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
                        <path strokeLinecap="round" d="M8.5 9.5h7M8.5 14.5h7" />
                      </svg>
                    </span>
                    <span className="min-w-0 flex-1">
                      <strong className="block text-base text-app-text">{plan.name}</strong>
                      <span className="mt-1 block text-sm text-app-muted">{getLicensePlanDescription(plan)}</span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block text-lg font-bold text-primary-700 dark:text-primary-700">{formatLicensePrice(plan.price, plan.currency)}</span>
                      <span className="mt-1 block text-xs text-app-muted">Paiement unique</span>
                    </span>
                  </span>
                  <span className="mt-4 flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition group-hover:bg-primary-700 group-focus-visible:bg-primary-700 group-disabled:bg-primary-600">
                    {purchaseLoading ? (
                      <>
                        <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                        Initialisation du paiement...
                      </>
                    ) : paymentProviderUnavailable ? (
                      "Paiement temporairement indisponible"
                    ) : (
                      <>
                        Acheter cette licence
                        <span aria-hidden="true">→</span>
                      </>
                    )}
                  </span>
                </button>
              ))}
            </div>
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
          {unavailable && <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700 focus:outline-none focus:ring-4 focus:ring-primary-100"
          >
            Fermer
          </button>}
        </div>
      </div>
    </div>
  );
}

function getLicensePlanDescription(plan: UserLicensePlan) {
  if (plan.isUnlimited || plan.maxPharmacies === null) {
    return "Pharmacies illimitées";
  }

  return plan.maxPharmacies === 1
    ? "1 pharmacie"
    : `${plan.maxPharmacies} pharmacies`;
}

function formatLicensePrice(price: string, currency: string) {
  const amount = Number(price);

  if (!Number.isFinite(amount)) {
    return [price, currency].filter(Boolean).join(" ");
  }

  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + (currency ? ` ${currency}` : "");
}

function isPaymentProviderUnavailable(message: string) {
  return /(fournisseur|optgateway|paiement).*(indisponible|unavailable)|(indisponible|unavailable).*(fournisseur|optgateway|paiement)/i.test(message);
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
