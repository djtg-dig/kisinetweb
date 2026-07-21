import type { Metadata } from "next";
import { PublicLayout } from "@/components/layout/public-layout";
import { LinkButton } from "@/components/ui/link-button";

export const metadata: Metadata = {
  title: "Conditions d'utilisation | Kisinet",
  description:
    "Consultez les conditions applicables à l'accès et à l'utilisation de la plateforme de gestion de pharmacie Kisinet.",
  alternates: {
    canonical: "/terms",
  },
  openGraph: {
    title: "Conditions d'utilisation | Kisinet",
    description:
      "Consultez les conditions applicables à l'accès et à l'utilisation de la plateforme de gestion de pharmacie Kisinet.",
    url: "/terms",
    siteName: "Kisinet",
    type: "article",
    locale: "fr_FR",
  },
  robots: {
    index: true,
    follow: true,
  },
};

type LegalBlock =
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] };

type LegalSection = {
  id: string;
  title: string;
  blocks: LegalBlock[];
};

const lastUpdated = "[À remplacer par la date officielle]";

const legalSections: LegalSection[] = [
  {
    id: "objet",
    title: "Objet",
    blocks: [
      { type: "paragraph", text: "Les présentes Conditions d'utilisation régissent l'accès et l'utilisation de la plateforme Kisinet." },
      { type: "paragraph", text: "Kisinet est une plateforme SaaS destinée à la gestion numérique des pharmacies, officines, dépôts pharmaceutiques, cliniques, hôpitaux, grossistes et autres établissements autorisés du secteur de la santé." },
      { type: "paragraph", text: "En créant un compte ou en utilisant Kisinet, l'utilisateur reconnaît avoir lu, compris et accepté les présentes Conditions d'utilisation." },
    ],
  },
  {
    id: "definitions",
    title: "Définitions",
    blocks: [
      { type: "paragraph", text: "Dans le présent document :" },
      {
        type: "list",
        items: [
          "Kisinet désigne la plateforme logicielle et les services associés ;",
          "Utilisateur désigne toute personne disposant d'un compte Kisinet ;",
          "Propriétaire désigne la personne responsable d'une pharmacie enregistrée sur Kisinet ;",
          "Pharmacie désigne tout établissement ou espace professionnel enregistré sur la plateforme ;",
          "Collaborateur désigne tout utilisateur invité à travailler dans une pharmacie ;",
          "Abonnement désigne une offre gratuite ou payante donnant accès à certaines fonctionnalités ;",
          "Données désigne les informations enregistrées, importées, traitées ou générées par l'utilisation de Kisinet.",
        ],
      },
    ],
  },
  {
    id: "acceptation",
    title: "Acceptation des Conditions",
    blocks: [
      { type: "paragraph", text: "L'utilisation de Kisinet implique l'acceptation pleine et entière des présentes Conditions." },
      { type: "paragraph", text: "Si l'utilisateur agit au nom d'une pharmacie, d'une entreprise ou d'une autre organisation, il déclare disposer de l'autorité nécessaire pour accepter les présentes Conditions au nom de cette organisation." },
      { type: "paragraph", text: "L'utilisateur qui n'accepte pas les présentes Conditions ne doit pas utiliser Kisinet." },
    ],
  },
  {
    id: "conditions-acces",
    title: "Conditions d'accès",
    blocks: [
      { type: "paragraph", text: "L'utilisation de Kisinet est réservée aux personnes ayant la capacité juridique nécessaire et aux professionnels ou établissements autorisés à exercer leurs activités." },
      { type: "paragraph", text: "L'utilisateur déclare :" },
      {
        type: "list",
        items: [
          "fournir des informations exactes, complètes et à jour ;",
          "disposer des autorisations nécessaires pour représenter la pharmacie enregistrée ;",
          "utiliser Kisinet conformément aux lois et réglementations applicables ;",
          "ne pas créer de compte sous une fausse identité ;",
          "ne pas utiliser les informations d'une autre personne sans autorisation.",
        ],
      },
    ],
  },
  {
    id: "securite-compte",
    title: "Création et sécurité du compte",
    blocks: [
      { type: "paragraph", text: "Chaque utilisateur est responsable :" },
      {
        type: "list",
        items: [
          "de la confidentialité de ses identifiants ;",
          "de la sécurité de son mot de passe ;",
          "des activités réalisées depuis son compte ;",
          "des appareils utilisés pour accéder à Kisinet.",
        ],
      },
      { type: "paragraph", text: "L'utilisateur ne doit pas partager ses identifiants avec une autre personne." },
      { type: "paragraph", text: "Lorsqu'une pharmacie souhaite donner accès à un collaborateur, elle doit utiliser les fonctionnalités d'invitation, de gestion des membres, des rôles et des permissions prévues par Kisinet." },
      { type: "paragraph", text: "En cas de perte, de vol, de compromission ou d'utilisation non autorisée du compte, l'utilisateur doit modifier immédiatement son mot de passe et informer le support de Kisinet." },
    ],
  },
  {
    id: "utilisation-autorisee",
    title: "Utilisation autorisée",
    blocks: [
      { type: "paragraph", text: "L'utilisateur s'engage à utiliser Kisinet uniquement dans le cadre d'activités légales et professionnelles." },
      { type: "paragraph", text: "Il est notamment interdit de :" },
      {
        type: "list",
        items: [
          "tenter d'accéder sans autorisation à un compte, un serveur ou une base de données ;",
          "contourner les mécanismes d'authentification, de limitation ou de sécurité ;",
          "introduire des virus, logiciels malveillants ou codes nuisibles ;",
          "perturber volontairement le fonctionnement de la plateforme ;",
          "copier, modifier, décompiler ou désassembler le logiciel ;",
          "extraire massivement les données de la plateforme sans autorisation ;",
          "utiliser Kisinet pour des activités frauduleuses ou illicites ;",
          "utiliser la plateforme pour vendre ou distribuer des produits interdits ;",
          "revendre, louer ou sous-licencier l'accès au service sans autorisation écrite ;",
          "utiliser les fonctionnalités de Kisinet d'une manière susceptible de porter atteinte aux droits d'un tiers.",
        ],
      },
    ],
  },
  {
    id: "pharmacies-collaborateurs",
    title: "Gestion des pharmacies et des collaborateurs",
    blocks: [
      { type: "paragraph", text: "Le propriétaire d'une pharmacie est responsable :" },
      {
        type: "list",
        items: [
          "des informations relatives à sa pharmacie ;",
          "des utilisateurs qu'il invite ;",
          "des rôles et permissions attribués ;",
          "des ventes enregistrées ;",
          "des factures créées ;",
          "des paiements enregistrés ;",
          "des mouvements de stock ;",
          "des produits ajoutés ;",
          "des données relatives aux clients, fournisseurs et employés ;",
          "des actions réalisées par ses collaborateurs.",
        ],
      },
      { type: "paragraph", text: "Les collaborateurs utilisent Kisinet sous la responsabilité de la pharmacie qui leur a accordé l'accès." },
      { type: "paragraph", text: "Le propriétaire doit retirer ou suspendre rapidement l'accès d'un collaborateur qui n'est plus autorisé à utiliser les données de la pharmacie." },
    ],
  },
  {
    id: "exactitude-donnees",
    title: "Exactitude des données",
    blocks: [
      { type: "paragraph", text: "Kisinet fournit des outils permettant d'enregistrer, organiser, analyser et consulter des données professionnelles." },
      { type: "paragraph", text: "La qualité des résultats dépend des informations saisies ou importées par les utilisateurs." },
      { type: "paragraph", text: "La pharmacie reste responsable :" },
      {
        type: "list",
        items: [
          "de l'exactitude des données ;",
          "de la vérification des prix ;",
          "de la vérification des quantités ;",
          "de la vérification des dates de péremption ;",
          "de la validation des ventes et des paiements ;",
          "de la correction des erreurs de saisie ;",
          "de la conformité de ses documents commerciaux.",
        ],
      },
      { type: "paragraph", text: "Kisinet ne garantit pas l'exactitude des informations enregistrées par les utilisateurs." },
    ],
  },
  {
    id: "medicaments-reglementation",
    title: "Médicaments et réglementation sanitaire",
    blocks: [
      { type: "paragraph", text: "Kisinet est un outil de gestion et ne constitue pas une pharmacie, un établissement médical ou une autorité sanitaire." },
      { type: "paragraph", text: "Kisinet :" },
      {
        type: "list",
        items: [
          "ne vend pas directement de médicaments ;",
          "ne délivre pas de prescriptions ;",
          "ne remplace pas le médecin ;",
          "ne remplace pas le pharmacien ;",
          "ne garantit pas la conformité réglementaire d'un établissement ;",
          "ne prend pas de décision médicale à la place d'un professionnel de santé.",
        ],
      },
      { type: "paragraph", text: "Chaque pharmacie demeure seule responsable :" },
      {
        type: "list",
        items: [
          "de la délivrance des médicaments ;",
          "du respect des prescriptions médicales ;",
          "du contrôle des substances réglementées ;",
          "des conditions de stockage ;",
          "du suivi des températures lorsque cela est nécessaire ;",
          "du contrôle des dates de péremption ;",
          "du retrait des produits périmés ou non conformes ;",
          "du respect des règles sanitaires et pharmaceutiques applicables dans son pays.",
        ],
      },
    ],
  },
  {
    id: "intelligence-artificielle",
    title: "Fonctionnalités d'intelligence artificielle",
    blocks: [
      { type: "paragraph", text: "Certaines fonctionnalités de Kisinet peuvent utiliser des systèmes d'intelligence artificielle, notamment pour :" },
      {
        type: "list",
        items: [
          "analyser des documents ;",
          "extraire du texte à partir d'images ;",
          "assister la lecture d'ordonnances ;",
          "suggérer des correspondances entre des informations extraites et des produits ;",
          "produire des résumés, classifications ou recommandations ;",
          "détecter des incohérences potentielles.",
        ],
      },
      { type: "paragraph", text: "Les résultats générés par intelligence artificielle sont fournis à titre d'assistance." },
      { type: "paragraph", text: "Ils peuvent être incomplets, inexacts ou mal interprétés." },
      { type: "paragraph", text: "L'utilisateur doit toujours :" },
      {
        type: "list",
        items: [
          "vérifier les informations extraites ;",
          "confirmer les noms des médicaments ;",
          "vérifier les dosages ;",
          "vérifier les quantités ;",
          "comparer les résultats avec l'ordonnance originale ;",
          "faire valider les informations par un professionnel compétent avant toute délivrance.",
        ],
      },
      { type: "paragraph", text: "Aucune décision médicale ou pharmaceutique ne doit être prise uniquement sur la base d'un résultat généré automatiquement." },
    ],
  },
  {
    id: "abonnements-fonctionnalites",
    title: "Abonnements et fonctionnalités",
    blocks: [
      { type: "paragraph", text: "Kisinet peut proposer plusieurs offres donnant accès à des fonctionnalités différentes." },
      { type: "paragraph", text: "Les caractéristiques, prix, limites et conditions de chaque offre sont présentés sur la page des tarifs ou dans l'espace utilisateur." },
      { type: "paragraph", text: "Certaines fonctionnalités peuvent notamment dépendre :" },
      {
        type: "list",
        items: [
          "du plan souscrit ;",
          "du nombre de pharmacies autorisées ;",
          "du nombre d'utilisateurs ;",
          "du volume de stockage ;",
          "du volume d'utilisation des fonctionnalités d'intelligence artificielle ;",
          "du nombre de requêtes API ;",
          "des capacités d'exportation ;",
          "de la durée de l'abonnement.",
        ],
      },
      { type: "paragraph", text: "Kisinet peut faire évoluer les fonctionnalités incluses dans chaque offre, sous réserve d'en informer les utilisateurs lorsque la modification est substantielle." },
    ],
  },
  {
    id: "paiements-renouvellements",
    title: "Paiements et renouvellements",
    blocks: [
      { type: "paragraph", text: "Les abonnements payants sont facturés selon les tarifs affichés au moment de la souscription." },
      { type: "paragraph", text: "Les paiements peuvent être traités par des prestataires de paiement externes." },
      { type: "paragraph", text: "L'utilisateur autorise Kisinet et ses prestataires à traiter les informations nécessaires à la réalisation du paiement." },
      { type: "paragraph", text: "Selon l'offre choisie, l'abonnement peut être renouvelé automatiquement ou nécessiter un renouvellement manuel." },
      { type: "paragraph", text: "En cas d'échec ou d'absence de paiement, Kisinet peut :" },
      {
        type: "list",
        items: [
          "limiter certaines fonctionnalités ;",
          "rétrograder la pharmacie vers une offre gratuite ;",
          "suspendre temporairement l'abonnement ;",
          "désactiver l'accès de certains collaborateurs ;",
          "empêcher la création de nouvelles opérations ;",
          "résilier l'abonnement après notification.",
        ],
      },
      { type: "paragraph", text: "Sauf disposition légale contraire, les sommes déjà payées ne sont pas remboursables pour une période d'abonnement déjà commencée." },
    ],
  },
  {
    id: "disponibilite",
    title: "Disponibilité du service",
    blocks: [
      { type: "paragraph", text: "Kisinet met en œuvre des moyens raisonnables afin d'assurer la disponibilité et le bon fonctionnement de la plateforme." },
      { type: "paragraph", text: "Toutefois, le service peut être temporairement interrompu en raison :" },
      {
        type: "list",
        items: [
          "d'une maintenance ;",
          "d'une mise à jour ;",
          "d'un incident de sécurité ;",
          "d'une panne de serveur ;",
          "d'une défaillance d'un fournisseur externe ;",
          "d'une interruption d'Internet ;",
          "d'un cas de force majeure ;",
          "d'un problème affectant les services de paiement, de messagerie, de stockage ou d'intelligence artificielle.",
        ],
      },
      { type: "paragraph", text: "Kisinet ne garantit pas une disponibilité permanente et sans interruption, sauf engagement spécifique prévu dans un contrat ou un accord de niveau de service distinct." },
    ],
  },
  {
    id: "sauvegardes",
    title: "Sauvegardes et conservation des données",
    blocks: [
      { type: "paragraph", text: "Kisinet peut mettre en place des mécanismes de sauvegarde de son infrastructure." },
      { type: "paragraph", text: "Ces sauvegardes ne remplacent pas les obligations professionnelles, comptables, fiscales ou réglementaires de la pharmacie." },
      { type: "paragraph", text: "Chaque pharmacie doit conserver ses propres documents et archives lorsque cela est requis par la réglementation applicable." },
      { type: "paragraph", text: "La durée de conservation des données peut dépendre :" },
      {
        type: "list",
        items: [
          "de la nature des données ;",
          "de l'abonnement ;",
          "des obligations légales ;",
          "de la durée de la relation contractuelle ;",
          "des paramètres de suppression définis par Kisinet.",
        ],
      },
    ],
  },
  {
    id: "securite-plateforme",
    title: "Sécurité de la plateforme",
    blocks: [
      { type: "paragraph", text: "Kisinet met en œuvre des mesures techniques et organisationnelles destinées à protéger la plateforme, notamment :" },
      {
        type: "list",
        items: [
          "le chiffrement des communications ;",
          "l'authentification des utilisateurs ;",
          "la gestion des rôles et permissions ;",
          "la journalisation de certaines opérations ;",
          "la surveillance des incidents ;",
          "les sauvegardes ;",
          "la limitation des accès ;",
          "la mise à jour des composants logiciels.",
        ],
      },
      { type: "paragraph", text: "Aucun système informatique ne peut toutefois garantir une sécurité absolue." },
      { type: "paragraph", text: "L'utilisateur est également responsable de la sécurité de ses appareils, de ses mots de passe et de son environnement de travail." },
    ],
  },
  {
    id: "confidentialite",
    title: "Confidentialité et données personnelles",
    blocks: [
      { type: "paragraph", text: "Les données enregistrées par une pharmacie demeurent sous sa responsabilité." },
      { type: "paragraph", text: "Kisinet traite les données nécessaires au fonctionnement, à la sécurité, à l'amélioration et à la fourniture du service." },
      { type: "paragraph", text: "Certaines informations techniques peuvent être collectées, notamment :" },
      {
        type: "list",
        items: [
          "l'adresse IP ;",
          "le type d'appareil ;",
          "le navigateur ;",
          "les journaux de connexion ;",
          "les actions réalisées dans la plateforme ;",
          "les données nécessaires à la prévention de la fraude.",
        ],
      },
      { type: "paragraph", text: "Kisinet ne vend pas les données commerciales confidentielles des pharmacies." },
      { type: "paragraph", text: "Les règles relatives au traitement des données personnelles sont détaillées dans la Politique de confidentialité. Le lien sera ajouté ici lorsque cette page sera disponible." },
    ],
  },
  {
    id: "services-externes",
    title: "Services et prestataires externes",
    blocks: [
      { type: "paragraph", text: "Certaines fonctionnalités de Kisinet peuvent dépendre de services tiers, notamment :" },
      {
        type: "list",
        items: [
          "les services d'hébergement ;",
          "les prestataires de paiement ;",
          "les services d'envoi d'e-mails ou de SMS ;",
          "les services de stockage ;",
          "les fournisseurs de modèles d'intelligence artificielle ;",
          "les services de reconnaissance de texte ;",
          "les outils d'analyse et de surveillance.",
        ],
      },
      { type: "paragraph", text: "Kisinet ne contrôle pas entièrement le fonctionnement de ces services externes." },
      { type: "paragraph", text: "L'utilisation de certains services peut également être soumise aux conditions propres de leurs fournisseurs." },
    ],
  },
  {
    id: "suspension",
    title: "Suspension du compte",
    blocks: [
      { type: "paragraph", text: "Kisinet peut suspendre temporairement un compte ou une pharmacie en cas :" },
      {
        type: "list",
        items: [
          "de défaut de paiement ;",
          "de suspicion de fraude ;",
          "de tentative de piratage ;",
          "de compromission de sécurité ;",
          "d'utilisation abusive des ressources ;",
          "de violation des présentes Conditions ;",
          "d'activité illicite ;",
          "de demande émanant d'une autorité compétente ;",
          "de risque pour les autres utilisateurs ou pour la plateforme.",
        ],
      },
      { type: "paragraph", text: "Lorsque cela est possible, l'utilisateur sera informé du motif de la suspension." },
    ],
  },
  {
    id: "resiliation-suppression",
    title: "Résiliation et suppression",
    blocks: [
      { type: "paragraph", text: "L'utilisateur peut demander la fermeture de son compte selon les procédures prévues dans la plateforme." },
      { type: "paragraph", text: "La fermeture du compte principal d'une pharmacie peut entraîner la perte d'accès pour ses collaborateurs." },
      { type: "paragraph", text: "Avant toute suppression, la pharmacie doit exporter les informations qu'elle souhaite conserver." },
      { type: "paragraph", text: "Kisinet peut conserver certaines données après la fermeture du compte lorsque cela est nécessaire pour :" },
      {
        type: "list",
        items: [
          "respecter une obligation légale ;",
          "prévenir la fraude ;",
          "gérer un litige ;",
          "protéger les droits de Kisinet ou d'un tiers ;",
          "conserver les journaux de sécurité.",
        ],
      },
    ],
  },
  {
    id: "propriete-intellectuelle",
    title: "Propriété intellectuelle",
    blocks: [
      { type: "paragraph", text: "Kisinet, son code source, son interface, son architecture, ses bases de données, ses textes, ses logos, ses illustrations, ses composants graphiques et sa documentation sont protégés par les règles relatives à la propriété intellectuelle." },
      { type: "paragraph", text: "L'utilisation de Kisinet n'entraîne aucun transfert de propriété au bénéfice de l'utilisateur." },
      { type: "paragraph", text: "L'utilisateur bénéficie uniquement d'un droit limité, personnel, non exclusif, non transférable et révocable d'utiliser la plateforme conformément à son abonnement et aux présentes Conditions." },
    ],
  },
  {
    id: "contenu-utilisateur",
    title: "Contenu transmis par l'utilisateur",
    blocks: [
      { type: "paragraph", text: "L'utilisateur conserve les droits dont il dispose sur les données et documents qu'il transmet à Kisinet." },
      { type: "paragraph", text: "Il accorde à Kisinet les autorisations techniques nécessaires pour :" },
      {
        type: "list",
        items: [
          "héberger les données ;",
          "les sauvegarder ;",
          "les traiter ;",
          "les afficher ;",
          "les convertir ;",
          "les analyser ;",
          "les transmettre aux prestataires nécessaires au fonctionnement du service.",
        ],
      },
      { type: "paragraph", text: "L'utilisateur garantit qu'il dispose des droits et autorisations nécessaires pour enregistrer ces données dans Kisinet." },
    ],
  },
  {
    id: "limitation-responsabilite",
    title: "Limitation de responsabilité",
    blocks: [
      { type: "paragraph", text: "Dans les limites autorisées par la loi, Kisinet ne pourra être tenu responsable notamment :" },
      {
        type: "list",
        items: [
          "des erreurs de saisie ;",
          "des erreurs commises par un collaborateur ;",
          "de la délivrance incorrecte d'un médicament ;",
          "d'une mauvaise interprétation d'une ordonnance ;",
          "d'une décision prise uniquement sur la base d'une suggestion automatique ;",
          "d'une rupture de stock ;",
          "de la vente d'un produit périmé ;",
          "d'une erreur dans les prix ;",
          "d'une perte financière résultant d'une mauvaise utilisation ;",
          "de la perte de clientèle ;",
          "d'un dommage indirect ;",
          "d'une interruption provenant d'un prestataire externe ;",
          "d'une utilisation frauduleuse liée à des identifiants compromis ;",
          "d'une violation des obligations professionnelles de la pharmacie.",
        ],
      },
      { type: "paragraph", text: "Kisinet reste responsable uniquement dans les limites prévues par la législation applicable et par les engagements expressément acceptés dans un contrat distinct." },
    ],
  },
  {
    id: "evolution-plateforme",
    title: "Évolution de la plateforme",
    blocks: [
      { type: "paragraph", text: "Kisinet peut faire évoluer la plateforme afin de :" },
      {
        type: "list",
        items: [
          "ajouter de nouvelles fonctionnalités ;",
          "améliorer la sécurité ;",
          "améliorer les performances ;",
          "modifier l'interface ;",
          "corriger des erreurs ;",
          "adapter le service aux exigences réglementaires ;",
          "supprimer des fonctionnalités obsolètes ;",
          "modifier les technologies ou prestataires utilisés.",
        ],
      },
      { type: "paragraph", text: "Les modifications importantes susceptibles d'affecter substantiellement les utilisateurs pourront faire l'objet d'une communication préalable." },
    ],
  },
  {
    id: "modification-conditions",
    title: "Modification des Conditions",
    blocks: [
      { type: "paragraph", text: "Kisinet peut mettre à jour les présentes Conditions d'utilisation." },
      { type: "paragraph", text: "La date de dernière mise à jour doit être affichée en haut de la page." },
      { type: "paragraph", text: "Lorsque les modifications sont importantes, les utilisateurs peuvent être informés par :" },
      {
        type: "list",
        items: [
          "une notification dans la plateforme ;",
          "un e-mail ;",
          "une bannière d'information ;",
          "une demande de nouvelle acceptation.",
        ],
      },
      { type: "paragraph", text: "La poursuite de l'utilisation de Kisinet après l'entrée en vigueur des nouvelles Conditions vaut acceptation de celles-ci, sous réserve des règles impératives applicables." },
    ],
  },
  {
    id: "droit-applicable",
    title: "Droit applicable et règlement des litiges",
    blocks: [
      { type: "paragraph", text: "Les présentes Conditions sont régies par les lois de la République démocratique du Congo, sous réserve des dispositions impératives applicables dans le pays d'utilisation." },
      { type: "paragraph", text: "En cas de différend, les parties chercheront prioritairement une solution amiable." },
      { type: "paragraph", text: "À défaut de solution amiable, le litige pourra être porté devant les juridictions compétentes conformément à la législation applicable." },
    ],
  },
  {
    id: "contact",
    title: "Contact",
    blocks: [
      { type: "paragraph", text: "Pour toute question relative aux présentes Conditions d'utilisation, l'utilisateur peut contacter Kisinet par les moyens officiels affichés sur le site." },
      { type: "paragraph", text: "Informations à afficher lorsque celles-ci seront officiellement confirmées :" },
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

export default function TermsPage() {
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
                Conditions d'utilisation
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-8 text-app-muted sm:text-lg">
                Les règles applicables à l'accès et à l'utilisation de la
                plateforme Kisinet.
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
              aria-label="Table des matières des conditions d'utilisation"
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
                aria-label="Table des matières mobile des conditions d'utilisation"
                className="mt-4"
              >
                <TableOfContents />
              </nav>
            </details>
          </aside>

          <div className="min-w-0">
            <div className="max-w-3xl rounded-lg border border-app-border bg-app-card p-5 shadow-sm sm:p-7">
              <p className="text-sm leading-7 text-app-muted">
                Cette page rassemble les règles d'utilisation de Kisinet. Elle
                doit être lue avec les politiques complémentaires qui seront
                publiées progressivement, notamment la Politique de
                confidentialité lorsqu'elle sera disponible.
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
              <p className="text-sm leading-6 text-app-muted">
                La Politique de confidentialité et la Politique de cookies
                seront reliées depuis cette zone lorsqu'elles seront publiées.
              </p>
              <LinkButton href="#top" variant="secondary" className="w-fit">
                Revenir en haut
              </LinkButton>
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
