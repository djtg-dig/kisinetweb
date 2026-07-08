import { PublicLayout } from "@/components/layout/public-layout";
import { PublicAuthLink } from "@/components/auth/public-auth-link";
import { FeatureCard } from "@/components/ui/feature-card";
import { LinkButton } from "@/components/ui/link-button";
import { features } from "@/lib/features";

const quickBenefits = [
  "Gestion des médicaments",
  "Suivi du stock",
  "Ventes et factures",
  "Multi-pharmacies",
  "Gestion des employés",
  "Données sécurisées",
];

const steps = [
  {
    title: "Connectez-vous avec Carri Account",
    description: "Utilisez votre identité Carri Business pour accéder à Kisinet.",
  },
  {
    title: "Ajoutez votre pharmacie",
    description: "Renseignez les informations utiles de votre pharmacie.",
  },
  {
    title: "Commencez à gérer votre activité",
    description: "Organisez produits, stocks, ventes, factures et équipe.",
  },
];

const strengths = [
  "Interface simple",
  "Accès sécurisé",
  "Adapté aux pharmacies modernes",
  "Utilisable sur ordinateur et mobile",
  "Préparé pour gérer plusieurs pharmacies",
  "Organisation claire des données",
];

const plans = [
  {
    name: "Gratuit",
    description: "Pour commencer",
    buttonLabel: "Se connecter",
    highlighted: false,
  },
  {
    name: "Professionnel",
    description: "Pour les pharmacies en croissance",
    buttonLabel: "Choisir ce plan",
    highlighted: true,
  },
  {
    name: "Entreprise",
    description: "Pour les grandes structures",
    buttonLabel: "Contacter Kisinet",
    highlighted: false,
  },
];

const faqs = [
  {
    question: "Kisinet est-il une pharmacie en ligne ?",
    answer:
      "Non. Kisinet est une application de gestion interne pour les pharmacies, pas une plateforme de vente de médicaments au public.",
  },
  {
    question: "Puis-je gérer plusieurs pharmacies ?",
    answer:
      "Oui. Kisinet est pensé pour évoluer vers une gestion multi-pharmacies claire et organisée.",
  },
  {
    question: "Puis-je inviter mes employés ?",
    answer:
      "Oui. La plateforme prévoit la gestion des équipes et des permissions selon les rôles.",
  },
  {
    question: "Mes données sont-elles sécurisées ?",
    answer:
      "Kisinet est conçu avec une approche SaaS professionnelle pour protéger l'accès aux données de gestion.",
  },
  {
    question: "Puis-je utiliser Kisinet sur téléphone ?",
    answer:
      "Oui. L'interface est responsive pour rester lisible sur mobile, tablette et ordinateur.",
  },
];

export default function HomePage() {
  return (
    <PublicLayout>
      <main>
        <section className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:py-18 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-20">
          <div className="flex flex-col justify-center">
            <span className="w-fit rounded-full bg-primary-50 px-3 py-1 text-sm font-semibold text-primary-700 ring-1 ring-primary-100">
              SaaS de gestion pharmaceutique
            </span>
            <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-tight text-app-text sm:text-5xl">
              Gérez votre pharmacie simplement, rapidement et en toute sécurité.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-app-muted sm:text-lg">
              Kisinet est une plateforme moderne qui vous aide à gérer vos
              pharmacies, vos médicaments, vos stocks, vos ventes et vos équipes
              depuis un seul espace.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <PublicAuthLink>Se connecter</PublicAuthLink>
              <LinkButton href="#fonctionnalites" variant="secondary">
                Voir les fonctionnalités
              </LinkButton>
            </div>
          </div>

          <DashboardPreview />
        </section>

        <section className="border-y border-app-border bg-app-surface">
          <div className="mx-auto grid max-w-6xl gap-3 px-4 py-6 sm:grid-cols-2 sm:px-6 md:grid-cols-3 lg:grid-cols-6 lg:px-8">
            {quickBenefits.map((benefit) => (
              <div
                key={benefit}
                className="rounded-md border border-app-border bg-app-card px-4 py-3 text-sm font-semibold text-app-text"
              >
                <span className="mr-2 text-success-600">●</span>
                {benefit}
              </div>
            ))}
          </div>
        </section>

        <section
          id="fonctionnalites"
          className="mx-auto max-w-6xl scroll-mt-24 px-4 py-16 sm:px-6 lg:px-8"
        >
          <SectionHeading
            eyebrow="Fonctionnalités"
            title="Tout ce qu'il faut pour organiser une pharmacie moderne"
            description="Kisinet rassemble les modules essentiels de gestion dans une interface claire, sans transformer votre espace en catalogue de vente en ligne."
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <FeatureCard key={feature.title} feature={feature} />
            ))}
          </div>
        </section>

        <section className="bg-app-surface">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="Méthode"
              title="Comment ça fonctionne ?"
              description="Une mise en route simple pour commencer à structurer votre activité sans complexité inutile."
            />
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {steps.map((step, index) => (
                <article
                  key={step.title}
                  className="rounded-lg border border-app-border bg-app-card p-5"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary-600 text-sm font-bold text-white">
                    {index + 1}
                  </span>
                  <h3 className="mt-4 text-lg font-semibold text-app-text">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-app-muted">
                    {step.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <SectionHeading
            eyebrow="Pourquoi Kisinet ?"
            title="Une solution claire pour les équipes de pharmacie"
            description="Kisinet privilégie la lisibilité, la sécurité et l'organisation des données pour accompagner le travail quotidien."
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {strengths.map((strength) => (
              <div
                key={strength}
                className="rounded-lg border border-app-border bg-app-card p-4"
              >
                <p className="font-semibold text-app-text">{strength}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="tarifs" className="scroll-mt-24 bg-app-surface">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="Tarifs"
              title="Des plans préparés pour chaque étape"
              description="Les prix définitifs seront précisés plus tard. La structure permet déjà de présenter clairement les offres."
            />
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {plans.map((plan) => (
                <article
                  key={plan.name}
                  className={`rounded-lg border p-6 ${
                    plan.highlighted
                      ? "border-primary-600 bg-primary-50 shadow-soft"
                      : "border-app-border bg-app-card"
                  }`}
                >
                  <h3 className="text-xl font-bold text-app-text">{plan.name}</h3>
                  <p className="mt-3 text-sm leading-6 text-app-muted">
                    {plan.description}
                  </p>
                  <p className="mt-6 text-sm font-semibold text-app-text">
                    Prix à définir
                  </p>
                  <PublicAuthLink
                    variant={plan.highlighted ? "primary" : "secondary"}
                    className="mt-6 w-full"
                    loggedInHref={plan.highlighted ? "/app/subscription" : "/app/select-pharmacy"}
                    loggedInLabel={plan.highlighted ? "Voir mon abonnement" : "Ouvrir Kisinet"}
                  >
                    {plan.buttonLabel}
                  </PublicAuthLink>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-16 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="FAQ"
            title="Questions fréquentes"
            description="Des réponses rapides pour comprendre le rôle de Kisinet."
          />
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {faqs.map((faq) => (
              <article
                key={faq.question}
                className="rounded-lg border border-app-border bg-app-card p-5"
              >
                <h3 className="font-semibold text-app-text">{faq.question}</h3>
                <p className="mt-2 text-sm leading-6 text-app-muted">
                  {faq.answer}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="px-4 pb-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl rounded-lg bg-primary-600 px-6 py-12 text-center text-white sm:px-10">
            <h2 className="text-3xl font-bold">
              Simplifiez la gestion de votre pharmacie dès aujourd'hui.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-primary-50 sm:text-base">
              Connectez-vous avec Carri Account et commencez à organiser vos produits,
              stocks, ventes et équipes avec Kisinet.
            </p>
            <PublicAuthLink
              variant="secondary"
              className="mt-7 border-white bg-white text-primary-700 hover:bg-primary-50"
            >
              Se connecter avec Carri Account
            </PublicAuthLink>
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}

function DashboardPreview() {
  return (
    <div className="rounded-lg border border-app-border bg-app-card p-5 shadow-soft">
      <div className="flex items-center justify-between border-b border-app-border pb-4">
        <div>
          <p className="text-sm font-semibold text-app-text">Tableau de bord</p>
          <p className="text-xs text-app-muted">Aperçu de gestion Kisinet</p>
        </div>
        <span className="rounded-full bg-success-50 px-3 py-1 text-xs font-semibold text-success-700 ring-1 ring-success-100">
          Actif
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <DashboardMetric label="Produits" value="1 284" tone="primary" />
        <DashboardMetric label="Stock faible" value="18" tone="warning" />
        <DashboardMetric label="Ventes du jour" value="42" tone="success" />
        <DashboardMetric label="Pharmacies actives" value="3" tone="info" />
      </div>

      <div className="mt-5 rounded-md border border-app-border bg-app-background p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-app-text">Organisation du stock</span>
          <span className="text-success-600">74%</span>
        </div>
        <div className="mt-3 h-2 rounded-full bg-primary-100">
          <div className="h-2 w-3/4 rounded-full bg-primary-600" />
        </div>
      </div>
    </div>
  );
}

type DashboardMetricProps = {
  label: string;
  value: string;
  tone: "primary" | "success" | "warning" | "info";
};

const metricToneClasses = {
  primary: "bg-primary-50 text-primary-700 ring-primary-100",
  success: "bg-success-50 text-success-700 ring-success-100",
  warning: "bg-warning/10 text-amber-700 ring-warning/20",
  info: "bg-info/10 text-cyan-700 ring-info/20",
};

function DashboardMetric({ label, value, tone }: DashboardMetricProps) {
  return (
    <div className={`rounded-md p-4 ring-1 ${metricToneClasses[tone]}`}>
      <p className="text-sm font-medium">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description: string;
};

function SectionHeading({ eyebrow, title, description }: SectionHeadingProps) {
  return (
    <div className="max-w-2xl">
      <p className="text-sm font-semibold uppercase tracking-wide text-primary-700">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-bold text-app-text">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-app-muted sm:text-base">
        {description}
      </p>
    </div>
  );
}
