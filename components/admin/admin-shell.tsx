"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logoutAdmin } from "@/lib/api/admin";
import { adminLoginPath } from "@/lib/admin/config";
import { Button } from "@/components/ui/button";

const adminNavItems = [
  { label: "Dashboard", href: "/admin/dashboard" },
  { label: "Utilisateurs", href: "/admin/users" },
  { label: "Pharmacies", href: "/admin/pharmacies" },
  { label: "Abonnements", href: "/admin/subscriptions" },
  { label: "Paiements", href: "/admin/payments" },
  { label: "Paramètres", href: "/admin/settings" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  async function handleLogout() {
    await logoutAdmin();
    window.location.href = adminLoginPath;
  }

  return (
    <div className="min-h-screen w-full bg-app-background text-app-text">
      <header className="border-b border-app-border bg-app-surface">
        <div className="flex w-full flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <p className="text-sm font-semibold text-primary-700">Kisinet interne</p>
            <h1 className="text-2xl font-bold text-app-text">Administration</h1>
          </div>
          <Button type="button" variant="secondary" onClick={() => void handleLogout()}>
            Déconnexion
          </Button>
        </div>
      </header>

      <div
        className={`grid min-h-[calc(100vh-81px)] w-full gap-4 px-4 py-4 sm:px-6 lg:px-8 ${
          isSidebarCollapsed
            ? "lg:grid-cols-[76px_minmax(0,1fr)]"
            : "lg:grid-cols-[240px_minmax(0,1fr)]"
        }`}
      >
        <nav className="h-fit rounded-lg border border-app-border bg-app-card p-3 shadow-sm lg:sticky lg:top-4">
          <button
            type="button"
            onClick={() => setIsSidebarCollapsed((value) => !value)}
            className={`mb-3 flex min-h-10 w-full items-center rounded-md border border-app-border bg-app-surface px-3 text-sm font-semibold text-app-text transition hover:bg-primary-50 ${
              isSidebarCollapsed ? "justify-center" : "justify-between"
            }`}
            aria-label={isSidebarCollapsed ? "Déplier le menu" : "Plier le menu"}
            title={isSidebarCollapsed ? "Déplier le menu" : "Plier le menu"}
          >
            {!isSidebarCollapsed && <span>Menu</span>}
            <span aria-hidden="true">{isSidebarCollapsed ? ">" : "<"}</span>
          </button>
          {adminNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-md px-3 py-2 text-sm font-semibold transition ${
                  isActive
                    ? "bg-primary-600 text-white"
                    : "text-app-text hover:bg-primary-50"
                }`}
                title={item.label}
              >
                {isSidebarCollapsed ? item.label.charAt(0) : item.label}
              </Link>
            );
          })}
        </nav>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
