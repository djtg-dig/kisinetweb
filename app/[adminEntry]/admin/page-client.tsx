"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { adminDashboardPath } from "@/lib/admin/config";
import { loginAdmin } from "@/lib/api/admin";

export function AdminLoginPageClient() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    try {
      await loginAdmin(email, password);
      window.location.href = adminDashboardPath;
    } catch {
      setMessage("Identifiants invalides.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-app-background px-4 py-10 text-app-text">
      <section className="w-full max-w-md rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
        <p className="text-sm font-semibold text-primary-700">Kisinet interne</p>
        <h1 className="mt-2 text-2xl font-bold text-app-text">Connexion administrateur</h1>
        <p className="mt-3 text-sm leading-6 text-app-muted">
          Accès strictement réservé à l'équipe Kisinet.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block text-sm font-semibold text-app-text">
            Email
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              autoComplete="username"
              required
              className="mt-2 min-h-11 w-full rounded-md border border-app-border bg-app-surface px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
            />
          </label>

          <label className="block text-sm font-semibold text-app-text">
            Mot de passe
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              autoComplete="current-password"
              required
              className="mt-2 min-h-11 w-full rounded-md border border-app-border bg-app-surface px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
            />
          </label>

          {message && (
            <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {message}
            </p>
          )}

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Connexion..." : "Se connecter"}
          </Button>
        </form>
      </section>
    </main>
  );
}
