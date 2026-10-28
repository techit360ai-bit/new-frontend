// frontend/src/lib/api/dealFlow.ts
//
// Investor deal-flow ranking — BACKEND /api/domain/investor/deal-flow.

import { domainDelete, domainGet, domainPatch, domainPost } from "@/lib/domainApi";
import type { GsisV2Input } from "@/lib/api/gsis";

export type RiskLevel = "low" | "moderate" | "high" | "unknown";

export interface StartupAbout {
  summary: string;
  useCase: string;
  marketSize: string;
  marketSizeValue: string;
}

export interface PassportSummary {
  hackathonsEntered: number;
  bestPlacement?: number;
  cohortSize?: number;
  demosShipped: number;
  avgBriefScore?: number;
}

export interface Milestone {
  id: string;
  title: string;
  date: string;
  type: "beta" | "revenue" | "pivot" | "certification" | "governance";
  status: "completed" | "in-progress" | "upcoming";
}

export interface RiskMetrics {
  product: number;
  market: number;
  team: number;
  compliance: number;
  financial: number;
  execution: number;
}

export interface InvestorStartup {
  id: string;
  name: string;
  sector: string;
  region: string;
  readinessScore: number;
  readinessDelta: number;
  executionVelocity: number;
  betaRetention: number;
  revenueGrowth: number;
  mrr: number;
  riskLevel: RiskLevel;
  riskDelta: string;
  founderReliability: number;
  complianceVerified: boolean;
  aiGovernanceVerified: boolean;
  burnEfficiency: number;
  pivotFrequency: number;
  experimentVelocity: number;
  velocityDelta: number;
  revenueDelta: number;
  investorsWatching: number;
  milestones: Milestone[];
  riskMetrics: RiskMetrics;
  about: StartupAbout;
  passport?: PassportSummary;
  rank?: number;
  rankScore: number;
  watchlisted: boolean;
  raw: DealFlowEntry;
  gsisV2?: {
    gsis: number | null;
    stage: string;
    momentum: number;
    pmf: number | null;
    riskLevel: string;
    readiness: number | null;
    confidence: number;
  };
}

export interface DealFlowEntry {
  id?: string;
  projectId?: string;
  startupId?: string;
  name?: string;
  title?: string;
  startupName?: string;
  sector?: string;
  industry?: string;
  region?: string;
  readinessScore?: number;
  marketReadiness?: number;
  market_readiness?: number;
  gsisScore?: number;
  executionVelocity?: number;
  eviI?: number;
  evi_i?: number;
  iis?: number;
  wcrs?: number;
  rank?: number;
  rankScore?: number;
  watchlisted?: boolean;
  project?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface DealFlowResponse {
  ranking: InvestorStartup[];
  rawRanking: DealFlowEntry[];
  watchlistProjectIds: string[];
  rankingFormula?: unknown;
  filtersApplied?: unknown;
  metrics: {
    totalStartups: number;
    watchlistedStartups: number;
    highReadiness: number;
    highExecution: number;
    revenueValidated: number;
    aiGovernanceVerified: number;
  };
}

export interface EviSignal {
  evi_i?: number;
  investment_score?: number;
  rankScore?: number;
  [k: string]: unknown;
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function firstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value;
  }
  return undefined;
}

function firstNumber(...values: unknown[]): number {
  for (const value of values) {
    const numberValue = Number(value);
    if (Number.isFinite(numberValue)) return numberValue;
  }
  return 0;
}

function bool(value: unknown): boolean {
  return value === true || value === "true" || value === 1 || value === "1";
}

function riskLevel(value: unknown): RiskLevel {
  if (value === "low" || value === "moderate" || value === "high") return value;
  return "unknown";
}

function milestoneType(value: unknown): Milestone["type"] {
  if (value === "beta" || value === "revenue" || value === "pivot" || value === "certification" || value === "governance") {
    return value;
  }
  return "beta";
}

function milestoneStatus(value: unknown): Milestone["status"] {
  if (value === "completed" || value === "in-progress" || value === "upcoming") return value;
  return "upcoming";
}

function milestones(value: unknown): Milestone[] {
  if (!Array.isArray(value)) return [];
  return value.map((row, index) => {
    const record = asObject(row);
    return {
      id: firstString(record.id) ?? `milestone_${index + 1}`,
      title: firstString(record.title, record.name, record.milestone) ?? "Milestone",
      date: firstString(record.date, record.updatedAt, record.createdAt) ?? "",
      type: milestoneType(record.type),
      status: milestoneStatus(record.status),
    };
  });
}

function riskMetrics(value: unknown): RiskMetrics {
  const record = asObject(value);
  return {
    product: firstNumber(record.product),
    market: firstNumber(record.market),
    team: firstNumber(record.team),
    compliance: firstNumber(record.compliance),
    financial: firstNumber(record.financial),
    execution: firstNumber(record.execution),
  };
}

function about(row: DealFlowEntry, project: Record<string, unknown>): StartupAbout {
  const record = asObject(row.about);
  return {
    summary: firstString(record.summary, row.summary, row.tagline, project.tagline) ?? "",
    useCase: firstString(record.useCase, row.useCase) ?? "",
    marketSize: firstString(record.marketSize, row.marketSize) ?? "",
    marketSizeValue: firstString(record.marketSizeValue, row.marketSizeValue) ?? "",
  };
}

function passport(value: unknown): PassportSummary | undefined {
  const record = asObject(value);
  const hackathonsEntered = firstNumber(record.hackathonsEntered);
  const demosShipped = firstNumber(record.demosShipped);
  if (!hackathonsEntered && !demosShipped) return undefined;
  return {
    hackathonsEntered,
    bestPlacement: firstNumber(record.bestPlacement) || undefined,
    cohortSize: firstNumber(record.cohortSize) || undefined,
    demosShipped,
    avgBriefScore: firstNumber(record.avgBriefScore) || undefined,
  };
}

export function normalizeDealFlowEntry(row: DealFlowEntry, watchlistProjectIds: string[]): InvestorStartup {
  const project = asObject(row.project);
  const id = firstString(row.projectId, row.startupId, row.id, project.id) ?? "";
  const readinessScore = firstNumber(
    row.readinessScore,
    row.marketReadiness,
    row.market_readiness,
    row.gsisScore,
    project.gsisScore,
  );
  const executionVelocity = firstNumber(row.executionVelocity, row.eviI, row.evi_i, project.eviI);
  const mrr = firstNumber(row.mrr, row.monthlyRecurringRevenue, row.revenueMonthly, row.revenue_monthly);

  return {
    id,
    name: firstString(row.startupName, row.name, row.title, project.title) ?? "Untitled startup",
    sector: firstString(row.sector, row.industry, project.industry) ?? "Uncategorized",
    region: firstString(row.region, row.location, project.location) ?? "Region unavailable",
    readinessScore,
    readinessDelta: firstNumber(row.readinessDelta, row.readiness_delta, row.velocityDelta),
    executionVelocity,
    betaRetention: firstNumber(row.betaRetention, row.beta_retention),
    revenueGrowth: firstNumber(row.revenueGrowth, row.revenue_growth),
    mrr,
    riskLevel: riskLevel(row.riskLevel),
    riskDelta: firstString(row.riskDelta, row.risk_delta) ?? "unknown",
    founderReliability: firstNumber(row.founderReliability, row.founder_reliability),
    complianceVerified: bool(row.complianceVerified ?? row.compliance_verified),
    aiGovernanceVerified: bool(row.aiGovernanceVerified ?? row.ai_governance_verified),
    burnEfficiency: firstNumber(row.burnEfficiency, row.burn_efficiency),
    pivotFrequency: firstNumber(row.pivotFrequency, row.pivot_frequency),
    experimentVelocity: firstNumber(row.experimentVelocity, row.experiment_velocity),
    velocityDelta: firstNumber(row.velocityDelta, row.velocity_delta),
    revenueDelta: firstNumber(row.revenueDelta, row.revenue_delta),
    investorsWatching: firstNumber(row.investorsWatching, row.investors_watching, row.iis),
    milestones: milestones(row.milestones),
    riskMetrics: riskMetrics(row.riskMetrics),
    about: about(row, project),
    passport: passport(row.passport),
    rank: firstNumber(row.rank) || undefined,
    rankScore: firstNumber(row.rankScore, row.wcrs, row.eviI, row.gsisScore, project.gsisScore),
    watchlisted: bool(row.watchlisted) || watchlistProjectIds.includes(id),
    raw: row,
  };
}

export function toGsisV2Input(startup: InvestorStartup): GsisV2Input {
  const metrics: GsisV2Input["metrics"] = {};
  if (startup.readinessScore > 0) metrics.product = { score: startup.readinessScore, status: "derived", evidence_level: 2, source: "deal_flow" };
  if (startup.executionVelocity > 0) metrics.execution = { score: startup.executionVelocity, status: "derived", evidence_level: 2, source: "deal_flow" };
  if (startup.betaRetention > 0) metrics.retention = { value: startup.betaRetention, status: "observed", evidence_level: 3, source: "deal_flow" };
  if (startup.revenueGrowth > 0) metrics.revenue_growth = { value: startup.revenueGrowth, status: "observed", evidence_level: 4, source: "deal_flow" };
  if (startup.mrr > 0) metrics.revenue = { value: startup.mrr, status: "observed", evidence_level: 4, source: "deal_flow" };
  if (startup.founderReliability > 0) metrics.team = { score: startup.founderReliability, status: "derived", evidence_level: 2, source: "deal_flow" };
  return {
    startup_id: startup.id,
    declared_stage: typeof startup.raw.stage === "string" ? startup.raw.stage : undefined,
    geography: startup.region,
    legacy_gsis: Number(startup.raw.gsisScore ?? 0) || undefined,
    metrics,
  };
}

function metricsFor(ranking: InvestorStartup[]) {
  return {
    totalStartups: ranking.length,
    watchlistedStartups: ranking.filter((startup) => startup.watchlisted).length,
    highReadiness: ranking.filter((startup) => startup.readinessScore >= 80).length,
    highExecution: ranking.filter((startup) => startup.executionVelocity >= 75).length,
    revenueValidated: ranking.filter((startup) => startup.mrr > 0 || startup.revenueGrowth > 0).length,
    aiGovernanceVerified: ranking.filter((startup) => startup.aiGovernanceVerified).length,
  };
}

/** GET /api/domain/investor/deal-flow — ranked live deal flow with investor watchlist flags. */
export function fetchDealFlow(): Promise<DealFlowResponse> {
  return domainGet<{
    ranking?: DealFlowEntry[];
    deal_flow?: DealFlowEntry[];
    watchlistProjectIds?: string[];
    watchlist_project_ids?: string[];
    ranking_formula?: unknown;
    rankingFormula?: unknown;
    filters_applied?: unknown;
    filtersApplied?: unknown;
  }>("/investor/deal-flow").then((data) => {
    const rawRanking = data.ranking ?? data.deal_flow ?? [];
    const watchlistProjectIds = data.watchlistProjectIds ?? data.watchlist_project_ids ?? [];
    const ranking = rawRanking.map((row) => normalizeDealFlowEntry(row, watchlistProjectIds));
    return {
      ranking,
      rawRanking,
      watchlistProjectIds,
      rankingFormula: data.rankingFormula ?? data.ranking_formula,
      filtersApplied: data.filtersApplied ?? data.filters_applied,
      metrics: metricsFor(ranking),
    };
  });
}

/** POST /api/domain/investor/watchlist — persist a watched project. */
export function addToWatchlist(projectId: string, notes = ""): Promise<{ ok: boolean }> {
  return domainPost<{ ok?: boolean }>("/investor/watchlist", { projectId, notes })
    .then((data) => ({ ok: data.ok !== false }));
}

export function removeFromWatchlist(projectId: string): Promise<{ ok: boolean }> {
  return domainDelete<{ ok?: boolean }>(`/investor/watchlist/${encodeURIComponent(projectId)}`).then((data) => ({ ok: data.ok !== false }));
}

export interface WatchlistPreferences {
  velocity: boolean;
  risk: boolean;
  milestone: boolean;
  trust: boolean;
  dealStatus: boolean;
}

export function fetchWatchlistPreferences(): Promise<{ preferences: WatchlistPreferences }> {
  return domainGet<{ preferences: WatchlistPreferences }>("/investor/watchlist/preferences");
}

export function updateWatchlistPreferences(input: Partial<WatchlistPreferences>): Promise<{ preferences: WatchlistPreferences }> {
  return domainPatch<{ preferences: WatchlistPreferences }>("/investor/watchlist/preferences", input);
}

/** EVI signal selected from the live deal-flow projection. */
export function fetchEvi(projectId: string): Promise<EviSignal | null> {
  return fetchDealFlow().then(({ ranking }) => {
    const item = ranking.find((startup) => startup.id === projectId);
    if (!item) return null;
    return {
      evi_i: item.executionVelocity,
      investment_score: item.readinessScore,
      rankScore: item.rankScore,
    };
  });
}
