"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LoadingBubble } from "@/components/ui/loading-bubble";
import { getAdminPharmacy, fetchAdminJson, type AdminPharmacyDetail, type AdminPharmacyDocument } from "@/lib/api/admin";

type PageState = "loading" | "ready" | "error";

export default function AdminPharmacyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const pharmacyId = params.pharmacy_id as string;

  const [state, setState] = useState<PageState>("loading");
  const [pharmacy, setPharmacy] = useState<AdminPharmacyDetail | null>(null);
  const [message, setMessage] = useState("");
  const [downloadingDocId, setDownloadingDocId] = useState<number | null>(null);

  useEffect(() => {
    let isCurrent = true;

    async function loadPharmacy() {
      setState("loading");
      setMessage("");

      try {
        const data = await getAdminPharmacy(pharmacyId);
        if (!isCurrent) {
          return;
        }
        setPharmacy(data);
        setState("ready");
      } catch (error) {
        if (!isCurrent) {
          return;
        }
        setState("error");
        setMessage(
          error instanceof Error ? error.message : "Impossible de charger la pharmacie.",
        );
      }
    }

    void loadPharmacy();

    return () => {
      isCurrent = false;
    };
  }, [pharmacyId]);

  async function handleDownloadDocument(doc: AdminPharmacyDocument) {
    setDownloadingDocId(doc.id);
    try {
      const data = await fetchAdminJson<{ url: string; expires_in: number }>(doc.download_url);
      window.open(data.url, "_blank");
    } catch (error) {
      alert("Impossible de télécharger le document: " + (error instanceof Error ? error.message : "Erreur inconnue"));
    } finally {
      setDownloadingDocId(null);
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-4">
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Retour
        </Button>
        <h1 className="text-2xl font-bold text-app-text">Détail Pharmacie</h1>
      </div>

      {state === "loading" && (
        <section className="rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
          <LoadingBubble label="Chargement de la pharmacie" className="min-h-[260px]" />
        </section>
      )}

      {state === "error" && (
        <section className="rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
          <p className="text-sm font-semibold text-red-700">Chargement impossible</p>
          <p className="mt-2 text-sm text-app-muted">{message}</p>
          <Button onClick={() => router.refresh()} className="mt-5">
            Réessayer
          </Button>
        </section>
      )}

      {state === "ready" && pharmacy && (
        <>
          <section className="rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-app-text">Informations générales</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <DetailField label="Référence" value={pharmacy.reference} />
              <DetailField label="Nom" value={pharmacy.name} />
              <DetailField label="Slug" value={pharmacy.slug} />
              <DetailField label="Email" value={pharmacy.email} />
              <DetailField label="Téléphone" value={pharmacy.phone_number} />
              <DetailField label="Devise" value={pharmacy.devise} />
              <DetailField
                label="Archivée"
                value={pharmacy.is_archived_at ? formatDate(pharmacy.is_archived_at) : "Non"}
              />
              <DetailField label="Créée le" value={formatDate(pharmacy.created_at)} />
              <DetailField label="Modifiée le" value={formatDate(pharmacy.updated_at)} />
            </div>
          </section>

          <section className="rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-app-text">Propriétaire</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <DetailField label="ID" value={pharmacy.owner_id} className="font-mono text-xs" />
              <DetailField label="Référence" value={pharmacy.owner_reference} />
              <DetailField label="Email" value={pharmacy.owner_email} />
              <DetailField label="Prénom" value={pharmacy.owner_first_name} />
              <DetailField label="Nom" value={pharmacy.owner_last_name} />
              <DetailField label="Téléphone" value={pharmacy.owner_phone_number || "-"} />
              <DetailField label="Compte actif" value={pharmacy.owner_is_active ? "Oui" : "Non"} />
              <DetailField label="Staff" value={pharmacy.owner_is_staff ? "Oui" : "Non"} />
              <DetailField label="Membre depuis" value={formatDate(pharmacy.owner_date_joined)} />
              <DetailField label="Dernière connexion" value={pharmacy.owner_last_login ? formatDate(pharmacy.owner_last_login) : "-"} />
            </div>
          </section>

          {pharmacy.invited_by_id && (
            <section className="rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-app-text">Parrain</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <DetailField label="ID" value={pharmacy.invited_by_id} className="font-mono text-xs" />
                <DetailField label="Référence" value={pharmacy.invited_by_reference || "-"} />
                <DetailField label="Email" value={pharmacy.invited_by_email || "-"} />
              </div>
            </section>
          )}

          <section className="rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-app-text">Adresse</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <DetailField label="ID" value={String(pharmacy.address_id)} className="font-mono text-xs" />
              <DetailField label="Pays" value={pharmacy.address_country} />
              <DetailField label="ISO2" value={pharmacy.address_country_iso2} />
              <DetailField label="Indicatif" value={pharmacy.address_country_phone_code} />
              <DetailField label="Ville/Province" value={pharmacy.address_city_or_province} />
              <DetailField label="Quartier" value={pharmacy.address_neighborhood} />
              <DetailField label="Rue" value={pharmacy.address_street} />
              <DetailField label="Complément" value={pharmacy.address_complement} />
              <DetailField label="Code postal" value={pharmacy.address_postal_code} />
              <DetailField label="Transports" value={pharmacy.address_proximite_transports} />
              <DetailField label="Adresse formatée" value={pharmacy.address_formatted_address} />
              <DetailField label="Latitude" value={pharmacy.address_latitude || "-"} />
              <DetailField label="Longitude" value={pharmacy.address_longitude || "-"} />
            </div>
          </section>

          <section className="rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-app-text">Membres</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <DetailField label="Total" value={String(pharmacy.members_count)} />
              <DetailField label="Actifs" value={String(pharmacy.active_members_count)} />
            </div>
          </section>

          {pharmacy.subscription && (
            <section className="rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-app-text">Abonnement</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <DetailField label="Référence" value={pharmacy.subscription.reference} />
                <DetailField label="Plan" value={pharmacy.subscription.plan_name} />
                <DetailField label="Code plan" value={pharmacy.subscription.plan_code} />
                <DetailField label="Statut" value={pharmacy.subscription.status} />
                <DetailField label="Durée (mois)" value={String(pharmacy.subscription.duration_months)} />
                <DetailField label="Renouvellement auto" value={pharmacy.subscription.auto_renew ? "Oui" : "Non"} />
                <DetailField label="Essai actif" value={pharmacy.subscription.is_trial_active ? "Oui" : "Non"} />
                <DetailField label="Actif" value={pharmacy.subscription.is_active ? "Oui" : "Non"} />
                <DetailField label="Remise" value={pharmacy.subscription.discount_percentage + "%"} />
                <DetailField label="Montant total" value={pharmacy.subscription.total_amount} />
                <DetailField label="Début" value={formatDate(pharmacy.subscription.starts_at)} />
                <DetailField label="Expiration" value={pharmacy.subscription.expires_at ? formatDate(pharmacy.subscription.expires_at) : "-"} />
                <DetailField label="Début essai" value={pharmacy.subscription.trial_starts_at ? formatDate(pharmacy.subscription.trial_starts_at) : "-"} />
                <DetailField label="Fin essai" value={pharmacy.subscription.trial_ends_at ? formatDate(pharmacy.subscription.trial_ends_at) : "-"} />
              </div>
            </section>
          )}

          <section className="rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-app-text">Documents juridiques ({pharmacy.documents.length})</h2>
            {pharmacy.documents.length === 0 ? (
              <p className="mt-4 text-sm text-app-muted">Aucun document.</p>
            ) : (
              <div className="mt-4 space-y-4">
                {pharmacy.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="cursor-pointer rounded-lg border border-app-border p-4 transition hover:border-primary-400 hover:shadow-md"
                    onClick={() => handleDownloadDocument(doc)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && handleDownloadDocument(doc)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 grid gap-2 md:grid-cols-2 lg:grid-cols-4">
                        <DetailField label="Type" value={doc.document_type_display} />
                        <DetailField label="Numéro" value={doc.document_number || "-"} />
                        <DetailField label="Autorité" value={doc.issuing_authority || "-"} />
                        <StatusBadge status={doc.verification_status} label={doc.verification_status_display} />
                        <DetailField label="Émis le" value={doc.issued_at ? doc.issued_at : "-"} />
                        <DetailField label="Expire le" value={doc.expires_at ? doc.expires_at : "-"} />
                        <DetailField label="Expiré" value={doc.is_expired ? "Oui" : "Non"} />
                        <DetailField label="Actif" value={doc.is_active ? "Oui" : "Non"} />
                        <DetailField label="Vérifié par" value={doc.verified_by_email || "-"} />
                        <DetailField label="Vérifié le" value={doc.verified_at ? formatDate(doc.verified_at) : "-"} />
                      </div>
                      <div className="ml-4 flex flex-col items-end gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadDocument(doc);
                          }}
                          disabled={downloadingDocId === doc.id}
                        >
                          {downloadingDocId === doc.id ? "Téléchargement..." : "Télécharger"}
                        </Button>
                        {doc.title && (
                          <p className="text-xs text-app-muted">{doc.title}</p>
                        )}
                      </div>
                    </div>
                    {doc.verification_note && (
                      <div className="mt-3 border-t border-app-border pt-3">
                        <p className="text-xs font-semibold text-app-muted">Note de vérification:</p>
                        <p className="mt-1 text-sm text-app-text">{doc.verification_note}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </section>
  );
}

function DetailField({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-app-muted">{label}</p>
      <p className={`mt-1 text-sm text-app-text ${className}`}>{value || "-"}</p>
    </div>
  );
}

function StatusBadge({ status, label }: { status: string; label: string }) {
  const colors: Record<string, string> = {
    PENDING: "bg-yellow-50 text-yellow-700",
    VERIFIED: "bg-emerald-50 text-emerald-700",
    REJECTED: "bg-red-50 text-red-700",
    EXPIRED: "bg-gray-50 text-gray-700",
  };
  const colorClass = colors[status] || "bg-gray-50 text-gray-700";

  return (
    <div>
      <p className="text-xs font-semibold uppercase text-app-muted">Statut</p>
      <span className={`mt-1 inline-flex rounded-md px-2.5 py-1 text-xs font-bold ${colorClass}`}>
        {label}
      </span>
    </div>
  );
}

function formatDate(value: string): string {
  if (!value) return "-";
  try {
    const date = new Date(value);
    return date.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}
