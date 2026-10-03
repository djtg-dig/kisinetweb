"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { LoadingBubble } from "@/components/ui/loading-bubble";
import {
  acceptPharmacyMemberInvitation,
  declinePharmacyMemberInvitation,
  getPharmacyMemberInvitationPreview,
  type PharmacyMemberInvitationPreview,
} from "@/lib/api";
import { carriAccountLoginUrl } from "@/lib/carri-account";
import { logout } from "@/lib/auth";
import { useSession } from "@/lib/hooks/use-session";

type InvitationResult = "accepted" | "declined" | null;

export default function AcceptInvitationPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-screen max-w-xl items-center px-4">
          <LoadingBubble label="Chargement de l’invitation" className="w-full" />
        </main>
      }
    >
      <InvitationAcceptanceContent />
    </Suspense>
  );
}

function InvitationAcceptanceContent() {
  const searchParams = useSearchParams();
  const { authenticated, loading, user } = useSession();
  const token = searchParams.get("token")?.trim() || "";
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeclineConfirmationOpen, setIsDeclineConfirmationOpen] = useState(false);
  const [result, setResult] = useState<InvitationResult>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [preview, setPreview] = useState<PharmacyMemberInvitationPreview | null>(null);
  const [previewError, setPreviewError] = useState("");
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  const invitationPath = "/invitations/accept?token=" + encodeURIComponent(token);
  const loginHref = carriAccountLoginUrl + "?next=" + encodeURIComponent(invitationPath);
  const sessionEmail = getSessionEmail(user);
  const canRespond = Boolean(preview?.isCurrentUser && preview.status === "PENDING");

  useEffect(() => {
    let cancelled = false;

    if (!authenticated || !token) {
      setPreview(null);
      return () => {
        cancelled = true;
      };
    }

    setIsPreviewLoading(true);
    setPreviewError("");
    getPharmacyMemberInvitationPreview(token)
      .then((data) => {
        if (!cancelled) {
          setPreview(data);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setPreviewError(getInvitationErrorMessage(error));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsPreviewLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [authenticated, token]);

  async function respond(action: "accept" | "decline") {
    if (!token) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    try {
      if (action === "accept") {
        await acceptPharmacyMemberInvitation(token);
        setResult("accepted");
      } else {
        await declinePharmacyMemberInvitation(token);
        setResult("declined");
      }
    } catch (error) {
      setErrorMessage(getInvitationErrorMessage(error));
    } finally {
      setIsSubmitting(false);
      setIsDeclineConfirmationOpen(false);
    }
  }

  if (!token) {
    return (
      <InvitationPanel title="Invitation invalide">
        Le lien d’invitation est incomplet ou invalide.
      </InvitationPanel>
    );
  }

  if (loading) {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl items-center px-4">
        <LoadingBubble label="Vérification de votre session" className="w-full" />
      </main>
    );
  }

  if (!authenticated) {
    return (
      <InvitationPanel title="Connectez-vous pour continuer">
        <p>
          Vous devez vous connecter à votre compte Kisinet avant de pouvoir consulter et accepter cette invitation.
        </p>
        <p className="mt-3">
          Cette invitation est personnelle. Connectez-vous avec le compte correspondant à l’adresse e-mail sur laquelle vous avez reçu l’invitation.
        </p>
        <a
          href={loginHref}
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-md bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700 focus:outline-none focus:ring-4 focus:ring-primary-200"
        >
          Se connecter à Kisinet
        </a>
        <p className="mt-5 text-xs leading-5 text-app-muted">
          Si la connexion ne fonctionne pas dans le navigateur intégré de votre application e-mail, ouvrez cette page dans votre navigateur habituel.
        </p>
      </InvitationPanel>
    );
  }

  if (isPreviewLoading) {
    return (
      <InvitationPanel title="Chargement de l’invitation">
        <LoadingBubble label="Chargement des informations de l’invitation" className="min-h-[160px]" />
      </InvitationPanel>
    );
  }

  if (previewError || !preview) {
    return (
      <InvitationPanel title="Invitation indisponible">
        {previewError || "Impossible de charger cette invitation. Réessayez dans quelques instants."}
      </InvitationPanel>
    );
  }

  if (result === "accepted") {
    return (
      <InvitationPanel title="Invitation acceptée">
        <p>Vous avez rejoint la pharmacie avec succès.</p>
        <a
          href="/app/select-pharmacy"
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-md bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700 focus:outline-none focus:ring-4 focus:ring-primary-200"
        >
          Continuer
        </a>
      </InvitationPanel>
    );
  }

  if (result === "declined") {
    return (
      <InvitationPanel title="Invitation refusée">
        <p>Vous avez refusé cette invitation. Aucun accès à la pharmacie n’a été créé.</p>
        <a
          href="/app/select-pharmacy"
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-md border border-app-border bg-app-surface px-5 py-2.5 text-sm font-semibold text-app-text transition hover:bg-primary-50 focus:outline-none focus:ring-4 focus:ring-primary-100"
        >
          Retour à Kisinet
        </a>
      </InvitationPanel>
    );
  }

  return (
    <>
      <InvitationPanel title={`Invitation à rejoindre ${preview.pharmacyName || "une pharmacie"}`}>
        <InvitationDetails preview={preview} currentUserEmail={sessionEmail || preview.currentUserEmail} />
        {preview.isCurrentUser ? (
          <p className="mt-5 rounded-md border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-700">
            Vous êtes connecté avec le compte correspondant à cette invitation.
          </p>
        ) : (
          <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-800">
            <p className="font-semibold">Cette invitation est destinée à un autre compte Kisinet.</p>
            <button
              type="button"
              onClick={() => logout(loginHref)}
              className="mt-3 inline-flex min-h-10 items-center justify-center rounded-md border border-amber-300 bg-app-card px-3 py-2 text-sm font-semibold text-app-text transition hover:bg-amber-100 focus:outline-none focus:ring-4 focus:ring-amber-100"
            >
              Se connecter avec un autre compte
            </button>
          </div>
        )}
        {preview.status !== "PENDING" && (
          <p role="alert" className="mt-5 rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium leading-6 text-red-700">
            {getInvitationStatusMessage(preview.status)}
          </p>
        )}
        {errorMessage && (
          <p role="alert" className="mt-5 rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium leading-6 text-red-700">
            {errorMessage}
          </p>
        )}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => respond("accept")}
            disabled={!canRespond || isSubmitting}
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-md bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700 focus:outline-none focus:ring-4 focus:ring-primary-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Traitement…" : "Accepter l’invitation"}
          </button>
          <button
            type="button"
            onClick={() => canRespond && setIsDeclineConfirmationOpen(true)}
            disabled={!canRespond || isSubmitting}
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-md border border-app-border bg-app-surface px-5 py-2.5 text-sm font-semibold text-app-text transition hover:bg-primary-50 focus:outline-none focus:ring-4 focus:ring-primary-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Refuser l’invitation
          </button>
        </div>
      </InvitationPanel>

      <ConfirmDialog
        open={isDeclineConfirmationOpen && canRespond}
        title="Refuser cette invitation ?"
        message="Vous ne serez pas ajouté à cette pharmacie."
        confirmLabel="Refuser l’invitation"
        loading={isSubmitting}
        onConfirm={() => respond("decline")}
        onCancel={() => setIsDeclineConfirmationOpen(false)}
      />
    </>
  );
}

function InvitationDetails({
  preview,
  currentUserEmail,
}: {
  preview: PharmacyMemberInvitationPreview;
  currentUserEmail: string;
}) {
  return (
    <dl className="divide-y divide-app-border overflow-hidden rounded-lg border border-app-border bg-app-surface text-sm">
      <InvitationDetail label="Rôle proposé" value={preview.roleDisplay} />
      <InvitationDetail label="Invitation destinée à" value={preview.invitedEmail} />
      <InvitationDetail label="Compte actuellement connecté" value={currentUserEmail || "Adresse e-mail indisponible"} />
      <InvitationDetail label="Expire le" value={formatInvitationDate(preview.expiresAt)} />
    </dl>
  );
}

function InvitationDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 px-4 py-3 sm:grid-cols-2 sm:gap-4">
      <dt className="font-medium text-app-muted">{label}</dt>
      <dd className="break-words font-semibold text-app-text">{value}</dd>
    </div>
  );
}

function formatInvitationDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Date d’expiration indisponible";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(date);
}

function getSessionEmail(user: unknown): string {
  if (!user || typeof user !== "object") {
    return "";
  }

  const email = (user as { email?: unknown }).email;
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

function getInvitationStatusMessage(status: PharmacyMemberInvitationPreview["status"]): string {
  switch (status) {
    case "EXPIRED":
      return "Cette invitation a expiré.";
    case "REVOKED":
      return "Cette invitation a été révoquée.";
    case "ACCEPTED":
      return "Cette invitation a déjà été acceptée.";
    case "DECLINED":
      return "Cette invitation a déjà été refusée.";
    default:
      return "Cette invitation n’est plus disponible.";
  }
}

function InvitationPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-app-background px-4 py-12 text-app-text sm:px-6">
      <section className="mx-auto max-w-xl rounded-xl border border-app-border bg-app-card p-6 shadow-soft sm:p-8">
        <p className="text-sm font-semibold text-primary-700">Kisinet</p>
        <h1 className="mt-2 text-2xl font-bold text-app-text sm:text-3xl">{title}</h1>
        <div className="mt-4 text-sm leading-6 text-app-muted">{children}</div>
      </section>
    </main>
  );
}

function getInvitationErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  const normalized = message.toLowerCase();

  if (normalized.includes("expir")) {
    return "Cette invitation a expiré. Demandez à la pharmacie de vous en envoyer une nouvelle.";
  }
  if (normalized.includes("autre adresse") || normalized.includes("autre utilisateur")) {
    return "Cette invitation est destinée à un autre compte Kisinet.";
  }
  if (normalized.includes("invalide") || normalized.includes("token")) {
    return "Ce lien d’invitation est invalide ou ne peut plus être utilisé.";
  }
  if (normalized.includes("csrf")) {
    return "Votre session de sécurité doit être actualisée. Veuillez réessayer.";
  }
  if (normalized.includes("session") || normalized.includes("reconnect")) {
    return "Votre session Kisinet a expiré. Connectez-vous à nouveau pour répondre à cette invitation.";
  }
  if (normalized.includes("plus active")) {
    return "Cette invitation n’est plus active. Elle a peut-être déjà été acceptée, refusée ou révoquée.";
  }
  if (
    normalized.includes("réseau") ||
    normalized.includes("indisponible") ||
    normalized.includes("impossible de contacter")
  ) {
    return "Impossible de contacter Kisinet. Vérifiez votre connexion puis réessayez.";
  }

  return "Impossible de traiter cette invitation pour le moment. Réessayez dans quelques instants.";
}
