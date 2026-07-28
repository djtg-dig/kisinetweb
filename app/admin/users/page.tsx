"use client";

import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { LoadingBubble } from "@/components/ui/loading-bubble";
import { getAdminUsers, type AdminProfile } from "@/lib/api/admin";

type PageState = "loading" | "ready" | "error";

export default function AdminUsersPage() {
  const [state, setState] = useState<PageState>("loading");
  const [users, setUsers] = useState<AdminProfile[]>([]);
  const [count, setCount] = useState(0);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  async function loadUsers(nextSearch = search) {
    setState("loading");
    setMessage("");

    try {
      const data = await getAdminUsers(nextSearch);
      setUsers(data);
      setCount(data.length);
      setState("ready");
    } catch (error) {
      setState("error");
      setMessage(
        error instanceof Error ? error.message : "Impossible de charger les utilisateurs.",
      );
    }
  }

  useEffect(() => {
    void loadUsers("");
  }, []);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadUsers(search);
  }

  return (
    <section className="space-y-6">
      <div className="rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
        <p className="text-sm font-semibold text-primary-700">Admin-User</p>
        <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-app-text">Utilisateurs</h2>
            <p className="mt-2 text-sm text-app-muted">
              {count} utilisateur{count > 1 ? "s" : ""} trouvé{count > 1 ? "s" : ""}.
            </p>
          </div>

          <form onSubmit={handleSearch} className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Email, référence, nom"
              className="min-h-11 rounded-md border border-app-border bg-app-surface px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100 sm:min-w-72"
            />
            <Button type="submit">Rechercher</Button>
          </form>
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
          <Button onClick={() => void loadUsers()} className="mt-5">
            Réessayer
          </Button>
        </section>
      )}

      {state === "ready" && (
        <section className="overflow-hidden rounded-lg border border-app-border bg-app-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-app-border text-left text-sm">
              <thead className="bg-app-surface text-xs font-bold uppercase text-app-muted">
                <tr>
                  <th className="px-4 py-3">Utilisateur</th>
                  <th className="px-4 py-3">Référence</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3">Admin</th>
                  <th className="px-4 py-3">Création</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-border">
                {users.map((user) => (
                  <tr key={user.reference} className="align-top">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-app-text">{formatName(user)}</p>
                      <p className="mt-1 text-app-muted">{user.email}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold text-app-text">{user.reference}</td>
                    <td className="px-4 py-3">
                      <StatusBadge active={user.is_active} />
                    </td>
                    <td className="px-4 py-3 text-app-muted">
                      {user.is_superuser ? "Superuser" : user.is_staff ? "Staff" : "Non"}
                    </td>
                    <td className="px-4 py-3 text-app-muted">{user.date_joined || "-"}</td>
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
        </section>
      )}
    </section>
  );
}

function formatName(user: AdminProfile) {
  const name = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
  return name || "Nom non renseigné";
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex rounded-md px-2.5 py-1 text-xs font-bold ${
        active
          ? "bg-emerald-50 text-emerald-700"
          : "bg-red-50 text-red-700"
      }`}
    >
      {active ? "Actif" : "Inactif"}
    </span>
  );
}
