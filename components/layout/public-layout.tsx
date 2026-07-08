"use client";

import { useEffect, useRef, useState } from "react";
import { LinkButton } from "@/components/ui/link-button";
import { SiteFooter } from "@/components/layout/site-footer";
import { getUserPharmacies, type PharmacySummary } from "@/lib/api";
import { carriAccountLoginUrl } from "@/lib/carri-account";
import { getAccessToken, getActivePharmacyId, logout, saveTokensFromUrlHash } from "@/lib/auth";

type PublicLayoutProps = {
  children: React.ReactNode;
  activePharmacy?: PharmacySummary | null;
};

const navLinks = [
  { label: "Fonctionnalités", href: "/#fonctionnalites" },
  { label: "Tarifs", href: "/#tarifs" },
  { label: "FAQ", href: "/#faq" },
  { label: "Contact", href: "/#contact" },
];

type UserMenuState = {
  isLoggedIn: boolean | null;
  contextPharmacy: PharmacySummary | null;
};

export function PublicLayout({ children, activePharmacy = null }: PublicLayoutProps) {
  return (
    <div className="min-h-screen bg-app-background pt-[77px] text-app-text">
      <PublicNavbar activePharmacy={activePharmacy} />

      {children}

      <SiteFooter />
    </div>
  );
}

function PublicNavbar({ activePharmacy = null }: { activePharmacy?: PharmacySummary | null }) {
  const [userMenu, setUserMenu] = useState<UserMenuState>({
    isLoggedIn: null,
    contextPharmacy: activePharmacy,
  });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadUserMenu() {
      saveTokensFromUrlHash();

      const accessToken = getAccessToken();

      if (!accessToken) {
        setUserMenu({ isLoggedIn: false, contextPharmacy: null });
        return;
      }

      if (activePharmacy) {
        setUserMenu({ isLoggedIn: true, contextPharmacy: activePharmacy });
        return;
      }

      setUserMenu({ isLoggedIn: true, contextPharmacy: null });

      try {
        const pharmacies = await getUserPharmacies();
        const lastPharmacyId = getActivePharmacyId();
        const lastPharmacy = pharmacies.find(
          (pharmacy) => pharmacy.id === lastPharmacyId,
        );

        setUserMenu({
          isLoggedIn: true,
          contextPharmacy: lastPharmacy || null,
        });
      } catch {
        setUserMenu({ isLoggedIn: true, contextPharmacy: null });
      }
    }

    loadUserMenu();
  }, [activePharmacy]);

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
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <a href="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary-600 text-lg font-bold text-white">
            K
          </span>
          <span className="text-lg font-bold text-app-text">Kisinet</span>
        </a>

        <div className="hidden items-center gap-6 text-sm font-medium text-app-muted md:flex">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="hover:text-primary-700">
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {userMenu.isLoggedIn === null ? (
            <span aria-hidden="true" className="min-h-11 w-32" />
          ) : userMenu.isLoggedIn ? (
            <UserMenu
              contextPharmacy={userMenu.contextPharmacy}
              isOpen={isMenuOpen}
              menuRef={menuRef}
              onToggle={() => setIsMenuOpen((current) => !current)}
              onClose={() => setIsMenuOpen(false)}
            />
          ) : (
            <LinkButton href={carriAccountLoginUrl}>Se connecter</LinkButton>
          )}
        </div>
      </nav>
    </header>
  );
}

type UserMenuProps = {
  contextPharmacy: PharmacySummary | null;
  isOpen: boolean;
  menuRef: React.RefObject<HTMLDivElement | null>;
  onToggle: () => void;
  onClose: () => void;
};

function UserMenu({
  contextPharmacy,
  isOpen,
  menuRef,
  onToggle,
  onClose,
}: UserMenuProps) {
  const dashboardHref = contextPharmacy
    ? "/app/pharmacies/" + contextPharmacy.id + "/dashboard"
    : "";

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onClick={onToggle}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-app-border bg-app-card px-4 py-2.5 text-sm font-semibold text-app-text transition hover:bg-primary-50 focus:outline-none focus:ring-4 focus:ring-primary-100"
      >
        Mon compte
        <span aria-hidden="true" className="text-xs text-app-muted">
          ▼
        </span>
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 mt-3 w-[min(88vw,280px)] overflow-hidden rounded-lg border border-app-border bg-app-card py-2 text-sm shadow-soft"
        >
          {contextPharmacy ? (
            <p className="border-b border-app-border px-4 py-3 font-semibold text-app-text">
              {contextPharmacy.name}
            </p>
          ) : (
            <MenuLink href="/app/select-pharmacy" onClose={onClose}>
              Mes pharmacies
            </MenuLink>
          )}

          {contextPharmacy && (
            <>
              <MenuLink href={dashboardHref} onClose={onClose}>
                Tableau de bord
              </MenuLink>
              <MenuLink href="/app/select-pharmacy" onClose={onClose}>
                Mes pharmacies
              </MenuLink>
            </>
          )}

          <MenuLink href="/app/pharmacies/create" onClose={onClose}>
            Créer une pharmacie
          </MenuLink>
          <MenuLink href="/app/pharmacies/join" onClose={onClose}>
            Rejoindre une pharmacie
          </MenuLink>
          <MenuLink href="/app/profile" onClose={onClose}>
            Mon profil
          </MenuLink>
          <MenuLink href="/app/subscription" onClose={onClose}>
            Mon abonnement
          </MenuLink>
          <MenuLink href="/app/settings" onClose={onClose}>
            Paramètres
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
      )}
    </div>
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

type FooterLinksProps = {
  title: string;
  links: { label: string; href: string }[];
};

function FooterLinks({ title, links }: FooterLinksProps) {
  return (
    <div>
      <p className="font-semibold text-app-text">{title}</p>
      <div className="mt-3 grid gap-2 text-sm text-app-muted">
        {links.map((link) => (
          <a key={link.label} href={link.href} className="hover:text-primary-700">
            {link.label}
          </a>
        ))}
      </div>
    </div>
  );
}
