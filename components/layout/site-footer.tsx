import Image from "next/image";

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

export function SiteFooter() {
  const legalLinks = [
    { label: "Conditions d'utilisation", href: "/terms" },
    { label: "Politique de cookies", href: "/cookies" },
  ];

  return (
    <footer id="contact" className="scroll-mt-24 border-t border-app-border bg-app-surface">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-md bg-white">
              <Image
                src="/kisinet-logo.png"
                alt=""
                width={40}
                height={40}
                className="h-full w-full object-contain"
              />
            </span>
            <p className="text-lg font-bold text-app-text">Kisinet</p>
          </div>
          <p className="mt-3 max-w-md text-sm leading-6 text-app-muted">
            Plateforme Numerique pour organiser les pharmacies, les stocks, les
            ventes, les factures, les rapports et les équipes.
          </p>
        </div>
        <FooterLinks
          title="Navigation"
          links={[
            { label: "Fonctionnalités", href: "/#fonctionnalites" },
            { label: "Tarifs", href: "/tarifs" },
            { label: "FAQ", href: "/#faq" },
            { label: "Contact", href: "/#contact" },
          ]}
        />
        <FooterLinks
          title="Légal"
          links={legalLinks}
        />
      </div>
      <div className="border-t border-app-border px-4 py-5 text-center text-sm text-app-muted">
        © 2026 Kisinet. Tous droits réservés.
      </div>
    </footer>
  );
}
