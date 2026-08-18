// Client API du tableau de bord d'administration IA (Kisinet).
//
// Réutilise le client admin existant (fetchAdminJson) et l'accès JWT admin :
// toutes les routes appelées ici sont réservées aux administrateurs
// (permission IsInternalAdmin côté backend). Aucune donnée sensible n'est
// exposée aux pharmaciens.

import { fetchAdminJson } from "@/lib/api/admin";

// Base des routes du dashboard IA (backend : apps/admin_api/ai_views.py).
const AI_BASE = "/api/admin/ai";

// ---------------------------------------------------------------------------
// Types partagés
// ---------------------------------------------------------------------------

export type AiDurationMs = {
  opencv: number | null;
  vision: number | null;
  gemini: number | null;
  global: number | null;
};

export type AiDashboard = {
  counts: { total: number; today: number; week: number; month: number };
  durations_ms: AiDurationMs;
  errors: { business: number; technical: number };
  rates: { success: number; failure: number };
  averages: {
    medications_per_analysis: number | null;
    ocr_lines_per_analysis: number | null;
  };
  consumption: {
    vision_tokens: number;
    vision_cost_usd: number;
    gemini_tokens: number;
    gemini_cost_usd: number;
    ia_tokens: number;
    ia_cost_usd: number;
  };
  tokens_total: number;
  cost_total_usd: number;
  cost_today_usd: number;
  cost_week_usd: number;
  cost_month_usd: number;
  scores: { image_reading: number | null; prescription_reading: number | null };
};

export type AiVision = {
  ocr_length?: number;
  ocr_characters?: number;
  ocr_preview?: string;
  ocr_lines_count?: number;
  image_reading_score?: number;
  image_width?: number;
  image_height?: number;
};

export type AiStep = {
  stage: string | null;
  model_name: string | null;
  duration_ms: number | null;
  total_tokens: number | null;
  estimated_cost_usd: number | null;
};

// Une analyse telle que remontée par le journal (liste ou détail).
export type AiAnalysis = {
  analysis_id: string;
  date: string | null;
  time: string | null;
  user: string | null;
  pharmacy: string | null;
  image: string | null;
  gemini_model: string | null;
  vision_model: string | null;
  opencv_version: string | null;
  pipeline_version: string | null;
  prompt_version: string | null;
  status: "success" | "error" | "in_progress" | string;
  category: "business" | "technical" | null;
  business_code: string | null;
  error_id: string | null;
  technical_code: string | null;
  stage: string | null;
  error_message: string | null;
  stacktrace: string | null;
  durations_ms: Record<string, number> | null;
  opencv_ms: number | null;
  vision_ms: number | null;
  gemini_ms: number | null;
  total_duration_ms: number | null;
  steps: AiStep[];
  vision: AiVision | null;
  scores: Record<string, unknown> | null;
  medications_count: number | null;
  image_reading_score: number | null;
  prescription_reading_score: number | null;
  total_tokens: number | null;
  estimated_cost_usd: number | null;
  consumption: Record<string, unknown> | null;
  events: Record<string, unknown>[];
  capture_image_url?: string | null;
};

export type AiAnalysisPage = {
  count: number;
  page: number;
  page_size: number;
  results: AiAnalysis[];
};

export type AiSeriesPoint = { date: string; analyses?: number; tokens?: number; cost_usd?: number };

export type AiStatistics = {
  analyses_per_day: AiSeriesPoint[];
  cost_per_day: AiSeriesPoint[];
  token_consumption_per_day: AiSeriesPoint[];
  error_repartition: Record<string, number>;
  business_codes: Record<string, number>;
  technical_codes: Record<string, number>;
  model_repartition: Record<string, number>;
  vision_gemini_split: { vision_tokens: number; gemini_tokens: number };
  avg_durations: AiDurationMs;
};

export type AiAlert = {
  severity: "warning" | "error" | string;
  kind: string;
  message: string;
  value: number | null;
  threshold: number | null;
};

export type AiAlertsResponse = { alerts: AiAlert[] };

export type AiLogRecord = {
  timestamp: string;
  level: string;
  logger: string;
  module: string;
  message: string;
  pathname?: string;
  line?: number;
  process?: number;
  thread?: string;
  prescription_ai?: Record<string, unknown>;
  exception?: string;
};

export type AiLogPage = {
  count: number;
  page: number;
  page_size: number;
  results: AiLogRecord[];
};

// ---------------------------------------------------------------------------
// Filtres de recherche du journal des analyses (section 5 du cahier des charges)
// ---------------------------------------------------------------------------

export type AiAnalysisFilters = {
  pharmacy?: string;
  user?: string;
  date?: string;
  status?: "success" | "error";
  category?: "business" | "technical";
  error_id?: string;
  business_code?: string;
  min_cost?: number;
  min_time?: number;
  min_ocr?: number;
  min_vision_score?: number;
  min_medications?: number;
};

export type AiLogFilters = {
  search?: string;
  level?: "INFO" | "WARNING" | "ERROR";
  date?: string;
  error_id?: string;
  event?: string;
};

// ---------------------------------------------------------------------------
// Fonctions d'appel (réutilisent fetchAdminJson, donc le JWT admin)
// ---------------------------------------------------------------------------

// Charge le tableau de bord global (volumes, durées, erreurs, coûts, scores).
export async function getAiDashboard(): Promise<AiDashboard> {
  return fetchAdminJson<AiDashboard>(`${AI_BASE}/dashboard/`);
}

// Charge les alertes automatiques (temps, coût, erreurs, OCR/Vision, pics).
export async function getAiAlerts(): Promise<AiAlertsResponse> {
  return fetchAdminJson<AiAlertsResponse>(`${AI_BASE}/alerts/`);
}

// Charge la liste paginée et filtrable des analyses.
export async function getAiAnalyses({
  filters = {},
  page = 1,
  pageSize = 20,
}: {
  filters?: AiAnalysisFilters;
  page?: number;
  pageSize?: number;
} = {}): Promise<AiAnalysisPage> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });
  if (page > 1) {
    params.set("page", String(page));
  }
  if (pageSize !== 20) {
    params.set("page_size", String(pageSize));
  }
  const query = params.toString();
  return fetchAdminJson<AiAnalysisPage>(
    `${AI_BASE}/analyses/` + (query ? "?" + query : ""),
  );
}

// Charge le détail complet d'une analyse (image, OCR, Gemini, stacktrace...).
export async function getAiAnalysis(analysisId: string): Promise<AiAnalysis> {
  return fetchAdminJson<AiAnalysis>(
    `${AI_BASE}/analyses/${encodeURIComponent(analysisId)}/`,
  );
}

// Charge les données des graphiques (séries et répartitions).
export async function getAiStatistics(): Promise<AiStatistics> {
  return fetchAdminJson<AiStatistics>(`${AI_BASE}/statistics/`);
}

// Charge le journal brut (recherche, filtres, pagination).
export async function getAiLogs({
  filters = {},
  page = 1,
  pageSize = 50,
}: {
  filters?: AiLogFilters;
  page?: number;
  pageSize?: number;
} = {}): Promise<AiLogPage> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });
  if (page > 1) {
    params.set("page", String(page));
  }
  if (pageSize !== 50) {
    params.set("page_size", String(pageSize));
  }
  const query = params.toString();
  return fetchAdminJson<AiLogPage>(`${AI_BASE}/logs/` + (query ? "?" + query : ""));
}
