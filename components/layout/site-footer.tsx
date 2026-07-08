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
  return (
    <footer id="contact" className="scroll-mt-24 border-t border-app-border bg-app-surface">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
        <div>
          <p className="text-lg font-bold text-app-text">Kisinet</p>
          <p className="mt-3 max-w-md text-sm leading-6 text-app-muted">
            Plateforme SaaS pour organiser les pharmacies, les stocks, les
            ventes, les factures, les rapports et les équipes.
          </p>
        </div>
        <FooterLinks
          title="Navigation"
          links={[
            { label: "Fonctionnalités", href: "/#fonctionnalites" },
            { label: "Tarifs", href: "/#tarifs" },
            { label: "FAQ", href: "/#faq" },
            { label: "Contact", href: "/#contact" },
          ]}
        />
        <FooterLinks
          title="Légal"
          links={[
            { label: "Confidentialité", href: "#" },
            { label: "Conditions d'utilisation", href: "#" },
          ]}
        />
      </div>
      <div className="border-t border-app-border px-4 py-5 text-center text-sm text-app-muted">
        © 2026 Kisinet. Tous droits réservés.
      </div>
    </footer>
  );
}
