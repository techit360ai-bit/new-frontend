// frontend/src/lib/api/incubation.ts
//
// Incubation Hub pipeline — ai-router /api/v1/incubation/pipeline/run.
// Returns the persisted project_id so the analyzed venture can flow into a workspace.

import { apiPost, apiUpload, withFallback } from "./client";
import { domainPost } from "@/lib/domainApi";

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

/** POST /api/v1/incubation/document/upload — upload a document for AI diagnosis. */
export function uploadIncubationDocument(file: File): Promise<Record<string, unknown> | null> {
  const formData = new FormData();
  formData.append("file", file);
  return withFallback(
    () => apiUpload<Record<string, unknown>>("/incubation/document/upload", formData),
    () => null,
    "document upload",
  );
}

// ---------------------------------------------------------------------------
// Fast-Track Intake — for startups with existing codebases / business plans
// ---------------------------------------------------------------------------

export interface FastTrackPayload {
  startup_name: string;
  industry: string;
  stage: string;
  one_liner: string;
  repo_url?: string;
  document_id?: string;
  focus_areas?: string[];
}

/** POST /api/v1/incubation/fast-track/run — enriched pipeline for existing startups. */
export function runFastTrack(payload: FastTrackPayload): Promise<PipelineBlueprint | null> {
  return withFallback(
    () => apiPost<PipelineBlueprint>("/incubation/fast-track/run", payload),
    () => null,
    "fast-track pipeline",
  );
}

/** POST /api/domain/incubation/publish — publish a scored project to investor deal flow. */
export function publishToInvestors(projectId: string): Promise<{ ok: boolean; snapshotId?: string }> {
  return domainPost<{ ok: boolean; snapshotId?: string }>("/incubation/publish", { projectId });
}
