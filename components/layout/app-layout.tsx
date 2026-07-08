"use client";

import { useEffect, useRef, useState } from "react";
import { logout, setActivePharmacyId } from "@/lib/auth";

type AppLayoutProps = {
  children: React.ReactNode;
  pharmacyId: string;
};

const appNavItems = [
  { label: "Vue dashboard", path: "/dashboard" },
  { label: "Produits", path: "/products" },
  { label: "Stock", path: "/stock" },
  { label: "Ventes", path: "/sales" },
  { label: "Rapports", path: "/reports" },
  { label: "Paramètres", path: "/settings" },
];

export function AppLayout({ children, pharmacyId }: AppLayoutProps) {
  useEffect(() => {
    setActivePharmacyId(pharmacyId);
  }, [pharmacyId]);

  return (
    <div className="min-h-screen bg-app-background pt-[65px] text-app-text sm:pt-[73px]">
      <AppNavbar pharmacyId={pharmacyId} />
      {children}
    </div>
  );
}

function AppNavbar({ pharmacyId }: { pharmacyId: string }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const basePath = "/app/pharmacies/" + pharmacyId;

  useEffect(() => {
    function closeMenuOnOutsideClick(event: MouseEvent) {
      if (!menuRef.current || menuRef.current.contains(event.target as Node)) {
        return;
      }

      setIsMenuOpen(false);
    }

    document.addEventListener("mousedown", closeMenuOnOutsideClick);
    return () => {
      document.removeEventListener("mousedown", closeMenuOnOutsideClick);
    };
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-20 border-b border-app-border bg-app-surface/95 backdrop-blur">
      <nav className="mx-auto grid min-h-16 max-w-7xl grid-cols-[auto_auto] items-center justify-between gap-3 px-3 py-2 sm:min-h-[72px] sm:gap-4 sm:px-6 sm:py-3 lg:px-8">
        <a href={basePath + "/dashboard"} className="flex min-w-0 items-center gap-2 sm:gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary-600 text-base font-bold text-white sm:h-10 sm:w-10 sm:text-lg">
            K
          </span>
          <span className="hidden truncate text-lg font-bold text-app-text sm:block">
            Kisinet
          </span>
        </a>

        <div ref={menuRef} className="relative justify-self-end">
          <button
            type="button"
            aria-expanded={isMenuOpen}
            aria-haspopup="menu"
            onClick={() => setIsMenuOpen((current) => !current)}
            className="inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-md border border-app-border bg-app-card px-3 py-2 text-sm font-semibold text-app-text transition hover:bg-primary-50 focus:outline-none focus:ring-4 focus:ring-primary-100 sm:min-h-11 sm:px-4"
          >
            <span className="truncate">Dashboard</span>
            <span aria-hidden="true" className="shrink-0 text-xs text-app-muted">
              ▼
            </span>
          </button>

          {isMenuOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-3 max-h-[calc(100vh-90px)] w-[min(calc(100vw-24px),280px)] overflow-y-auto rounded-lg border border-app-border bg-app-card py-2 text-sm shadow-soft"
            >
              {appNavItems.map((item) => (
                <MenuLink
                  key={item.path}
                  href={basePath + item.path}
                  onClose={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </MenuLink>
              ))}
              <div className="my-2 border-t border-app-border" />
              <MenuLink href="/app/profile" onClose={() => setIsMenuOpen(false)}>
                Mon profil
              </MenuLink>
              <MenuLink href="/app/select-pharmacy" onClose={() => setIsMenuOpen(false)}>
                Mes pharmacies
              </MenuLink>
              <MenuLink href="/app/subscription" onClose={() => setIsMenuOpen(false)}>
                Mon abonnement
              </MenuLink>
              <MenuLink href="/help" onClose={() => setIsMenuOpen(false)}>
                Aide
              </MenuLink>
              <button
                type="button"
                role="menuitem"
                onClick={logout}
                className="block w-full px-4 py-2.5 text-left font-semibold text-app-text transition hover:bg-primary-50"
              >
                Déconnexion
              </button>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}

function MenuLink({
  href,
  children,
  onClose,
}: {
  href: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <a
      role="menuitem"
      href={href}
      onClick={onClose}
      className="block px-4 py-2.5 font-medium text-app-muted transition hover:bg-primary-50 hover:text-primary-700"
    >
      {children}
    </a>
  );
}
