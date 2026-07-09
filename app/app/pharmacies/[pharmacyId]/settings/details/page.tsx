"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import {
  getCitiesOrProvinces,
  getCountries,
  getPharmacyDetail,
  getPharmacyPermissions,
  updatePharmacy,
  type CityOrProvinceOption,
  type CountryOption,
  type PharmacyDetail,
  type PharmacyPermissions,
  type UpdatePharmacyAddressInput,
  type UpdatePharmacyInput,
} from "@/lib/api";
import { LoadingBubble } from "@/components/ui/loading-bubble";

type SettingsDetailsPageProps = {
  params: Promise<{ pharmacyId: string }>;
};

// Etat du formulaire d'adresse.
type AddressFormState = {
  countryId?: string;
  countryPhoneCode?: string;
  cityOrProvinceId?: string;
  neighborhood?: string;
  street?: string;
  complementAdresse?: string;
  postalCode?: string;
  proximiteTransports?: string;
  formattedAddress?: string;
};

type PageState = "loading" | "error" | "ready";

// Section en cours d'edition : coordonnees, adresse ou aucune.
type EditingSection = "coordinates" | "address" | null;

export default function SettingsDetailsPage({ params }: SettingsDetailsPageProps) {
  const [pharmacyId, setPharmacyId] = useState("");
  const [pharmacy, setPharmacy] = useState<PharmacyDetail | null>(null);
  const [permissions, setPermissions] = useState<PharmacyPermissions>({});
  const [state, setState] = useState<PageState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [editingSection, setEditingSection] = useState<EditingSection>(null);
  const [coordinatesForm, setCoordinatesForm] = useState<UpdatePharmacyInput>({});
  const [addressForm, setAddressForm] = useState<AddressFormState>({});
  const [isSaving, setIsSaving] = useState(false);
  // Listes geographiques pour les menus deroulants et l'affichage des noms.
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [cities, setCities] = useState<CityOrProvinceOption[]>([]);

  useEffect(() => {
    if (!successMessage) {
      return;
    }

    const timer = setTimeout(() => {
      setSuccessMessage("");
    }, 3500);

    return () => clearTimeout(timer);
  }, [successMessage]);

  useEffect(() => {
    if (!errorMessage) {
      return;
    }

    const timer = setTimeout(() => {
      setErrorMessage("");
    }, 6000);

    return () => clearTimeout(timer);
  }, [errorMessage]);

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

        // Charge les permissions pour afficher (ou non) les boutons Modifier.
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

  // Charge les pays, puis les villes du pays de la pharmacie, pour les
  // menus deroulants et l'affichage des noms (et non des codes bruts).
  useEffect(() => {
    const countryValue =
      pharmacy?.address?.countryId ||
      pharmacy?.address?.countryPhoneCode ||
      pharmacy?.address?.country;
    if (!countryValue) {
      return;
    }

    async function loadGeography() {
      try {
        const countryRows = await getCountries();
        setCountries(countryRows);
        const selectedCountry = findCountryByApiValue(countryRows, countryValue);
        const cityRows = await getCitiesOrProvinces(
          selectedCountry ? String(selectedCountry.id) : String(countryValue),
        );
        setCities(cityRows);
      } catch {
        // Non bloquant : l'affichage des codes reste possible en repli.
      }
    }

    loadGeography();
  }, [pharmacy]);

  function startEditingCoordinates() {
    if (!pharmacy) {
      return;
    }

    setSuccessMessage("");
    setEditingSection("coordinates");
    setCoordinatesForm({
      name: pharmacy.name ?? "",
      email: pharmacy.email ?? "",
      phoneNumber: pharmacy.phoneNumber ?? "",
    });
  }

  async function startEditingAddress() {
    if (!pharmacy?.address) {
      return;
    }

    setSuccessMessage("");
    setErrorMessage("");
    setEditingSection("address");
    let countryRows = countries;
    if (!countryRows.length) {
      try {
        countryRows = await getCountries();
        setCountries(countryRows);
      } catch {
        countryRows = [];
      }
    }

    const selectedCountry = findCountryByApiValue(
      countryRows,
      pharmacy.address.countryId ||
        pharmacy.address.countryPhoneCode ||
        pharmacy.address.country,
    );
    const countryPhoneCode =
      pharmacy.address.countryPhoneCode ||
      selectedCountry?.phoneCode ||
      String(pharmacy.address.country || "");
    const countryId =
      pharmacy.address.countryId ||
      (selectedCountry ? String(selectedCountry.id) : "");

    let cityRows: CityOrProvinceOption[] = [];
    if (countryId) {
      try {
        cityRows = await getCitiesOrProvinces(countryId);
        setCities(cityRows);
      } catch {
        cityRows = [];
      }
    }

    const cityOrProvinceId =
      findCityByApiValue(
        cityRows,
        pharmacy.address.cityOrProvinceId || pharmacy.address.cityOrProvince,
      )?.id?.toString() || "";

    setAddressForm({
      countryId,
      countryPhoneCode,
      cityOrProvinceId,
      neighborhood: pharmacy.address.neighborhood ?? "",
      street: pharmacy.address.street ?? "",
      complementAdresse: pharmacy.address.complementAdresse ?? "",
      postalCode: pharmacy.address.postalCode ?? "",
      proximiteTransports: pharmacy.address.proximiteTransports ?? "",
      formattedAddress: pharmacy.address.formattedAddress ?? "",
    });
  }

  function cancelEditing() {
    setEditingSection(null);
    setCoordinatesForm({});
    setAddressForm({});
    setErrorMessage("");
  }

  function handleCoordinatesField(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setErrorMessage("");
    setSuccessMessage("");
    setCoordinatesForm((current) => ({ ...current, [name]: value }));
  }

  function handleAddressField(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setErrorMessage("");
    setSuccessMessage("");
    setAddressForm((current) => ({ ...current, [name]: value }));
  }

  async function loadAddressCities(countryId: string) {
    if (!countryId) {
      setCities([]);
      return [];
    }

    try {
      const cityRows = await getCitiesOrProvinces(countryId);
      setCities(cityRows);
      return cityRows;
    } catch {
      setCities([]);
      return [];
    }
  }

  async function changeAddressCountry(countryId: string) {
    // Changement de pays : on recharge les villes et on reinitialise la ville.
    const country = findCountryByApiValue(countries, countryId);
    setErrorMessage("");
    setSuccessMessage("");
    setAddressForm((current) => ({
      ...current,
      countryId,
      countryPhoneCode: country?.phoneCode || "",
      cityOrProvinceId: "",
    }));
    await loadAddressCities(countryId);
  }

  async function saveCoordinates() {
    if (!pharmacyId) {
      return;
    }

    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const updatedPharmacy = await updatePharmacy(pharmacyId, coordinatesForm);
      setPharmacy(updatedPharmacy);
      setEditingSection(null);
      setCoordinatesForm({});
      setSuccessMessage("Coordonnées mises à jour.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Impossible de modifier la pharmacie.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function saveAddress() {
    if (!pharmacyId || !pharmacy?.address) {
      return;
    }

    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const country = findCountryByApiValue(
        countries,
        addressForm.countryId || addressForm.countryPhoneCode,
      );
      let cityRows = cities;
      let city = findCityByApiValue(cityRows, addressForm.cityOrProvinceId);

      if (!city && addressForm.countryId) {
        cityRows = await loadAddressCities(addressForm.countryId);
        city = findCityByApiValue(cityRows, addressForm.cityOrProvinceId);
      }

      if (!country) {
        setErrorMessage("Veuillez sélectionner un pays dans la liste.");
        return;
      }

      if (!city) {
        if (cityRows.length === 1) {
          const onlyCity = cityRows[0];
          setAddressForm((current) => ({
            ...current,
            cityOrProvinceId: String(onlyCity.id),
          }));
          setErrorMessage("");
          city = onlyCity;
        } else {
          setErrorMessage("Veuillez sélectionner une ville ou province dans la liste.");
          return;
        }
      }

      // On envoie les valeurs attendues par le backend : indicatif pays + id ville.
      const updatedPharmacy = await updatePharmacy(pharmacyId, {
        address: {
          country: country.phoneCode,
          cityOrProvince: city.id,
          neighborhood: addressForm.neighborhood,
          street: addressForm.street,
          complementAdresse: addressForm.complementAdresse,
          postalCode: addressForm.postalCode,
          proximiteTransports: addressForm.proximiteTransports,
          formattedAddress: addressForm.formattedAddress,
        },
      });
      setPharmacy(updatedPharmacy);
      setEditingSection(null);
      setAddressForm({});
      setSuccessMessage("Adresse mise à jour.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Impossible de modifier l'adresse.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  const canEdit = Boolean(permissions.pharmacy_update) && !pharmacy?.isArchivedAt;

  // Noms lisibles pour l'affichage en lecture seule.
  const countryName =
    pharmacy?.address?.countryName ||
    findCountryByApiValue(countries, pharmacy?.address?.countryPhoneCode || pharmacy?.address?.country)?.name ||
    pharmacy?.address?.country;
  const cityName =
    pharmacy?.address?.cityOrProvinceName ||
    findCityByApiValue(cities, pharmacy?.address?.cityOrProvinceId || pharmacy?.address?.cityOrProvince)?.name ||
    pharmacy?.address?.cityOrProvince;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-primary-700">Détails pharmacie</p>
            <h1 className="mt-2 text-3xl font-bold text-app-text">Informations générales</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-app-muted">
              Consultez et modifiez les informations générales de la pharmacie.
            </p>
          </div>
          <a
            href={pharmacyId ? "/app/pharmacies/" + pharmacyId + "/settings" : "#"}
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-md border border-app-border bg-app-surface px-4 py-2.5 text-sm font-semibold text-app-text transition hover:bg-primary-50 hover:text-primary-700 focus:outline-none focus:ring-4 focus:ring-primary-100"
          >
            Retour
          </a>
        </div>
      </section>

      {errorMessage && (
        <ToastMessage tone="error" onClose={() => setErrorMessage("")}>
          {errorMessage}
        </ToastMessage>
      )}

      {successMessage && (
        <ToastMessage tone="success" onClose={() => setSuccessMessage("")}>
          {successMessage}
        </ToastMessage>
      )}

      {state === "loading" && (
        <section className="mt-6 rounded-lg border border-app-border bg-app-card p-8">
          <LoadingBubble label="Chargement des informations" className="min-h-[180px]" />
        </section>
      )}

      {state === "error" && (
        <section className="mt-6 rounded-lg border border-app-border bg-app-card p-8 text-center text-sm font-semibold text-app-muted">
          Informations indisponibles.
        </section>
      )}

      {state === "ready" && pharmacy && (
        <section className="mt-6 grid gap-4">
          <article className="rounded-lg border border-app-border bg-app-card p-5">
            <h2 className="text-lg font-bold text-app-text">Identité</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Detail label="Référence" value={pharmacy.reference} />
              <Detail label="Statut" value={pharmacy.isArchivedAt ? "Archivée" : "Active"} />
              <Detail label="Référence propriétaire" value={pharmacy.ownerReference} />
              <Detail label="Propriétaire" value={pharmacy.ownerFullName} />
              <Detail label="Parrain" value={pharmacy.invitedByReference} />
              <Detail label="Slug" value={pharmacy.slug} />
              <Detail label="Créée le" value={pharmacy.createdAt} />
              <Detail label="Mise à jour le" value={pharmacy.updatedAt} />
            </div>
          </article>

          <article className="rounded-lg border border-app-border bg-app-card p-5">
            <SectionHeader
              title="Coordonnées"
              canEdit={canEdit}
              isEditing={editingSection === "coordinates"}
              onEdit={startEditingCoordinates}
            />

            {editingSection === "coordinates" ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <TextField
                  label="Nom"
                  name="name"
                  value={coordinatesForm.name ?? ""}
                  onChange={handleCoordinatesField}
                />
                <TextField
                  label="Email"
                  name="email"
                  type="email"
                  value={coordinatesForm.email ?? ""}
                  onChange={handleCoordinatesField}
                />
                <TextField
                  label="Téléphone"
                  name="phoneNumber"
                  value={coordinatesForm.phoneNumber ?? ""}
                  onChange={handleCoordinatesField}
                />
                <ReadOnlyField label="Devise" value={pharmacy.devise} note="Champ non modifiable." />
              </div>
            ) : (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Detail label="Nom" value={pharmacy.name} />
                <Detail label="Email" value={pharmacy.email} />
                <Detail label="Téléphone" value={pharmacy.phoneNumber} />
                <Detail label="Devise" value={pharmacy.devise} />
              </div>
            )}

            {editingSection === "coordinates" && (
              <EditActions
                isSaving={isSaving}
                onCancel={cancelEditing}
                onSave={saveCoordinates}
                saveLabel="Enregistrer"
              />
            )}
          </article>

          {pharmacy.address && (
            <article className="rounded-lg border border-app-border bg-app-card p-5">
              <SectionHeader
                title="Adresse"
                canEdit={canEdit}
                isEditing={editingSection === "address"}
                onEdit={startEditingAddress}
              />

              {editingSection === "address" ? (
                <>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <SelectField
                      label="Pays"
                      name="countryId"
                      value={addressForm.countryId ?? ""}
                      options={countries.map((country) => ({
                        value: String(country.id),
                        label: country.name + " (" + country.phoneCode + ")",
                      }))}
                      onChange={(event) => changeAddressCountry(event.target.value)}
                    />
                    <SelectField
                      label="Ville ou province"
                      name="cityOrProvinceId"
                      value={addressForm.cityOrProvinceId ?? ""}
                      options={cities.map((city) => ({
                        value: String(city.id),
                        label: city.name,
                      }))}
                      onChange={(event) =>
                        handleAddressField({
                          target: { name: "cityOrProvinceId", value: event.target.value },
                        } as ChangeEvent<HTMLInputElement>)
                      }
                      disabled={!addressForm.countryId}
                    />
                    <TextField
                      label="Quartier"
                      name="neighborhood"
                      value={addressForm.neighborhood ?? ""}
                      onChange={handleAddressField}
                    />
                    <TextField
                      label="Rue"
                      name="street"
                      value={addressForm.street ?? ""}
                      onChange={handleAddressField}
                    />
                    <TextField
                      label="Complément"
                      name="complementAdresse"
                      value={addressForm.complementAdresse ?? ""}
                      onChange={handleAddressField}
                    />
                    <TextField
                      label="Code postal"
                      name="postalCode"
                      value={addressForm.postalCode ?? ""}
                      onChange={handleAddressField}
                    />
                    <TextField
                      label="Proximité transports"
                      name="proximiteTransports"
                      value={addressForm.proximiteTransports ?? ""}
                      onChange={handleAddressField}
                    />
                    <TextField
                      label="Adresse formatée"
                      name="formattedAddress"
                      value={addressForm.formattedAddress ?? ""}
                      onChange={handleAddressField}
                    />
                  </div>
                  <EditActions
                    isSaving={isSaving}
                    onCancel={cancelEditing}
                    onSave={saveAddress}
                    saveLabel="Enregistrer"
                  />
                </>
              ) : (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Detail label="Pays" value={countryName} />
                  <Detail label="Ville ou province" value={cityName} />
                  <Detail label="Quartier" value={pharmacy.address.neighborhood} />
                  <Detail label="Rue" value={pharmacy.address.street} />
                  <Detail label="Complément" value={pharmacy.address.complementAdresse} />
                  <Detail label="Code postal" value={pharmacy.address.postalCode} />
                  <Detail label="Proximité transports" value={pharmacy.address.proximiteTransports} />
                  <Detail label="Adresse formatée" value={pharmacy.address.formattedAddress} />
                </div>
              )}
            </article>
          )}
        </section>
      )}
    </main>
  );
}

function findCountryByApiValue(
  countries: CountryOption[],
  value?: string | number,
) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const textValue = String(value);

  return countries.find(
    (country) =>
      String(country.id) === textValue ||
      country.phoneCode === textValue ||
      country.iso2.toLowerCase() === textValue.toLowerCase() ||
      country.name === textValue,
  );
}

function findCityByApiValue(
  cities: CityOrProvinceOption[],
  value?: string | number | null,
) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const textValue = String(value);

  return cities.find(
    (city) =>
      String(city.id) === textValue ||
      city.code === textValue ||
      city.name === textValue,
  );
}

function ToastMessage({
  tone,
  children,
  onClose,
}: {
  tone: "error" | "success";
  children: React.ReactNode;
  onClose: () => void;
}) {
  const className =
    tone === "error"
      ? "border-red-200 bg-red-50 text-red-700"
      : "border-success-100 bg-success-50 text-success-700";

  return (
    <div className="fixed inset-x-3 top-20 z-[1200] sm:left-auto sm:right-5 sm:w-[min(420px,calc(100vw-40px))] lg:top-24">
      <div
        role="status"
        aria-live="polite"
        className={`flex items-start gap-3 rounded-lg border p-4 text-sm font-semibold leading-6 shadow-soft ${className}`}
      >
        <p className="min-w-0 flex-1 whitespace-pre-line">{children}</p>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-md px-2 py-1 text-xs font-bold transition hover:bg-white/60 focus:outline-none focus:ring-2 focus:ring-primary-100"
          aria-label="Fermer le message"
        >
          X
        </button>
      </div>
    </div>
  );
}

function SectionHeader({
  title,
  canEdit,
  isEditing,
  onEdit,
}: {
  title: string;
  canEdit: boolean;
  isEditing: boolean;
  onEdit: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h2 className="text-lg font-bold text-app-text">{title}</h2>
      {!isEditing && canEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-app-border bg-app-card px-5 py-2.5 text-sm font-semibold text-app-text transition hover:bg-primary-50 focus:outline-none focus:ring-4 focus:ring-primary-100"
        >
          Modifier
        </button>
      )}
    </div>
  );
}

function EditActions({
  isSaving,
  onCancel,
  onSave,
  saveLabel,
}: {
  isSaving: boolean;
  onCancel: () => void;
  onSave: () => void;
  saveLabel: string;
}) {
  return (
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
        {isSaving ? "Enregistrement..." : saveLabel}
      </button>
    </div>
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
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
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
  disabled = false,
}: {
  label: string;
  name: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-wide text-app-muted">{label}</span>
      <select
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="mt-1 min-h-10 w-full rounded-md border border-app-border bg-app-background px-3 text-sm font-medium text-app-text outline-none transition focus:border-primary-600 focus:ring-4 focus:ring-primary-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <option value="">
          {options.length === 0 ? "Aucune option" : "Sélectionner..."}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ReadOnlyField({
  label,
  value,
  note,
}: {
  label: string;
  value?: string | number | null;
  note?: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-app-muted">{label}</p>
      <p className="mt-1 inline-flex min-h-10 w-full items-center rounded-md border border-app-border bg-app-background px-3 text-sm font-semibold text-app-muted">
        {value && String(value).trim() ? value : "—"}
      </p>
      {note && <p className="mt-1 text-xs text-app-muted">{note}</p>}
    </div>
  );
}
