"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { SiteFooter } from "@/components/layout/site-footer";
import { getPharmacyDetail, getPharmacyPermissions, type PharmacyPermissions } from "@/lib/api";
import {
  getReportFeaturesFromPharmacy,
  type ReportFeatureKey,
  type ReportFeatures,
} from "@/lib/api/reports";
import {
  NOTIFICATION_BADGE_REFRESH_EVENT,
  getUnreadNotificationCount,
} from "@/lib/api/notifications";
import {
  clearActivePharmacyId,
  getAccessToken,
  logout,
  setActivePharmacyId,
  subscribeToAuthChanges,
} from "@/lib/auth";

type AppLayoutProps = {
  children: React.ReactNode;
  pharmacyId: string;
  permissions?: PharmacyPermissions;
};

const appNavItems = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "Produits", path: "/products", permission: "product_view" },
  { label: "Stock", path: "/stock", permission: "stock_view" },
  { label: "Ventes", path: "/sales/create", permission: "sale_view" },
  { label: "Facture", path: "/invoices", permission: "sale_view" },
  { label: "Rapports", path: "/reports", permission: "report_view", feature: "reports" },
  { label: "Notifications", path: "/notifications", icon: "bell", permission: "join_request_view" },
  { label: "Paramètres", path: "/settings" },
] satisfies {
  label: string;
  path: string;
  icon?: string;
  permission?: keyof PharmacyPermissions;
  feature?: ReportFeatureKey;
}[];

const disabledNavTitle = "Vous n'avez pas la permission d'accéder à cette section dans cette pharmacie.";
const hiddenReportFeatures: ReportFeatures = {
  reports: false,
};

export function AppLayout({ children, pharmacyId, permissions: initialPermissions }: AppLayoutProps) {
  const [permissions, setPermissions] = useState<PharmacyPermissions>(initialPermissions ?? {});
  const [reportFeatures, setReportFeatures] = useState<ReportFeatures>(hiddenReportFeatures);
  const [isMounted, setIsMounted] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    function redirectIfSessionClosed() {
      if (!getAccessToken()) {
        router.replace("/");
      }
    }

    redirectIfSessionClosed();
    return subscribeToAuthChanges(redirectIfSessionClosed);
  }, [router]);

  useEffect(() => {
    if (!pharmacyId) return;
    setActivePharmacyId(pharmacyId);
  }, [pharmacyId]);

  useEffect(() => {
    let isMounted = true;

    async function loadPermissions() {
      if (!pharmacyId) return;

      try {
        const [currentPermissions, pharmacy] = await Promise.all([
          getPharmacyPermissions(pharmacyId),
          getPharmacyDetail(pharmacyId),
        ]);
        if (isMounted) {
          setPermissions(currentPermissions);
          setReportFeatures(getReportFeaturesFromPharmacy(pharmacy));
        }
      } catch {
        if (isMounted) {
          setPermissions({});
          setReportFeatures(hiddenReportFeatures);
        }
      }
    }

    loadPermissions();

    return () => {
      isMounted = false;
    };
  }, [pharmacyId]);

  useEffect(() => {
    let isMounted = true;

    async function loadUnreadCount() {
      try {
        const count = await getUnreadNotificationCount({ pharmacy: pharmacyId });
        if (isMounted) {
          setUnreadNotificationCount(count);
        }
      } catch {
        // Silently fail - badge will show 0
      }
    }

    loadUnreadCount();
    // Les pages notifications declenchent cet evenement apres lecture afin que
    // le badge de la navbar reste aligne avec le backend sans state global.
    window.addEventListener(NOTIFICATION_BADGE_REFRESH_EVENT, loadUnreadCount);
    const interval = setInterval(loadUnreadCount, 60000);

    return () => {
      isMounted = false;
      window.removeEventListener(NOTIFICATION_BADGE_REFRESH_EVENT, loadUnreadCount);
      clearInterval(interval);
    };
  }, [pharmacyId]);

  if (!isMounted) {
    return (
      <div className="min-h-screen overflow-x-hidden bg-app-background pt-16 text-app-text lg:pt-[72px]">
        <div className="flex h-16 w-full items-center justify-center border-b border-app-border bg-app-surface lg:h-[72px]">
          <div className="h-16 w-full border-b border-app-border bg-app-surface lg:h-[72px]" />
        </div>
        <div className="flex min-h-[calc(100vh-4rem)] flex-col lg:min-h-[calc(100vh-4.5rem)]">
          <div className="flex-1">{children}</div>
          <SiteFooter />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-app-background pt-16 text-app-text lg:pt-[72px]">
      <AppNavbar
        pharmacyId={pharmacyId}
        permissions={permissions}
        reportFeatures={reportFeatures}
        unreadNotificationCount={unreadNotificationCount}
      />
      <div className="relative z-0 flex min-h-[calc(100vh-4rem)] flex-col lg:min-h-[calc(100vh-4.5rem)]">
        <div className="flex-1">{children}</div>
        <SiteFooter />
      </div>
    </div>
  );
}

function AppNavbar({
  pharmacyId,
  permissions,
  reportFeatures,
  unreadNotificationCount,
}: {
  pharmacyId: string;
  permissions: PharmacyPermissions;
  reportFeatures: ReportFeatures;
  unreadNotificationCount: number;
}) {
  const basePath = "/app/pharmacies/" + pharmacyId;
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

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
    <header className="fixed left-0 right-0 top-0 z-[1000] h-16 w-full border-b border-app-border bg-app-surface shadow-sm lg:h-[72px]">
      <nav className="mx-auto flex h-full max-w-7xl items-center justify-between gap-3 px-3 pr-24 sm:px-6 sm:pr-28 lg:px-8">
        <a href="/" className="flex min-w-0 shrink items-center gap-2 sm:gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-white sm:h-10 sm:w-10">
            <Image
              src="/kisinet-logo.png"
              alt=""
              width={40}
              height={40}
              className="h-full w-full object-contain"
              priority
            />
          </span>
          <span className="truncate text-base font-bold text-app-text sm:text-lg">Kisi<span className="text-accent-700">net</span></span>
        </a>

        <DesktopNav
          basePath={basePath}
          permissions={permissions}
          reportFeatures={reportFeatures}
          pathname={pathname}
          unreadNotificationCount={unreadNotificationCount}
        />
        <MobileNav
          basePath={basePath}
          permissions={permissions}
          reportFeatures={reportFeatures}
          pathname={pathname}
          unreadNotificationCount={unreadNotificationCount}
        />
      </nav>
    </header>
  );
}

function DesktopNav({
  basePath,
  permissions,
  reportFeatures,
  pathname,
  unreadNotificationCount,
}: {
  basePath: string;
  permissions: PharmacyPermissions;
  reportFeatures: ReportFeatures;
  pathname: string;
  unreadNotificationCount: number;
}) {
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
              enabled={isNavItemEnabled(item, permissions, reportFeatures)}
              badgeCount={item.icon === "bell" ? unreadNotificationCount : undefined}
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
            reportFeatures={reportFeatures}
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
  reportFeatures,
  pathname,
  unreadNotificationCount,
}: {
  basePath: string;
  permissions: PharmacyPermissions;
  reportFeatures: ReportFeatures;
  pathname: string;
  unreadNotificationCount: number;
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
          reportFeatures={reportFeatures}
          onClose={() => setIsMenuOpen(false)}
          unreadNotificationCount={unreadNotificationCount}
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
  reportFeatures,
  onClose,
  unreadNotificationCount,
}: {
  basePath: string;
  includeAppLinks: boolean;
  mode: "desktop" | "mobile";
  permissions: PharmacyPermissions;
  reportFeatures: ReportFeatures;
  onClose: () => void;
  unreadNotificationCount?: number;
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
                enabled={isNavItemEnabled(item, permissions, reportFeatures)}
                onClose={onClose}
              >
                <span className="inline-flex items-center gap-2">
                  {item.icon === "bell" && <BellIcon className="h-4 w-4" />}
                  {item.label}
                  {item.icon === "bell" && unreadNotificationCount && unreadNotificationCount > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-600 px-1.5 text-xs font-semibold text-white">
                      {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
                    </span>
                  )}
                </span>
              </MenuLink>
            ))}
          <div className="my-2 border-t border-app-border" />
        </>
      )}
      <MenuLink href="/" onClose={onClose}>
        Accueil
      </MenuLink>
      <MenuLink href={basePath + "/history"} onClose={onClose}>
        Mon espace
      </MenuLink>
      <MenuLink href="/app/select-pharmacy" onClose={onClose}>
        Mes pharmacies
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
  badgeCount,
  children,
}: {
  href: string;
  isActive: boolean;
  icon?: string;
  enabled?: boolean;
  badgeCount?: number;
  children: React.ReactNode;
}) {
  const isNotificationLink = icon === "bell";
  const notificationCount = badgeCount && badgeCount > 99 ? "99+" : badgeCount;
  const accessibleLabel =
    isNotificationLink && badgeCount && badgeCount > 0
      ? "Notifications (" + notificationCount + " non lues)"
      : children;

  if (!enabled) {
    return (
      <span
        aria-disabled="true"
        aria-label={typeof accessibleLabel === "string" ? accessibleLabel : undefined}
        className="inline-flex shrink-0 cursor-not-allowed items-center gap-2 rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-slate-400"
        role="link"
        title={disabledNavTitle}
      >
        {isNotificationLink && <BellIcon className="h-4 w-4" />}
        <span className={isNotificationLink ? "sr-only" : ""}>{children}</span>
        {isNotificationLink && badgeCount !== undefined && badgeCount > 0 && (
          <span aria-hidden="true" className="text-xs font-semibold">
            ({notificationCount})
          </span>
        )}
      </span>
    );
  }

  return (
    <a
      href={href}
      aria-label={typeof accessibleLabel === "string" ? accessibleLabel : undefined}
      className={`inline-flex shrink-0 items-center gap-2 rounded-md px-3 py-2 transition hover:bg-primary-50 hover:text-primary-700 ${
        isActive ? "bg-primary-50 text-primary-700" : ""
      }`}
    >
      {isNotificationLink && <BellIcon className="h-4 w-4" />}
      <span className={isNotificationLink ? "sr-only" : ""}>{children}</span>
      {isNotificationLink && badgeCount !== undefined && badgeCount > 0 && (
        <span aria-hidden="true" className="text-xs font-semibold">
          ({notificationCount})
        </span>
      )}
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
  reportFeatures: ReportFeatures,
) {
  const hasPermission = item.permission ? Boolean(permissions[item.permission]) : true;
  const hasFeature = item.feature ? Boolean(reportFeatures[item.feature]) : true;
  return hasPermission && hasFeature;
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
