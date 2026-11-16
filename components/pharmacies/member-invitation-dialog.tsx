"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { SubscriptionInactiveState } from "@/components/subscriptions/subscription-inactive-state";
import {
  createPharmacyMemberInvitation,
  searchPharmacyMemberCandidate,
  type MemberCandidate,
  type PharmacyMemberRole,
} from "@/lib/api";
import {
  getMemberInvitationErrorMessage,
  isSubscriptionInactiveError,
} from "@/lib/subscription-access";

type InvitationRole = Exclude<PharmacyMemberRole, "OWNER">;

type MemberInvitationDialogProps = {
  open: boolean;
  pharmacyId: string;
  subscription: unknown;
  canPaySubscription: boolean;
  onClose: () => void;
  onSubscriptionPurchaseDenied: () => void;
  onCreated: () => Promise<void> | void;
};

const roleLabels: Record<InvitationRole, string> = {
  MANAGER: "Manager",
  PHARMACIST: "Pharmacien",
  EMPLOYEE: "Employé",
};

export function MemberInvitationDialog({
  open,
  pharmacyId,
  subscription,
  canPaySubscription,
  onClose,
  onSubscriptionPurchaseDenied,
  onCreated,
}: MemberInvitationDialogProps) {
  const [email, setEmail] = useState("");
  const [candidate, setCandidate] = useState<MemberCandidate | null>(null);
  const [role, setRole] = useState<InvitationRole>("EMPLOYEE");
  const [isSearching, setIsSearching] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [subscriptionBlocked, setSubscriptionBlocked] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setEmail("");
    setCandidate(null);
    setRole("EMPLOYEE");
    setErrorMessage("");
    setSubscriptionBlocked(false);
  }, [open]);

  function updateEmail(value: string) {
    setEmail(value);
    setCandidate(null);
    setErrorMessage("");
  }

  async function searchCandidate() {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setErrorMessage("Saisissez une adresse e-mail.");
      return;
    }

    setIsSearching(true);
    setCandidate(null);
    setErrorMessage("");
    try {
      const foundCandidate = await searchPharmacyMemberCandidate(pharmacyId, normalizedEmail);
      setCandidate(foundCandidate);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (/aucun utilisateur kisinet|user_not_found/i.test(message)) {
        setErrorMessage(
          "Aucun compte Kisinet n’est associé à cette adresse e-mail. Demandez à cette personne de créer d’abord son compte Kisinet.",
        );
      } else if (/permission|autorisation/i.test(message)) {
        setErrorMessage("Vous n’avez pas la permission de rechercher un membre à inviter.");
      } else {
        setErrorMessage("La recherche du compte a échoué. Réessayez dans quelques instants.");
      }
    } finally {
      setIsSearching(false);
    }
  }

  async function sendInvitation() {
    if (!candidate) {
      return;
    }

    setIsSending(true);
    setErrorMessage("");
    try {
      await createPharmacyMemberInvitation(pharmacyId, {
        userReference: candidate.reference,
        role,
      });
      await onCreated();
      onClose();
    } catch (error) {
      if (isSubscriptionInactiveError(error, subscription)) {
        setSubscriptionBlocked(true);
      } else {
        setErrorMessage(getMemberInvitationErrorMessage(error));
      }
    } finally {
      setIsSending(false);
    }
  }

  return (
    <Modal
      open={open}
      title={subscriptionBlocked ? "Abonnement inactif" : "Inviter un membre"}
      onClose={onClose}
      saving={isSearching || isSending}
    >
      <div className="grid gap-5">
        {subscriptionBlocked ? (
          <SubscriptionInactiveState
            context="members"
            compact
            canPaySubscription={canPaySubscription}
            onPurchaseDenied={onSubscriptionPurchaseDenied}
          />
        ) : (
          <>
        <div className="grid gap-2">
          <label htmlFor="member-invitation-email" className="text-sm font-semibold text-app-text">
            Adresse e-mail
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id="member-invitation-email"
              type="email"
              value={email}
              onChange={(event) => updateEmail(event.target.value)}
              disabled={isSearching || isSending}
              placeholder="personne@example.com"
              className="min-h-11 min-w-0 flex-1 rounded-md border border-app-border bg-app-background px-3 text-sm text-app-text outline-none transition placeholder:text-app-muted focus:border-primary-600 focus:ring-4 focus:ring-primary-100 disabled:cursor-not-allowed disabled:opacity-60"
            />
            <button
              type="button"
              onClick={searchCandidate}
              disabled={isSearching || isSending}
              className="inline-flex min-h-11 justify-center rounded-md border border-primary-600 bg-primary-50 px-4 py-2 text-sm font-semibold text-primary-700 transition hover:bg-primary-100 focus:outline-none focus:ring-4 focus:ring-primary-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSearching ? "Recherche…" : "Rechercher"}
            </button>
          </div>
        </div>

        {errorMessage && (
          <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium leading-6 text-red-700">
            {errorMessage}
          </p>
        )}

        {candidate && (
          <>
            <section className="rounded-lg border border-app-border bg-app-background p-4">
              <p className="text-sm font-semibold text-app-text">{candidate.displayName}</p>
              <p className="mt-1 text-sm text-app-muted">{candidate.email}</p>
            </section>

            <label className="grid gap-2 text-sm font-semibold text-app-text">
              Rôle dans la pharmacie
              <select
                value={role}
                onChange={(event) => setRole(event.target.value as InvitationRole)}
                disabled={isSending}
                className="min-h-11 rounded-md border border-app-border bg-app-background px-3 text-sm font-medium text-app-text outline-none transition focus:border-primary-600 focus:ring-4 focus:ring-primary-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {(Object.keys(roleLabels) as InvitationRole[]).map((value) => (
                  <option key={value} value={value}>
                    {roleLabels[value]}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={sendInvitation}
              disabled={isSending}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700 focus:outline-none focus:ring-4 focus:ring-primary-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSending ? "Envoi…" : "Envoyer l’invitation"}
            </button>
          </>
        )}
          </>
        )}
      </div>
    </Modal>
  );
}
