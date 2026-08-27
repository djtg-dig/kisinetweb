"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { LoadingBubble } from "@/components/ui/loading-bubble";
import {
  getPharmacyDetail,
  getPharmacyPermissions,
} from "@/lib/api";
import {
  getExpirationReport,
  getInventoryReport,
  getReportFeaturesFromPharmacy,
  getReportOverview,
  getSalesReport,
  type ExpirationReport,
  type ExpirationStatus,
  type InventoryReport,
  type ReportFeatures,
  type ReportOverview,
  type SalesReport,
} from "@/lib/api/reports";
import { formatCurrency, formatDate } from "@/lib/dashboard";

/**
 * Page des rapports pharmacie.
 *
 * Cette V1 consomme les 4 endpoints backend existants et garde les calculs
 * métier côté API. Le frontend contrôle seulement l'affichage, les filtres et
 * la pagination.
 */

type ReportsPageProps = {
  params: Promise<{ pharmacyId: string }>;
};

type PageState = "loading" | "ready" | "forbidden" | "feature_unavailable" | "error";
type SectionState = "idle" | "loading" | "ready" | "empty" | "error";
type ReportTab = "overview" | "sales" | "inventory" | "expirations";
type PeriodFilters = { startDate: string; endDate: string };
type KpiCard = { label: string; value: string; tone?: "success" | "warning" | "error" };

const emptyFeatures: ReportFeatures = {
  reports: false,
};

const defaultPeriod: PeriodFilters = {
  startDate: "",
  endDate: "",
};

const expirationStatusOptions: { value: "" | ExpirationStatus; label: string }[] = [
  { value: "", label: "Tous les statuts" },
  { value: "expired", label: "Expirés" },
  { value: "expiring_soon", label: "Expirent bientôt" },
  { value: "valid", label: "Valides" },
  { value: "no_expiration", label: "Sans date" },
];

export default function PharmacyReportsPage({ params }: ReportsPageProps) {
  const [pharmacyId, setPharmacyId] = useState("");
  const [pharmacyName, setPharmacyName] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [features, setFeatures] = useState<ReportFeatures>(emptyFeatures);
  const [pageState, setPageState] = useState<PageState>("loading");
  const [pageError, setPageError] = useState("");
  const [activeTab, setActiveTab] = useState<ReportTab>("overview");
  const [period, setPeriod] = useState<PeriodFilters>(defaultPeriod);
  const [appliedPeriod, setAppliedPeriod] = useState<PeriodFilters>(defaultPeriod);
  const [salesPage, setSalesPage] = useState("1");
  const [inventoryPage, setInventoryPage] = useState("1");
  const [expirationPage, setExpirationPage] = useState("1");
  const [expirationStatus, setExpirationStatus] = useState<"" | ExpirationStatus>("");
  const [overview, setOverview] = useState<ReportOverview | null>(null);
  const [salesReport, setSalesReport] = useState<SalesReport | null>(null);
  const [inventoryReport, setInventoryReport] = useState<InventoryReport | null>(null);
  const [expirationReport, setExpirationReport] = useState<ExpirationReport | null>(null);
  const [sectionState, setSectionState] = useState<SectionState>("idle");
  const [sectionError, setSectionError] = useState("");
  const [contextReloadKey, setContextReloadKey] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isCurrent = true;

    async function readParams() {
      const resolvedParams = await params;
      if (isCurrent) {
        setPharmacyId(resolvedParams.pharmacyId);
      }
    }

    readParams();

    return () => {
      isCurrent = false;
    };
  }, [params]);

  useEffect(() => {
    if (!pharmacyId) {
      return;
    }

    let isCurrent = true;

    async function loadReportsContext() {
      setPageState("loading");
      setPageError("");

      try {
        // Contexte minimum : identité pharmacie, devise, permissions et features du plan.
        const [userPermissions, pharmacy] = await Promise.all([
          getPharmacyPermissions(pharmacyId),
          getPharmacyDetail(pharmacyId),
        ]);
        if (!isCurrent) {
          return;
        }

        const reportFeatures = getReportFeaturesFromPharmacy(pharmacy);
        setFeatures(reportFeatures);
        setPharmacyName(pharmacy.name || "Pharmacie active");
        setCurrency(pharmacy.devise || "USD");

        if (!reportFeatures.reports) {
          setPageState("feature_unavailable");
          return;
        }

        if (!userPermissions.report_view) {
          setPageState("forbidden");
          return;
        }

        setPageState("ready");
      } catch {
        if (!isCurrent) {
          return;
        }
        setPageError("Impossible de préparer les rapports. Veuillez réessayer.");
        setPageState("error");
      }
    }

    loadReportsContext();

    return () => {
      isCurrent = false;
    };
  }, [contextReloadKey, pharmacyId]);

  const availableTabs = useMemo(() => buildAvailableTabs(features), [features]);

  useEffect(() => {
    if (pageState !== "ready" || availableTabs.some((tab) => tab.id === activeTab)) {
      return;
    }

    setActiveTab(availableTabs[0]?.id || "overview");
  }, [activeTab, availableTabs, pageState]);

  useEffect(() => {
    if (!pharmacyId || pageState !== "ready") {
      return;
    }

    let isCurrent = true;

    async function loadActiveReport() {
      setSectionState("loading");
      setSectionError("");

      try {
        if (activeTab === "overview") {
          const data = await getReportOverview(pharmacyId, appliedPeriod);
          if (!isCurrent) return;
          setOverview(data);
          setSectionState("ready");
          return;
        }

        if (activeTab === "sales") {
          const data = await getSalesReport(pharmacyId, {
            ...appliedPeriod,
            page: salesPage,
          });
          if (!isCurrent) return;
          setSalesReport(data);
          setSectionState(data.results.length ? "ready" : "empty");
          return;
        }

        if (activeTab === "inventory") {
          const data = await getInventoryReport(pharmacyId, { page: inventoryPage });
          if (!isCurrent) return;
          setInventoryReport(data);
          setSectionState(data.results.length ? "ready" : "empty");
          return;
        }

        const data = await getExpirationReport(pharmacyId, {
          ...appliedPeriod,
          status: expirationStatus,
          page: expirationPage,
        });
        if (!isCurrent) return;
        setExpirationReport(data);
        setSectionState(data.results.length ? "ready" : "empty");
      } catch {
        if (!isCurrent) {
          return;
        }
        setSectionError(getReportErrorMessage(activeTab));
        setSectionState("error");
      }
    }

    loadActiveReport();

    return () => {
      isCurrent = false;
    };
  }, [
    activeTab,
    appliedPeriod,
    expirationPage,
    expirationStatus,
    inventoryPage,
    pageState,
    pharmacyId,
    reloadKey,
    salesPage,
  ]);

  function applyPeriod() {
    setSalesPage("1");
    setExpirationPage("1");
    setAppliedPeriod(period);
  }

  function resetPeriod() {
    setSalesPage("1");
    setExpirationPage("1");
    setPeriod(defaultPeriod);
    setAppliedPeriod(defaultPeriod);
  }

  if (pageState === "loading") {
    return <ReportsShell pharmacyName={pharmacyName} content={<LoadingBubble label="Chargement des rapports" />} />;
  }

  if (pageState === "forbidden") {
    return (
      <ReportsShell
        pharmacyName={pharmacyName}
        content={<AccessState pharmacyId={pharmacyId} title="Rapports indisponibles" message="Vous n'avez pas accès à ce rapport." />}
      />
    );
  }

  if (pageState === "feature_unavailable") {
    return (
      <ReportsShell
        pharmacyName={pharmacyName}
        content={<AccessState pharmacyId={pharmacyId} title="Rapport non inclus" message="Ce rapport n'est pas inclus dans votre plan actuel." />}
      />
    );
  }

  if (pageState === "error") {
    return (
      <ReportsShell
        pharmacyName={pharmacyName}
        content={<ErrorState message={pageError} onRetry={() => setContextReloadKey((key) => key + 1)} />}
      />
    );
  }

  return (
    <ReportsShell
      pharmacyName={pharmacyName}
      content={
        <>
          <PeriodFilter
            period={period}
            loading={sectionState === "loading"}
            onChange={setPeriod}
            onApply={applyPeriod}
            onReset={resetPeriod}
          />

          <TabNav tabs={availableTabs} activeTab={activeTab} onChange={setActiveTab} />

          {sectionState === "loading" && <ReportSkeleton />}
          {sectionState === "error" && (
            <ErrorState message={sectionError} onRetry={() => setReloadKey((key) => key + 1)} />
          )}
          {activeTab === "overview" && sectionState === "ready" && overview && (
            <OverviewSection overview={overview} currency={currency} />
          )}
          {activeTab === "sales" && sectionState === "empty" && (
            <EmptyState message="Aucune vente trouvée pour cette période." />
          )}
          {activeTab === "sales" && sectionState === "ready" && salesReport && (
            <SalesSection
              report={salesReport}
              currency={currency}
              currentPage={Number(salesPage)}
              onPageChange={(page) => setSalesPage(String(page))}
            />
          )}
          {activeTab === "inventory" && sectionState === "empty" && (
            <EmptyState message="Aucun produit trouvé." />
          )}
          {activeTab === "inventory" && sectionState === "ready" && inventoryReport && (
            <InventorySection
              report={inventoryReport}
              currency={currency}
              currentPage={Number(inventoryPage)}
              onPageChange={(page) => setInventoryPage(String(page))}
            />
          )}
          {activeTab === "expirations" && (
            <ExpirationStatusFilter
              value={expirationStatus}
              loading={sectionState === "loading"}
              onChange={(value) => {
                setExpirationStatus(value);
                setExpirationPage("1");
              }}
            />
          )}
          {activeTab === "expirations" && sectionState === "empty" && (
            <EmptyState message="Aucun produit correspondant à ce filtre." />
          )}
          {activeTab === "expirations" && sectionState === "ready" && expirationReport && (
            <ExpirationsSection
              report={expirationReport}
              currentPage={Number(expirationPage)}
              onPageChange={(page) => setExpirationPage(String(page))}
            />
          )}
        </>
      }
    />
  );
}

function ReportsShell({ pharmacyName, content }: { pharmacyName: string; content: React.ReactNode }) {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-app-background text-app-text lg:min-h-[calc(100vh-4.5rem)]">
      <header className="border-b border-app-border bg-app-surface">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold text-primary-700">{pharmacyName || "Pharmacie active"}</p>
          <h1 className="mt-2 text-3xl font-bold text-app-text">Rapports</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-app-muted">
            Consultez les indicateurs clés des ventes, du stock et des péremptions.
          </p>
        </div>
      </header>
      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:px-8">{content}</main>
    </div>
  );
}

function PeriodFilter({
  period,
  loading,
  onChange,
  onApply,
  onReset,
}: {
  period: PeriodFilters;
  loading: boolean;
  onChange: (period: PeriodFilters) => void;
  onApply: () => void;
  onReset: () => void;
}) {
  return (
    <section className="rounded-lg border border-app-border bg-app-card p-4 shadow-sm">
      <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
        <FilterInput
          label="Date de début"
          type="date"
          value={period.startDate}
          onChange={(value) => onChange({ ...period, startDate: value })}
        />
        <FilterInput
          label="Date de fin"
          type="date"
          value={period.endDate}
          onChange={(value) => onChange({ ...period, endDate: value })}
        />
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" onClick={onApply} disabled={loading}>
            Appliquer
          </Button>
          <Button type="button" variant="secondary" onClick={onReset} disabled={loading}>
            Réinitialiser
          </Button>
        </div>
      </div>
    </section>
  );
}

function TabNav({
  tabs,
  activeTab,
  onChange,
}: {
  tabs: { id: ReportTab; label: string }[];
  activeTab: ReportTab;
  onChange: (tab: ReportTab) => void;
}) {
  return (
    <nav className="flex gap-2 overflow-x-auto rounded-lg border border-app-border bg-app-card p-2 shadow-sm" aria-label="Sections des rapports">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`whitespace-nowrap rounded-md px-4 py-2 text-sm font-semibold transition ${
            activeTab === tab.id
              ? "bg-primary-600 text-white"
              : "text-app-muted hover:bg-primary-50 hover:text-primary-700"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}

function OverviewSection({ overview, currency }: { overview: ReportOverview; currency: string }) {
  const cards: KpiCard[] = [
    { label: "Nombre de ventes", value: formatNumber(overview.salesCount) },
    { label: "Chiffre d'affaires", value: formatCurrency(overview.revenue, currency), tone: "success" },
    { label: "Articles vendus", value: formatNumber(overview.itemsSold) },
    { label: "Produits actifs", value: formatNumber(overview.activeProducts) },
    { label: "Stock total", value: formatNumber(overview.totalStock) },
    { label: "Produits en rupture", value: formatNumber(overview.outOfStockProducts), tone: "error" },
    { label: "Bientôt périmés", value: formatNumber(overview.expiringSoonProducts), tone: "warning" },
    { label: "Produits expirés", value: formatNumber(overview.expiredProducts), tone: "error" },
  ];

  return <KpiGrid cards={cards} />;
}

function SalesSection({
  report,
  currency,
  currentPage,
  onPageChange,
}: {
  report: SalesReport;
  currency: string;
  currentPage: number;
  onPageChange: (page: number) => void;
}) {
  const summaryCards: KpiCard[] = [
    { label: "Nombre de ventes", value: formatNumber(report.summary.salesCount) },
    { label: "Articles vendus", value: formatNumber(report.summary.itemsSold) },
    { label: "Chiffre d'affaires", value: formatCurrency(report.summary.revenue, currency), tone: "success" },
  ];

  return (
    <>
      <KpiGrid cards={summaryCards} />
      <section className="rounded-lg border border-app-border bg-app-card shadow-sm">
        <SectionHeader title="Ventes" description="Liste paginée des ventes retournées par le backend." />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-app-border bg-app-surface text-xs font-semibold uppercase text-app-muted">
                <th className="px-5 py-3">Référence</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Utilisateur</th>
                <th className="px-5 py-3 text-right">Total</th>
                <th className="px-5 py-3 text-right">Articles</th>
              </tr>
            </thead>
            <tbody>
              {report.results.map((sale) => (
                <tr key={sale.reference + sale.date} className="border-b border-app-border last:border-0">
                  <td className="px-5 py-4 font-semibold text-app-text">{sale.reference}</td>
                  <td className="px-5 py-4 text-app-muted">{formatDateTime(sale.date)}</td>
                  <td className="px-5 py-4 text-app-muted">{sale.user}</td>
                  <td className="px-5 py-4 text-right font-bold text-app-text">{formatCurrency(sale.total, currency)}</td>
                  <td className="px-5 py-4 text-right text-app-muted">{formatNumber(sale.itemsCount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <PaginationControls page={currentPage} count={report.count} next={report.next} previous={report.previous} onPageChange={onPageChange} />
    </>
  );
}

function InventorySection({
  report,
  currency,
  currentPage,
  onPageChange,
}: {
  report: InventoryReport;
  currency: string;
  currentPage: number;
  onPageChange: (page: number) => void;
}) {
  const summaryCards: KpiCard[] = [
    { label: "Produits", value: formatNumber(report.summary.productsCount) },
    { label: "Quantité totale", value: formatNumber(report.summary.totalStockQuantity) },
    { label: "Ruptures", value: formatNumber(report.summary.outOfStockProducts), tone: "error" },
    { label: "Stocks faibles", value: formatNumber(report.summary.lowStockProducts), tone: "warning" },
    {
      label: "Valeur estimée",
      value: report.summary.estimatedStockValue === null ? "Non renseignée" : formatCurrency(report.summary.estimatedStockValue, currency),
      tone: "success",
    },
  ];

  return (
    <>
      <KpiGrid cards={summaryCards} />
      <section className="rounded-lg border border-app-border bg-app-card shadow-sm">
        <SectionHeader title="Stock" description="État du stock calculé par le backend." />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[940px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-app-border bg-app-surface text-xs font-semibold uppercase text-app-muted">
                <th className="px-5 py-3">Référence</th>
                <th className="px-5 py-3">Produit</th>
                <th className="px-5 py-3 text-right">Stock</th>
                <th className="px-5 py-3 text-right">Prix achat</th>
                <th className="px-5 py-3 text-right">Prix vente</th>
                <th className="px-5 py-3">Statut</th>
                <th className="px-5 py-3 text-right">Valeur estimée</th>
              </tr>
            </thead>
            <tbody>
              {report.results.map((product) => (
                <tr key={product.reference} className="border-b border-app-border last:border-0">
                  <td className="px-5 py-4 font-semibold text-app-text">{product.reference}</td>
                  <td className="px-5 py-4 text-app-muted">{product.product}</td>
                  <td className="px-5 py-4 text-right font-bold text-app-text">{formatNumber(product.stock)}</td>
                  <td className="px-5 py-4 text-right text-app-muted">{formatNullableMoney(product.purchasePrice, currency)}</td>
                  <td className="px-5 py-4 text-right text-app-muted">{formatNullableMoney(product.salePrice, currency)}</td>
                  <td className="px-5 py-4"><StockStatusBadge status={product.stockStatus} /></td>
                  <td className="px-5 py-4 text-right font-semibold text-app-text">{formatNullableMoney(product.estimatedValue, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <PaginationControls page={currentPage} count={report.count} next={report.next} previous={report.previous} onPageChange={onPageChange} />
    </>
  );
}

function ExpirationsSection({
  report,
  currentPage,
  onPageChange,
}: {
  report: ExpirationReport;
  currentPage: number;
  onPageChange: (page: number) => void;
}) {
  const summaryCards: KpiCard[] = [
    { label: "Expirés", value: formatNumber(report.summary.expired), tone: "error" },
    { label: "Bientôt expirés", value: formatNumber(report.summary.expiringSoon), tone: "warning" },
    { label: "Valides", value: formatNumber(report.summary.valid), tone: "success" },
    { label: "Sans date", value: formatNumber(report.summary.noExpiration) },
  ];

  return (
    <>
      <KpiGrid cards={summaryCards} />
      <section className="rounded-lg border border-app-border bg-app-card shadow-sm">
        <SectionHeader title="Péremptions" description="Produits filtrés par statut de péremption." />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-app-border bg-app-surface text-xs font-semibold uppercase text-app-muted">
                <th className="px-5 py-3">Référence</th>
                <th className="px-5 py-3">Produit</th>
                <th className="px-5 py-3 text-right">Stock actuel</th>
                <th className="px-5 py-3">Date de péremption</th>
                <th className="px-5 py-3">Statut</th>
              </tr>
            </thead>
            <tbody>
              {report.results.map((product) => (
                <tr key={product.reference} className="border-b border-app-border last:border-0">
                  <td className="px-5 py-4 font-semibold text-app-text">{product.reference}</td>
                  <td className="px-5 py-4 text-app-muted">{product.product}</td>
                  <td className="px-5 py-4 text-right font-bold text-app-text">{formatNumber(product.currentStock)}</td>
                  <td className="px-5 py-4 text-app-muted">{formatDate(product.expirationDate || undefined)}</td>
                  <td className="px-5 py-4"><ExpirationStatusBadge status={product.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <PaginationControls page={currentPage} count={report.count} next={report.next} previous={report.previous} onPageChange={onPageChange} />
    </>
  );
}

function KpiGrid({
  cards,
}: {
  cards: KpiCard[];
}) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <article key={card.label} className="rounded-lg border border-app-border bg-app-card p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-app-muted">{card.label}</p>
          <p className={getKpiValueClass(card.tone)}>{card.value}</p>
        </article>
      ))}
    </section>
  );
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="border-b border-app-border px-5 py-4">
      <h2 className="text-lg font-bold text-app-text">{title}</h2>
      <p className="mt-1 text-sm text-app-muted">{description}</p>
    </div>
  );
}

function ExpirationStatusFilter({
  value,
  loading,
  onChange,
}: {
  value: "" | ExpirationStatus;
  loading: boolean;
  onChange: (value: "" | ExpirationStatus) => void;
}) {
  return (
    <section className="rounded-lg border border-app-border bg-app-card p-4 shadow-sm">
      <FilterSelect
        label="Statut de péremption"
        value={value}
        options={expirationStatusOptions}
        disabled={loading}
        onChange={onChange}
      />
    </section>
  );
}

function ReportSkeleton() {
  return (
    <section className="rounded-lg border border-app-border bg-app-card p-5 shadow-sm">
      <div className="grid gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="grid gap-3 rounded-lg border border-app-border bg-app-surface p-4 sm:grid-cols-4">
            <div className="h-5 animate-pulse rounded bg-app-border" />
            <div className="h-5 animate-pulse rounded bg-app-border" />
            <div className="h-5 animate-pulse rounded bg-app-border" />
            <div className="h-5 animate-pulse rounded bg-app-border" />
          </div>
        ))}
      </div>
    </section>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <section className="max-w-2xl rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
      <p className="text-sm font-semibold text-primary-700">Aucun résultat</p>
      <h2 className="mt-2 text-xl font-bold text-app-text">{message}</h2>
      <p className="mt-2 text-sm leading-6 text-app-muted">
        Modifiez les filtres ou revenez plus tard lorsque de nouvelles données seront disponibles.
      </p>
    </section>
  );
}

function AccessState({ pharmacyId, title, message }: { pharmacyId: string; title: string; message: string }) {
  return (
    <section className="max-w-2xl rounded-lg border border-red-200 bg-app-card p-6 shadow-sm">
      <p className="text-sm font-semibold text-red-600">Accès limité</p>
      <h2 className="mt-2 text-xl font-bold text-app-text">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-app-muted">{message}</p>
      <LinkButton href={"/app/pharmacies/" + pharmacyId + "/dashboard"} variant="secondary" className="mt-5">
        Retour au dashboard
      </LinkButton>
    </section>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <section className="max-w-2xl rounded-lg border border-red-200 bg-app-card p-6 shadow-sm">
      <p className="text-sm font-semibold text-red-600">Une erreur s'est produite</p>
      <h2 className="mt-2 text-xl font-bold text-app-text">Impossible de charger le rapport</h2>
      <p className="mt-2 text-sm leading-6 text-app-muted">{message}</p>
      <Button type="button" variant="secondary" onClick={onRetry} className="mt-5">
        Réessayer
      </Button>
    </section>
  );
}

function PaginationControls({
  page,
  count,
  next,
  previous,
  onPageChange,
}: {
  page: number;
  count: number;
  next: string | null;
  previous: string | null;
  onPageChange: (page: number) => void;
}) {
  const pageCount = Math.max(1, Math.ceil(count / 10));

  return (
    <div className="flex flex-col items-center justify-between gap-3 rounded-lg border border-app-border bg-app-card p-4 text-sm sm:flex-row">
      <p className="font-semibold text-app-muted">
        Page {page} sur {pageCount}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={!previous}
          onClick={() => onPageChange(Math.max(1, page - 1))}
          className="rounded-md border border-app-border bg-app-surface px-4 py-2 font-semibold text-app-text transition hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Précédent
        </button>
        <button
          type="button"
          disabled={!next}
          onClick={() => onPageChange(page + 1)}
          className="rounded-md border border-app-border bg-app-surface px-4 py-2 font-semibold text-app-text transition hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Suivant
        </button>
      </div>
    </div>
  );
}

function FilterInput({
  label,
  value,
  type = "text",
  onChange,
}: {
  label: string;
  value: string;
  type?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-app-text">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 rounded-md border border-app-border bg-white px-3 text-sm text-app-text outline-none transition focus:border-primary-300 focus:ring-4 focus:ring-primary-100 dark:bg-app-surface"
      />
    </label>
  );
}

function FilterSelect<T extends string>({
  label,
  value,
  options,
  disabled,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  disabled?: boolean;
  onChange: (value: T) => void;
}) {
  return (
    <label className="grid gap-2 sm:max-w-xs">
      <span className="text-sm font-semibold text-app-text">{label}</span>
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value as T)}
        className="min-h-11 rounded-md border border-app-border bg-white px-3 text-sm text-app-text outline-none transition focus:border-primary-300 focus:ring-4 focus:ring-primary-100 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-app-surface"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function StockStatusBadge({ status }: { status: string }) {
  const label = getStockStatusLabel(status);
  const tone = status === "OUT_OF_STOCK" ? "error" : status === "LOW_STOCK" ? "warning" : "success";

  return <span className={getBadgeClass(tone)}>{label}</span>;
}

function ExpirationStatusBadge({ status }: { status: string }) {
  const tone = status === "expired" ? "error" : status === "expiring_soon" ? "warning" : "success";

  return <span className={getBadgeClass(tone)}>{getExpirationStatusLabel(status)}</span>;
}

function buildAvailableTabs(features: ReportFeatures): { id: ReportTab; label: string }[] {
  // Une seule feature `reports` englobe toutes les sections visibles.
  if (!features.reports) {
    return [];
  }

  return [
    { id: "overview", label: "Vue d'ensemble" },
    { id: "sales", label: "Ventes" },
    { id: "inventory", label: "Stock" },
    { id: "expirations", label: "Péremptions" },
  ];
}

function getKpiValueClass(tone?: "success" | "warning" | "error") {
  const toneClass =
    tone === "success"
      ? "text-success-700"
      : tone === "warning"
        ? "text-warning-700"
        : tone === "error"
          ? "text-red-600"
          : "text-app-text";

  return "mt-3 text-2xl font-bold " + toneClass;
}

function getBadgeClass(tone: "success" | "warning" | "error") {
  if (tone === "error") {
    return "inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700 ring-1 ring-red-200";
  }
  if (tone === "warning") {
    return "inline-flex rounded-full bg-warning-50 px-3 py-1 text-xs font-bold text-warning-700 ring-1 ring-warning-200";
  }
  return "inline-flex rounded-full bg-success-50 px-3 py-1 text-xs font-bold text-success-700 ring-1 ring-success-200";
}

function getStockStatusLabel(status: string) {
  switch (status) {
    case "OUT_OF_STOCK":
      return "Rupture";
    case "LOW_STOCK":
      return "Stock faible";
    case "IN_STOCK":
      return "En stock";
    default:
      return status;
  }
}

function getExpirationStatusLabel(status: string) {
  switch (status) {
    case "expired":
      return "Expiré";
    case "expiring_soon":
      return "Expire bientôt";
    case "valid":
      return "Valide";
    case "no_expiration":
      return "Sans date";
    default:
      return status;
  }
}

function getReportErrorMessage(tab: ReportTab) {
  if (tab === "sales") {
    return "Impossible de charger le rapport des ventes.";
  }
  if (tab === "inventory") {
    return "Impossible de charger le rapport du stock.";
  }
  if (tab === "expirations") {
    return "Impossible de charger le rapport des péremptions.";
  }
  return "Impossible de charger le rapport.";
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("fr-FR").format(value);
}

function formatNullableMoney(value: number | null, currency: string) {
  return value === null ? "Non renseigné" : formatCurrency(value, currency);
}

function formatDateTime(value: string) {
  if (!value) {
    return "Non renseignée";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
