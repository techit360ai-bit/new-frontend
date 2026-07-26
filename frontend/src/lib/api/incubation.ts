// frontend/src/lib/api/incubation.ts
//
// Incubation Hub pipeline — ai-router /api/v1/incubation/pipeline/run.
// Returns the persisted project_id so the analyzed venture can flow into a workspace.

import { apiPost, withFallback } from "./client";

export interface PipelineBlueprint {
  project_id?: string;
  venture_name?: string;
  unicorn_potential_score?: number;
  investment_score?: number;
  pivot_needed?: boolean;
  [k: string]: unknown;
}

/** POST /api/v1/incubation/pipeline/run — runs the venture pipeline, persists an analysis. */
export function runVenturePipeline(ventureData: Record<string, unknown>): Promise<PipelineBlueprint | null> {
  return withFallback(
    () => apiPost<PipelineBlueprint>("/incubation/pipeline/run", ventureData),
    () => null,
    "venture pipeline",
  );
}

export interface IdeaDiagnostic {
  /** Structured venture profile extracted by the VentureIntake agent. */
  structured_profile?: Record<string, unknown> | null;
  /** Recommended next actions for the founder. */
  next_steps?: string[] | null;
  [k: string]: unknown;
}

/** POST /api/v1/incubation/idea/diagnose — quick idea diagnostic (1 credit, Free+). */
export function diagnoseIdea(ideaData: Record<string, unknown>): Promise<IdeaDiagnostic | null> {
  return withFallback(
    () => apiPost<IdeaDiagnostic>("/incubation/idea/diagnose", ideaData),
    () => null,
    "idea diagnostic",
  );
}

/** POST /api/v1/incubation/unicorn/analyze — unicorn potential analysis. */
export function analyzeUnicorn(ventureData: Record<string, unknown>): Promise<Record<string, unknown> | null> {
  return withFallback(
    () => apiPost<Record<string, unknown>>("/incubation/unicorn/analyze", ventureData),
    () => null,
    "unicorn analysis",
  );
}

/** POST /api/v1/incubation/market/analyze — market validation analysis. */
export function analyzeMarket(ventureData: Record<string, unknown>): Promise<Record<string, unknown> | null> {
  return withFallback(
    () => apiPost<Record<string, unknown>>("/incubation/market/analyze", ventureData),
    () => null,
    "market analysis",
  );
}

/** POST /api/v1/incubation/strategy/generate — startup strategy generation. */
export function generateStrategy(ventureData: Record<string, unknown>): Promise<Record<string, unknown> | null> {
  return withFallback(
    () => apiPost<Record<string, unknown>>("/incubation/strategy/generate", ventureData),
    () => null,
    "strategy generation",
  );
}

/** POST /api/v1/incubation/business-plan/generate — business plan generation. */
export function generateBusinessPlan(ventureData: Record<string, unknown>): Promise<Record<string, unknown> | null> {
  return withFallback(
    () => apiPost<Record<string, unknown>>("/incubation/business-plan/generate", ventureData),
    () => null,
    "business plan generation",
  );
}

/** POST /api/v1/incubation/pivot/analyze — pivot analysis. */
export function analyzePivot(ventureData: Record<string, unknown>): Promise<Record<string, unknown> | null> {
  return withFallback(
    () => apiPost<Record<string, unknown>>("/incubation/pivot/analyze", ventureData),
    () => null,
    "pivot analysis",
  );
}

/** POST /api/v1/incubation/investor-readiness/generate — investor readiness report. */
export function generateInvestorReadiness(ventureData: Record<string, unknown>): Promise<Record<string, unknown> | null> {
  return withFallback(
    () => apiPost<Record<string, unknown>>("/incubation/investor-readiness/generate", ventureData),
    () => null,
    "investor readiness",
  );
}

/** POST /api/v1/incubation/finance/analyze — finance strategy analysis. */
export function analyzeFinance(ventureData: Record<string, unknown>): Promise<Record<string, unknown> | null> {
  return withFallback(
    () => apiPost<Record<string, unknown>>("/incubation/finance/analyze", ventureData),
    () => null,
    "finance analysis",
  );
}

/** POST /api/v1/incubation/feasibility/analyze — feasibility analysis. */
export function analyzeFeasibility(ventureData: Record<string, unknown>): Promise<Record<string, unknown> | null> {
  return withFallback(
    () => apiPost<Record<string, unknown>>("/incubation/feasibility/analyze", ventureData),
    () => null,
    "feasibility analysis",
  );
}

/** POST /api/v1/incubation/tech-stack/design — tech architecture design. */
export function designTechStack(ventureData: Record<string, unknown>): Promise<Record<string, unknown> | null> {
  return withFallback(
    () => apiPost<Record<string, unknown>>("/incubation/tech-stack/design", ventureData),
    () => null,
    "tech stack design",
  );
}
