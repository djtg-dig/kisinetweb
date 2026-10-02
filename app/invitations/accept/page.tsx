"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { LoadingBubble } from "@/components/ui/loading-bubble";
import {
  acceptPharmacyMemberInvitation,
  declinePharmacyMemberInvitation,
} from "@/lib/api";
import { carriAccountLoginUrl } from "@/lib/carri-account";
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
  const { authenticated, loading } = useSession();
  const token = searchParams.get("token")?.trim() || "";
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeclineConfirmationOpen, setIsDeclineConfirmationOpen] = useState(false);
  const [result, setResult] = useState<InvitationResult>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const invitationPath = "/invitations/accept?token=" + encodeURIComponent(token);
  const loginHref = carriAccountLoginUrl + "?next=" + encodeURIComponent(invitationPath);

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
      <InvitationPanel title="Invitation à rejoindre une pharmacie">
        <p>
          Cette invitation est associée à votre compte Kisinet. Vous pouvez l’accepter ou la refuser.
        </p>
        {errorMessage && (
          <p role="alert" className="mt-5 rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium leading-6 text-red-700">
            {errorMessage}
          </p>
        )}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => respond("accept")}
            disabled={isSubmitting}
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-md bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700 focus:outline-none focus:ring-4 focus:ring-primary-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Traitement…" : "Accepter l’invitation"}
          </button>
          <button
            type="button"
            onClick={() => setIsDeclineConfirmationOpen(true)}
            disabled={isSubmitting}
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-md border border-app-border bg-app-surface px-5 py-2.5 text-sm font-semibold text-app-text transition hover:bg-primary-50 focus:outline-none focus:ring-4 focus:ring-primary-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Refuser l’invitation
          </button>
        </div>
      </InvitationPanel>

      <ConfirmDialog
        open={isDeclineConfirmationOpen}
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
  if (normalized.includes("plus active")) {
    return "Cette invitation n’est plus active. Elle a peut-être déjà été acceptée, refusée ou révoquée.";
  }
  if (normalized.includes("réseau") || normalized.includes("indisponible")) {
    return "La connexion au service est momentanément indisponible. Réessayez dans quelques instants.";
  }

  return "Impossible de traiter cette invitation pour le moment. Réessayez dans quelques instants.";
}
