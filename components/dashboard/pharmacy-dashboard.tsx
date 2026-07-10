import { LinkButton } from "@/components/ui/link-button";
import type { PharmacyPermissions } from "@/lib/api";
import {
  formatCurrency,
  type DashboardAlert,
  type PharmacyDashboardData,
  type SalesDay,
} from "@/lib/dashboard";

type PharmacyDashboardProps = {
  data: PharmacyDashboardData;
  permissions: PharmacyPermissions;
};

const quickActions = [
  { label: "Nouvelle vente", path: "/sales/create", permission: "sale_create", tone: "primary" },
  { label: "Entrée de stock", path: "/stock/entries/create", permission: "stock_adjust", tone: "info" },
] satisfies {
  label: string;
  path: string;
  permission: keyof PharmacyPermissions;
  tone: string;
}[];

const shortcutPermissions: Record<string, keyof PharmacyPermissions> = {
  "Nouvelle vente": "sale_create",
  "Entrée de stock": "stock_adjust",
};

const disabledActionTitle =
  "Vous n'avez pas la permission d'effectuer cette action dans cette pharmacie.";

type QuickAction = (typeof quickActions)[number];

type DashboardActionProps = {
  href: string;
  label: string;
  tone?: string;
  enabled: boolean;
  compact?: boolean;
};

const shortcutActionClass =
  "rounded-lg border border-app-border bg-app-surface px-4 py-3 text-sm font-semibold text-app-text transition hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700";

const disabledShortcutActionClass =
  "cursor-not-allowed rounded-lg border border-app-border bg-app-surface px-4 py-3 text-sm font-semibold text-app-muted opacity-60";

function isActionAllowed(permissions: PharmacyPermissions, permission: keyof PharmacyPermissions) {
  return Boolean(permissions[permission]);
}

function getQuickActionEnabled(action: QuickAction, permissions: PharmacyPermissions) {
  return isActionAllowed(permissions, action.permission);
}

function getShortcutEnabled(label: string, permissions: PharmacyPermissions) {
  const permission = shortcutPermissions[label];

  return permission ? isActionAllowed(permissions, permission) : true;
}

function DashboardAction({
  href,
  label,
  tone = "secondary",
  enabled,
  compact = false,
}: DashboardActionProps) {
  if (!enabled) {
    return (
      <span
        aria-disabled="true"
        className={compact ? disabledShortcutActionClass : getActionClass(tone, false)}
        role="link"
        title={disabledActionTitle}
      >
        {label}
      </span>
    );
  }

  return (
    <a href={href} className={compact ? shortcutActionClass : getActionClass(tone, true)}>
      {label}
    </a>
  );
}

export function PharmacyDashboard({ data, permissions }: PharmacyDashboardProps) {
  const pharmacyId = data.pharmacy.id;
  const currency = data.pharmacy.devise || "USD";
  const alerts = [
    ...data.alerts.out_of_stock,
    ...data.alerts.low_stock,
    ...data.alerts.expiring_products,
    ...(data.alerts.subscription ? [data.alerts.subscription] : []),
    ...data.alerts.pending_invoices,
  ];

  const hasData =
    data.stats.products_count > 0 ||
    data.latest_sales.length > 0 ||
    data.top_products.length > 0 ||
    data.restock_products.length > 0;

  return (
    <>
      <header className="relative z-0 border-b border-app-border bg-app-surface">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-sm font-semibold text-primary-700">Tableau de bord</p>
              <h1 className="mt-2 text-3xl font-bold text-app-text">{data.pharmacy.name}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-app-muted">
                Bonjour, voici un aperçu des activité d'aujourd'hui.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {quickActions.map((action) => (
                <DashboardAction
                  key={action.label}
                  href={"/app/pharmacies/" + pharmacyId + action.path}
                  label={action.label}
                  tone={action.tone}
                  enabled={getQuickActionEnabled(action, permissions)}
                />
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:px-8">
        {!hasData && <EmptyDashboard />}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <StatCard label="Produits" value={String(data.stats.products_count)} tone="primary" />
          <StatCard label="Stock faible" value={String(data.stats.low_stock_count)} tone="warning" />
          <StatCard label="Ruptures de stock" value={String(data.stats.out_of_stock_count)} tone="error" />
          <StatCard label="Ventes aujourd'hui" value={String(data.stats.today_sales_count)} tone="success" />
          <StatCard
            label="Chiffre du jour"
            value={formatCurrency(data.stats.today_revenue, currency)}
            tone="info"
          />
          <StatCard label="Employés" value={String(data.stats.employees_count)} tone="primary" />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Panel title="Alertes importantes">
            {alerts.length ? (
              <div className="grid gap-3">
                {alerts.map((alert) => (
                  <AlertItem key={alert.id} alert={alert} />
                ))}
              </div>
            ) : (
              <EmptyText message="Aucune alerte importante pour le moment." />
            )}
          </Panel>

          <Panel title="Ventes des 7 derniers jours">
            {data.sales_last_7_days.length ? (
              <SalesBars rows={data.sales_last_7_days} currency={currency} />
            ) : (
              <EmptyText message="Aucune vente récente à afficher." />
            )}
          </Panel>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <Panel title="Produits les plus vendus">
            {data.top_products.length ? (
              <div className="grid gap-3">
                {data.top_products.map((product) => (
                  <div
                    key={product.id}
                    className="grid gap-2 rounded-lg border border-app-border bg-app-surface p-4 sm:grid-cols-[1fr_auto] sm:items-center"
                  >
                    <div>
                      <p className="font-semibold text-app-text">{product.name}</p>
                      <p className="mt-1 text-sm text-app-muted">
                        {product.quantity_sold} unités vendues
                      </p>
                    </div>
                    <p className="text-sm font-bold text-success-700">
                      {product.revenue !== undefined
                        ? formatCurrency(product.revenue, currency)
                        : "Non renseigné"}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyText message="Aucun produit vendu pour l'instant." />
            )}
          </Panel>

          <Panel title="Produits à réapprovisionner">
            {data.restock_products.length ? (
              <div className="grid gap-3">
                {data.restock_products.map((product) => (
                  <div
                    key={product.id}
                    className="grid gap-3 rounded-lg border border-app-border bg-app-surface p-4 sm:grid-cols-[1fr_auto] sm:items-center"
                  >
                    <div>
                      <p className="font-semibold text-app-text">{product.name}</p>
                      <p className="mt-1 text-sm text-app-muted">
                        Restant: {product.remaining_quantity} · Seuil:{" "}
                        {product.minimum_threshold}
                      </p>
                    </div>
                    <LinkButton
                      href={"/app/pharmacies/" + pharmacyId + "/stock"}
                      variant="secondary"
                    >
                      Voir
                    </LinkButton>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyText message="Aucun produit à réapprovisionner." />
            )}
          </Panel>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Panel title="Dernières ventes">
            {data.latest_sales.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-app-border text-xs font-semibold text-app-muted">
                      <th className="py-3 pr-4">Date</th>
                      <th className="py-3 pr-4">Référence</th>
                      <th className="py-3 pr-4">Client</th>
                      <th className="py-3 pr-4">Montant</th>
                      <th className="py-3">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.latest_sales.map((sale) => (
                      <tr key={sale.id} className="border-b border-app-border last:border-0">
                        <td className="py-3 pr-4 text-app-muted">{sale.date}</td>
                        <td className="py-3 pr-4 font-semibold text-app-text">
                          {sale.reference}
                        </td>
                        <td className="py-3 pr-4 text-app-muted">
                          {sale.client || "Non renseigné"}
                        </td>
                        <td className="py-3 pr-4 font-semibold text-app-text">
                          {formatCurrency(sale.amount, currency)}
                        </td>
                        <td className="py-3">
                          <StatusBadge label={sale.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyText message="Aucune vente récente." />
            )}
          </Panel>

          <Panel title="Activité récente">
            {data.recent_activity.length ? (
              <div className="grid gap-4">
                {data.recent_activity.map((activity) => (
                  <div key={activity.id} className="border-l-2 border-primary-600 pl-4">
                    <p className="text-xs font-semibold text-app-muted">{activity.date}</p>
                    <p className="mt-1 font-semibold text-app-text">{activity.label}</p>
                    <p className="mt-1 text-sm leading-6 text-app-muted">
                      {activity.description}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyText message="Aucune activité récente." />
            )}
          </Panel>
        </section>

        <Panel title="Raccourcis">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {data.shortcuts.map((shortcut) => (
              <DashboardAction
                key={shortcut.label}
                href={shortcut.href}
                label={shortcut.label}
                enabled={getShortcutEnabled(shortcut.label, permissions)}
                compact
              />
            ))}
          </div>
        </Panel>
      </main>
    </>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-app-border bg-app-card p-5 shadow-sm">
      <h2 className="text-lg font-bold text-app-text">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "primary" | "success" | "info" | "warning" | "error";
}) {
  return (
    <article className="rounded-lg border border-app-border bg-app-card p-4 shadow-sm">
      <div className={`h-1.5 w-10 rounded-full ${getToneBarClass(tone)}`} />
      <p className="mt-4 text-xs font-semibold text-app-muted">{label}</p>
      <p className="mt-2 truncate text-2xl font-bold text-app-text">{value}</p>
    </article>
  );
}

function AlertItem({ alert }: { alert: DashboardAlert }) {
  return (
    <div className={`rounded-lg border p-4 ${getAlertClass(alert.tone)}`}>
      <p className="font-semibold">{alert.title}</p>
      <p className="mt-1 text-sm leading-6">{alert.description}</p>
    </div>
  );
}

function SalesBars({ rows, currency }: { rows: SalesDay[]; currency: string }) {
  const maxRevenue = Math.max(...rows.map((row) => row.revenue), 1);

  return (
    <div className="grid gap-3">
      {rows.map((row) => (
        <div key={row.label} className="grid grid-cols-[44px_1fr_auto] items-center gap-3">
          <p className="text-sm font-semibold text-app-muted">{row.label}</p>
          <div className="h-3 overflow-hidden rounded-full bg-primary-50">
            <div
              className="h-full rounded-full bg-primary-600"
              style={{ width: Math.max((row.revenue / maxRevenue) * 100, 8) + "%" }}
            />
          </div>
          <p className="text-sm font-semibold text-app-text">
            {formatCurrency(row.revenue, currency)}
          </p>
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ label }: { label: string }) {
  const isPaid = label.toLowerCase().includes("pay");

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
        isPaid
          ? "bg-success-50 text-success-700 ring-success-100"
          : "bg-primary-50 text-primary-700 ring-primary-100"
      }`}
    >
      {label}
    </span>
  );
}

function EmptyDashboard() {
  return (
    <div className="rounded-lg border border-app-border bg-app-card p-5 text-sm leading-6 text-app-muted shadow-sm">
      Aucune donnée métier n'est encore disponible pour ce dashboard. Les sections se
      rempliront automatiquement avec les produits, ventes, stocks et activités.
    </div>
  );
}

function EmptyText({ message }: { message: string }) {
  return <p className="text-sm leading-6 text-app-muted">{message}</p>;
}

function getActionClass(tone: string, enabled = true) {
  const base =
    "inline-flex min-h-11 items-center justify-center rounded-md px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-4";

  if (!enabled) {
    return base + " cursor-not-allowed bg-app-border text-app-muted opacity-70";
  }

  if (tone === "success") {
    return base + " bg-success-600 text-white hover:bg-success-700 focus:ring-success-100";
  }

  if (tone === "info") {
    return base + " bg-cyan-500 text-white hover:bg-cyan-600 focus:ring-cyan-100";
  }

  if (tone === "secondary") {
    return base + " border border-app-border bg-app-card text-app-text hover:bg-primary-50 focus:ring-primary-100";
  }

  return base + " bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-200";
}

function getToneBarClass(tone: string) {
  if (tone === "success") return "bg-success-500";
  if (tone === "info") return "bg-cyan-500";
  if (tone === "warning") return "bg-warning";
  if (tone === "error") return "bg-error";
  return "bg-primary-600";
}

function getAlertClass(tone: DashboardAlert["tone"]) {
  if (tone === "error") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (tone === "info") {
    return "border-cyan-200 bg-cyan-50 text-cyan-700";
  }

  return "border-orange-200 bg-orange-50 text-orange-700";
}
