"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { logout, setActivePharmacyId } from "@/lib/auth";

type AppLayoutProps = {
  children: React.ReactNode;
  pharmacyId: string;
};

const appNavItems = [
  { label: "Dashboard", path: "/dashboard" },
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
    <div className="min-h-screen overflow-x-hidden bg-app-background pt-16 text-app-text lg:pt-[72px]">
      <AppNavbar pharmacyId={pharmacyId} />
      <div className="relative z-0">{children}</div>
    </div>
  );
}

function AppNavbar({ pharmacyId }: { pharmacyId: string }) {
  const basePath = "/app/pharmacies/" + pharmacyId;

  return (
    <header className="fixed left-0 right-0 top-0 z-[1000] h-16 w-full border-b border-app-border bg-app-surface shadow-sm lg:h-[72px]">
      <nav className="mx-auto flex h-full max-w-7xl items-center justify-between gap-3 px-3 pr-24 sm:px-6 sm:pr-28 lg:px-8">
        <a href={basePath + "/dashboard"} className="flex min-w-0 shrink items-center gap-2 sm:gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary-600 text-base font-bold text-white sm:h-10 sm:w-10 sm:text-lg">
            K
          </span>
          <span className="truncate text-base font-bold text-app-text sm:text-lg">Kisinet</span>
        </a>

        <DesktopNav basePath={basePath} />
        <MobileNav basePath={basePath} />
      </nav>
    </header>
  );
}

function DesktopNav({ basePath }: { basePath: string }) {
  const pathname = usePathname();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function closeMenuOnOutsideClick(event: MouseEvent) {
      if (!menuRef.current || menuRef.current.contains(event.target as Node)) {
        return;
      }

      setIsUserMenuOpen(false);
    }

    document.addEventListener("mousedown", closeMenuOnOutsideClick);
    return () => {
      document.removeEventListener("mousedown", closeMenuOnOutsideClick);
    };
  }, []);

  return (
    <div className="hidden min-w-0 flex-1 items-center justify-end gap-2 lg:flex">
      <div className="flex min-w-0 items-center gap-1 text-sm font-semibold text-app-muted">
        {appNavItems.map((item) => (
          <NavLink
            key={item.path}
            href={basePath + item.path}
            isActive={isActivePath(pathname, basePath + item.path, item.path)}
          >
            {item.label}
          </NavLink>
        ))}
      </div>

      <div ref={menuRef} className="relative shrink-0">
        <button
          type="button"
          aria-expanded={isUserMenuOpen}
          aria-haspopup="menu"
          onClick={() => setIsUserMenuOpen((current) => !current)}
          className="inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-md border border-app-border bg-app-card px-4 py-2.5 text-sm font-semibold text-app-text transition hover:bg-primary-50 focus:outline-none focus:ring-4 focus:ring-primary-100"
        >
          Compte
          <span aria-hidden="true" className="text-xs text-app-muted">
            ▼
          </span>
        </button>

        {isUserMenuOpen && (
          <MenuPanel
            basePath={basePath}
            includeAppLinks={false}
            mode="desktop"
            onClose={() => setIsUserMenuOpen(false)}
          />
        )}
      </div>
    </div>
  );
}

function MobileNav({ basePath }: { basePath: string }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
    <div ref={menuRef} className="fixed right-3 top-3 z-[1010] shrink-0 sm:right-6 sm:top-2.5 lg:hidden">
      <button
        type="button"
        aria-expanded={isMenuOpen}
        aria-haspopup="menu"
        onClick={() => setIsMenuOpen((current) => !current)}
        className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-md border border-app-border bg-app-card px-3 text-sm font-semibold text-app-text shadow-sm transition hover:bg-primary-50 focus:outline-none focus:ring-4 focus:ring-primary-100 sm:h-11 sm:px-4"
      >
        Menu
        <span aria-hidden="true" className="text-xs text-app-muted">
          ▼
        </span>
      </button>

      {isMenuOpen && (
        <MenuPanel
          basePath={basePath}
          includeAppLinks
          mode="mobile"
          onClose={() => setIsMenuOpen(false)}
        />
      )}
    </div>
  );
}

function MenuPanel({
  basePath,
  includeAppLinks,
  mode,
  onClose,
}: {
  basePath: string;
  includeAppLinks: boolean;
  mode: "desktop" | "mobile";
  onClose: () => void;
}) {
  const panelClass =
    mode === "mobile"
      ? "fixed right-3 top-16 z-[1010] max-h-[calc(100vh-76px)] w-[min(calc(100vw-24px),300px)]"
      : "absolute right-0 z-[1010] mt-3 max-h-[calc(100vh-90px)] w-[min(calc(100vw-24px),300px)]";

  return (
    <div
      role="menu"
      className={`${panelClass} overflow-y-auto rounded-lg border border-app-border bg-app-card py-2 text-sm shadow-soft`}
    >
      {includeAppLinks && (
        <>
          {appNavItems.map((item) => (
            <MenuLink key={item.path} href={basePath + item.path} onClose={onClose}>
              {item.label}
            </MenuLink>
          ))}
          <div className="my-2 border-t border-app-border" />
        </>
      )}
      <MenuLink href="/app/profile" onClose={onClose}>
        Mon profil
      </MenuLink>
      <MenuLink href="/app/select-pharmacy" onClose={onClose}>
        Mes pharmacies
      </MenuLink>
      <MenuLink href="/app/subscription" onClose={onClose}>
        Mon abonnement
      </MenuLink>
      <MenuLink href="/help" onClose={onClose}>
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
  );
}

function NavLink({
  href,
  isActive,
  children,
}: {
  href: string;
  isActive: boolean;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className={`shrink-0 rounded-md px-3 py-2 transition hover:bg-primary-50 hover:text-primary-700 ${
        isActive ? "bg-primary-50 text-primary-700" : ""
      }`}
    >
      {children}
    </a>
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

function isActivePath(pathname: string, href: string, path: string) {
  return path === "/dashboard" ? pathname === href : pathname.startsWith(href);
}
