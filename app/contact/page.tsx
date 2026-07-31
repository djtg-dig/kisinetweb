import { PublicLayout } from "@/components/layout/public-layout";

export default function ContactPage() {
  return (
    <PublicLayout>
      {/* Section Contact — affiche les coordonnées pour joindre Kisinet */}
      <main>
        <section
          id="contact"
          className="scroll-mt-24 border-y border-app-border bg-app-surface px-4 py-16 sm:px-6 lg:px-8"
        >
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-wide text-primary-700">
                Contact
              </p>
              <h2 className="mt-3 text-3xl font-bold leading-tight text-app-text">
                Une question&nbsp;? Contactez-nous
              </h2>
              <p className="mt-3 text-sm leading-6 text-app-muted sm:text-base">
                Notre équipe est disponible pour vous accompagner.
              </p>
            </div>
            <div className="mt-8 grid gap-4">
              {/* Carte E-mail — coordonnée principale de contact */}
              <article className="rounded-lg border border-app-border bg-app-card p-5 shadow-sm">
                <h3 className="text-lg font-bold text-app-text">E-mail</h3>
                <p className="mt-2 text-sm leading-6 text-app-muted">
                  <a
                    href="mailto:contact@kisinet.com"
                    className="text-primary-700 hover:underline"
                  >
                    contact@kisinet.com
                  </a>
                </p>
              </article>
              {/* Carte Téléphone — coordonnée secondaire de contact */}
              <article className="rounded-lg border border-app-border bg-app-card p-5 shadow-sm">
                <h3 className="text-lg font-bold text-app-text">Téléphone</h3>
                <p className="mt-2 text-sm leading-6 text-app-muted">
                  +243 000 000 000
                </p>
              </article>
              {/* Carte Adresse — localisation de l'entreprise */}
              <article className="rounded-lg border border-app-border bg-app-card p-5 shadow-sm">
                <h3 className="text-lg font-bold text-app-text">Adresse</h3>
                <p className="mt-2 text-sm leading-6 text-app-muted">
                  Kinshasa, République Démocratique du Congo
                </p>
              </article>
            </div>
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}