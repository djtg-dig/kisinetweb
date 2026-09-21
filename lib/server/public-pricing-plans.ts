import "server-only";

import { cache } from "react";
import { signedBackendFetch } from "@/lib/server/backend-fetch";
import type {
  PharmacyPlan,
  PharmacyPlanAnalysisCredits,
  PharmacyPlanFeature,
} from "@/lib/api";

type UnknownRecord = Record<string, unknown>;

export const PUBLIC_PRICING_PLANS_PATH = "/api/paiements/pharmacy-plans/";
export const PUBLIC_PRICING_PLANS_REVALIDATE_SECONDS = 900;

function getRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === "object" ? (value as UnknownRecord) : null;
}

function getText(value: unknown) {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function toRecordList(value: unknown): UnknownRecord[] {
  const record = getRecord(value);
  const rows = Array.isArray(value)
    ? value
    : Array.isArray(record?.results)
      ? record.results
      : [];

  return rows.filter(
    (item: unknown): item is UnknownRecord =>
      Boolean(item) && typeof item === "object",
  );
}

function normalizePlanFeaturesMap(value: unknown): Record<string, boolean> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(value as UnknownRecord).map(([key, entry]) => [key, Boolean(entry)]),
  );
}

function normalizePlanFeatures(
  value: unknown,
  featuresMap?: Record<string, boolean>,
): PharmacyPlanFeature[] {
  if (Array.isArray(value)) {
    return value
      .filter((feature: unknown): feature is UnknownRecord =>
        Boolean(feature) && typeof feature === "object",
      )
      .map((feature) => ({
        label: String(feature.label || feature.key || ""),
        enabled: Boolean(feature.enabled),
      }));
  }

  return featuresMap
    ? Object.entries(featuresMap).map(([label, enabled]) => ({ label, enabled }))
    : [];
}

function normalizePharmacyPlanAnalysisCredits(
  item: UnknownRecord,
): PharmacyPlanAnalysisCredits {
  return {
    enabled: Boolean(item.enabled),
    label: String(item.label || "Crédits d'analyse"),
    monthlyAnalysisCredits: Number(item.monthly_analysis_credits || 0),
    perUserMonthlyAnalysisCredits: Number(item.per_user_monthly_analysis_credits || 0),
    multiplyByDurationMonths: Boolean(item.multiply_by_duration_months),
    unusedCreditsExpire: Boolean(item.unused_credits_expire),
    periodScope: String(item.period_scope || ""),
  };
}

function normalizePharmacyPlan(item: UnknownRecord): PharmacyPlan {
  const featuresMap = normalizePlanFeaturesMap(item.features);

  return {
    id: Number(item.id),
    code: String(item.code || ""),
    name: String(item.name || item.label || ""),
    description: String(item.description || item.tagline || ""),
    priceMonthly: getText(
      item.price_monthly ?? item.price ?? item.monthly_price ?? item.price_per_user_month,
    ),
    currency: typeof item.currency === "string" ? item.currency : "",
    maxUsers:
      item.max_users === null || item.max_users === undefined
        ? null
        : Number(item.max_users),
    maxBranches:
      item.max_branches === null || item.max_branches === undefined
        ? null
        : Number(item.max_branches),
    unlimitedUsers:
      item.unlimited_users === undefined
        ? item.max_users === null
        : Boolean(item.unlimited_users),
    unlimitedProducts: Boolean(item.unlimited_products),
    unlimitedBranches: Boolean(item.unlimited_branches),
    features: normalizePlanFeatures(item.features, featuresMap),
    durations: Array.isArray(item.durations)
      ? item.durations
          .filter((duration: unknown): duration is UnknownRecord =>
            Boolean(duration) && typeof duration === "object",
          )
          .map((duration) => ({
            durationMonths: Number(duration.duration_months),
            label: String(duration.label || ""),
            discountPercentage: Number(duration.discount_percentage),
            totalAmount: String(duration.total_amount ?? ""),
          }))
      : [],
    analysisCredits:
      item.analysis_credits && typeof item.analysis_credits === "object"
        ? normalizePharmacyPlanAnalysisCredits(item.analysis_credits as UnknownRecord)
        : undefined,
    highlighted: Boolean(item.highlighted ?? item.is_popular ?? item.popular),
    version: item.version === undefined ? undefined : Number(item.version),
    pricePerUserMonth: getText(item.price_per_user_month),
    includedAiCreditPerUserMonth:
      item.included_ai_credit_per_user_month === undefined
        ? undefined
        : Number(item.included_ai_credit_per_user_month),
    minBillableUsers:
      item.min_billable_users === undefined
        ? undefined
        : Number(item.min_billable_users),
    currencyId: typeof item.currency === "number" ? item.currency : undefined,
    isActive: item.is_active === undefined ? undefined : Boolean(item.is_active),
    featuresMap,
    createdAt: getText(item.created_at),
    updatedAt: getText(item.updated_at),
  };
}

export async function getPublicPricingPlansServerUncached(): Promise<
  PharmacyPlan[]
> {
  const response = await signedBackendFetch({
    path: PUBLIC_PRICING_PLANS_PATH,
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "force-cache",
    revalidate: PUBLIC_PRICING_PLANS_REVALIDATE_SECONDS,
  });

  if (!response.ok) {
    throw new Error("Impossible de charger les tarifs publics.");
  }

  const data = (await response.json()) as unknown;

  return toRecordList(data)
    .map(normalizePharmacyPlan)
    .filter((plan) => Boolean(plan.id) || Boolean(plan.name));
}

export const getPublicPricingPlansServer = cache(getPublicPricingPlansServerUncached);
