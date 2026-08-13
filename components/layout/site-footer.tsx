import Image from "next/image";

type FooterLinksProps = {
  title: string;
  links: { label: string; href: string }[];
};

function FooterLinks({ title, links }: FooterLinksProps) {
  return (
    <div>
      <p className="font-semibold text-white">{title}</p>
      <div className="mt-3 grid gap-2 text-sm text-white/60">
        {links.map((link) => (
          <a key={link.label} href={link.href} className="transition hover:text-accent-400">
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
    <footer className="scroll-mt-24 border-t border-white/10 bg-primary-800 text-white/70">
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
            <p className="text-lg font-bold text-white">Kisi<span className="text-accent-400">net</span></p>
          </div>
          <p className="mt-3 max-w-md text-sm leading-6 text-white/60">
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
      <div className="border-t border-white/15 px-4 py-5 text-center text-sm text-white/50">
        © 2026 Kisinet. Tous droits réservés.
      </div>
    </footer>
  );
}
