import { authenticatedFetch } from "@/lib/api";
import { apiBaseUrl } from "@/lib/carri-account";

/**
 * Client API de la facturation par utilisateur (seat-based).
 *
 * Couvre les endpoints `/api/paiements/` introduits par le backend :
 * portefeuille de credits, journal (ledger), packs de credits, achats de
 * credits, factures d'abonnement et historique des sieges.
 *
 * Ce module est volontairement distinct de `lib/api/invoices.ts` qui, lui,
 * gere les factures de vente (`/api/sales/`). Les deux domaines portent le mot
 * "facture" mais ne partagent ni endpoint ni modele.
 */

// --------------------------------------------------------------------------- //
// Enumerations
// --------------------------------------------------------------------------- //
export type CreditSource = "INCLUDED" | "PURCHASED";

export type CreditLedgerEntryType =
  | "MONTHLY_ALLOCATION"
  | "PURCHASE"
  | "CONSUMPTION"
  | "EXPIRATION"
  | "ADJUSTMENT";

export type InvoiceStatus = "DRAFT" | "ISSUED" | "PAID" | "VOID";

export type InvoiceLineType = "SUBSCRIPTION" | "PRORATA_ADJUSTMENT" | "CREDIT_PACK" | "DISCOUNT";

export type SeatRole = "OWNER" | "MANAGER" | "PHARMACIST" | "EMPLOYEE";

// --------------------------------------------------------------------------- //
// Types du domaine
// --------------------------------------------------------------------------- //

/**
 * Plan de la facturation par siege (`GET /api/paiements/plans/`, endpoint
 * legacy conserve pour compatibilite ; le contrat public officiel des plans
 * reste `GET /api/paiements/pharmacy-plans/`, expose par `lib/api.ts`).
 *
 * Attention : `currency` est ici un identifiant numerique (cle etrangere vers
 * `/api/paiements/currencies/`), et non un code ISO comme dans l'ancienne API.
 * `features` est un objet de booleens, et non un tableau `{label, enabled}`.
 *
 * Prix : `pricePerUserMonth` est le prix par utilisateur et par mois (seule
 * donnee tarifaire d'un plan). Le montant reel d'un abonnement n'est PAS une
 * propriete du plan : il vaut `monthlyAmount` cote abonnement
 * (`PharmacySubscriptionSeatBilling` dans `lib/api.ts`). Le champ deprecie
 * `monthlyPrice` (`pricePerUserMonth * minBillableUsers`, simple prix plancher)
 * a ete retire pour eviter de l'afficher comme un montant facture.
 */
export type PharmacyPlan = {
  id: number;
  code: string;
  name: string;
  description: string;
  version: number;
  pricePerUserMonth: string;
  includedAiCreditPerUserMonth: number;
  currency: number | null;
  minBillableUsers: number;
  features: Record<string, boolean>;
  isActive: boolean;
  /** @deprecated Informatif : `null` signifie illimite. */
  maxUsers: number | null;
  /** @deprecated Derive de `maxUsers === null`. */
  unlimitedUsers: boolean;
  createdAt: string;
  updatedAt: string;
};

/** Portefeuille de credits achetes (`GET /api/paiements/pharmacies/{ref}/wallet/`). */
export type CreditWallet = {
  id: number;
  pharmacy: number | null;
  balance: number;
  /** Alias backend de `balance`. */
  remainingBalance: number;
  purchasedTotal: number;
  consumedTotal: number;
  createdAt: string;
  updatedAt: string;
};

/** Allocation mensuelle de credits inclus dans l'abonnement. */
export type MonthlyCreditAllocation = {
  id: number;
  pharmacyReference: string;
  subscription: number | null;
  periodStart: string;
  periodEnd: string;
  usersSnapshot: number;
  allocatedAmount: number;
  consumedAmount: number;
  expiredAmount: number;
  createdAt: string;
};

/**
 * Ecriture immuable du journal des credits.
 * `amount` est toujours positif : le sens est porte par `entryType`.
 */
export type CreditLedgerEntry = {
  id: number;
  pharmacy: number | null;
  entryType: CreditLedgerEntryType | string;
  source: CreditSource | string;
  amount: number;
  creditPeriod: number | null;
  wallet: number | null;
  usageOperation: number | null;
  idempotencyKey: string;
  createdAt: string;
};

/** Pack de credits achetable (`GET /api/paiements/credit-packs/`). */
export type CreditPack = {
  id: number;
  name: string;
  creditAmount: number;
  price: string;
  currency: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

/** Achat de credits realise par une pharmacie. */
export type CreditPurchase = {
  id: number;
  pharmacy: number | null;
  wallet: number | null;
  pack: number | null;
  credits: number;
  amount: string;
  payment: number | null;
  createdAt: string;
};

/** Ligne de facture d'abonnement. */
export type InvoiceLine = {
  id: number;
  lineType: InvoiceLineType | string;
  label: string;
  quantity: string;
  unitPrice: string;
  amount: string;
};

/**
 * Facture d'abonnement seat-based.
 * A ne pas confondre avec `Invoice` de `lib/api/invoices.ts` (factures de vente).
 */
export type Invoice = {
  id: number;
  pharmacyReference: string;
  number: string;
  periodStart: string;
  periodEnd: string;
  status: InvoiceStatus | string;
  currency: number | null;
  subtotal: string;
  taxAmount: string;
  total: string;
  issuedAt: string | null;
  createdAt: string;
  lines: InvoiceLine[];
};

/** Periode de siege (occupation facturable d'un utilisateur). */
export type MembershipSeatPeriod = {
  id: number;
  userReference: string;
  userName: string;
  role: SeatRole | string;
  seatStartedAt: string;
  /** `null` lorsque le siege est encore ouvert. */
  seatEndedAt: string | null;
  isBillable: boolean;
};

/** Reponse de `GET /api/paiements/pharmacies/{ref}/seats/`. */
export type ActiveSeats = {
  count: number;
  users: MembershipSeatPeriod[];
};

// --------------------------------------------------------------------------- //
// Filtres
// --------------------------------------------------------------------------- //
export type CreditLedgerFilters = {
  source?: CreditSource | string;
  entryType?: CreditLedgerEntryType | string;
  period?: number | string;
  userReference?: string;
  createdAtAfter?: string;
  createdAtBefore?: string;
  ordering?: string;
};

export type BillingInvoiceFilters = {
  status?: InvoiceStatus | string;
  ordering?: string;
};

export type CreditPackFilters = {
  search?: string;
  ordering?: string;
};

export type SeatHistoryFilters = {
  isBillable?: boolean;
};

export type CreateCreditPurchasePayload = {
  packId: number;
  /** Reference idempotente du paiement : un rejeu ne recredite pas deux fois. */
  paymentReference: string;
  currency?: string;
};

// --------------------------------------------------------------------------- //
// Endpoints : plans et packs (catalogue)
// --------------------------------------------------------------------------- //
export async function getBillingPlans(
  filters: { code?: string; search?: string; ordering?: string } = {},
): Promise<PharmacyPlan[]> {
  const params = new URLSearchParams();
  appendFilter(params, "code", filters.code);
  appendFilter(params, "search", filters.search);
  appendFilter(params, "ordering", filters.ordering);

  const data = await fetchBillingJson<unknown>(
    "/api/paiements/plans/" + buildQuery(params),
    "Impossible de charger les plans.",
  );

  return toRecordList(data).map(normalizePlan);
}

export async function getBillingPlan(code: string): Promise<PharmacyPlan> {
  const data = await fetchBillingJson<unknown>(
    "/api/paiements/plans/" + encodeURIComponent(code) + "/",
    "Impossible de charger le plan.",
  );

  return normalizePlan(toRecord(data));
}

export async function getCreditPacks(filters: CreditPackFilters = {}): Promise<CreditPack[]> {
  const params = new URLSearchParams();
  appendFilter(params, "search", filters.search);
  appendFilter(params, "ordering", filters.ordering);

  const data = await fetchBillingJson<unknown>(
    "/api/paiements/credit-packs/" + buildQuery(params),
    "Impossible de charger les packs de credits.",
  );

  return toRecordList(data).map(normalizeCreditPack);
}

export async function getCreditPack(packId: number | string): Promise<CreditPack> {
  const data = await fetchBillingJson<unknown>(
    "/api/paiements/credit-packs/" + encodeURIComponent(String(packId)) + "/",
    "Impossible de charger le pack de credits.",
  );

  return normalizeCreditPack(toRecord(data));
}

// --------------------------------------------------------------------------- //
// Endpoints : portefeuille et journal des credits
// --------------------------------------------------------------------------- //
export async function getCreditWallet(pharmacyReference: string): Promise<CreditWallet> {
  const data = await fetchBillingJson<unknown>(
    pharmacyPath(pharmacyReference, "wallet"),
    "Impossible de charger le portefeuille de credits.",
  );

  return normalizeCreditWallet(toRecord(data));
}

export async function getCreditLedger(
  pharmacyReference: string,
  filters: CreditLedgerFilters = {},
): Promise<CreditLedgerEntry[]> {
  const params = new URLSearchParams();
  appendFilter(params, "source", filters.source);
  appendFilter(params, "entry_type", filters.entryType);
  appendFilter(params, "period", filters.period);
  appendFilter(params, "user_reference", filters.userReference);
  appendFilter(params, "created_at_after", filters.createdAtAfter);
  appendFilter(params, "created_at_before", filters.createdAtBefore);
  appendFilter(params, "ordering", filters.ordering);

  const data = await fetchBillingJson<unknown>(
    pharmacyPath(pharmacyReference, "credit-ledger") + buildQuery(params),
    "Impossible de charger le journal des credits.",
  );

  return toRecordList(data).map(normalizeCreditLedgerEntry);
}

// --------------------------------------------------------------------------- //
// Endpoints : achats de credits
// --------------------------------------------------------------------------- //
export async function getCreditPurchases(pharmacyReference: string): Promise<CreditPurchase[]> {
  const data = await fetchBillingJson<unknown>(
    pharmacyPath(pharmacyReference, "credit-purchases"),
    "Impossible de charger les achats de credits.",
  );

  return toRecordList(data).map(normalizeCreditPurchase);
}

export async function getCreditPurchase(
  pharmacyReference: string,
  purchaseId: number | string,
): Promise<CreditPurchase> {
  const data = await fetchBillingJson<unknown>(
    pharmacyPath(pharmacyReference, "credit-purchases") +
      encodeURIComponent(String(purchaseId)) +
      "/",
    "Impossible de charger l'achat de credits.",
  );

  return normalizeCreditPurchase(toRecord(data));
}

/**
 * Initie un achat de credits.
 *
 * NOTE backend : la route POST est actuellement masquee par la vue de liste
 * (deux `path()` identiques dans `apps/paiements/urls.py`), l'API repond donc
 * `405`. La fonction est fournie pour etre prete des la correction backend.
 */
export async function createCreditPurchase(
  pharmacyReference: string,
  payload: CreateCreditPurchasePayload,
): Promise<CreditPurchase> {
  const data = await fetchBillingJson<unknown>(
    pharmacyPath(pharmacyReference, "credit-purchases"),
    "Impossible d'initier l'achat de credits.",
    {
      method: "POST",
      body: JSON.stringify({
        pack_id: payload.packId,
        pharmacy_reference: pharmacyReference,
        payment_reference: payload.paymentReference,
        ...(payload.currency ? { currency: payload.currency.toUpperCase() } : {}),
      }),
    },
  );

  return normalizeCreditPurchase(toRecord(data));
}

// --------------------------------------------------------------------------- //
// Endpoints : factures d'abonnement
// --------------------------------------------------------------------------- //
export async function getBillingInvoices(
  pharmacyReference: string,
  filters: BillingInvoiceFilters = {},
): Promise<Invoice[]> {
  const params = new URLSearchParams();
  appendFilter(params, "status", filters.status);
  appendFilter(params, "ordering", filters.ordering);

  const data = await fetchBillingJson<unknown>(
    pharmacyPath(pharmacyReference, "invoices") + buildQuery(params),
    "Impossible de charger les factures.",
  );

  return toRecordList(data).map(normalizeInvoice);
}

export async function getBillingInvoice(
  pharmacyReference: string,
  invoiceId: number | string,
): Promise<Invoice> {
  const data = await fetchBillingJson<unknown>(
    pharmacyPath(pharmacyReference, "invoices") + encodeURIComponent(String(invoiceId)) + "/",
    "Impossible de charger la facture.",
  );

  return normalizeInvoice(toRecord(data));
}

/**
 * Telecharge une facture au format texte.
 * Le backend renvoie actuellement une chaine encodee en JSON : on gere les deux cas.
 */
export async function downloadBillingInvoice(
  pharmacyReference: string,
  invoiceId: number | string,
): Promise<string> {
  const data = await fetchBillingJson<unknown>(
    pharmacyPath(pharmacyReference, "invoices") +
      encodeURIComponent(String(invoiceId)) +
      "/download/",
    "Impossible de telecharger la facture.",
  );

  return typeof data === "string" ? data : String(data ?? "");
}

// --------------------------------------------------------------------------- //
// Endpoints : sieges
// --------------------------------------------------------------------------- //
export async function getActiveSeats(pharmacyReference: string): Promise<ActiveSeats> {
  const data = await fetchBillingJson<unknown>(
    pharmacyPath(pharmacyReference, "seats"),
    "Impossible de charger les sieges actifs.",
  );

  const record = toRecord(data);
  const users = toRecordList(record.users).map(normalizeSeatPeriod);

  return {
    count: toInteger(record.count) || users.length,
    users,
  };
}

export async function getSeatHistory(
  pharmacyReference: string,
  filters: SeatHistoryFilters = {},
): Promise<MembershipSeatPeriod[]> {
  const params = new URLSearchParams();
  if (filters.isBillable !== undefined) {
    params.set("is_billable", filters.isBillable ? "true" : "false");
  }

  const data = await fetchBillingJson<unknown>(
    pharmacyPath(pharmacyReference, "seat-history") + buildQuery(params),
    "Impossible de charger l'historique des sieges.",
  );

  return toRecordList(data).map(normalizeSeatPeriod);
}

// --------------------------------------------------------------------------- //
// Endpoints : administration (reserves aux comptes staff)
// --------------------------------------------------------------------------- //
export async function getAdminCreditWallets(
  filters: { search?: string; ordering?: string } = {},
): Promise<CreditWallet[]> {
  const params = new URLSearchParams();
  appendFilter(params, "search", filters.search);
  appendFilter(params, "ordering", filters.ordering);

  const data = await fetchBillingJson<unknown>(
    "/api/paiements/admin/wallets/" + buildQuery(params),
    "Impossible de charger les portefeuilles de credits.",
  );

  return toRecordList(data).map(normalizeCreditWallet);
}

export async function getAdminMonthlyAllocations(
  filters: { pharmacyReference?: string; ordering?: string } = {},
): Promise<MonthlyCreditAllocation[]> {
  const params = new URLSearchParams();
  appendFilter(params, "pharmacy_reference", filters.pharmacyReference);
  appendFilter(params, "ordering", filters.ordering);

  const data = await fetchBillingJson<unknown>(
    "/api/paiements/admin/allocations/" + buildQuery(params),
    "Impossible de charger les allocations mensuelles.",
  );

  return toRecordList(data).map(normalizeMonthlyCreditAllocation);
}

export async function getAdminCreditLedger(
  filters: {
    pharmacyReference?: string;
    source?: CreditSource | string;
    entryType?: CreditLedgerEntryType | string;
    ordering?: string;
  } = {},
): Promise<CreditLedgerEntry[]> {
  const params = new URLSearchParams();
  appendFilter(params, "pharmacy_reference", filters.pharmacyReference);
  appendFilter(params, "source", filters.source);
  appendFilter(params, "entry_type", filters.entryType);
  appendFilter(params, "ordering", filters.ordering);

  const data = await fetchBillingJson<unknown>(
    "/api/paiements/admin/credit-ledger/" + buildQuery(params),
    "Impossible de charger le journal des credits.",
  );

  return toRecordList(data).map(normalizeCreditLedgerEntry);
}

export async function getAdminCreditPurchases(
  filters: { pharmacyReference?: string; ordering?: string } = {},
): Promise<CreditPurchase[]> {
  const params = new URLSearchParams();
  appendFilter(params, "pharmacy_reference", filters.pharmacyReference);
  appendFilter(params, "ordering", filters.ordering);

  const data = await fetchBillingJson<unknown>(
    "/api/paiements/admin/credit-purchases/" + buildQuery(params),
    "Impossible de charger les achats de credits.",
  );

  return toRecordList(data).map(normalizeCreditPurchase);
}

// --------------------------------------------------------------------------- //
// Normalisation
// --------------------------------------------------------------------------- //
function normalizePlan(item: UnknownRecord): PharmacyPlan {
  return {
    id: toInteger(item.id),
    code: toText(item.code),
    name: toText(item.name),
    description: toText(item.description),
    version: toInteger(item.version),
    pricePerUserMonth: toDecimal(item.price_per_user_month),
    includedAiCreditPerUserMonth: toInteger(item.included_ai_credit_per_user_month),
    currency: toNullableInteger(item.currency),
    minBillableUsers: toInteger(item.min_billable_users),
    features: toBooleanMap(item.features),
    isActive: Boolean(item.is_active),
    maxUsers: toNullableInteger(item.max_users),
    unlimitedUsers:
      item.unlimited_users === undefined
        ? item.max_users === null || item.max_users === undefined
        : Boolean(item.unlimited_users),
    createdAt: toText(item.created_at),
    updatedAt: toText(item.updated_at),
  };
}

function normalizeCreditWallet(item: UnknownRecord): CreditWallet {
  const balance = toInteger(item.balance);

  return {
    id: toInteger(item.id),
    pharmacy: toNullableInteger(item.pharmacy),
    balance,
    remainingBalance:
      item.remaining_balance === undefined ? balance : toInteger(item.remaining_balance),
    purchasedTotal: toInteger(item.purchased_total),
    consumedTotal: toInteger(item.consumed_total),
    createdAt: toText(item.created_at),
    updatedAt: toText(item.updated_at),
  };
}

function normalizeMonthlyCreditAllocation(item: UnknownRecord): MonthlyCreditAllocation {
  return {
    id: toInteger(item.id),
    pharmacyReference: toText(item.pharmacy_reference),
    subscription: toNullableInteger(item.subscription),
    periodStart: toText(item.period_start),
    periodEnd: toText(item.period_end),
    usersSnapshot: toInteger(item.users_snapshot),
    allocatedAmount: toInteger(item.allocated_amount),
    consumedAmount: toInteger(item.consumed_amount),
    expiredAmount: toInteger(item.expired_amount),
    createdAt: toText(item.created_at),
  };
}

function normalizeCreditLedgerEntry(item: UnknownRecord): CreditLedgerEntry {
  return {
    id: toInteger(item.id),
    pharmacy: toNullableInteger(item.pharmacy),
    entryType: toText(item.entry_type),
    source: toText(item.source),
    amount: toInteger(item.amount),
    creditPeriod: toNullableInteger(item.credit_period),
    wallet: toNullableInteger(item.wallet),
    usageOperation: toNullableInteger(item.usage_operation),
    idempotencyKey: toText(item.idempotency_key),
    createdAt: toText(item.created_at),
  };
}

function normalizeCreditPack(item: UnknownRecord): CreditPack {
  return {
    id: toInteger(item.id),
    name: toText(item.name),
    creditAmount: toInteger(item.credit_amount),
    price: toDecimal(item.price),
    currency: toNullableInteger(item.currency),
    isActive: Boolean(item.is_active),
    createdAt: toText(item.created_at),
    updatedAt: toText(item.updated_at),
  };
}

function normalizeCreditPurchase(item: UnknownRecord): CreditPurchase {
  return {
    id: toInteger(item.id),
    pharmacy: toNullableInteger(item.pharmacy),
    wallet: toNullableInteger(item.wallet),
    pack: toNullableInteger(item.pack),
    credits: toInteger(item.credits),
    amount: toDecimal(item.amount),
    payment: toNullableInteger(item.payment),
    createdAt: toText(item.created_at),
  };
}

function normalizeInvoiceLine(item: UnknownRecord): InvoiceLine {
  return {
    id: toInteger(item.id),
    lineType: toText(item.line_type),
    label: toText(item.label),
    quantity: toDecimal(item.quantity),
    unitPrice: toDecimal(item.unit_price),
    amount: toDecimal(item.amount),
  };
}

function normalizeInvoice(item: UnknownRecord): Invoice {
  return {
    id: toInteger(item.id),
    pharmacyReference: toText(item.pharmacy_reference),
    number: toText(item.number),
    periodStart: toText(item.period_start),
    periodEnd: toText(item.period_end),
    status: toText(item.status),
    currency: toNullableInteger(item.currency),
    subtotal: toDecimal(item.subtotal),
    taxAmount: toDecimal(item.tax_amount),
    total: toDecimal(item.total),
    issuedAt: toNullableText(item.issued_at),
    createdAt: toText(item.created_at),
    lines: toRecordList(item.lines).map(normalizeInvoiceLine),
  };
}

function normalizeSeatPeriod(item: UnknownRecord): MembershipSeatPeriod {
  return {
    id: toInteger(item.id),
    userReference: toText(item.user_reference),
    userName: toText(item.user_name),
    role: toText(item.role),
    seatStartedAt: toText(item.seat_started_at),
    seatEndedAt: toNullableText(item.seat_ended_at),
    isBillable: Boolean(item.is_billable),
  };
}

// --------------------------------------------------------------------------- //
// Transport
// --------------------------------------------------------------------------- //
type UnknownRecord = Record<string, unknown>;

function pharmacyPath(pharmacyReference: string, segment: string) {
  return (
    "/api/paiements/pharmacies/" + encodeURIComponent(pharmacyReference) + "/" + segment + "/"
  );
}

function buildQuery(params: URLSearchParams) {
  const query = params.toString();
  return query ? "?" + query : "";
}

function appendFilter(params: URLSearchParams, key: string, value?: string | number) {
  if (value === undefined || value === null) {
    return;
  }

  const text = String(value).trim();
  if (text) {
    params.set(key, text);
  }
}

async function fetchBillingJson<T>(
  path: string,
  fallbackMessage: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await authenticatedFetch(
    apiBaseUrl.replace(/\/$/, "") + path,
    {
      cache: "no-store",
      ...init,
      headers: {
        Accept: "application/json",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
    },
  );

  const responseText = await response.text();
  const data = parseJsonResponse(responseText);

  if (!response.ok) {
    throw new Error(getApiErrorMessage(data, fallbackMessage));
  }

  return data as T;
}

function parseJsonResponse(responseText: string): unknown {
  if (!responseText.trim()) {
    return null;
  }

  try {
    return JSON.parse(responseText) as unknown;
  } catch {
    return responseText;
  }
}

function getApiErrorMessage(data: unknown, fallbackMessage: string): string {
  if (!data) {
    return fallbackMessage;
  }

  if (typeof data === "string") {
    return data;
  }

  if (typeof data !== "object") {
    return fallbackMessage;
  }

  const detail = (data as { detail?: unknown }).detail;
  if (typeof detail === "string") {
    return detail;
  }

  for (const value of Object.values(data as UnknownRecord)) {
    if (typeof value === "string") {
      return value;
    }

    if (Array.isArray(value)) {
      const firstText = value.find((entry) => typeof entry === "string");
      if (typeof firstText === "string") {
        return firstText;
      }
    }
  }

  return fallbackMessage;
}

// --------------------------------------------------------------------------- //
// Conversions
// --------------------------------------------------------------------------- //
function toRecord(value: unknown): UnknownRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as UnknownRecord) : {};
}

/** Accepte un tableau brut comme une enveloppe paginee `{results: []}`. */
function toRecordList(value: unknown): UnknownRecord[] {
  const rows = Array.isArray(value)
    ? value
    : Array.isArray(toRecord(value).results)
      ? (toRecord(value).results as unknown[])
      : [];

  return rows.filter((item): item is UnknownRecord => Boolean(item) && typeof item === "object");
}

function toText(value: unknown): string {
  return value === undefined || value === null ? "" : String(value);
}

function toNullableText(value: unknown): string | null {
  return value === undefined || value === null ? null : String(value);
}

/** Les montants decimaux transitent en chaine pour eviter toute perte de precision. */
function toDecimal(value: unknown): string {
  return value === undefined || value === null ? "" : String(value);
}

function toInteger(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toNullableInteger(value: unknown): number | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toBooleanMap(value: unknown): Record<string, boolean> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value as UnknownRecord).map(([key, entry]) => [key, Boolean(entry)]),
  );
}

// --------------------------------------------------------------------------- //
// Crédits IA restants d'un utilisateur dans une pharmacie
// --------------------------------------------------------------------------- //

/**
 * Réponse de l'endpoint
 * `GET /api/paiements/pharmacies/{pharmacy_id}/users/{user_reference}/ai-credits/`.
 *
 * Seul le solde `remaining` nous intéresse pour l'affichage dans l'interface
 * de vente, mais le type reflète la structure renvoyée par le backend.
 */
export type UserAiCredits = {
  pharmacyReference: string;
  userReference: string;
  planCode: string;
  periodStart?: string;
  periodEnd?: string;
  included: number;
  used: number;
  remaining: number;
  usagePercent: number;
};

/**
 * Crédits IA restants d'un utilisateur au sein d'une pharmacie pour la période
 * courante. Source de vérité : le compteur par utilisateur du backend.
 */
export async function getUserAiCredits(
  pharmacyId: string,
  userReference: string,
): Promise<UserAiCredits> {
  const data = await fetchBillingJson<UnknownRecord>(
    "/api/paiements/pharmacies/" +
      encodeURIComponent(pharmacyId) +
      "/users/" +
      encodeURIComponent(userReference) +
      "/ai-credits/",
    "Impossible de charger les crédits IA restants.",
  );

  const pharmacy = toRecord(data.pharmacy);
  const user = toRecord(data.user);
  const plan = toRecord(data.plan);
  const period = toRecord(data.period);
  const credits = toRecord(data.credits);

  return {
    pharmacyReference: toText(pharmacy.reference),
    userReference: toText(user.reference),
    planCode: toText(plan.code),
    periodStart: toNullableText(period.start) ?? undefined,
    periodEnd: toNullableText(period.end) ?? undefined,
    included: toInteger(credits.included),
    used: toInteger(credits.used),
    remaining: toInteger(credits.remaining),
    usagePercent: toInteger(credits.usage_percent),
  };
}

// --------------------------------------------------------------------------- //
// Crédits IA restants d'une pharmacie (quotas inclus + consommation)
// --------------------------------------------------------------------------- //

/**
 * Réponse de l'endpoint
 * `GET /api/paiements/pharmacies/{pharmacy_id}/ai-credits/`.
 *
 * Renvoie le quota de crédits d'analyse IA inclus pour la période courante,
 * les crédits consommés, restants et le pourcentage d'utilisation.
 */
export type PharmacyAiCredits = {
  pharmacyReference: string;
  planCode: string;
  planName: string;
  periodStart?: string;
  periodEnd?: string;
  billableUsers: number;
  included: number;
  used: number;
  remaining: number;
  usagePercent: number;
};

/**
 * Crédits IA restants d'une pharmacie pour la période courante. Source de
 * vérité : le système de périodes/crédits du backend.
 */
export async function getPharmacyAiCredits(pharmacyId: string): Promise<PharmacyAiCredits> {
  const data = await fetchBillingJson<UnknownRecord>(
    "/api/paiements/pharmacies/" + encodeURIComponent(pharmacyId) + "/ai-credits/",
    "Impossible de charger les crédits IA de la pharmacie.",
  );

  const pharmacy = toRecord(data.pharmacy);
  const plan = toRecord(data.plan);
  const period = toRecord(data.period);
  const billing = toRecord(data.billing);
  const credits = toRecord(data.credits);

  return {
    pharmacyReference: toText(pharmacy.reference),
    planCode: toText(plan.code),
    planName: toText(plan.name),
    periodStart: toNullableText(period.start) ?? undefined,
    periodEnd: toNullableText(period.end) ?? undefined,
    billableUsers: toInteger(billing.billable_users),
    included: toInteger(credits.included),
    used: toInteger(credits.used),
    remaining: toInteger(credits.remaining),
    usagePercent: toInteger(credits.usage_percent),
  };
}
