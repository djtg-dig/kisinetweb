import { PublicLayout } from "@/components/layout/public-layout";
import { PublicAuthLink } from "@/components/auth/public-auth-link";
import { FeatureCard } from "@/components/ui/feature-card";
import { LinkButton } from "@/components/ui/link-button";
import { features } from "@/lib/features";

const quickBenefits = [
  "Stock suivi en temps réel",
  "Factures et paiements alignés",
  "Équipe encadrée par rôles",
  "Alertes de péremption",
  "Multi-pharmacies",
  "Données structurées",
];

const audiences = [
  {
    title: "Pharmacies",
    description: "Organisez les produits, les ventes, les factures et les équipes.",
  },
  {
    title: "Dépôts pharmaceutiques",
    description: "Gardez une lecture claire des mouvements de stock et des quantités.",
  },
  {
    title: "Cliniques et hôpitaux",
    description: "Centralisez les produits utilisés par vos services et vos points de vente.",
  },
  {
    title: "Grossistes",
    description: "Préparez une gestion plus fiable des catalogues, stocks et opérations.",
  },
];

const productMetrics = [
  { label: "Produits suivis", value: "1 284", tone: "primary" },
  { label: "Stock faible", value: "18", tone: "warning" },
  { label: "Ventes du jour", value: "42", tone: "success" },
  { label: "Factures impayées", value: "7", tone: "info" },
] as const;

const stockRows = [
  {
    name: "Paracétamol 500 mg",
    status: "Stock stable",
    value: "430 unités",
    tone: "success",
  },
  {
    name: "Amoxicilline sirop",
    status: "À réapprovisionner",
    value: "12 unités",
    tone: "warning",
  },
  {
    name: "Gants médicaux",
    status: "Rotation élevée",
    value: "86 boîtes",
    tone: "info",
  },
] as const;

const workflow = [
  {
    title: "Connectez-vous",
    description: "Accédez à Kisinet avec votre compte et retrouvez vos espaces de travail.",
  },
  {
    title: "Structurez la pharmacie",
    description: "Ajoutez produits, stocks, membres, rôles et informations essentielles.",
  },
  {
    title: "Pilotez chaque journée",
    description: "Suivez les ventes, les factures, les alertes et les décisions à prendre.",
  },
];

const proofPoints = [
  "Une interface pensée pour les équipes qui travaillent vite.",
  "Des informations importantes visibles sans chercher longtemps.",
  "Une base solide pour gérer plusieurs pharmacies sans perdre le contrôle.",
  "Des modules orientés gestion, pas vente publique de médicaments.",
];

const faqs = [
  {
    question: "Kisinet est-il une pharmacie en ligne ?",
    answer:
      "Non. Kisinet est une application de gestion interne pour les pharmacies et les établissements autorisés.",
  },
  {
    question: "Puis-je gérer plusieurs pharmacies ?",
    answer:
      "Oui. Kisinet est pensé pour suivre plusieurs espaces de travail avec une organisation claire.",
  },
  {
    question: "Puis-je inviter mes employés ?",
    answer:
      "Oui. Les rôles et permissions permettent d'encadrer les accès de chaque collaborateur.",
  },
  {
    question: "Kisinet convient-il à une petite pharmacie ?",
    answer:
      "Oui. L'interface reste simple pour démarrer, puis accompagne la croissance de l'activité.",
  },
];

export default function HomePage() {
  return (
    <PublicLayout>
      <main>
        <section className="border-b border-app-border bg-app-background">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:py-16">
            <div className="flex flex-col justify-center">
              <span className="w-fit rounded-full bg-primary-50 px-3 py-1 text-sm font-semibold text-primary-700 ring-1 ring-primary-100">
                Gestion pharmaceutique moderne
              </span>
              <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-tight text-app-text sm:text-5xl">
                Une pharmacie mieux suivie, une équipe plus sereine.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-app-muted sm:text-lg">
                Kisinet rassemble stocks, ventes, factures, produits,
                collaborateurs et alertes dans un espace clair pour piloter les
                opérations quotidiennes sans perdre le fil.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <PublicAuthLink>Se connecter</PublicAuthLink>
                <LinkButton href="/tarifs" variant="secondary">
                  Voir les tarifs
                </LinkButton>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <TrustSignal value="5 min" label="pour prendre en main" />
                <TrustSignal value="24/7" label="accès à l'espace" />
                <TrustSignal value="1+" label="pharmacie gérée" />
              </div>
            </div>

            <ProductShowcase />
          </div>
        </section>

        <section className="border-b border-app-border bg-app-surface">
          <div className="mx-auto grid max-w-6xl gap-3 px-4 py-6 sm:grid-cols-2 sm:px-6 md:grid-cols-3 lg:grid-cols-6 lg:px-8">
            {quickBenefits.map((benefit) => (
              <div
                key={benefit}
                className="rounded-md border border-app-border bg-app-card px-4 py-3 text-sm font-semibold text-app-text"
              >
                <span
                  aria-hidden="true"
                  className="mr-2 text-success-600 dark:text-success-400"
                >
                  ●
                </span>
                {benefit}
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <SectionHeading
              eyebrow="Pour qui ?"
              title="Une solution conçue pour les vrais circuits de santé"
              description="Kisinet s'adapte aux établissements qui doivent contrôler leurs produits, leurs mouvements et leurs équipes avec rigueur."
            />
            <div className="grid gap-4 sm:grid-cols-2">
              {audiences.map((audience) => (
                <article
                  key={audience.title}
                  className="rounded-lg border border-app-border bg-app-card p-5 shadow-sm"
                >
                  <h3 className="text-lg font-bold text-app-text">
                    {audience.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-app-muted">
                    {audience.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="fonctionnalites"
          className="border-y border-app-border bg-app-surface"
        >
          <div className="mx-auto max-w-6xl scroll-mt-24 px-4 py-16 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="Fonctionnalités"
              title="Les modules essentiels, sans surcharge"
              description="Chaque partie de Kisinet sert un objectif précis : mieux voir, mieux décider et mieux contrôler l'activité."
            />
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <FeatureCard key={feature.title} feature={feature} />
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_0.95fr] lg:px-8">
          <div>
            <SectionHeading
              eyebrow="Méthode"
              title="Un parcours simple pour passer du désordre au contrôle"
              description="La plateforme accompagne les équipes sans leur imposer une logique compliquée."
            />
            <div className="mt-8 grid gap-4">
              {workflow.map((step, index) => (
                <article
                  key={step.title}
                  className="grid gap-4 rounded-lg border border-app-border bg-app-card p-5 shadow-sm sm:grid-cols-[44px_1fr]"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-md bg-primary-600 text-sm font-bold text-white">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-app-text">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-app-muted">
                      {step.description}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-app-border bg-app-card p-6 shadow-soft">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary-700">
              Pourquoi ça compte
            </p>
            <h2 className="mt-3 text-3xl font-bold leading-tight text-app-text">
              Moins d'oublis, plus de visibilité.
            </h2>
            <div className="mt-6 grid gap-3">
              {proofPoints.map((point) => (
                <p
                  key={point}
                  className="rounded-md border border-app-border bg-app-surface px-4 py-3 text-sm font-semibold leading-6 text-app-text"
                >
                  {point}
                </p>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="border-y border-app-border bg-app-surface">
          <div className="mx-auto max-w-6xl scroll-mt-24 px-4 py-16 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="FAQ"
              title="Questions fréquentes"
              description="Les réponses courtes dont un visiteur a besoin avant d'essayer Kisinet."
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
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl rounded-lg bg-primary-600 px-6 py-12 text-center text-white sm:px-10">
            <h2 className="text-3xl font-bold">
              Donnez à votre pharmacie un tableau de bord digne de son activité.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-white/90 sm:text-base">
              Commencez avec une organisation claire, puis ajoutez les modules
              dont votre équipe a besoin au quotidien.
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <PublicAuthLink
                variant="secondary"
                className="border-white bg-white text-app-text hover:bg-primary-50 dark:border-app-border dark:bg-app-card dark:text-primary-700 dark:hover:bg-primary-50"
              >
                Se connecter avec Carri Account
              </PublicAuthLink>
              <LinkButton
                href="/tarifs"
                variant="secondary"
                className="border-white/60 bg-transparent text-white hover:bg-white/10"
              >
                Comparer les plans
              </LinkButton>
            </div>
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}

function ProductShowcase() {
  return (
    <div className="relative">
      <div className="overflow-hidden rounded-lg border border-app-border bg-app-card shadow-soft">
        <div className="flex items-center justify-between border-b border-app-border bg-app-surface px-4 py-3">
          <div>
            <p className="text-sm font-bold text-app-text">Kisinet</p>
            <p className="text-xs text-app-muted">Vue opérationnelle pharmacie</p>
          </div>
          <span className="rounded-full bg-success-50 px-3 py-1 text-xs font-semibold text-success-700 ring-1 ring-success-100">
            Synchronisé
          </span>
        </div>

        <div className="grid gap-4 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {productMetrics.map((metric) => (
              <ProductMetric
                key={metric.label}
                label={metric.label}
                value={metric.value}
                tone={metric.tone}
              />
            ))}
          </div>

          <div className="rounded-md border border-app-border">
            <div className="grid grid-cols-[1fr_auto] border-b border-app-border bg-app-surface px-4 py-3 text-xs font-semibold uppercase text-app-muted">
              <span>Produit</span>
              <span>État</span>
            </div>
            <div className="divide-y divide-app-border">
              {stockRows.map((row) => (
                <div
                  key={row.name}
                  className="grid grid-cols-[1fr_auto] gap-4 px-4 py-4"
                >
                  <div>
                    <p className="font-semibold text-app-text">{row.name}</p>
                    <p className="mt-1 text-sm text-app-muted">{row.value}</p>
                  </div>
                  <StatusBadge tone={row.tone}>{row.status}</StatusBadge>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 rounded-md border border-app-border bg-app-surface p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-app-text">
                Qualité du stock
              </span>
              <span className="font-bold text-success-700 dark:text-success-400">
                74%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-primary-100">
              <div className="h-full w-3/4 rounded-full bg-primary-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TrustSignal({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-lg border border-app-border bg-app-card p-4">
      <p className="text-2xl font-bold text-app-text">{value}</p>
      <p className="mt-1 text-sm leading-5 text-app-muted">{label}</p>
    </div>
  );
}

type ProductTone = "primary" | "success" | "warning" | "info";

const metricToneClasses: Record<ProductTone, string> = {
  primary: "bg-primary-50 text-primary-700 ring-primary-100",
  success: "bg-success-50 text-success-700 ring-success-100",
  warning: "bg-warning/10 text-amber-700 ring-warning/20 dark:text-amber-300",
  info: "bg-info/10 text-cyan-700 ring-info/20 dark:text-cyan-300",
};

function ProductMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: ProductTone;
}) {
  return (
    <div className={`rounded-md p-4 ring-1 ${metricToneClasses[tone]}`}>
      <p className="text-sm font-medium">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}

function StatusBadge({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: ProductTone;
}) {
  return (
    <span
      className={`h-fit rounded-full px-3 py-1 text-xs font-semibold ring-1 ${metricToneClasses[tone]}`}
    >
      {children}
    </span>
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
      <h2 className="mt-3 text-3xl font-bold leading-tight text-app-text">
        {title}
      </h2>
      <p className="mt-3 text-sm leading-6 text-app-muted sm:text-base">
        {description}
      </p>
    </div>
  );
}
