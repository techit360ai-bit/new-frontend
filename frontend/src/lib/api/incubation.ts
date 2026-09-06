// frontend/src/lib/api/incubation.ts
//
// Incubation Hub pipeline — ai-router /api/v1/incubation/pipeline/run.
// Returns the persisted project_id so the analyzed venture can flow into a workspace.

import { apiGet, apiPost, apiUpload, getAuthToken, withFallback } from "./client";
import { apiUrl } from "./config";
import { domainPost } from "@/lib/domainApi";

export interface PipelineBlueprint {
  project_id?: string;
  venture_name?: string;
  unicorn_potential_score?: number;
  investment_score?: number;
  pivot_needed?: boolean;
  workspace_id?: string;
  incubation_session_id?: string;
  validation?: ValidationStartResult;
  [k: string]: unknown;
}

export interface FounderQuestion {
  id: string;
  priority?: string;
  category?: string;
  question: string;
  why_it_matters?: string;
  answer_type?: string;
}

export interface IncubationSession {
  id: string;
  projectId?: string | null;
  status: string;
  currentPhase: number;
  version: number;
  state: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface ValidationStartResult {
  session: IncubationSession;
  founder_questions: FounderQuestion[];
  founder_answers?: Record<string, string>;
  evidence?: Record<string, unknown>;
  geography?: Record<string, unknown>;
  company_building?: Record<string, unknown>;
  pmf_validation?: Record<string, unknown>;
  mvp_plan?: Record<string, unknown>;
  venture_data?: Record<string, unknown>;
  blueprint?: Record<string, unknown>;
  workspace_id?: string;
}

export interface ValidationSessionSummary {
  id: string;
  projectId?: string | null;
  status: string;
  currentPhase: number;
  version: number;
  ventureName: string;
  summary: string;
  workspaceId?: string | null;
  questionCount: number;
  answeredCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomerValidationSession {
  id: string;
  projectId: string;
  title: string;
  description?: string | null;
  objective: string;
  mode: string;
  stage: string;
  questions: Array<{ id: string; question: string; answer_type?: string; required?: boolean; options?: string[] }>;
  status: string;
  configurationLocked: boolean;
  totalResponseCount: number;
  qualifiedResponseCount: number;
  qualityCounts: Record<string, number>;
  confidenceLevel: string;
  expiresAt?: string | null;
  publicToken?: string;
  publicUrlPath?: string;
}

export function createCustomerValidationSession(body: Record<string, unknown>) {
  return apiPost<CustomerValidationSession>("/incubation/validate/sessions", body);
}

export function draftCustomerValidationQuestions(body: Record<string, unknown>) {
  return apiPost<{ questions: Array<{ id: string; question: string; answer_type: string; required: boolean; options: string[] }>; modelUsed?: string }>("/incubation/validate/questions", body);
}

export function customerValidationEmbedCode(url: string) {
  return `<iframe title="Customer validation" src="${url}?embed=true" loading="lazy" style="width:100%;min-height:520px;border:0"></iframe>`;
}


export function fetchCustomerValidationSessions(limit = 20) {
  return apiGet<{ sessions: CustomerValidationSession[] }>(`/incubation/validate/sessions?limit=${limit}`);
}

export function transitionCustomerValidationSession(sessionId: string, action: "activate" | "pause" | "complete") {
  return apiPost<CustomerValidationSession>(`/incubation/validate/sessions/${encodeURIComponent(sessionId)}/${action}`);
}

export function fetchCustomerValidationFindings(sessionId: string) {
  return apiGet<{ recurringPainPoints: Array<{ theme: string; count: number; share: number; quotes: string[] }>; whatWeLearned: string[]; whatRemainsUncertain: string[] }>(`/incubation/validate/sessions/${encodeURIComponent(sessionId)}/findings`);
}

export function fetchCustomerValidationRecommendations(sessionId: string) {
  return apiGet<{ recommendations: Array<{ id: string; title: string; reason: string; urgency: string; confidence: string; sourceEngines: string[]; status: string }> }>(`/incubation/validate/sessions/${encodeURIComponent(sessionId)}/recommendations`);
}

export function createCustomerValidationSynthesis(sessionId: string) {
  return apiPost<{ synthesis: { verdict: string; confidence: string; findings: Record<string, unknown>; limitations: string[] } }>(`/incubation/validate/sessions/${encodeURIComponent(sessionId)}/synthesis`);
}

export function createCustomerValidationShare(sessionId: string, scope: string) {
  return apiPost<{ shareToken: string; report: Record<string, unknown> }>(`/incubation/validate/sessions/${encodeURIComponent(sessionId)}/share`, { scope });
}

export function customerValidationShareTargets(url: string) {
  const encoded = encodeURIComponent(url);
  return {
    whatsapp: `https://wa.me/?text=${encoded}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`,
    x: `https://x.com/intent/post?url=${encoded}`,
    telegram: `https://t.me/share/url?url=${encoded}`,
    email: `mailto:?subject=Customer%20evidence&body=${encoded}`,
    sms: `sms:?body=${encoded}`,
  };
}

export function openCustomerValidationStream(sessionId: string, onSnapshot: (snapshot: { response_count: number; qualified_count: number; confidence: string; synthesis_status: string }) => void) {
  const source = new EventSource(apiUrl(`/incubation/validate/sessions/${encodeURIComponent(sessionId)}/stream`), { withCredentials: true });
  source.addEventListener("validation_snapshot", (event) => { try { onSnapshot(JSON.parse((event as MessageEvent).data)); } catch { /* ignore malformed freshness events */ } });
  return () => source.close();
}

export async function fetchPublicCustomerValidation(token: string) {
  const response = await fetch(apiUrl(`/validate/${encodeURIComponent(token)}`));
  if (!response.ok) throw new Error("Validation link is unavailable");
  return response.json() as Promise<CustomerValidationSession>;
}

export async function submitPublicCustomerValidation(token: string, answers: Record<string, unknown>) {
  const anonymousKey = "techit_validation_anonymous_id";
  let anonymousId = localStorage.getItem(anonymousKey);
  if (!anonymousId) { anonymousId = crypto.randomUUID(); localStorage.setItem(anonymousKey, anonymousId); }
  const response = await fetch(apiUrl(`/validate/${encodeURIComponent(token)}`), {
    method: "POST", headers: { "Content-Type": "application/json", "X-Validation-Anonymous-Id": anonymousId },
    body: JSON.stringify({ answers }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(String(data.detail || "Response could not be recorded"));
  return data as { message: string };
}

export interface SandboxBuild {
  id: string;
  status: string;
  scope: string;
  checks?: Record<string, { passed?: boolean; detail?: string }>;
  previewUrl?: string;
  artifactPath?: string;
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

/** POST /api/v1/incubation/idea/diagnose — quick idea diagnostic. */
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
    () => apiPost<Record<string, unknown>>("/incubation/pivot/analyze", {
      venture_data: ventureData,
      unicorn_score: ventureData.unicorn_potential_score ?? 0,
    }),
    () => null,
    "pivot analysis",
  );
}

function runAnalysis(path: string, ventureData: Record<string, unknown>, label: string) {
  return withFallback(
    () => apiPost<Record<string, unknown>>(path, ventureData),
    () => null,
    label,
  );
}

export const analyzePMF = (data: Record<string, unknown>) =>
  runAnalysis("/incubation/pmf/validate", data, "PMF validation");
export const analyzeSWOT = (data: Record<string, unknown>) =>
  runAnalysis("/incubation/swot/analyze", data, "SWOT analysis");
export const analyzeMonetization = (data: Record<string, unknown>) =>
  runAnalysis("/incubation/monetization/analyze", data, "monetization analysis");
export const analyzeCompanyBuilding = (data: Record<string, unknown>) =>
  runAnalysis("/incubation/company/analyze", data, "company-building analysis");
export const analyzeMarketIntelligence = (data: Record<string, unknown>) =>
  runAnalysis("/incubation/intelligence/analyze", data, "market intelligence");
export const analyzeImpact = (data: Record<string, unknown>) =>
  runAnalysis("/incubation/impact/analyze", data, "impact analysis");
export const generateRoadmap = (data: Record<string, unknown>) =>
  runAnalysis("/incubation/roadmap/generate", data, "MVP roadmap");
export const simulateMarketSurvey = (data: Record<string, unknown>) =>
  runAnalysis("/incubation/survey/simulate", data, "market survey simulation");
export const generateRecommendations = (data: Record<string, unknown>) =>
  runAnalysis("/incubation/recommendations/generate", data, "recommendations");

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

export function persistIndividualAnalysis(
  ventureData: Record<string, unknown>,
  analysis: Record<string, unknown>,
  module: string,
): Promise<{ project_id: string }> {
  return apiPost<{ project_id: string }>("/incubation/analysis/persist", {
    venture_data: ventureData,
    analysis,
    module,
  });
}

export const startValidation = (ventureData: Record<string, unknown>) =>
  apiPost<ValidationStartResult>("/incubation/validation/start", ventureData);

export const fetchValidationSessions = async (limit = 20): Promise<ValidationSessionSummary[]> => {
  const response = await apiGet<{ sessions?: ValidationSessionSummary[] }>(`/incubation/validation/sessions?limit=${encodeURIComponent(limit)}`);
  return Array.isArray(response?.sessions) ? response.sessions : [];
};

export const fetchValidationSession = (sessionId: string) =>
  apiGet<ValidationStartResult>(`/incubation/validation/sessions/${encodeURIComponent(sessionId)}`);

export const submitFounderAnswers = (sessionId: string, answers: Record<string, string>) =>
  apiPost<{ session: IncubationSession; founder_questions: FounderQuestion[]; validation_blocked: boolean }>(`/incubation/validation/${encodeURIComponent(sessionId)}/answers`, { answers });

export const runSessionPMFValidation = (sessionId: string) =>
  apiPost<{ session: IncubationSession; pmf_validation: Record<string, unknown> }>(`/incubation/validation/${encodeURIComponent(sessionId)}/pmf`);

export const generateSessionMVPPlan = (sessionId: string, founderConstraints: Record<string, unknown>) =>
  apiPost<{ session: IncubationSession; mvp_plan: Record<string, unknown> }>(`/incubation/validation/${encodeURIComponent(sessionId)}/mvp-plan`, { founder_constraints: founderConstraints });

export const recordHumanDecision = (sessionId: string, action: string, decision: string, rationale = "") =>
  apiPost<{ session: IncubationSession; recorded: boolean }>(`/incubation/validation/${encodeURIComponent(sessionId)}/decisions`, { action, decision, rationale });

export const createSandboxBuild = (sessionId: string, scope: string, workspaceId?: string) =>
  apiPost<SandboxBuild>(`/incubation/validation/${encodeURIComponent(sessionId)}/builds`, { scope, workspace_id: workspaceId });

export const deploySandboxPreview = (sessionId: string, buildId: string) =>
  apiPost<SandboxBuild>(`/incubation/validation/${encodeURIComponent(sessionId)}/builds/${encodeURIComponent(buildId)}/deploy-preview`);

async function authenticatedBuildBlob(buildId: string, kind: "artifact" | "preview"): Promise<Blob> {
  const token = getAuthToken();
  const response = await fetch(apiUrl(`/incubation/builds/${encodeURIComponent(buildId)}/${kind}`), {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!response.ok) throw new Error(`Build ${kind} failed (${response.status})`);
  return response.blob();
}

export const downloadSandboxArtifact = (buildId: string) => authenticatedBuildBlob(buildId, "artifact");
export const fetchSandboxPreview = (buildId: string) => authenticatedBuildBlob(buildId, "preview");

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
  target_geography?: string;
  founder_constraints?: Record<string, unknown>;
  model_id?: string;
}

export interface IncubationJobResponse {
  job_id: string;
  status: string;
  idempotent?: boolean;
}

export interface IncubationJobStatus extends IncubationJobResponse {
  result?: PipelineBlueprint;
  error?: string;
  progress?: { stage?: string; step?: string };
}

/** POST /api/v1/incubation/fast-track/run — enriched pipeline for existing startups. */
export function runFastTrack(payload: FastTrackPayload, init?: RequestInit): Promise<(PipelineBlueprint & { job_id?: never }) | IncubationJobResponse | null> {
  return withFallback(
    () => apiPost<PipelineBlueprint | IncubationJobResponse>("/incubation/fast-track/run", payload, init),
    () => null,
    "fast-track pipeline",
  );
}

export function getIncubationJobStatus(jobId: string): Promise<IncubationJobStatus | null> {
  return withFallback(
    () => apiGet<IncubationJobStatus>(`/incubation/jobs/${encodeURIComponent(jobId)}`),
    () => null,
    "incubation job status",
  );
}

/** POST /api/domain/incubation/publish — publish a scored project to investor deal flow. */
export function publishToInvestors(projectId: string): Promise<{ ok: boolean; snapshotId?: string }> {
  return domainPost<{ ok: boolean; snapshotId?: string }>("/incubation/publish", { projectId });
}

/** Download the authenticated user's latest persisted analysis for a project. */
export async function downloadProjectAnalysis(projectId: string): Promise<Blob> {
  const token = getAuthToken();
  const response = await fetch(apiUrl(`/incubation/projects/${encodeURIComponent(projectId)}/export`), {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!response.ok) throw new Error(`Analysis download failed (${response.status})`);
  return response.blob();
}
