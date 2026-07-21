import type { Metadata } from "next";
import { PublicLayout } from "@/components/layout/public-layout";
import { LinkButton } from "@/components/ui/link-button";

export const metadata: Metadata = {
  title: "Politique de cookies | Kisinet",
  description:
    "Consultez la politique de cookies de Kisinet et découvrez comment la plateforme utilise les cookies et technologies similaires.",
  alternates: {
    canonical: "/cookies",
  },
  openGraph: {
    title: "Politique de cookies | Kisinet",
    description:
      "Consultez la politique de cookies de Kisinet et découvrez comment la plateforme utilise les cookies et technologies similaires.",
    url: "/cookies",
    siteName: "Kisinet",
    type: "article",
    locale: "fr_FR",
  },
  robots: {
    index: true,
    follow: true,
  },
};

type CookieCategory = "Nécessaire" | "Fonctionnel" | "Analyse" | "Marketing";

type CookieEntry = {
  name: string;
  provider: string;
  purpose: string;
  category: CookieCategory;
  duration: string;
};

type StorageEntry = {
  name: string;
  purpose: string;
  duration: string;
};

type LegalBlock =
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "cookie-table" }
  | { type: "storage-list" };

type LegalSection = {
  id: string;
  title: string;
  blocks: LegalBlock[];
};

const lastUpdated = "2 juillet 2026";

const cookieEntries: CookieEntry[] = [
  {
    name: "Aucun cookie publicitaire ou d'audience",
    provider: "Kisinet",
    purpose:
      "Kisinet ne dépose actuellement pas de cookie non essentiel pour la publicité, le ciblage ou la mesure d'audience.",
    category: "Nécessaire",
    duration: "Sans objet",
  },
  {
    name: "Session de connexion",
    provider: "Kisinet",
    purpose:
      "Permettre la connexion, la déconnexion et la protection de l'accès aux espaces privés.",
    category: "Nécessaire",
    duration: "Durée à confirmer",
  },
  {
    name: "Session utilisateur",
    provider: "Kisinet",
    purpose:
      "Maintenir temporairement l'utilisateur connecté pendant l'utilisation de la plateforme.",
    category: "Nécessaire",
    duration: "Jusqu'à déconnexion ou suppression des données du navigateur",
  },
  {
    name: "Pharmacie active",
    provider: "Kisinet",
    purpose:
      "Mémorisation de la pharmacie active ou dernièrement consultée par l'utilisateur.",
    category: "Fonctionnel",
    duration: "Jusqu'à changement, déconnexion ou suppression des données du navigateur",
  },
  {
    name: "Préférences de vente",
    provider: "Kisinet",
    purpose:
      "Conserver certaines options utiles à la saisie des ventes, comme les modes de paiement et les statuts.",
    category: "Fonctionnel",
    duration: "Durée à confirmer",
  },
  {
    name: "Brouillon de vente",
    provider: "Kisinet",
    purpose:
      "Conserver temporairement une vente en cours de saisie afin d'éviter une perte de travail.",
    category: "Fonctionnel",
    duration: "Jusqu'à validation, suppression du brouillon ou suppression des données du navigateur",
  },
];

const storageEntries: StorageEntry[] = [
  {
    name: "Informations de session",
    purpose: "Maintenir l'accès à l'espace utilisateur après connexion.",
    duration: "Supprimées lors de la déconnexion ; sinon conservées par le navigateur.",
  },
  {
    name: "Pharmacie active",
    purpose: "Identifiant de la pharmacie active ou dernièrement consultée.",
    duration: "Supprimé lors de la déconnexion ou par action de nettoyage dédiée.",
  },
  {
    name: "Options de vente",
    purpose: "Options de vente conservées pour faciliter la saisie.",
    duration: "Conservées jusqu'à remplacement ou suppression des données du navigateur.",
  },
  {
    name: "Brouillon de vente",
    purpose: "Brouillon de vente propre à une pharmacie.",
    duration: "Supprimé lorsque le brouillon est effacé ou que la vente est finalisée.",
  },
];

const legalSections: LegalSection[] = [
  {
    id: "objet",
    title: "Objet",
    blocks: [
      {
        type: "paragraph",
        text: "La présente Politique de cookies explique comment Kisinet utilise les cookies et technologies similaires lors de l'accès à son site web et à sa plateforme.",
      },
      { type: "paragraph", text: "Elle précise notamment :" },
      {
        type: "list",
        items: [
          "les types de cookies et stockages navigateur susceptibles d'être utilisés ;",
          "leur finalité ;",
          "leur durée de conservation lorsqu'elle peut être déterminée ;",
          "les services utilisés dans le cadre du fonctionnement de Kisinet ;",
          "les choix dont dispose l'utilisateur.",
        ],
      },
      {
        type: "paragraph",
        text: "Cette politique complète les Conditions d'utilisation de Kisinet. La Politique de confidentialité sera reliée lorsqu'elle sera disponible.",
      },
    ],
  },
  {
    id: "definition-cookie",
    title: "Définition d'un cookie",
    blocks: [
      {
        type: "paragraph",
        text: "Un cookie est un petit fichier texte enregistré sur l'appareil de l'utilisateur lors de la consultation d'un site web ou de l'utilisation d'une application web.",
      },
      { type: "paragraph", text: "Les cookies peuvent notamment permettre :" },
      {
        type: "list",
        items: [
          "de maintenir une session ouverte ;",
          "de reconnaître un utilisateur ;",
          "de mémoriser certaines préférences ;",
          "de sécuriser l'accès à un compte ;",
          "d'analyser l'utilisation d'un service ;",
          "d'améliorer les performances et l'expérience utilisateur.",
        ],
      },
      {
        type: "paragraph",
        text: "Certains cookies sont supprimés à la fermeture du navigateur. D'autres peuvent rester enregistrés pendant une durée déterminée.",
      },
    ],
  },
  {
    id: "technologies-similaires",
    title: "Technologies similaires",
    blocks: [
      {
        type: "paragraph",
        text: "Kisinet peut également utiliser des technologies similaires aux cookies lorsqu'elles remplissent une fonction comparable.",
      },
      {
        type: "list",
        items: [
          "le stockage local du navigateur ;",
          "le stockage de session, si une fonctionnalité future l'exige ;",
          "les identifiants techniques ;",
          "les journaux de connexion côté serveur ;",
          "les identifiants de session ;",
          "les scripts nécessaires au fonctionnement de l'application.",
        ],
      },
      {
        type: "paragraph",
        text: "À la date de la présente politique, Kisinet utilise le stockage du navigateur pour assurer certaines fonctions de connexion et de confort d'utilisation.",
      },
    ],
  },
  {
    id: "cookies-necessaires",
    title: "Cookies strictement nécessaires",
    blocks: [
      {
        type: "paragraph",
        text: "Les cookies strictement nécessaires et mécanismes équivalents permettent le fonctionnement essentiel de Kisinet.",
      },
      {
        type: "list",
        items: [
          "authentifier un utilisateur ;",
          "permettre la déconnexion ;",
          "protéger les routes privées ;",
          "gérer les autorisations ;",
          "sécuriser les connexions ;",
          "permettre la navigation entre les pages ;",
          "mémoriser temporairement certaines opérations indispensables.",
        ],
      },
      {
        type: "paragraph",
        text: "Ces mécanismes sont indispensables au fonctionnement de la plateforme. Leur blocage depuis le navigateur peut empêcher l'accès à certaines fonctionnalités.",
      },
    ],
  },
  {
    id: "cookies-fonctionnels",
    title: "Cookies fonctionnels",
    blocks: [
      {
        type: "paragraph",
        text: "Les cookies fonctionnels et stockages équivalents permettent d'améliorer l'expérience utilisateur sans être nécessairement indispensables à toutes les pages publiques.",
      },
      {
        type: "list",
        items: [
          "mémoriser la pharmacie active ou dernièrement consultée ;",
          "conserver certaines options de vente utiles à la saisie ;",
          "conserver temporairement un brouillon de vente local pour éviter une perte de saisie.",
        ],
      },
      {
        type: "paragraph",
        text: "Kisinet peut aussi utiliser les préférences d'affichage disponibles dans le navigateur lorsque cela est nécessaire à l'expérience utilisateur.",
      },
    ],
  },
  {
    id: "mesure-audience",
    title: "Cookies de mesure d'audience",
    blocks: [
      {
        type: "paragraph",
        text: "À la date de la présente politique, Kisinet n'utilise pas de cookies de mesure d'audience non essentiels.",
      },
      {
        type: "paragraph",
        text: "Aucun outil de mesure d'audience non essentiel n'est actuellement utilisé sur les pages publiques de Kisinet.",
      },
      {
        type: "paragraph",
        text: "Si Kisinet intègre ultérieurement un outil de mesure non essentiel, celui-ci devra être décrit ici et chargé selon les règles de consentement applicables.",
      },
    ],
  },
  {
    id: "marketing",
    title: "Cookies publicitaires et marketing",
    blocks: [
      {
        type: "paragraph",
        text: "À la date de la présente politique, Kisinet n'utilise pas de cookies publicitaires ou de ciblage marketing.",
      },
      {
        type: "paragraph",
        text: "Aucun outil publicitaire ou de suivi marketing n'est actuellement utilisé sur les pages publiques de Kisinet.",
      },
      {
        type: "paragraph",
        text: "Si de tels cookies sont ajoutés plus tard, ils ne devront être activés qu'après consentement lorsque la réglementation applicable l'exige.",
      },
    ],
  },
  {
    id: "authentification",
    title: "Cookies liés à l'authentification",
    blocks: [
      {
        type: "paragraph",
        text: "Kisinet utilise des mécanismes de session afin de permettre la connexion, la déconnexion et l'accès aux espaces privés.",
      },
      {
        type: "list",
        items: [
          "conserver temporairement une session active ;",
          "vérifier que l'utilisateur est autorisé à accéder à une page privée ;",
          "faciliter le retour vers l'espace de travail après connexion ;",
          "la pharmacie active est mémorisée localement pour faciliter la navigation.",
        ],
      },
      {
        type: "paragraph",
        text: "Les détails techniques précis des cookies de session doivent être [À confirmer avant la mise en production].",
      },
    ],
  },
  {
    id: "services-tiers",
    title: "Cookies et services tiers",
    blocks: [
      {
        type: "paragraph",
        text: "Certaines fonctionnalités peuvent dépendre de services nécessaires au fonctionnement de Kisinet, notamment pour la connexion et la fourniture des données de gestion.",
      },
      {
        type: "list",
        items: [
          "Service de connexion : permet d'authentifier l'utilisateur et de l'orienter vers son espace Kisinet ;",
          "Service applicatif Kisinet : permet d'afficher les données de pharmacies, ventes, factures, produits et abonnements ;",
          "Services d'intelligence artificielle : aucune technologie de suivi liée à l'intelligence artificielle n'est chargée dans le navigateur de l'utilisateur ;",
          "Paiement : aucun outil de paiement tiers ne dépose actuellement de cookies depuis les pages publiques de Kisinet.",
        ],
      },
      {
        type: "paragraph",
        text: "Aucun outil de support, chat, publicité, surveillance d'erreurs ou mesure d'audience tiers n'est actuellement utilisé sur les pages publiques.",
      },
    ],
  },
  {
    id: "liste-cookies",
    title: "Liste des cookies utilisés",
    blocks: [
      {
        type: "paragraph",
        text: "Le tableau ci-dessous présente les cookies et technologies similaires utilisés ou susceptibles d'être nécessaires au fonctionnement de Kisinet, avec des libellés compréhensibles pour les utilisateurs.",
      },
      { type: "cookie-table" },
    ],
  },
  {
    id: "stockage-local-session",
    title: "Stockage local et stockage de session",
    blocks: [
      {
        type: "paragraph",
        text: "Kisinet peut utiliser le stockage du navigateur pour des besoins de connexion, de contexte utilisateur et de confort d'interface.",
      },
      { type: "storage-list" },
      {
        type: "paragraph",
        text: "Aucun stockage de session distinct n'est actuellement utilisé pour les pages publiques.",
      },
    ],
  },
  {
    id: "duree-conservation",
    title: "Durée de conservation",
    blocks: [
      {
        type: "paragraph",
        text: "La durée de conservation dépend de la finalité du cookie ou de la technologie assimilée.",
      },
      {
        type: "list",
        items: [
          "les informations de session sont supprimées lors de la déconnexion ;",
          "la pharmacie active est supprimée lors de la déconnexion ou d'un nettoyage dédié ;",
          "les options de vente restent présentes jusqu'à leur remplacement ou suppression des données du navigateur ;",
          "les brouillons de vente sont supprimés lorsque le brouillon est effacé ou la vente finalisée ;",
          "les cookies serveur éventuels du parcours d'authentification ont une durée à confirmer.",
        ],
      },
      {
        type: "paragraph",
        text: "Lorsqu'une durée exacte ne peut pas être confirmée, elle est indiquée comme Durée à confirmer.",
      },
    ],
  },
  {
    id: "consentement",
    title: "Consentement de l'utilisateur",
    blocks: [
      {
        type: "paragraph",
        text: "Les cookies strictement nécessaires peuvent être utilisés sans consentement préalable lorsqu'ils sont indispensables au fonctionnement de Kisinet.",
      },
      {
        type: "paragraph",
        text: "À la date de cette politique, aucun cookie d'analyse, marketing ou autre cookie non essentiel nécessitant une bannière de consentement n'est utilisé sur les pages publiques.",
      },
      {
        type: "paragraph",
        text: "Si Kisinet ajoute plus tard des cookies non essentiels, leur activation devra respecter un consentement libre, spécifique, éclairé, explicite, modifiable et révocable.",
      },
    ],
  },
  {
    id: "preferences",
    title: "Gestion des préférences",
    blocks: [
      {
        type: "paragraph",
        text: "Aucun gestionnaire de préférences de cookies n'est actuellement nécessaire, car aucun cookie non essentiel n'est utilisé sur les pages publiques.",
      },
      {
        type: "paragraph",
        text: "Si des catégories non essentielles sont ajoutées ultérieurement, Kisinet devra proposer un moyen clair d'accepter, refuser, personnaliser et modifier les préférences.",
      },
    ],
  },
  {
    id: "parametres-navigateur",
    title: "Paramètres du navigateur",
    blocks: [
      {
        type: "paragraph",
        text: "L'utilisateur peut contrôler les cookies et stockages navigateur depuis les paramètres de son navigateur.",
      },
      {
        type: "list",
        items: [
          "consulter les cookies et données enregistrés ;",
          "supprimer les cookies ;",
          "bloquer certains cookies ;",
          "bloquer tous les cookies ;",
          "limiter les cookies tiers ;",
          "configurer la suppression automatique des données de navigation.",
        ],
      },
      {
        type: "paragraph",
        text: "La désactivation de certains cookies ou stockages strictement nécessaires peut empêcher le bon fonctionnement de Kisinet.",
      },
    ],
  },
  {
    id: "retrait-consentement",
    title: "Retrait du consentement",
    blocks: [
      {
        type: "paragraph",
        text: "Lorsque des cookies non essentiels sont utilisés, l'utilisateur doit pouvoir retirer son consentement à tout moment.",
      },
      {
        type: "paragraph",
        text: "Aucun mécanisme d'acceptation ou de refus n'est actuellement affiché, car aucun cookie non essentiel n'a été détecté. Cette situation devra être réévaluée dès l'ajout d'un outil d'analyse, de publicité, de support ou de suivi non indispensable.",
      },
      {
        type: "paragraph",
        text: "Le retrait du consentement ne remet pas en cause la licéité des traitements effectués avant ce retrait.",
      },
    ],
  },
  {
    id: "donnees-personnelles",
    title: "Protection des données personnelles",
    blocks: [
      {
        type: "paragraph",
        text: "Certains cookies ou stockages assimilés peuvent contenir ou permettre de relier des informations à un utilisateur.",
      },
      {
        type: "paragraph",
        text: "Le traitement de ces données sera décrit plus en détail dans la Politique de confidentialité de Kisinet lorsqu'elle sera disponible.",
      },
      {
        type: "list",
        items: [
          "les données collectées ;",
          "les finalités du traitement ;",
          "les bases légales ;",
          "les destinataires ;",
          "les durées de conservation ;",
          "les droits des utilisateurs.",
        ],
      },
    ],
  },
  {
    id: "modification-politique",
    title: "Modification de la Politique de cookies",
    blocks: [
      {
        type: "paragraph",
        text: "Kisinet peut modifier la présente Politique de cookies afin de tenir compte de l'évolution du service, de l'ajout de nouvelles fonctionnalités, de l'intégration de nouveaux prestataires ou de changements légaux et réglementaires.",
      },
      {
        type: "paragraph",
        text: "La date de dernière mise à jour doit apparaître en haut de la page.",
      },
      {
        type: "paragraph",
        text: "En cas de changement important, Kisinet peut informer les utilisateurs par une bannière, une notification, un e-mail ou une nouvelle demande de consentement lorsque cela est nécessaire.",
      },
    ],
  },
  {
    id: "contact",
    title: "Contact",
    blocks: [
      {
        type: "paragraph",
        text: "Pour toute question relative à l'utilisation des cookies par Kisinet, l'utilisateur peut contacter Kisinet par les moyens officiels affichés sur le site.",
      },
      {
        type: "paragraph",
        text: "Informations à afficher lorsqu'elles seront officiellement confirmées :",
      },
      {
        type: "list",
        items: [
          "Entreprise : [Nom juridique officiel] ;",
          "Produit : Kisinet ;",
          "Adresse : [Adresse officielle] ;",
          "E-mail : [Adresse e-mail officielle du support] ;",
          "Site web : [Domaine officiel de Kisinet].",
        ],
      },
    ],
  },
];

export default function CookiesPage() {
  return (
    <PublicLayout>
      <main id="top">
        <section className="border-b border-app-border bg-gradient-to-b from-primary-50 via-app-surface to-app-background">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-14">
            <div className="max-w-3xl">
              <span className="inline-flex rounded-full bg-primary-100 px-3 py-1 text-sm font-semibold text-primary-700 ring-1 ring-primary-200">
                Légal
              </span>
              <h1 className="mt-5 text-4xl font-bold leading-tight text-app-text sm:text-5xl">
                Politique de cookies
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-8 text-app-muted sm:text-lg">
                Découvrez comment Kisinet utilise les cookies et technologies
                similaires.
              </p>
              <p className="mt-5 text-sm font-semibold text-app-text">
                Dernière mise à jour : {lastUpdated}
              </p>
            </div>
          </div>
        </section>

        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-8">
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <nav
              aria-label="Table des matières de la politique de cookies"
              className="hidden rounded-lg border border-app-border bg-app-card p-4 shadow-sm lg:block"
            >
              <p className="text-sm font-bold text-app-text">Sommaire</p>
              <TableOfContents className="mt-4 max-h-[calc(100vh-12rem)] overflow-auto pr-1" />
            </nav>

            <details className="rounded-lg border border-app-border bg-app-card p-4 shadow-sm lg:hidden">
              <summary className="cursor-pointer text-sm font-bold text-app-text focus:outline-none focus:ring-4 focus:ring-primary-100">
                Table des matières
              </summary>
              <nav
                aria-label="Table des matières mobile de la politique de cookies"
                className="mt-4"
              >
                <TableOfContents />
              </nav>
            </details>
          </aside>

          <div className="min-w-0">
            <div className="max-w-3xl rounded-lg border border-app-border bg-app-card p-5 shadow-sm sm:p-7">
              <p className="text-sm leading-7 text-app-muted">
                Cette page décrit les cookies et technologies similaires
                utilisés par Kisinet. Consultez également nos{" "}
                <a
                  href="/terms"
                  className="font-semibold text-primary-700 underline-offset-4 hover:underline focus:outline-none focus:ring-4 focus:ring-primary-100"
                >
                  Conditions d'utilisation
                </a>
                . La Politique de confidentialité sera reliée lorsqu'elle sera
                disponible.
              </p>
            </div>

            <div className="mt-8 max-w-3xl space-y-8">
              {legalSections.map((section, index) => (
                <LegalSectionView
                  key={section.id}
                  index={index + 1}
                  section={section}
                />
              ))}
            </div>

            <div className="mt-10 flex flex-col gap-3 border-t border-app-border pt-8 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-3">
                <LinkButton href="/terms" variant="secondary">
                  Conditions d'utilisation
                </LinkButton>
                <LinkButton href="#top" variant="secondary">
                  Revenir en haut
                </LinkButton>
              </div>
            </div>
          </div>
        </div>
      </main>
    </PublicLayout>
  );
}

function TableOfContents({ className = "" }: { className?: string }) {
  return (
    <ol className={`grid gap-1 text-sm ${className}`}>
      {legalSections.map((section, index) => (
        <li key={section.id}>
          <a
            href={"#" + section.id}
            className="flex gap-2 rounded-md px-2 py-2 text-app-muted transition hover:bg-primary-50 hover:text-primary-700 focus:outline-none focus:ring-4 focus:ring-primary-100"
          >
            <span className="w-6 shrink-0 font-semibold text-app-text">
              {index + 1}.
            </span>
            <span>{section.title}</span>
          </a>
        </li>
      ))}
    </ol>
  );
}

function LegalSectionView({
  index,
  section,
}: {
  index: number;
  section: LegalSection;
}) {
  return (
    <section
      id={section.id}
      className="scroll-mt-28 rounded-lg border border-app-border bg-app-card p-5 shadow-sm sm:p-7"
    >
      <p className="text-sm font-semibold text-primary-700">Section {index}</p>
      <h2 className="mt-2 text-2xl font-bold leading-tight text-app-text">
        {section.title}
      </h2>

      {section.blocks.map((block, blockIndex) => {
        if (block.type === "paragraph") {
          return (
            <p
              key={`${section.id}-${blockIndex}`}
              className="mt-4 text-sm leading-7 text-app-muted sm:text-base"
            >
              {block.text}
            </p>
          );
        }

        if (block.type === "cookie-table") {
          return <CookieTable key={`${section.id}-${blockIndex}`} />;
        }

        if (block.type === "storage-list") {
          return <StorageList key={`${section.id}-${blockIndex}`} />;
        }

        return (
          <ul
            key={`${section.id}-${blockIndex}`}
            className="mt-4 grid gap-2 text-sm leading-7 text-app-muted sm:text-base"
          >
            {block.items.map((item) => (
              <li key={item} className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-600"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        );
      })}
    </section>
  );
}

function CookieTable() {
  return (
    <div className="mt-5 overflow-x-auto rounded-lg border border-app-border">
      <table className="min-w-[760px] divide-y divide-app-border text-left text-sm">
        <caption className="sr-only">
          Liste des cookies et technologies similaires utilisés par Kisinet
        </caption>
        <thead className="bg-app-surface text-app-text">
          <tr>
            <th scope="col" className="px-4 py-3 font-semibold">
              Nom
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Fournisseur
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Finalité
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Catégorie
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Durée
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-app-border bg-app-card text-app-muted">
          {cookieEntries.map((entry) => (
            <tr key={entry.name}>
              <th
                scope="row"
                className="max-w-[220px] px-4 py-4 align-top font-semibold text-app-text"
              >
                <span className="break-words">{entry.name}</span>
              </th>
              <td className="px-4 py-4 align-top">{entry.provider}</td>
              <td className="px-4 py-4 align-top">{entry.purpose}</td>
              <td className="px-4 py-4 align-top">{entry.category}</td>
              <td className="px-4 py-4 align-top">{entry.duration}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StorageList() {
  return (
    <div className="mt-5 grid gap-3">
      {storageEntries.map((entry) => (
        <article
          key={entry.name}
          className="rounded-lg border border-app-border bg-app-surface p-4"
        >
          <h3 className="text-base font-bold text-app-text">{entry.name}</h3>
          <p className="mt-3 text-sm leading-7 text-app-muted">
            {entry.purpose}
          </p>
          <p className="mt-2 text-sm leading-7 text-app-muted">
            Durée : {entry.duration}
          </p>
        </article>
      ))}
    </div>
  );
}
