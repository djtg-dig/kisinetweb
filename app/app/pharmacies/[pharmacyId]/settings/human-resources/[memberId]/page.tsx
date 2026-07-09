"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  getPharmacyMembers,
  type PharmacyMember,
  type PharmacyMemberRole,
  type PharmacyPermissions,
} from "@/lib/api";

type MemberDetailPageProps = {
  params: Promise<{ pharmacyId: string; memberId: string }>;
};

type PageState = "loading" | "error" | "not-found" | "ready";

const roleLabels: Record<PharmacyMemberRole, string> = {
  OWNER: "Propriétaire",
  MANAGER: "Gérant",
  PHARMACIST: "Pharmacien",
  EMPLOYEE: "Employé",
};

const permissionGroups = [
  {
    title: "Pharmacie",
    permissions: [
      ["pharmacy_view", "Voir la pharmacie"],
      ["pharmacy_update", "Modifier la pharmacie"],
      ["pharmacy_delete", "Archiver la pharmacie"],
    ],
  },
  {
    title: "Membres",
    permissions: [
      ["member_view", "Voir les membres"],
      ["member_update", "Modifier les membres"],
      ["member_suspend", "Suspendre les membres"],
      ["member_delete", "Supprimer les membres"],
      ["member_manage_permissions", "Gérer les permissions"],
    ],
  },
  {
    title: "Demandes",
    permissions: [
      ["join_request_view", "Voir les demandes"],
      ["join_request_accept", "Accepter les demandes"],
      ["join_request_reject", "Refuser les demandes"],
    ],
  },
  {
    title: "Produits, stock et ventes",
    permissions: [
      ["product_view", "Voir les produits"],
      ["product_create", "Ajouter des produits"],
      ["product_update", "Modifier les produits"],
      ["product_delete", "Supprimer les produits"],
      ["stock_view", "Voir le stock"],
      ["stock_adjust", "Ajuster le stock"],
      ["stock_transfer", "Transférer le stock"],
      ["sale_view", "Voir les ventes"],
      ["sale_create", "Ajouter des ventes"],
      ["sale_cancel", "Annuler les ventes"],
    ],
  },
] satisfies { title: string; permissions: [keyof PharmacyPermissions, string][] }[];

export default function MemberDetailPage({ params }: MemberDetailPageProps) {
  const [pharmacyId, setPharmacyId] = useState("");
  const [memberId, setMemberId] = useState("");
  const [member, setMember] = useState<PharmacyMember | null>(null);
  const [state, setState] = useState<PageState>("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function readParams() {
      const resolvedParams = await params;
      setPharmacyId(resolvedParams.pharmacyId);
      setMemberId(resolvedParams.memberId);
    }

    readParams();
  }, [params]);

  useEffect(() => {
    if (!pharmacyId || !memberId) {
      return;
    }

    async function loadMember() {
      setState("loading");
      setErrorMessage("");

      try {
        const members = await getPharmacyMembers(pharmacyId);
        const foundMember =
          members.find((current) => String(current.id) === memberId) || null;

        setMember(foundMember);
        setState(foundMember ? "ready" : "not-found");
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Impossible de charger ce membre.",
        );
        setState("error");
      }
    }

    loadMember();
  }, [pharmacyId, memberId]);

  const backUrl = pharmacyId
    ? "/app/pharmacies/" + pharmacyId + "/settings/human-resources"
    : "#";

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <a
        href={backUrl}
        className="text-sm font-semibold text-primary-700 transition hover:text-primary-800"
      >
        Retour à la liste des employés
      </a>

      {state === "loading" && (
        <section className="mt-6 rounded-lg border border-app-border bg-app-card p-8 text-center text-sm font-semibold text-app-muted">
          Chargement du membre...
        </section>
      )}

      {state === "error" && (
        <Message tone="error">{errorMessage}</Message>
      )}

      {state === "not-found" && (
        <section className="mt-6 rounded-lg border border-app-border bg-app-card p-8 text-center">
          <h1 className="text-xl font-bold text-app-text">Membre introuvable</h1>
          <p className="mt-2 text-sm leading-6 text-app-muted">
            Ce membre n'existe pas ou n'est plus rattaché à cette pharmacie.
          </p>
        </section>
      )}

      {state === "ready" && member && (
        <>
          <section className="mt-6 rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-primary-700">
                  Détail de l'employé
                </p>
                <h1 className="mt-2 text-3xl font-bold text-app-text">
                  {member.userFullName || member.userEmail || "Membre sans nom"}
                </h1>
                <p className="mt-2 text-sm text-app-muted">
                  {member.userEmail || "Email non renseigné"}
                </p>
              </div>
              <StatusBadge suspended={member.isSuspended} />
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <InfoCard label="Rôle" value={roleLabels[member.role]} />
              <InfoCard label="Arrivée" value={formatDate(member.joinedAt) || "Non renseigné"} />
              <InfoCard label="Identifiant membre" value={String(member.id)} />
            </div>
          </section>

          <section className="mt-6 rounded-lg border border-app-border bg-app-card p-6">
            <h2 className="text-lg font-bold text-app-text">Permissions du membre</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {permissionGroups.map((group) => (
                <div key={group.title} className="rounded-md border border-app-border bg-app-background p-4">
                  <h3 className="text-sm font-bold text-app-text">{group.title}</h3>
                  <div className="mt-3 grid gap-2">
                    {group.permissions.map(([permission, label]) => (
                      <div
                        key={permission}
                        className="flex items-center justify-between gap-3 text-sm"
                      >
                        <span className="text-app-muted">{label}</span>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            member.permissions[permission]
                              ? "bg-success-50 text-success-700"
                              : "bg-app-surface text-app-muted"
                          }`}
                        >
                          {member.permissions[permission] ? "Oui" : "Non"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-app-border bg-app-background p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-app-muted">{label}</p>
      <p className="mt-2 text-sm font-bold text-app-text">{value}</p>
    </div>
  );
}

function StatusBadge({ suspended }: { suspended: boolean }) {
  return (
    <span
      className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
        suspended
          ? "bg-red-50 text-red-700 ring-red-100"
          : "bg-success-50 text-success-700 ring-success-100"
      }`}
    >
      {suspended ? "Suspendu" : "Actif"}
    </span>
  );
}

function Message({
  tone,
  children,
}: {
  tone: "error" | "success";
  children: ReactNode;
}) {
  const className =
    tone === "error"
      ? "border-red-200 bg-red-50 text-red-700"
      : "border-app-border bg-app-card text-app-text";

  return (
    <div className={`mt-5 rounded-lg border p-4 text-sm font-semibold leading-6 ${className}`}>
      {children}
    </div>
  );
}

function formatDate(value?: string) {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
