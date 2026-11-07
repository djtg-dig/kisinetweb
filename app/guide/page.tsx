import type { Metadata } from "next";
import { PublicLayout } from "@/components/layout/public-layout";
import { defaultOpenGraph, defaultTwitter } from "@/lib/server/metadata-og";

const title = "Guide : créer un compte Carri Business";
const description =
  "Découvrez comment créer un compte Carri Business pour vous connecter à Kisinet et commencer à gérer votre pharmacie.";
const url = "https://kisinet.com/guide";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: url,
  },
  openGraph: {
    ...defaultOpenGraph,
    title,
    description,
    url,
  },
  twitter: {
    ...defaultTwitter,
    title,
    description,
  },
};

const steps = [
  {
    title: "Accéder à Carri Business",
    content: (
      <>
        <p>Ouvrez votre navigateur Internet (Google Chrome, Firefox, Safari ou autre).</p>
        <p className="mt-3">Rendez-vous ensuite sur :</p>
        <a
          href="https://compte.carribusiness.com"
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex font-semibold text-primary-700 underline decoration-primary-300 underline-offset-4 transition hover:text-primary-600"
        >
          https://compte.carribusiness.com
        </a>
        <p className="mt-3">Vous accéderez à la plateforme de gestion des comptes Carri Business.</p>
      </>
    ),
  },
  {
    title: "Commencer l'inscription",
    content: (
      <>
        <p>Sur la page d&apos;accueil, recherchez l&apos;option « Créer un compte » ou « S&apos;inscrire ».</p>
        <p className="mt-3">Cliquez dessus pour ouvrir le formulaire d&apos;inscription.</p>
      </>
    ),
  },
  {
    title: "Renseigner les informations demandées",
    content: (
      <>
        <p>Remplissez soigneusement les différents champs du formulaire. Vous devrez notamment renseigner :</p>
        <ul className="mt-3 list-disc space-y-1 pl-5 marker:text-primary-600">
          <li>votre nom ;</li>
          <li>votre prénom ;</li>
          <li>votre adresse e-mail ;</li>
          <li>votre mot de passe.</li>
        </ul>
        <p className="mt-3">Assurez-vous de fournir une adresse e-mail valide et accessible.</p>
        <p className="mt-3">Choisissez un mot de passe sécurisé et ne le communiquez à personne.</p>
      </>
    ),
  },
  {
    title: "Valider votre inscription",
    content: (
      <>
        <p>Après avoir renseigné les informations nécessaires, vérifiez leur exactitude.</p>
        <p className="mt-3">Prenez connaissance des conditions d&apos;utilisation et de la politique de confidentialité lorsqu&apos;elles vous sont présentées.</p>
        <p className="mt-3">Validez ensuite le formulaire pour soumettre votre demande de création de compte.</p>
        <p className="mt-3">Si une vérification de votre adresse e-mail vous est demandée, suivez les instructions affichées ou envoyées dans votre boîte de réception.</p>
      </>
    ),
  },
  {
    title: "Se connecter à Kisinet",
    content: (
      <>
        <p>Une fois votre compte créé et activé, rendez-vous sur le site officiel de Kisinet :</p>
        <a
          href="https://kisinet.com"
          className="mt-3 inline-flex font-semibold text-primary-700 underline decoration-primary-300 underline-offset-4 transition hover:text-primary-600"
        >
          https://kisinet.com
        </a>
        <p className="mt-3">Cliquez sur le bouton de connexion, puis suivez la procédure d&apos;authentification Carri Business avec les identifiants de votre compte.</p>
        <p className="mt-3">Après une connexion réussie, vous pourrez accéder aux fonctionnalités de Kisinet autorisées pour votre compte.</p>
      </>
    ),
  },
  {
    title: "Commencer à utiliser Kisinet",
    content: (
      <>
        <p>Vous pouvez désormais poursuivre la configuration de votre espace.</p>
        <p className="mt-3">Si vous êtes propriétaire d&apos;une pharmacie, l&apos;étape suivante consiste à enregistrer votre pharmacie sur Kisinet.</p>
      </>
    ),
  },
];

export default function GuidePage() {
  return (
    <PublicLayout>
      <main>
        <section className="border-b border-app-border bg-gradient-to-b from-primary-50 via-app-surface to-app-background px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <span className="inline-flex rounded-full bg-primary-100 px-3 py-1 text-sm font-semibold text-primary-700 ring-1 ring-primary-200">
              Guide de démarrage
            </span>
            <h1 className="mt-5 text-3xl font-bold leading-tight text-app-text sm:text-4xl">
              Comment créer un compte Carri Business
            </h1>
            <p className="mt-4 text-base leading-7 text-app-muted">
              Pour utiliser Kisinet, vous devez d&apos;abord disposer d&apos;un compte Carri Business. Ce compte vous permet de vous identifier et d&apos;accéder aux services Carri Business, notamment Kisinet.
            </p>

            <ol className="mt-10 space-y-5">
              {steps.map((step, index) => (
                <li key={step.title} className="rounded-xl border border-app-border bg-app-card p-5 shadow-sm sm:p-6">
                  <div className="flex gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white">
                      {index + 1}
                    </span>
                    <div className="min-w-0 text-sm leading-6 text-app-muted sm:text-base">
                      <h2 className="text-lg font-bold text-app-text">{step.title}</h2>
                      <div className="mt-3">{step.content}</div>
                    </div>
                  </div>
                </li>
              ))}
            </ol>

            <aside className="mt-8 rounded-xl border border-accent-200 bg-accent-50 p-5 sm:p-6">
              <h2 className="text-lg font-bold text-app-text">Besoin d&apos;aide ?</h2>
              <p className="mt-2 text-sm leading-6 text-app-muted sm:text-base">
                Si vous rencontrez des difficultés lors de la création de votre compte ou de votre connexion, contactez l&apos;équipe Kisinet à l&apos;adresse{' '}
                <a href="mailto:contact@kisinet.com" className="font-semibold text-primary-700 underline decoration-primary-300 underline-offset-4 hover:text-primary-600">
                  contact@kisinet.com
                </a>.
              </p>
              <p className="mt-3 text-sm font-medium leading-6 text-app-text sm:text-base">
                Pour votre sécurité, ne communiquez jamais votre mot de passe à une personne qui prétend vous assister.
              </p>
            </aside>

            <p className="mt-6 rounded-lg border border-app-border bg-app-surface p-4 text-sm leading-6 text-app-muted">
              <span className="font-semibold text-app-text">Conseil :</span> utilisez une adresse e-mail à laquelle vous avez régulièrement accès afin de recevoir les communications importantes concernant votre compte.
            </p>
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}
