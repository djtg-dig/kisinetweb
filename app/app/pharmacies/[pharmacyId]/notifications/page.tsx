"use client";

import { useEffect, useMemo, useState } from "react";
import { SiteFooter } from "@/components/layout/site-footer";
import { LoadingBubble } from "@/components/ui/loading-bubble";
import {
  acceptPharmacyJoinRequest,
  archivePharmacyJoinRequest,
  getPharmacyJoinRequests,
  getPharmacyPermissions,
  getPublicPharmacyByReference,
  rejectPharmacyJoinRequest,
  type PharmacyJoinRequestSummary,
  type PharmacyPermissions,
  type PharmacySummary,
} from "@/lib/api";

type NotificationsPageProps = {
  params: Promise<{ pharmacyId: string }>;
};

type PageState = "loading" | "error" | "empty" | "ready";
type ActionType = "accept" | "reject" | "archive";

const statusLabels: Record<string, string> = {
  PENDING: "En attente",
  ACCEPTED: "Acceptée",
  REJECTED: "Refusée",
  CANCELLED: "Annulée",
};

const roleLabels: Record<string, string> = {
  EMPLOYEE: "Employé",
  PHARMACIST: "Pharmacien",
  MANAGER: "Manager",
};

export default function PharmacyNotificationsPage({ params }: NotificationsPageProps) {
  const [pharmacyId, setPharmacyId] = useState("");
  const [pharmacy, setPharmacy] = useState<PharmacySummary | null>(null);
  const [permissions, setPermissions] = useState<PharmacyPermissions>({});
  const [joinRequests, setJoinRequests] = useState<PharmacyJoinRequestSummary[]>([]);
  const [state, setState] = useState<PageState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [runningAction, setRunningAction] = useState("");

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

    async function loadNotifications() {
      setState("loading");
      setErrorMessage("");

      try {
        const [publicPharmacy, pharmacyPermissions] = await Promise.all([
          getPublicPharmacyByReference(pharmacyId),
          getPharmacyPermissions(pharmacyId),
        ]);

        if (!publicPharmacy?.databaseId) {
          setErrorMessage("Impossible d'identifier cette pharmacie pour charger ses notifications.");
          setState("error");
          return;
        }

        const requests = await getPharmacyJoinRequests(publicPharmacy.databaseId);

        setPharmacy(publicPharmacy);
        setPermissions(pharmacyPermissions);
        setJoinRequests(requests);
        setState(requests.length ? "ready" : "empty");
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Impossible de charger les notifications.",
        );
        setState("error");
      }
    }

    loadNotifications();
  }, [pharmacyId]);

  const pendingCount = useMemo(
    () => joinRequests.filter((request) => request.status === "PENDING").length,
    [joinRequests],
  );

  async function runAction(
    action: ActionType,
    joinRequest: PharmacyJoinRequestSummary,
  ) {
    if (!pharmacy?.databaseId || !joinRequest.id) {
      return;
    }

    setRunningAction(action + ":" + joinRequest.id);
    setErrorMessage("");

    try {
      if (action === "archive") {
        await archivePharmacyJoinRequest(pharmacy.databaseId, joinRequest.id);
        setJoinRequests((current) => {
          const next = current.filter((request) => request.id !== joinRequest.id);
          setState(next.length ? "ready" : "empty");
          return next;
        });
        return;
      }

      const updatedRequest =
        action === "accept"
          ? await acceptPharmacyJoinRequest(pharmacy.databaseId, joinRequest.id)
          : await rejectPharmacyJoinRequest(pharmacy.databaseId, joinRequest.id);

      setJoinRequests((current) =>
        current.map((request) =>
          request.id === joinRequest.id ? { ...request, ...updatedRequest } : request,
        ),
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Impossible de traiter cette demande.",
      );
    } finally {
      setRunningAction("");
    }
  }

  return (
    <>
      {state === "loading" && <LoadingNotifications />}
      {state !== "loading" && (
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <section className="rounded-lg border border-app-border bg-app-card p-5">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary-700">
              Notifications
            </p>
            <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-app-text sm:text-3xl">
                  Demandes d'intégration
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-app-muted">
                  Consultez et traitez les demandes d'adhésion envoyées à
                  {pharmacy ? " " + pharmacy.name : " cette pharmacie"}.
                </p>
              </div>
              <div className="grid gap-2 rounded-lg border border-app-border bg-app-background px-4 py-3 text-sm">
                <span className="font-semibold text-app-text">
                  {pendingCount} en attente
                </span>
                <span className="text-app-muted">
                  {joinRequests.length} notification{joinRequests.length > 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </section>

          {errorMessage && (
            <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold leading-6 text-red-700">
              {errorMessage}
            </div>
          )}

          {state === "error" && !joinRequests.length && (
            <EmptyPanel title="Notifications indisponibles" />
          )}

          {state === "empty" && (
            <EmptyPanel title="Aucune notification" />
          )}

          {state === "ready" && (
            <section className="mt-6 grid gap-4">
              {joinRequests.map((joinRequest) => (
                <JoinRequestCard
                  key={joinRequest.id}
                  joinRequest={joinRequest}
                  permissions={permissions}
                  runningAction={runningAction}
                  onAction={runAction}
                />
              ))}
            </section>
          )}
        </main>
      )}
      <SiteFooter />
    </>
  );
}

function LoadingNotifications() {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-160px)] max-w-6xl items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <LoadingBubble label="Chargement des notifications" className="min-h-0" />
    </section>
  );
}

function EmptyPanel({ title }: { title: string }) {
  return (
    <section className="mt-6 rounded-lg border border-app-border bg-app-card p-8 text-center">
      <h2 className="text-lg font-bold text-app-text">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-app-muted">
        Les demandes d'intégration apparaîtront ici lorsqu'elles seront envoyées
        à cette pharmacie.
      </p>
    </section>
  );
}

function JoinRequestCard({
  joinRequest,
  permissions,
  runningAction,
  onAction,
}: {
  joinRequest: PharmacyJoinRequestSummary;
  permissions: PharmacyPermissions;
  runningAction: string;
  onAction: (action: ActionType, joinRequest: PharmacyJoinRequestSummary) => void;
}) {
  const isPending = joinRequest.status === "PENDING";
  const canAccept = Boolean(permissions.join_request_accept) && isPending;
  const canReject = Boolean(permissions.join_request_reject) && isPending;
  const canArchive = Boolean(permissions.join_request_view);

  return (
    <article className="rounded-lg border border-app-border bg-app-card p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={joinRequest.status} />
            <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700 ring-1 ring-primary-100">
              {roleLabels[joinRequest.requestedRole || ""] || "Rôle non renseigné"}
            </span>
          </div>
          <h2 className="mt-3 text-lg font-bold text-app-text">
            {joinRequest.userEmail || "Demandeur non renseigné"}
          </h2>
          <p className="mt-2 max-w-3xl whitespace-pre-line text-sm leading-6 text-app-muted">
            {joinRequest.message || "Aucun message joint à cette demande."}
          </p>
        </div>

        <div className="grid gap-2 text-sm lg:min-w-64">
          <Detail label="Créée le" value={formatDate(joinRequest.createdAt)} />
          <Detail label="Traitée par" value={joinRequest.reviewerEmail} />
          <Detail label="Traitée le" value={formatDate(joinRequest.reviewedAt)} />
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 border-t border-app-border pt-4 sm:flex-row sm:justify-end">
        {canAccept && (
          <ActionButton
            label="Accepter"
            loading={runningAction === "accept:" + joinRequest.id}
            onClick={() => onAction("accept", joinRequest)}
          />
        )}
        {canReject && (
          <ActionButton
            label="Refuser"
            variant="danger"
            loading={runningAction === "reject:" + joinRequest.id}
            onClick={() => onAction("reject", joinRequest)}
          />
        )}
        {canArchive && (
          <ActionButton
            label="Archiver"
            variant="secondary"
            loading={runningAction === "archive:" + joinRequest.id}
            onClick={() => onAction("archive", joinRequest)}
          />
        )}
      </div>
    </article>
  );
}

function StatusBadge({ status }: { status?: string }) {
  const label = statusLabels[status || ""] || "Statut inconnu";
  const tone =
    status === "ACCEPTED"
      ? "bg-success-50 text-success-700 ring-success-100"
      : status === "REJECTED"
        ? "bg-red-50 text-red-700 ring-red-100"
        : "bg-warning/10 text-amber-700 ring-warning/20";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${tone}`}>
      {label}
    </span>
  );
}

function Detail({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-app-muted">
        {label}
      </p>
      <p className="mt-1 font-medium text-app-text">{value || "Non renseigné"}</p>
    </div>
  );
}

function ActionButton({
  label,
  variant = "primary",
  loading,
  onClick,
}: {
  label: string;
  variant?: "primary" | "secondary" | "danger";
  loading: boolean;
  onClick: () => void;
}) {
  const variants = {
    primary: "bg-success-600 text-white hover:bg-success-700 focus:ring-success-100",
    secondary:
      "border border-app-border bg-app-surface text-app-text hover:bg-primary-50 focus:ring-primary-100",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-100",
  };

  return (
    <button
      type="button"
      disabled={loading}
      onClick={onClick}
      className={`inline-flex min-h-11 items-center justify-center rounded-md px-5 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]}`}
    >
      {loading ? "Traitement..." : label}
    </button>
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
