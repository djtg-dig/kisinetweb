"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import {
  getCitiesOrProvinces,
  getCountries,
  getPharmacyDetail,
  getPharmacyPermissions,
  getPharmacyLegalDocuments,
  createPharmacyLegalDocument,
  updatePharmacyLegalDocument,
  deletePharmacyLegalDocument,
  getPharmacyLegalDocumentDownloadUrl,
  updatePharmacy,
  type CityOrProvinceOption,
  type CountryOption,
  type PharmacyDetail,
  type PharmacyPermissions,
  type PharmacyLegalDocument,
  type PharmacyLegalDocumentType,
  type UpdatePharmacyAddressInput,
  type UpdatePharmacyInput,
  type CreatePharmacyLegalDocumentInput,
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

// Section en cours d'edition : coordonnees, adresse, documents ou aucune.
type EditingSection = "coordinates" | "address" | "legal-document" | null;

// Type de formulaire pour un document juridique.
type LegalDocumentFormState = {
  documentId?: number;
  document_type?: PharmacyLegalDocumentType;
  title?: string;
  document_number?: string;
  file?: File | null;
  issued_at?: string;
  expires_at?: string;
  issuing_authority?: string;
};

const documentTypeLabels: Record<PharmacyLegalDocumentType, string> = {
  RCCM: "Registre de Commerce et du Crédit Mobilier",
  ID_NAT: "Identification Nationale",
  NIF: "Numéro d'Identification Fiscale",
  PHARMACY_LICENSE: "Autorisation d'ouverture de pharmacie",
  OPERATING_LICENSE: "Licence d'exploitation",
  PHARMACIST_LICENSE: "Autorisation /'agrément du pharmacien",
  TAX_DOCUMENT: "Document fiscal",
  OTHER: "Autre document",
};

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

  // Documents juridiques.
  const [legalDocuments, setLegalDocuments] = useState<PharmacyLegalDocument[]>([]);
  const [legalDocumentsState, setLegalDocumentsState] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [legalDocumentForm, setLegalDocumentForm] = useState<LegalDocumentFormState>({});

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

        // Charge les documents juridiques si l'utilisateur a la permission de les voir.
        try {
          const docs = await getPharmacyLegalDocuments(pharmacyId);
          setLegalDocuments(docs);
          setLegalDocumentsState("ready");
        } catch {
          setLegalDocuments([]);
          setLegalDocumentsState("error");
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

  function startEditingLegalDocument(document?: PharmacyLegalDocument) {
    setSuccessMessage("");
    setErrorMessage("");
    setEditingSection("legal-document");
    setLegalDocumentForm({
      documentId: document?.id,
      document_type: document?.document_type,
      title: document?.title ?? "",
      document_number: document?.document_number ?? "",
      file: null,
      issued_at: document?.issued_at ?? "",
      expires_at: document?.expires_at ?? "",
      issuing_authority: document?.issuing_authority ?? "",
    });
  }

  function startCreatingLegalDocument() {
    setSuccessMessage("");
    setErrorMessage("");
    setEditingSection("legal-document");
    setLegalDocumentForm({
      documentId: undefined,
      document_type: undefined,
      title: "",
      document_number: "",
      file: null,
      issued_at: "",
      expires_at: "",
      issuing_authority: "",
    });
  }

  function cancelEditing() {
    setEditingSection(null);
    setCoordinatesForm({});
    setAddressForm({});
    setLegalDocumentForm({});
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

  function handleLegalDocumentField(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = event.target;
    setErrorMessage("");
    setSuccessMessage("");
    setLegalDocumentForm((current) => ({ ...current, [name]: value }));
  }

  function handleLegalDocumentFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setErrorMessage("");
    setSuccessMessage("");
    setLegalDocumentForm((current) => ({ ...current, file }));
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

  async function saveLegalDocument() {
    if (!pharmacyId) {
      return;
    }

    if (!legalDocumentForm.document_type) {
      setErrorMessage("Le type de document est obligatoire.");
      return;
    }

    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      if (legalDocumentForm.documentId) {
        // Mise à jour d'un document existant.
        const updated = await updatePharmacyLegalDocument(
          pharmacyId,
          legalDocumentForm.documentId,
          {
            title: legalDocumentForm.title,
            document_number: legalDocumentForm.document_number,
            file: legalDocumentForm.file ?? undefined,
            issued_at: legalDocumentForm.issued_at || undefined,
            expires_at: legalDocumentForm.expires_at || undefined,
            issuing_authority: legalDocumentForm.issuing_authority,
          },
        );
        setLegalDocuments((current) =>
          current.map((doc) => (doc.id === updated.id ? updated : doc)),
        );
        setSuccessMessage("Document mis à jour.");
      } else {
        // Création d'un nouveau document.
        if (!legalDocumentForm.file) {
          setErrorMessage("Le fichier est obligatoire pour un nouveau document.");
          setIsSaving(false);
          return;
        }
        const created = await createPharmacyLegalDocument(pharmacyId, {
          document_type: legalDocumentForm.document_type,
          title: legalDocumentForm.title,
          document_number: legalDocumentForm.document_number,
          file: legalDocumentForm.file,
          issued_at: legalDocumentForm.issued_at || undefined,
          expires_at: legalDocumentForm.expires_at || undefined,
          issuing_authority: legalDocumentForm.issuing_authority,
        });
        setLegalDocuments((current) => [created, ...current]);
        setSuccessMessage("Document ajouté.");
      }
      setEditingSection(null);
      setLegalDocumentForm({});
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Impossible d'enregistrer le document.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteLegalDocument(documentId: number) {
    if (!pharmacyId) {
      return;
    }

    if (!window.confirm("Voulez-vous vraiment supprimer ce document ?")) {
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");

    try {
      await deletePharmacyLegalDocument(pharmacyId, documentId);
      setLegalDocuments((current) => current.filter((doc) => doc.id !== documentId));
      setSuccessMessage("Document supprimé.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Impossible de supprimer ce document.",
      );
    }
  }

  async function handleDownloadLegalDocument(documentId: number) {
    if (!pharmacyId) {
      return;
    }

    setErrorMessage("");

    try {
      const { url } = await getPharmacyLegalDocumentDownloadUrl(pharmacyId, documentId);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible de télécharger ce document.",
      );
    }
  }

  const canEdit = Boolean(permissions.pharmacy_update) && !pharmacy?.isArchivedAt;
  const canManageLegalDocuments =
    Boolean(permissions.pharmacy_legal_document_manage) && !pharmacy?.isArchivedAt;

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
    <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-7xl px-4 py-8 text-app-text sm:px-6 lg:min-h-[calc(100vh-4.5rem)] lg:px-8">
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
                  <Detail label="Ville, province ou région." value={cityName} />
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

          {/* Section des documents juridiques */}
          <article className="rounded-lg border border-app-border bg-app-card p-5">
            <SectionHeader
              title="Informations juridiques"
              canEdit={canManageLegalDocuments}
              isEditing={editingSection === "legal-document"}
              onEdit={startCreatingLegalDocument}
            />

            {legalDocumentsState === "loading" && (
              <div className="mt-4">
                <LoadingBubble label="Chargement des documents" />
              </div>
            )}

            {legalDocumentsState === "error" && (
              <p className="mt-4 text-sm text-app-muted">
                Impossible de charger les documents juridiques.
              </p>
            )}

            {legalDocumentsState === "ready" && (
              <>
                {editingSection === "legal-document" ? (
                  <>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <SelectField
                        label="Type de document"
                        name="document_type"
                        value={legalDocumentForm.document_type ?? ""}
                        options={Object.entries(documentTypeLabels).map(([value, label]) => ({
                          value,
                          label,
                        }))}
                        onChange={handleLegalDocumentField}
                        disabled={Boolean(legalDocumentForm.documentId)}
                      />
                      <TextField
                        label="Titre"
                        name="title"
                        value={legalDocumentForm.title ?? ""}
                        onChange={handleLegalDocumentField}
                      />
                      <TextField
                        label="Numéro du document"
                        name="document_number"
                        value={legalDocumentForm.document_number ?? ""}
                        onChange={handleLegalDocumentField}
                      />
                      <TextField
                        label="Autorité émettrice"
                        name="issuing_authority"
                        value={legalDocumentForm.issuing_authority ?? ""}
                        onChange={handleLegalDocumentField}
                      />
                      <TextField
                        label="Date d'émission"
                        name="issued_at"
                        type="date"
                        value={legalDocumentForm.issued_at ?? ""}
                        onChange={handleLegalDocumentField}
                      />
                      <TextField
                        label="Date d'expiration"
                        name="expires_at"
                        type="date"
                        value={legalDocumentForm.expires_at ?? ""}
                        onChange={handleLegalDocumentField}
                      />
                    </div>

                    <div className="mt-4">
                      <label className="block">
                        <span className="text-xs font-medium uppercase tracking-wide text-app-muted">
                          Fichier {legalDocumentForm.documentId ? "(laisser vide pour conserver l'existant)" : ""}
                        </span>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={handleLegalDocumentFileChange}
                          className="mt-1 min-h-10 w-full rounded-md border border-app-border bg-app-background px-3 text-sm font-medium text-app-text outline-none transition focus:border-primary-600 focus:ring-4 focus:ring-primary-100"
                        />
                        <p className="mt-1 text-xs text-app-muted">
                          Formats acceptés : PDF, JPG, JPEG, PNG. Taille maximale : 10 Mo.
                        </p>
                      </label>
                    </div>

                    <EditActions
                      isSaving={isSaving}
                      onCancel={cancelEditing}
                      onSave={saveLegalDocument}
                      saveLabel={legalDocumentForm.documentId ? "Enregistrer" : "Ajouter"}
                    />
                  </>
                ) : (
                  <>
                    {legalDocuments.length === 0 ? (
                      <p className="mt-4 text-sm text-app-muted">
                        Aucun document juridique enregistré.
                      </p>
                    ) : (
                      <div className="mt-4 space-y-3">
                        {legalDocuments.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-start justify-between rounded-md border border-app-border bg-app-background p-3"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-app-text">
                                  {documentTypeLabels[doc.document_type] || doc.document_type}
                                </p>
                                <StatusBadge status={doc.verification_status} />
                              </div>
                              {doc.title && (
                                <p className="mt-1 text-xs text-app-muted">{doc.title}</p>
                              )}
                              {doc.document_number && (
                                <p className="mt-1 text-xs text-app-muted">
                                  N° {doc.document_number}
                                </p>
                              )}
                              {doc.issuing_authority && (
                                <p className="mt-1 text-xs text-app-muted">
                                  Émis par : {doc.issuing_authority}
                                </p>
                              )}
                              {doc.issued_at && (
                                <p className="mt-1 text-xs text-app-muted">
                                  Émis le : {formatDate(doc.issued_at)}
                                  {doc.expires_at && (
                                    <> — Expire le : {formatDate(doc.expires_at)}</>
                                  )}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleDownloadLegalDocument(doc.id)}
                                className="rounded-md border border-app-border bg-app-card px-3 py-1.5 text-xs font-semibold text-app-text transition hover:bg-primary-50"
                              >
                                Télécharger
                              </button>
                              {canManageLegalDocuments && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => startEditingLegalDocument(doc)}
                                    className="rounded-md border border-app-border bg-app-card px-3 py-1.5 text-xs font-semibold text-app-text transition hover:bg-primary-50"
                                  >
                                    Modifier
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteLegalDocument(doc.id)}
                                    className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                                  >
                                    Supprimer
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </article>
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

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: "bg-yellow-50 text-yellow-700 ring-yellow-100",
    VERIFIED: "bg-success-50 text-success-700 ring-success-100",
    REJECTED: "bg-red-50 text-red-700 ring-red-100",
    EXPIRED: "bg-red-50 text-red-700 ring-red-100",
  };

  const labels: Record<string, string> = {
    PENDING: "En attente",
    VERIFIED: "Vérifié",
    REJECTED: "Rejeté",
    EXPIRED: "Expiré",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${
        styles[status] || "bg-app-surface text-app-muted"
      }`}
    >
      {labels[status] || status}
    </span>
  );
}

function formatDate(value?: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
  }).format(date);
}
