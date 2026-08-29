// frontend/src/lib/api/gsis.ts
//
// Dashboard intelligence / GSIS — ai-router /api/v1/dashboard/intelligence + /gsis/compute.
// Surfaces the master Global Startup Intelligence Score the frontend never showed.

import { apiGet, apiPost, withFallback } from "./client";

export interface GsisScore {
  gsis: number;
  classification?: string;
  components?: Record<string, number>;
}
export interface DashboardIntelligence {
  gsis: GsisScore | null;
  alerts: { id?: string; type?: string; message: string; severity?: string }[];
  evi?: number;
  [k: string]: unknown;
}

export type GsisStage = "BUILD" | "LAUNCH" | "GROWTH";
export type GsisRiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | "UNKNOWN";
export type GsisReadinessStatus = "NOT_READY" | "APPROACHING" | "READY" | "ADVANCED";

export interface GsisMetricInput {
  value?: number | boolean;
  score?: number;
  previous_value?: number;
  previous_score?: number;
  status?: "observed" | "derived" | "estimated" | "ai_inferred" | "unknown";
  evidence_level?: 1 | 2 | 3 | 4 | 5;
  source?: string;
  observed_at?: string;
}

export interface GsisV2Input {
  startup_id?: string;
  declared_stage?: string;
  business_model?: string;
  geography?: string;
  evaluated_at?: string;
  last_activity_at?: string;
  expected_activity_days?: number;
  legacy_gsis?: number;
  metrics: Record<string, GsisMetricInput | number | boolean>;
}

export interface GsisStageResult {
  declared_stage: string;
  detected_stage: GsisStage;
  confidence: number;
  matches_declaration: boolean | null;
  reason: string;
}

export interface GsisComponent {
  key: string;
  score: number;
  confidence: number;
  status: string;
  source: string;
  freshness: string;
  trend: string;
  change: number | null;
}

export interface GsisV2Scorecard {
  startup_id?: string;
  model: { name: string; version: string; legacy_compatible: boolean };
  evaluated_at: string;
  gsis: number | null;
  stage: GsisStageResult;
  stage_health: number | null;
  momentum: {
    score: number;
    direction: "IMPROVING" | "STABLE" | "DECLINING";
    activity_status: string;
    decay_factor: number;
  };
  pmf: { score: number | null; confidence: number; status: string; interpretation: string };
  confidence: number;
  data_coverage: number;
  health_classification: string;
  risk: {
    score: number | null;
    level: GsisRiskLevel;
    primary_risk: string;
    trend: string;
    radar?: Record<string, { score: number | null; status: string }>;
  };
  readiness: {
    next_stage: string;
    score: number | null;
    status: GsisReadinessStatus;
    blocking_requirements: { metric: string; minimum: number; value: number | null }[];
    satisfied_gates: { metric: string; minimum: number; value: number | null }[];
  };
  bottleneck: { category: string; severity: string; score: number | null; confidence?: number };
  recommendation?: {
    action: string;
    next_milestone: string;
    expected_impact: string;
    time_horizon_days: number;
    owner: string;
    confidence: number;
    success_metric: string;
  };
  components?: Record<string, GsisComponent>;
  strongest_area?: { category: string; score: number } | null;
  weakest_area?: { category: string; score: number } | null;
}

const FALLBACK_INTEL: DashboardIntelligence = {
  gsis: null,
  alerts: [],
};

/** GET /api/v1/dashboard/intelligence — real-time GSIS + alerts for the dashboard. */
export function fetchDashboardIntelligence(): Promise<DashboardIntelligence> {
  return withFallback(
    () => apiGet<DashboardIntelligence>("/dashboard/intelligence"),
    FALLBACK_INTEL,
    "dashboard intelligence",
  );
}

/** POST /api/v1/gsis/compute — compute GSIS from component scores. */
export function computeGsis(componentScores: Record<string, number>): Promise<GsisScore> {
  return apiPost<GsisScore>("/gsis/compute", { component_scores: componentScores });
}

/** Deterministic role-specific GSIS v2 scorecard. Missing evidence remains unknown. */
export function computeGsisV2(payload: GsisV2Input): Promise<GsisV2Scorecard | null> {
  return withFallback(
    () => apiPost<GsisV2Scorecard>("/api/v2/gsis/scorecard", payload),
    null,
    "GSIS v2 scorecard",
  );
}

/** Batch GSIS v2 projections for Deal Intelligence. */
export function computeGsisV2Batch(payloads: GsisV2Input[]): Promise<GsisV2Scorecard[]> {
  return withFallback(
    () => apiPost<{ scorecards: GsisV2Scorecard[] }>("/api/v2/gsis/scorecards", { startups: payloads })
      .then((data) => data.scorecards),
    [],
    "GSIS v2 scorecards",
  );
}
