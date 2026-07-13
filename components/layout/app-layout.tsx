"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { SiteFooter } from "@/components/layout/site-footer";
import { getPharmacyPermissions, type PharmacyPermissions } from "@/lib/api";
import { clearActivePharmacyId, logout, setActivePharmacyId } from "@/lib/auth";

type AppLayoutProps = {
  children: React.ReactNode;
  pharmacyId: string;
};

const appNavItems = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "Produits", path: "/products", permission: "product_view" },
  { label: "Stock", path: "/stock", permission: "stock_view" },
  { label: "Ventes", path: "/sales", permission: "sale_view" },
  { label: "Facture", path: "/invoices", permission: "sale_view" },
  { label: "Rapports", path: "/reports" },
  { label: "Notification", path: "/notifications", icon: "bell", permission: "join_request_view" },
  { label: "Paramètres", path: "/settings" },
] satisfies {
  label: string;
  path: string;
  icon?: string;
  permission?: keyof PharmacyPermissions;
}[];

const disabledNavTitle =
  "Vous n'avez pas la permission d'accéder à cette section dans cette pharmacie.";

export function AppLayout({ children, pharmacyId }: AppLayoutProps) {
  useEffect(() => {
    setActivePharmacyId(pharmacyId);
  }, [pharmacyId]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-app-background pt-16 text-app-text lg:pt-[72px]">
      <AppNavbar pharmacyId={pharmacyId} />
      <div className="relative z-0 flex min-h-[calc(100vh-4rem)] flex-col lg:min-h-[calc(100vh-4.5rem)]">
        <div className="flex-1">{children}</div>
        <SiteFooter />
      </div>
    </div>
  );
}

function AppNavbar({ pharmacyId }: { pharmacyId: string }) {
  const basePath = "/app/pharmacies/" + pharmacyId;
  const [permissions, setPermissions] = useState<PharmacyPermissions>({});

  useEffect(() => {
    let isMounted = true;

    async function loadPermissions() {
      try {
        const currentPermissions = await getPharmacyPermissions(pharmacyId);
        if (isMounted) {
          setPermissions(currentPermissions);
        }
      } catch {
        if (isMounted) {
          setPermissions({});
        }
      }
    }

    loadPermissions();

    return () => {
      isMounted = false;
    };
  }, [pharmacyId]);

  return (
    <header className="fixed left-0 right-0 top-0 z-[1000] h-16 w-full border-b border-app-border bg-app-surface shadow-sm lg:h-[72px]">
      <nav className="mx-auto flex h-full max-w-7xl items-center justify-between gap-3 px-3 pr-24 sm:px-6 sm:pr-28 lg:px-8">
        <a href="/" className="flex min-w-0 shrink items-center gap-2 sm:gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary-600 text-base font-bold text-white sm:h-10 sm:w-10 sm:text-lg">
            K
          </span>
          <span className="truncate text-base font-bold text-app-text sm:text-lg">Kisinet</span>
        </a>

        <DesktopNav basePath={basePath} permissions={permissions} />
        <MobileNav basePath={basePath} permissions={permissions} />
      </nav>
    </header>
  );
}

function DesktopNav({
  basePath,
  permissions,
}: {
  basePath: string;
  permissions: PharmacyPermissions;
}) {
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
            icon={item.icon}
            enabled={isNavItemEnabled(item, permissions)}
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
            permissions={permissions}
            onClose={() => setIsUserMenuOpen(false)}
          />
        )}
      </div>
    </div>
  );
}

function MobileNav({
  basePath,
  permissions,
}: {
  basePath: string;
  permissions: PharmacyPermissions;
}) {
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
          permissions={permissions}
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
  permissions,
  onClose,
}: {
  basePath: string;
  includeAppLinks: boolean;
  mode: "desktop" | "mobile";
  permissions: PharmacyPermissions;
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
            <MenuLink
              key={item.path}
              href={basePath + item.path}
              enabled={isNavItemEnabled(item, permissions)}
              onClose={onClose}
            >
              <span className="inline-flex items-center gap-2">
                {item.icon === "bell" && <BellIcon className="h-4 w-4" />}
                {item.label}
              </span>
            </MenuLink>
          ))}
          <div className="my-2 border-t border-app-border" />
        </>
      )}
      <MenuLink href="/app/profile" onClose={onClose}>
        Mon profil
      </MenuLink>
      <MenuLink href={basePath + "/history"} onClose={onClose}>
        Mon historique
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
        onClick={() => {
          clearActivePharmacyId();
          onClose();
          window.location.href = "/app/select-pharmacy";
        }}
        className="block w-full px-4 py-2.5 text-left font-semibold text-app-text transition hover:bg-primary-50"
      >
        Fermer la pharmacie
      </button>
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
  icon,
  enabled = true,
  children,
}: {
  href: string;
  isActive: boolean;
  icon?: string;
  enabled?: boolean;
  children: React.ReactNode;
}) {
  if (!enabled) {
    return (
      <span
        aria-disabled="true"
        className="inline-flex shrink-0 cursor-not-allowed items-center gap-2 rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-slate-400"
        role="link"
        title={disabledNavTitle}
      >
        {icon === "bell" && <BellIcon className="h-4 w-4" />}
        {children}
      </span>
    );
  }

  return (
    <a
      href={href}
      className={`inline-flex shrink-0 items-center gap-2 rounded-md px-3 py-2 transition hover:bg-primary-50 hover:text-primary-700 ${
        isActive ? "bg-primary-50 text-primary-700" : ""
      }`}
    >
      {icon === "bell" && <BellIcon className="h-4 w-4" />}
      {children}
    </a>
  );
}

function MenuLink({
  href,
  children,
  enabled = true,
  onClose,
}: {
  href: string;
  children: React.ReactNode;
  enabled?: boolean;
  onClose: () => void;
}) {
  if (!enabled) {
    return (
      <span
        aria-disabled="true"
        className="block cursor-not-allowed border-l-2 border-slate-300 bg-slate-50 px-4 py-2.5 font-medium text-slate-400"
        role="menuitem"
        title={disabledNavTitle}
      >
        {children}
      </span>
    );
  }

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

function isNavItemEnabled(
  item: (typeof appNavItems)[number],
  permissions: PharmacyPermissions,
) {
  return item.permission ? Boolean(permissions[item.permission]) : true;
}

function isActivePath(pathname: string, href: string, path: string) {
  return path === "/dashboard" ? pathname === href : pathname.startsWith(href);
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}
