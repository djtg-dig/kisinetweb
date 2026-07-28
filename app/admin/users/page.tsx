"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { LoadingBubble } from "@/components/ui/loading-bubble";
import { getAdminUsers, type AdminProfile } from "@/lib/api/admin";

type PageState = "loading" | "ready" | "error";

export default function AdminUsersPage() {
  const [state, setState] = useState<PageState>("loading");
  const [users, setUsers] = useState<AdminProfile[]>([]);
  const [count, setCount] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);
  const [refreshIndex, setRefreshIndex] = useState(0);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setPage(1);
      setDebouncedSearch(search.trim());
    }, 450);

    return () => window.clearTimeout(timeoutId);
  }, [search]);

  useEffect(() => {
    let isCurrent = true;

    async function loadUsers() {
      setState("loading");
      setMessage("");

      try {
        const data = await getAdminUsers({ search: debouncedSearch, page });
        if (!isCurrent) {
          return;
        }
        setUsers(data.results);
        setCount(data.count);
        setHasNextPage(Boolean(data.next));
        setHasPreviousPage(Boolean(data.previous));
        setState("ready");
      } catch (error) {
        if (!isCurrent) {
          return;
        }
        setState("error");
        setMessage(
          error instanceof Error ? error.message : "Impossible de charger les utilisateurs.",
        );
      }
    }

    void loadUsers();

    return () => {
      isCurrent = false;
    };
  }, [debouncedSearch, page, refreshIndex]);

  return (
    <section className="space-y-4">
      <div className="rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
        <p className="text-sm font-semibold text-primary-700">Admin-User</p>
        <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-app-text">Utilisateurs</h2>
            <p className="mt-2 text-sm text-app-muted">
              {count} utilisateur{count > 1 ? "s" : ""} trouvé{count > 1 ? "s" : ""}.
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 lg:w-auto">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Email, référence, nom, téléphone"
              className="min-h-11 rounded-md border border-app-border bg-app-surface px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100 sm:min-w-80"
            />
            <p className="text-xs text-app-muted">Recherche automatique après une courte pause.</p>
          </div>
        </div>
      </div>

      {state === "loading" && (
        <section className="rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
          <LoadingBubble label="Chargement des utilisateurs" className="min-h-[260px]" />
        </section>
      )}

      {state === "error" && (
        <section className="rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
          <p className="text-sm font-semibold text-red-700">Chargement impossible</p>
          <p className="mt-2 text-sm text-app-muted">{message}</p>
          <Button onClick={() => setRefreshIndex((current) => current + 1)} className="mt-5">
            Réessayer
          </Button>
        </section>
      )}

      {state === "ready" && (
        <section className="overflow-hidden rounded-lg border border-app-border bg-app-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-[1480px] divide-y divide-app-border text-left text-xs">
              <thead className="bg-app-surface text-xs font-bold uppercase text-app-muted">
                <tr>
                  <th className="px-3 py-3">ID</th>
                  <th className="px-3 py-3">Référence</th>
                  <th className="px-3 py-3">Email</th>
                  <th className="px-3 py-3">Prénom</th>
                  <th className="px-3 py-3">Nom</th>
                  <th className="px-3 py-3">Téléphone</th>
                  <th className="px-3 py-3">Actif</th>
                  <th className="px-3 py-3">Staff</th>
                  <th className="px-3 py-3">Superuser</th>
                  <th className="px-3 py-3">Groupes</th>
                  <th className="px-3 py-3">Permissions</th>
                  <th className="px-3 py-3">Dernière connexion</th>
                  <th className="px-3 py-3">Création</th>
                  <th className="px-3 py-3">Mise à jour</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-border">
                {users.map((user) => (
                  <tr key={user.id} className="align-top">
                    <td className="max-w-[180px] truncate px-3 py-3 font-mono text-[11px] text-app-muted">
                      {user.id}
                    </td>
                    <td className="px-3 py-3 font-semibold text-app-text">{user.reference}</td>
                    <td className="max-w-[220px] truncate px-3 py-3 text-app-text">{user.email}</td>
                    <td className="px-3 py-3 text-app-muted">{user.first_name || "-"}</td>
                    <td className="px-3 py-3 text-app-muted">{user.last_name || "-"}</td>
                    <td className="px-3 py-3 text-app-muted">{user.phone_number || "-"}</td>
                    <td className="px-3 py-3">
                      <BooleanBadge value={user.is_active} />
                    </td>
                    <td className="px-3 py-3">
                      <BooleanBadge value={user.is_staff} />
                    </td>
                    <td className="px-3 py-3">
                      <BooleanBadge value={user.is_superuser} />
                    </td>
                    <td className="max-w-[160px] px-3 py-3 text-app-muted">
                      {formatList(user.groups)}
                    </td>
                    <td className="max-w-[220px] px-3 py-3 text-app-muted">
                      {formatList(user.user_permissions)}
                    </td>
                    <td className="px-3 py-3 text-app-muted">{formatDate(user.last_login)}</td>
                    <td className="px-3 py-3 text-app-muted">{formatDate(user.date_joined)}</td>
                    <td className="px-3 py-3 text-app-muted">{formatDate(user.updated_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!users.length && (
            <p className="border-t border-app-border px-4 py-6 text-sm text-app-muted">
              Aucun utilisateur trouvé.
            </p>
          )}

          <div className="flex flex-col gap-3 border-t border-app-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-app-muted">
              Page {page} · 20 lignes maximum par page · {count} résultat{count > 1 ? "s" : ""}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={!hasPreviousPage}
                onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
              >
                Précédent
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={!hasNextPage}
                onClick={() => setPage((currentPage) => currentPage + 1)}
              >
                Suivant
              </Button>
            </div>
          </div>
        </section>
      )}
    </section>
  );
}

function formatDate(value: string | null) {
  return value || "-";
}

function formatList(values: string[]) {
  if (!values.length) {
    return "-";
  }
  return values.join(", ");
}

function BooleanBadge({ value }: { value: boolean }) {
  return (
    <span
      className={`inline-flex rounded-md px-2.5 py-1 text-xs font-bold ${
        value
          ? "bg-emerald-50 text-emerald-700"
          : "bg-red-50 text-red-700"
      }`}
    >
      {value ? "Oui" : "Non"}
    </span>
  );
}
