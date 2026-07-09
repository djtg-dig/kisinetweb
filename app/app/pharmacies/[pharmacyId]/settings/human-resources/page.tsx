"use client";

import { useEffect, useState, type ChangeEvent, type ReactNode } from "react";
import {
  assignPharmacyMemberPermissions,
  deletePharmacyMember,
  getPharmacyMembers,
  getPharmacyPermissions,
  suspendPharmacyMember,
  updatePharmacyMember,
  type PharmacyMember,
  type PharmacyMemberRole,
  type PharmacyPermissions,
} from "@/lib/api";

type HumanResourcesSettingsPageProps = {
  params: Promise<{ pharmacyId: string }>;
};

type PageState = "loading" | "error" | "empty" | "ready";

const roleLabels: Record<PharmacyMemberRole, string> = {
  OWNER: "Propriétaire",
  MANAGER: "Gérant",
  PHARMACIST: "Pharmacien",
  EMPLOYEE: "Employé",
};

const editableRoles: PharmacyMemberRole[] = ["MANAGER", "PHARMACIST", "EMPLOYEE"];

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

export default function HumanResourcesSettingsPage({
  params,
}: HumanResourcesSettingsPageProps) {
  const [pharmacyId, setPharmacyId] = useState("");
  const [members, setMembers] = useState<PharmacyMember[]>([]);
  const [permissions, setPermissions] = useState<PharmacyPermissions>({});
  const [permissionModalMember, setPermissionModalMember] =
    useState<PharmacyMember | null>(null);
  const [draftPermissions, setDraftPermissions] = useState<PharmacyPermissions>({});
  const [state, setState] = useState<PageState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [permissionFeedback, setPermissionFeedback] = useState("");
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

    async function loadMembers() {
      setState("loading");
      setErrorMessage("");

      try {
        // On charge les membres et les droits de l'utilisateur en même temps.
        const [pageMembers, currentPermissions] = await Promise.all([
          getPharmacyMembers(pharmacyId),
          getPharmacyPermissions(pharmacyId),
        ]);

        setMembers(pageMembers);
        setPermissions(currentPermissions);
        setPermissionModalMember(null);
        setDraftPermissions({});
        setState(pageMembers.length ? "ready" : "empty");
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Impossible de charger les membres.",
        );
        setState("error");
      }
    }

    loadMembers();
  }, [pharmacyId]);

  function openPermissionsModal(member: PharmacyMember) {
    setPermissionModalMember(member);
    setDraftPermissions(member.permissions);
    setPermissionFeedback("");
    setSuccessMessage("");
    setErrorMessage("");
  }

  function closePermissionsModal() {
    setPermissionModalMember(null);
    setDraftPermissions({});
    setPermissionFeedback("");
  }

  function replaceMember(updatedMember: PharmacyMember) {
    setMembers((current) =>
      current.map((member) => (member.id === updatedMember.id ? updatedMember : member)),
    );
    setPermissionModalMember((current) =>
      current?.id === updatedMember.id ? updatedMember : current,
    );
    if (permissionModalMember?.id === updatedMember.id) {
      setDraftPermissions(updatedMember.permissions);
    }
  }

  async function changeRole(member: PharmacyMember, role: PharmacyMemberRole) {
    await runMemberAction("role:" + member.id, async () => {
      const updatedMember = await updatePharmacyMember(pharmacyId, member.id, { role });
      replaceMember(updatedMember);
      setSuccessMessage("Rôle mis à jour.");
    });
  }

  async function suspendMember(member: PharmacyMember) {
    await runMemberAction("suspend:" + member.id, async () => {
      const updatedMember = await suspendPharmacyMember(pharmacyId, member.id);
      replaceMember(updatedMember);
      setSuccessMessage("Membre suspendu.");
    });
  }

  async function removeMember(member: PharmacyMember) {
    if (!window.confirm("Supprimer ce membre de la pharmacie ?")) {
      return;
    }

    await runMemberAction("delete:" + member.id, async () => {
      await deletePharmacyMember(pharmacyId, member.id);
      const nextMembers = members.filter((current) => current.id !== member.id);
      setMembers(nextMembers);
      if (permissionModalMember?.id === member.id) {
        closePermissionsModal();
      }
      setState(nextMembers.length ? "ready" : "empty");
      setSuccessMessage("Membre supprimé.");
    });
  }

  async function savePermissions() {
    if (!permissionModalMember) {
      return;
    }

    const memberToUpdate = permissionModalMember;
    const actionKey = "permissions:" + memberToUpdate.id;
    setRunningAction(actionKey);
    setPermissionFeedback("");
    setErrorMessage("");
    setSuccessMessage("");

    try {
      // Le backend décide quelles permissions peuvent vraiment être affectées.
      const updatedMember = await assignPharmacyMemberPermissions(
        pharmacyId,
        memberToUpdate.id,
        draftPermissions,
      );
      closePermissionsModal();
      replaceMember(updatedMember);
      setSuccessMessage("Permissions mises à jour.");
    } catch (error) {
      setPermissionFeedback(
        error instanceof Error
          ? error.message
          : "Le backend n'a pas renvoyé la raison de cette erreur.",
      );
    } finally {
      setRunningAction("");
    }
  }

  async function runMemberAction(actionKey: string, action: () => Promise<void>) {
    setRunningAction(actionKey);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await action();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Action impossible pour ce membre.",
      );
    } finally {
      setRunningAction("");
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <a
        href={pharmacyId ? "/app/pharmacies/" + pharmacyId + "/settings" : "#"}
        className="text-sm font-semibold text-primary-700 transition hover:text-primary-800"
      >
        Retour aux paramètres
      </a>

      <section className="mt-6 rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
        <p className="text-sm font-semibold text-primary-700">Ressources humaines</p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-app-text">Membres et permissions</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-app-muted">
              Gérez les rôles, les accès et les permissions des membres de cette pharmacie.
            </p>
          </div>
          <div className="rounded-lg border border-app-border bg-app-background px-4 py-3 text-sm">
            <span className="font-semibold text-app-text">{members.length} membre{members.length > 1 ? "s" : ""}</span>
          </div>
        </div>
      </section>

      {errorMessage && (
        <Message tone="error">{errorMessage}</Message>
      )}
      {successMessage && (
        <Message tone="success">{successMessage}</Message>
      )}

      {state === "loading" && (
        <section className="mt-6 rounded-lg border border-app-border bg-app-card p-8 text-center text-sm font-semibold text-app-muted">
          Chargement des membres...
        </section>
      )}

      {state === "error" && (
        <EmptyPanel title="Membres indisponibles" />
      )}

      {state === "empty" && (
        <EmptyPanel title="Aucun membre trouvé" />
      )}

      {state === "ready" && (
        <section className="mt-6">
          <MembersList
            pharmacyId={pharmacyId}
            members={members}
            currentPermissions={permissions}
            runningAction={runningAction}
            onChangeRole={changeRole}
            onSuspend={suspendMember}
            onDelete={removeMember}
            onOpenPermissions={openPermissionsModal}
          />
        </section>
      )}

      <PermissionsModal
        member={permissionModalMember}
        currentPermissions={permissions}
        draftPermissions={draftPermissions}
        runningAction={runningAction}
        feedback={permissionFeedback}
        onClose={closePermissionsModal}
        onToggle={(permission) => {
          setPermissionFeedback("");
          setDraftPermissions((current) => ({
            ...current,
            [permission]: !current[permission],
          }));
        }}
        onSave={savePermissions}
      />
    </main>
  );
}

function MembersList({
  pharmacyId,
  members,
  currentPermissions,
  runningAction,
  onChangeRole,
  onSuspend,
  onDelete,
  onOpenPermissions,
}: {
  pharmacyId: string;
  members: PharmacyMember[];
  currentPermissions: PharmacyPermissions;
  runningAction: string;
  onChangeRole: (member: PharmacyMember, role: PharmacyMemberRole) => void;
  onSuspend: (member: PharmacyMember) => void;
  onDelete: (member: PharmacyMember) => void;
  onOpenPermissions: (member: PharmacyMember) => void;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-app-border bg-app-card">
      <div className="border-b border-app-border px-4 py-3">
        <h2 className="text-base font-bold text-app-text">Liste des employés</h2>
        <p className="mt-1 text-sm text-app-muted">
          Utilisez le menu Actions pour consulter, suspendre, supprimer ou gérer les permissions.
        </p>
      </div>

      <div className="hidden overflow-x-auto lg:block">
        <table className="min-w-full table-fixed divide-y divide-app-border text-sm">
          <thead className="bg-app-background text-left text-xs font-semibold uppercase tracking-wide text-app-muted">
            <tr>
              <th className="w-[34%] px-4 py-3">Employé</th>
              <th className="w-[16%] px-4 py-3">Rôle</th>
              <th className="w-[12%] px-4 py-3">Statut</th>
              <th className="w-[16%] px-4 py-3">Arrivée</th>
              <th className="w-[22%] px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-app-border">
            {members.map((member) => (
              <MemberRow
                key={member.id}
                pharmacyId={pharmacyId}
                member={member}
                currentPermissions={currentPermissions}
                runningAction={runningAction}
                onChangeRole={(role) => onChangeRole(member, role)}
                onSuspend={() => onSuspend(member)}
                onDelete={() => onDelete(member)}
                onOpenPermissions={() => onOpenPermissions(member)}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 p-3 lg:hidden">
        {members.map((member) => (
          <MemberMobileItem
            key={member.id}
            pharmacyId={pharmacyId}
            member={member}
            currentPermissions={currentPermissions}
            runningAction={runningAction}
            onChangeRole={(role) => onChangeRole(member, role)}
            onSuspend={() => onSuspend(member)}
            onDelete={() => onDelete(member)}
            onOpenPermissions={() => onOpenPermissions(member)}
          />
        ))}
      </div>
    </section>
  );
}

function MemberRow({
  pharmacyId,
  member,
  currentPermissions,
  runningAction,
  onChangeRole,
  onSuspend,
  onDelete,
  onOpenPermissions,
}: {
  pharmacyId: string;
  member: PharmacyMember;
  currentPermissions: PharmacyPermissions;
  runningAction: string;
  onChangeRole: (role: PharmacyMemberRole) => void;
  onSuspend: () => void;
  onDelete: () => void;
  onOpenPermissions: () => void;
}) {
  const isOwner = member.role === "OWNER";

  return (
    <tr className="bg-app-card">
      <td className="px-4 py-3 align-middle">
        <div className="block min-w-0 text-left">
          <span className="block truncate font-semibold text-app-text">
            {member.userFullName || member.userEmail || "Membre sans nom"}
          </span>
          <span className="mt-1 block truncate text-xs text-app-muted">
            {member.userEmail || "Email non renseigné"}
          </span>
        </div>
      </td>
      <td className="px-4 py-3 align-middle">
        <RoleSelect
          member={member}
          disabled={isOwner || !currentPermissions.member_update || runningAction === "role:" + member.id}
          onChange={onChangeRole}
        />
      </td>
      <td className="px-4 py-3 align-middle">
        <StatusBadge suspended={member.isSuspended} />
      </td>
      <td className="px-4 py-3 align-middle text-xs font-medium text-app-muted">
        {formatDate(member.joinedAt) || "Non renseigné"}
      </td>
      <td className="px-4 py-3 align-middle">
        <ActionSelect
          pharmacyId={pharmacyId}
          member={member}
          currentPermissions={currentPermissions}
          runningAction={runningAction}
          onSuspend={onSuspend}
          onDelete={onDelete}
          onOpenPermissions={onOpenPermissions}
        />
      </td>
    </tr>
  );
}

function MemberMobileItem({
  pharmacyId,
  member,
  currentPermissions,
  runningAction,
  onChangeRole,
  onSuspend,
  onDelete,
  onOpenPermissions,
}: {
  pharmacyId: string;
  member: PharmacyMember;
  currentPermissions: PharmacyPermissions;
  runningAction: string;
  onChangeRole: (role: PharmacyMemberRole) => void;
  onSuspend: () => void;
  onDelete: () => void;
  onOpenPermissions: () => void;
}) {
  const isOwner = member.role === "OWNER";

  return (
    <article className="rounded-md border border-app-border bg-app-card p-4">
      <div className="block min-w-0 text-left">
        <span className="block truncate font-semibold text-app-text">
          {member.userFullName || member.userEmail || "Membre sans nom"}
        </span>
        <span className="mt-1 block truncate text-sm text-app-muted">
          {member.userEmail || "Email non renseigné"}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <StatusBadge suspended={member.isSuspended} />
        <span className="text-xs font-medium text-app-muted">
          {formatDate(member.joinedAt) || "Date non renseignée"}
        </span>
      </div>
      <div className="mt-3 grid gap-3">
        <RoleSelect
          member={member}
          disabled={isOwner || !currentPermissions.member_update || runningAction === "role:" + member.id}
          onChange={onChangeRole}
        />
        <ActionSelect
          pharmacyId={pharmacyId}
          member={member}
          currentPermissions={currentPermissions}
          runningAction={runningAction}
          onSuspend={onSuspend}
          onDelete={onDelete}
          onOpenPermissions={onOpenPermissions}
        />
      </div>
    </article>
  );
}

function ActionSelect({
  pharmacyId,
  member,
  currentPermissions,
  runningAction,
  onSuspend,
  onDelete,
  onOpenPermissions,
}: {
  pharmacyId: string;
  member: PharmacyMember;
  currentPermissions: PharmacyPermissions;
  runningAction: string;
  onSuspend: () => void;
  onDelete: () => void;
  onOpenPermissions: () => void;
}) {
  const isOwner = member.role === "OWNER";
  const isBusy = runningAction.endsWith(":" + member.id);
  const detailUrl =
    "/app/pharmacies/" + pharmacyId + "/settings/human-resources/" + member.id;

  function handleAction(event: ChangeEvent<HTMLSelectElement>) {
    const action = event.target.value;
    event.target.value = "";

    if (action === "view") {
      window.location.href = detailUrl;
    }

    if (action === "suspend") {
      onSuspend();
    }

    if (action === "delete") {
      onDelete();
    }

    if (action === "permissions") {
      onOpenPermissions();
    }
  }

  return (
    <select
      defaultValue=""
      disabled={isBusy}
      onChange={handleAction}
      className="min-h-10 w-full rounded-md border border-app-border bg-app-background px-3 text-sm font-semibold text-app-text outline-none transition focus:border-primary-600 focus:ring-4 focus:ring-primary-100 disabled:cursor-not-allowed disabled:opacity-60 lg:ml-auto lg:max-w-[180px]"
    >
      <option value="">Actions</option>
      <option value="view" disabled={!currentPermissions.member_view}>
        Voir
      </option>
      <option
        value="suspend"
        disabled={isOwner || member.isSuspended || !currentPermissions.member_suspend}
      >
        Suspendre
      </option>
      <option value="delete" disabled={isOwner || !currentPermissions.member_delete}>
        Supprimer
      </option>
      <option
        value="permissions"
        disabled={isOwner || !currentPermissions.member_manage_permissions}
      >
        Permissions
      </option>
    </select>
  );
}

function RoleSelect({
  member,
  disabled,
  onChange,
}: {
  member: PharmacyMember;
  disabled: boolean;
  onChange: (role: PharmacyMemberRole) => void;
}) {
  return (
    <select
      value={member.role}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value as PharmacyMemberRole)}
      className="min-h-10 w-full rounded-md border border-app-border bg-app-background px-3 text-sm font-medium text-app-text outline-none transition focus:border-primary-600 focus:ring-4 focus:ring-primary-100 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {member.role === "OWNER" && <option value="OWNER">Propriétaire</option>}
      {editableRoles.map((role) => (
        <option key={role} value={role}>
          {roleLabels[role]}
        </option>
      ))}
    </select>
  );
}

function PermissionsModal({
  member,
  currentPermissions,
  draftPermissions,
  runningAction,
  feedback,
  onClose,
  onToggle,
  onSave,
}: {
  member: PharmacyMember | null;
  currentPermissions: PharmacyPermissions;
  draftPermissions: PharmacyPermissions;
  runningAction: string;
  feedback: string;
  onClose: () => void;
  onToggle: (permission: keyof PharmacyPermissions) => void;
  onSave: () => void;
}) {
  if (!member) {
    return null;
  }

  const canEdit = Boolean(
    member.role !== "OWNER" &&
      currentPermissions.member_manage_permissions,
  );

  return (
    <div className="fixed inset-0 z-[1100] flex items-stretch justify-center bg-black/40 px-3 pb-3 pt-20 sm:items-center sm:px-4 sm:py-6 sm:pt-6">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="permissions-title"
        className="flex max-h-[calc(100dvh-5.75rem)] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-app-border bg-app-card shadow-xl sm:max-h-[88vh]"
      >
        <div className="shrink-0 border-b border-app-border px-4 py-4 sm:px-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id="permissions-title" className="text-lg font-bold text-app-text">
                Permissions
              </h2>
              <p className="mt-1 text-sm leading-6 text-app-muted">
                Modifiez uniquement les droits nécessaires pour ce membre.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-app-border bg-app-background px-3 py-2 text-sm font-semibold text-app-text transition hover:bg-primary-50 focus:outline-none focus:ring-4 focus:ring-primary-100"
            >
              Fermer
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          <div className="rounded-md border border-app-border bg-app-background p-3">
            <p className="font-semibold text-app-text">
              {member.userFullName || member.userEmail}
            </p>
            <p className="mt-1 text-sm text-app-muted">{roleLabels[member.role]}</p>
          </div>

          {feedback && (
            <div
              role="status"
              aria-live="polite"
              className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-800"
            >
              <p className="font-bold">Modification refusée</p>
              <p className="mt-1">{feedback}</p>
            </div>
          )}

          <div className="mt-4 grid gap-4">
            {permissionGroups.map((group) => (
              <div key={group.title}>
                <p className="text-sm font-bold text-app-text">{group.title}</p>
                <div className="mt-2 grid gap-1.5">
                  {group.permissions.map(([permission, label]) => (
                    <label
                      key={permission}
                      className="flex items-center justify-between gap-3 rounded-md border border-app-border bg-app-background px-3 py-2 text-xs font-semibold text-app-text"
                    >
                      {label}
                      <input
                        type="checkbox"
                        checked={Boolean(draftPermissions[permission])}
                        disabled={!canEdit}
                        onChange={() => onToggle(permission)}
                        className="h-4 w-4 accent-primary-600 disabled:cursor-not-allowed"
                      />
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="shrink-0 border-t border-app-border bg-app-background px-4 py-3 sm:px-5 sm:py-4">
          <div className="grid gap-3 sm:flex sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-app-border bg-app-card px-5 py-2.5 text-sm font-semibold text-app-text transition hover:bg-primary-50 focus:outline-none focus:ring-4 focus:ring-primary-100"
            >
              Annuler
            </button>
            <button
              type="button"
              disabled={!canEdit || runningAction === "permissions:" + member.id}
              onClick={onSave}
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700 focus:outline-none focus:ring-4 focus:ring-primary-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {runningAction === "permissions:" + member.id
                ? "Enregistrement..."
                : "Enregistrer les permissions"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatusBadge({ suspended }: { suspended: boolean }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
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
      : "border-success-100 bg-success-50 text-success-700";

  return (
    <div className={`mt-5 rounded-lg border p-4 text-sm font-semibold leading-6 ${className}`}>
      {children}
    </div>
  );
}

function EmptyPanel({ title }: { title: string }) {
  return (
    <section className="mt-6 rounded-lg border border-app-border bg-app-card p-8 text-center">
      <h2 className="text-lg font-bold text-app-text">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-app-muted">
        Vérifiez vos permissions ou acceptez des demandes d'intégration pour afficher des membres.
      </p>
    </section>
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
