import type { Feature } from "@/types/feature";

type FeatureCardProps = {
  feature: Feature;
};

const toneClasses = {
  primary: "bg-primary-50 text-primary-700 ring-primary-100",
  success: "bg-success-50 text-success-700 ring-success-100",
  warning: "bg-warning/10 text-amber-700 ring-warning/20",
  error: "bg-error/10 text-red-700 ring-error/20",
  info: "bg-info/10 text-cyan-700 ring-info/20",
};

export function FeatureCard({ feature }: FeatureCardProps) {
  return (
    <article className="rounded-lg border border-app-border bg-app-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <span
          className={`inline-flex h-10 w-10 items-center justify-center rounded-md text-xs font-bold ring-1 ${toneClasses[feature.tone]}`}
        >
          {feature.icon}
        </span>
        <span className="rounded-full bg-app-background px-3 py-1 text-xs font-semibold text-app-muted ring-1 ring-app-border">
          {feature.badge}
        </span>
      </div>
      <h3 className="mt-4 text-lg font-semibold text-app-text">
        {feature.title}
      </h3>
      <p className="mt-2 text-sm leading-6 text-app-muted">
        {feature.description}
      </p>
    </article>
  );
}
