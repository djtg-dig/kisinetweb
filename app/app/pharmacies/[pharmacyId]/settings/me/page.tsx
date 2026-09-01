"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { LoadingBubble } from "@/components/ui/loading-bubble";
import {
  getAccountProfile,
  getPharmacyMembers,
  type AccountProfile,
  type PharmacyMember,
  type PharmacyMemberRole,
  type PharmacyPermissions,
} from "@/lib/api";
import {
  getUserAiCredits,
  type UserAiCredits,
} from "@/lib/api/billing";
import { AI_CREDITS_UPDATED_EVENT } from "@/lib/ai-credits-events";

type MySpacePageProps = {
  params: Promise<{ pharmacyId: string }>;
  searchParams: Promise<{ user?: string }>;
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
      ["product_export_pdf", "Exporter les produits en PDF"],
      ["product_export_excel", "Exporter les produits en Excel"],
      ["stock_view", "Voir le stock"],
      ["stock_adjust", "Ajuster le stock"],
      ["stock_transfer", "Transférer le stock"],
      ["sale_view", "Voir les ventes"],
      ["sale_create", "Ajouter des ventes"],
      ["sale_payment_create", "Encaisser les factures"],
      ["sale_cancel", "Annuler les ventes"],
    ],
  },
] satisfies { title: string; permissions: [keyof PharmacyPermissions, string][] }[];

export default function MySpacePage({ params, searchParams }: MySpacePageProps) {
  const [pharmacyId, setPharmacyId] = useState("");
  const [userReference, setUserReference] = useState("");
  const [member, setMember] = useState<PharmacyMember | null>(null);
  const [state, setState] = useState<PageState>("loading");
  const [errorMessage, setErrorMessage] = useState("");

  // Profil de l'utilisateur connecté (source de l'email et de la référence).
  const [profile, setProfile] = useState<AccountProfile | null>(null);

  // Crédits IA restants de l'utilisateur (endpoint facturation dédié).
  const [aiCredits, setAiCredits] = useState<UserAiCredits | null>(null);
  const [aiCreditsState, setAiCreditsState] = useState<"loading" | "ready" | "error">("loading");
  const [aiCreditsError, setAiCreditsError] = useState("");

  // Identifiant de la dernière requête de crédits IA en cours (évite d'appliquer
  // une réponse obsolète si plusieurs chargements se chevauchent ou après démontage).
  const aiCreditsRequestId = useRef(0);

  useEffect(() => {
    async function readParams() {
      const resolvedParams = await params;
      const resolvedSearch = await searchParams;
      setPharmacyId(resolvedParams.pharmacyId);
      setUserReference(resolvedSearch.user || "");
    }

    readParams();
  }, [params, searchParams]);

  // On résout l'utilisateur courant via /api/accounts/me/ pour obtenir son
  // email (utilisé pour trouver le membre) et sa référence (pour les crédits IA).
  useEffect(() => {
    if (!pharmacyId) {
      return;
    }

    let isCurrent = true;

    getAccountProfile()
      .then((data) => {
        if (isCurrent) {
          setProfile(data);
        }
      })
      .catch(() => {
        // Profil optionnel : on continue avec le paramètre `user` si fourni.
      });

    return () => {
      isCurrent = false;
    };
  }, [pharmacyId]);

  useEffect(() => {
    if (!pharmacyId) {
      return;
    }

    // Email prioritaire (profil connecté), sinon repli sur le paramètre `user`.
    const lookupEmail = profile?.email?.trim().toLowerCase() || "";
    const lookupReference = userReference.trim();

    async function loadMember() {
      setState("loading");
      setErrorMessage("");

      try {
        const members = await getPharmacyMembers(pharmacyId);
        // Le backend renvoie `user` comme clé primaire (entier) et
        // `user_email` comme email. On matche donc sur l'email du profil,
        // ou sur la référence fournie en repli.
        const foundMember =
          members.find(
            (current) =>
              (lookupEmail && current.userEmail?.toLowerCase() === lookupEmail) ||
              (lookupReference && current.user === lookupReference),
          ) || null;

        setMember(foundMember);
        setState(foundMember ? "ready" : "not-found");
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Impossible de charger votre espace.",
        );
        setState("error");
      }
    }

    loadMember();
  }, [pharmacyId, profile, userReference]);

  // Recharge les crédits IA pour la référence résolue. Fonction extraite pour
  // pouvoir être rappelée après une analyse IA (rafraîchissement ciblé).
  const loadAiCredits = useCallback(
    (creditReference: string) => {
      const creditUserReference = creditReference.trim();
      if (!creditUserReference) {
        setAiCreditsState("error");
        setAiCreditsError("Utilisateur non identifié pour les crédits IA.");
        return;
      }

      const requestId = ++aiCreditsRequestId.current;
      setAiCreditsState("loading");
      setAiCreditsError("");

      getUserAiCredits(pharmacyId, creditUserReference)
        .then((data) => {
          if (requestId !== aiCreditsRequestId.current) {
            return;
          }
          setAiCredits(data);
          setAiCreditsState("ready");
        })
        .catch((error) => {
          if (requestId !== aiCreditsRequestId.current) {
            return;
          }
          setAiCreditsError(
            error instanceof Error
              ? error.message
              : "Impossible de charger vos crédits IA.",
          );
          setAiCreditsState("error");
        });
    },
    [pharmacyId],
  );

  // Chargement initial des crédits IA : un échec n'empêche pas l'affichage
  // du reste de l'espace personnel.
  useEffect(() => {
    const creditUserReference =
      profile?.reference?.trim() || userReference.trim();
    loadAiCredits(creditUserReference);
  }, [profile, userReference, loadAiCredits]);

  // Rafraîchissement automatique quand une analyse IA a été réalisée sur la
  // page de vente (événement global diffusé par le scanner IA).
  useEffect(() => {
    function handleAiCreditsUpdated() {
      const creditUserReference =
        profile?.reference?.trim() || userReference.trim();
      loadAiCredits(creditUserReference);
    }

    window.addEventListener(AI_CREDITS_UPDATED_EVENT, handleAiCreditsUpdated);
    return () => {
      window.removeEventListener(AI_CREDITS_UPDATED_EVENT, handleAiCreditsUpdated);
    };
  }, [profile, userReference, loadAiCredits]);

  const backUrl = pharmacyId ? "/app/pharmacies/" + pharmacyId + "/settings" : "#";

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <a
        href={backUrl}
        className="text-sm font-semibold text-primary-700 transition hover:text-primary-800"
      >
        Retour aux paramètres
      </a>

      {state === "loading" && (
        <section className="mt-6 rounded-lg border border-app-border bg-app-card p-8">
          <LoadingBubble label="Chargement de votre espace" />
        </section>
      )}

      {state === "error" && <Message tone="error">{errorMessage}</Message>}

      {state === "not-found" && (
        <section className="mt-6 rounded-lg border border-app-border bg-app-card p-8 text-center">
          <h1 className="text-xl font-bold text-app-text">Espace introuvable</h1>
          <p className="mt-2 text-sm leading-6 text-app-muted">
            Votre compte n'est pas rattaché à cette pharmacie ou n'a pas encore d'accès.
          </p>
        </section>
      )}

      {state === "ready" && member && (
        <>
          <section className="mt-6 rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-primary-700">
                  Mon espace dans cette pharmacie
                </p>
                <h1 className="mt-2 text-3xl font-bold text-app-text">
                  {member.userFullName || member.userEmail || "Mon profil"}
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
            <h2 className="text-lg font-bold text-app-text">Mes permissions</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {permissionGroups.map((group) => (
                <div
                  key={group.title}
                  className="rounded-md border border-app-border bg-app-background p-4"
                >
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

          <section className="mt-6 rounded-lg border border-app-border bg-app-card p-6">
            <h2 className="text-lg font-bold text-app-text">Mes crédits d'analyse IA</h2>
            <p className="mt-2 text-sm leading-6 text-app-muted">
              Crédits d'analyse IA restants sur votre compteur personnel pour la période en cours.
            </p>

            {aiCreditsState === "loading" && (
              <div className="mt-4">
                <LoadingBubble label="Chargement de vos crédits IA" />
              </div>
            )}

            {aiCreditsState === "error" && (
              <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                {aiCreditsError}
              </div>
            )}

            {aiCreditsState === "ready" && aiCredits && (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <InfoCard
                  label="Crédits restants"
                  value={aiCredits.remaining.toLocaleString("fr-FR")}
                  strong
                />
                <InfoCard label="Plan" value={aiCredits.planCode || "—"} />
                <InfoCard
                  label="Crédits inclus"
                  value={aiCredits.included.toLocaleString("fr-FR")}
                />
                <InfoCard
                  label="Crédits utilisés"
                  value={aiCredits.used.toLocaleString("fr-FR")}
                />
                <InfoCard
                  label="Période"
                  value={formatPeriod(aiCredits.periodStart, aiCredits.periodEnd)}
                />
                <InfoCard label="Taux d'utilisation" value={aiCredits.usagePercent + " %"} />

                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-app-muted">
                    <span>Consommation de la période</span>
                    <span>{aiCredits.usagePercent} %</span>
                  </div>
                  <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-app-surface">
                    <div
                      className="h-full rounded-full bg-primary-600"
                      style={{ width: Math.min(100, aiCredits.usagePercent) + "%" }}
                    />
                  </div>
                </div>
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}

function InfoCard({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="rounded-md border border-app-border bg-app-background p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-app-muted">{label}</p>
      <p
        className={
          "mt-2 text-sm " + (strong ? "font-bold text-primary-700" : "font-bold text-app-text")
        }
      >
        {value}
      </p>
    </div>
  );
}

function formatPeriod(start?: string, end?: string) {
  const formattedStart = start ? formatDate(start) : "—";
  const formattedEnd = end ? formatDate(end) : "—";

  return formattedStart + " → " + formattedEnd;
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
