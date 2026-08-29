import { domainGet, domainPatch, domainPost } from "@/lib/domainApi";

export type OrganizationLiveSection = "marketplace" | "talent" | "settings" | "integrations" | "programs" | "ai-operations" | "market-readiness" | "community";
export type OrganizationLiveRecord = { id: string; title?: string; name?: string; description?: string; status?: string; category?: string; ownerId?: string; createdAt?: string; updatedAt?: string; [key: string]: unknown };
const responseKeys: Record<OrganizationLiveSection, string> = { marketplace: "items", talent: "talent", settings: "settings", integrations: "integrations", programs: "programs", "ai-operations": "operations", "market-readiness": "records", community: "posts" };
export async function fetchOrganizationSection(section: OrganizationLiveSection): Promise<OrganizationLiveRecord[]> { const payload = await domainGet<Record<string, unknown>>(`/organization/${section}`); const value = payload[responseKeys[section]]; return Array.isArray(value) ? value as OrganizationLiveRecord[] : []; }
export async function createOrganizationSectionRecord(section: OrganizationLiveSection, input: Record<string, unknown>): Promise<OrganizationLiveRecord> { const payload = await domainPost<Record<string, OrganizationLiveRecord>>(`/organization/${section}`, input); return payload[responseKeys[section].replace(/s$/, "")] || Object.values(payload)[0]; }
export async function updateOrganizationSectionRecord(section: OrganizationLiveSection, id: string, input: Record<string, unknown>): Promise<OrganizationLiveRecord> { const payload = await domainPatch<Record<string, OrganizationLiveRecord>>(`/organization/${section}/${encodeURIComponent(id)}`, input); return Object.values(payload)[0]; }

export interface OrganizationMetrics {
  activePrograms: number;
  hackathons: number;
  members: number;
  opportunities: number;
}

export interface OrganizationProjectHealth {
  name: string;
  value: number;
  color: string;
}

export interface OrganizationTalentActivity {
  skill: string;
  count: number;
}

export interface OrganizationAutomationPoint {
  label: string;
  automated: number;
  manual: number;
}

export interface OrganizationActivity {
  id: string;
  type: string;
  message: string;
  at: string;
}

export interface OrganizationDashboardData {
  metrics: OrganizationMetrics;
  projectHealth: OrganizationProjectHealth[];
  talentActivity: OrganizationTalentActivity[];
  automation: OrganizationAutomationPoint[];
  activity: OrganizationActivity[];
}

export interface OrganizationProject {
  id: string;
  title: string;
  tagline: string;
  industry: string;
  stage: string;
  status: string;
  progress: number;
  teamName: string;
  memberCount: number;
  marketReadyScore: number;
  aiLevel: string;
  hasWorkspace: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationProjectInput {
  title: string;
  tagline?: string;
  industry?: string;
  stage?: string;
  status?: string;
  progress?: number;
  teamName?: string;
  memberCount?: number;
  marketReadyScore?: number;
  aiLevel?: string;
  hasWorkspace?: boolean;
}

type UnknownRecord = Record<string, unknown>;

const PROJECT_HEALTH_COLORS = ["#10b981", "#f59e0b", "#ef4444", "#2563eb"];

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as UnknownRecord
    : {};
}

function asRows(value: unknown): UnknownRecord[] {
  return Array.isArray(value) ? value.map(asRecord) : [];
}

function asNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function asText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asBoolean(value: unknown): boolean {
  return value === true || value === "true";
}

function asPercent(value: unknown): number {
  return Math.min(100, Math.max(0, asNumber(value)));
}

function chartRows(charts: UnknownRecord, ...keys: string[]): UnknownRecord[] {
  for (const key of keys) {
    const rows = asRows(charts[key]);
    if (rows.length > 0) return rows;
  }
  return [];
}

export function normalizeOrganizationDashboard(payload: unknown): OrganizationDashboardData {
  const root = asRecord(payload);
  const metrics = asRecord(root.metrics);
  const charts = asRecord(root.charts);

  const projectHealth = chartRows(charts, "projectHealth", "projectHealthData")
    .map((row, index) => ({
      name: asText(row.name) || asText(row.label) || asText(row.status) || "Unlabelled",
      value: asNumber(row.value ?? row.count),
      color: asText(row.color) || PROJECT_HEALTH_COLORS[index % PROJECT_HEALTH_COLORS.length],
    }))
    .filter((row) => row.value > 0);

  const talentActivity = chartRows(charts, "talentActivity", "talentActivityData")
    .map((row) => ({
      skill: asText(row.skill) || asText(row.name) || "Unlabelled",
      count: asNumber(row.count ?? row.value),
    }))
    .filter((row) => row.count > 0);

  const automation = chartRows(charts, "automation", "automationTrend", "aiOperations")
    .map((row) => ({
      label: asText(row.label) || asText(row.month) || asText(row.period) || "Period",
      automated: asNumber(row.automated),
      manual: asNumber(row.manual),
    }))
    .filter((row) => row.automated > 0 || row.manual > 0);

  const activity = asRows(root.activity)
    .map((row, index) => {
      const message = asText(row.message) || asText(row.summary) || asText(row.detail);
      return {
        id: asText(row.id) || `${message || "activity"}-${index}`,
        type: asText(row.type) || asText(row.kind) || "info",
        message,
        at: asText(row.at) || asText(row.createdAt) || asText(row.time),
      };
    })
    .filter((row) => row.message);

  return {
    metrics: {
      activePrograms: asNumber(metrics.activePrograms),
      hackathons: asNumber(metrics.hackathons),
      members: asNumber(metrics.members),
      opportunities: asNumber(metrics.opportunities),
    },
    projectHealth,
    talentActivity,
    automation,
    activity,
  };
}

export async function fetchOrganizationDashboard(): Promise<OrganizationDashboardData> {
  const payload = await domainGet<unknown>("/organization/dashboard");
  return normalizeOrganizationDashboard(payload);
}

export function normalizeOrganizationProject(value: unknown): OrganizationProject | null {
  const row = asRecord(value);
  const id = asText(row.id);
  const title = asText(row.title);
  if (!id || !title) return null;

  return {
    id,
    title,
    tagline: asText(row.tagline),
    industry: asText(row.industry),
    stage: asText(row.stage) || "idea",
    status: asText(row.status) || "planned",
    progress: asPercent(row.progress),
    teamName: asText(row.teamName),
    memberCount: Math.max(0, asNumber(row.memberCount)),
    marketReadyScore: asPercent(row.marketReadyScore),
    aiLevel: asText(row.aiLevel),
    hasWorkspace: asBoolean(row.hasWorkspace),
    createdAt: asText(row.createdAt),
    updatedAt: asText(row.updatedAt),
  };
}

export async function fetchOrganizationProjects(): Promise<OrganizationProject[]> {
  const payload = asRecord(await domainGet<unknown>("/organization/projects"));
  return asRows(payload.projects)
    .map(normalizeOrganizationProject)
    .filter((project): project is OrganizationProject => project !== null);
}

export async function createOrganizationProject(
  input: OrganizationProjectInput,
): Promise<OrganizationProject> {
  const payload = asRecord(await domainPost<unknown>("/organization/projects", input));
  const project = normalizeOrganizationProject(payload.project);
  if (!project) throw new Error("The organization project response was invalid.");
  return project;
}

export async function updateOrganizationProject(
  projectId: string,
  input: Partial<OrganizationProjectInput>,
): Promise<OrganizationProject> {
  const payload = asRecord(
    await domainPatch<unknown>(`/organization/projects/${encodeURIComponent(projectId)}`, input),
  );
  const project = normalizeOrganizationProject(payload.project);
  if (!project) throw new Error("The organization project response was invalid.");
  return project;
}

// --- Organization Intelligence: Cohort Health -------------------------------

export type HealthBand = "green" | "amber" | "red";

export interface CohortHealthEntry {
  id: string;
  title: string;
  industry: string;
  stage: string;
  gsisScore: number;
  progress: number;
  marketReadyScore: number;
  mrr: number;
  memberCount: number;
  daysInactive: number;
  decay: number;
  band: HealthBand;
  updatedAt: string;
}

export interface CohortAlert {
  projectId: string;
  severity: string;
  type: string;
  message: string;
}

export interface CohortHealthSummary {
  total: number;
  green: number;
  amber: number;
  red: number;
  avgGsis: number;
}

export interface CohortHealthData {
  cohort: CohortHealthEntry[];
  alerts: CohortAlert[];
  summary: CohortHealthSummary;
  stages: string[];
}

export interface InterventionRec {
  projectId: string;
  title: string;
  band: HealthBand;
  recommendation: string;
  source: "ai" | "rule";
}

export interface InterventionsData {
  recommendations: InterventionRec[];
  aiAvailable: boolean;
}

function asBand(value: unknown): HealthBand {
  const v = asText(value);
  return v === "green" || v === "red" ? v : "amber";
}

export interface CohortHealthParams {
  stage?: string;
  riskLevel?: HealthBand;
}

export function normalizeCohortHealth(payload: unknown): CohortHealthData {
  const root = asRecord(payload);
  const summary = asRecord(root.summary);
  const cohort = asRows(root.cohort)
    .map((row): CohortHealthEntry | null => {
      const id = asText(row.id);
      if (!id) return null;
      return {
        id,
        title: asText(row.title) || "Untitled project",
        industry: asText(row.industry),
        stage: asText(row.stage) || "idea",
        gsisScore: asPercent(row.gsisScore),
        progress: asPercent(row.progress),
        marketReadyScore: asPercent(row.marketReadyScore),
        mrr: Math.max(0, asNumber(row.mrr)),
        memberCount: Math.max(0, asNumber(row.memberCount)),
        daysInactive: Math.max(0, asNumber(row.daysInactive)),
        decay: Math.max(0, asNumber(row.decay)),
        band: asBand(row.band),
        updatedAt: asText(row.updatedAt),
      };
    })
    .filter((row): row is CohortHealthEntry => row !== null);

  const alerts = asRows(root.alerts)
    .map((row) => ({
      projectId: asText(row.projectId),
      severity: asText(row.severity) || "medium",
      type: asText(row.type) || "info",
      message: asText(row.message),
    }))
    .filter((row) => row.message);

  const stages = Array.isArray(root.stages)
    ? root.stages.map((s) => asText(s)).filter(Boolean)
    : [];

  return {
    cohort,
    alerts,
    summary: {
      total: asNumber(summary.total),
      green: asNumber(summary.green),
      amber: asNumber(summary.amber),
      red: asNumber(summary.red),
      avgGsis: asNumber(summary.avgGsis),
    },
    stages,
  };
}

export async function fetchCohortHealth(params: CohortHealthParams = {}): Promise<CohortHealthData> {
  const query = new URLSearchParams();
  if (params.stage) query.set("stage", params.stage);
  if (params.riskLevel) query.set("riskLevel", params.riskLevel);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return normalizeCohortHealth(await domainGet<unknown>(`/organization/cohort-health${suffix}`));
}

export function normalizeInterventions(payload: unknown): InterventionsData {
  const root = asRecord(payload);
  const recommendations = asRows(root.recommendations)
    .map((row) => ({
      projectId: asText(row.projectId),
      title: asText(row.title) || "Untitled project",
      band: asBand(row.band),
      recommendation: asText(row.recommendation),
      source: asText(row.source) === "ai" ? ("ai" as const) : ("rule" as const),
    }))
    .filter((row) => row.recommendation);
  return { recommendations, aiAvailable: asBoolean(root.aiAvailable) };
}

export async function fetchInterventions(): Promise<InterventionsData> {
  return normalizeInterventions(await domainGet<unknown>("/organization/interventions"));
}

// --- Organization Intelligence: Impact Reporting ----------------------------

export interface ImpactMetrics {
  startups: number;
  productsLaunched: number;
  totalMrr: number;
  jobs: number;
  avgProgress: number;
  avgMarketReady: number;
}

export interface ImpactReport {
  template: string;
  metrics: ImpactMetrics;
  stageProgression: { name: string; value: number }[];
  industryBreakdown: { name: string; value: number }[];
  revenueByStartup: { name: string; mrr: number }[];
  generatedAt: string;
}

export interface KpiTarget {
  id: string;
  metric: string;
  label: string;
  target: number;
}

function nameValueRows(value: unknown): { name: string; value: number }[] {
  return asRows(value)
    .map((row) => ({ name: asText(row.name) || "Unspecified", value: asNumber(row.value) }))
    .filter((row) => row.value > 0);
}

export function normalizeImpact(payload: unknown): ImpactReport {
  const root = asRecord(payload);
  const metrics = asRecord(root.metrics);
  const charts = asRecord(root.charts);
  return {
    template: asText(root.template) || "quarterly",
    metrics: {
      startups: asNumber(metrics.startups),
      productsLaunched: asNumber(metrics.productsLaunched),
      totalMrr: asNumber(metrics.totalMrr),
      jobs: asNumber(metrics.jobs),
      avgProgress: asNumber(metrics.avgProgress),
      avgMarketReady: asNumber(metrics.avgMarketReady),
    },
    stageProgression: nameValueRows(charts.stageProgression),
    industryBreakdown: nameValueRows(charts.industryBreakdown),
    revenueByStartup: asRows(charts.revenueByStartup)
      .map((row) => ({ name: asText(row.name) || "Untitled", mrr: asNumber(row.mrr) }))
      .filter((row) => row.mrr > 0),
    generatedAt: asText(root.generatedAt),
  };
}

export async function fetchImpact(template = "quarterly"): Promise<ImpactReport> {
  return normalizeImpact(
    await domainGet<unknown>(`/organization/impact?template=${encodeURIComponent(template)}`),
  );
}

export async function fetchKpiTargets(): Promise<KpiTarget[]> {
  const root = asRecord(await domainGet<unknown>("/organization/kpi-targets"));
  return asRows(root.targets)
    .map((row) => ({
      id: asText(row.id),
      metric: asText(row.metric),
      label: asText(row.label) || asText(row.metric),
      target: asNumber(row.target),
    }))
    .filter((row) => row.metric);
}

export async function saveKpiTarget(input: {
  metric: string;
  label?: string;
  target: number;
}): Promise<void> {
  await domainPost<unknown>("/organization/kpi-targets", input);
}

// --- Organization Intelligence: Demo Day Pipeline ---------------------------

export interface DemoDayChecklistItem {
  key: string;
  label: string;
  met: boolean;
}

export interface DemoDayEntry {
  id: string;
  title: string;
  industry: string;
  stage: string;
  gsisScore: number;
  mrr: number;
  investorReady: boolean;
  published: boolean;
  checklist: DemoDayChecklistItem[];
  readyPct: number;
}

export interface DemoDayPipelineData {
  threshold: number;
  pipeline: DemoDayEntry[];
}

export interface InvestorMatch {
  investorId: string;
  name: string;
  score: number;
  reasons: string[];
}

export function normalizeDemoDayPipeline(payload: unknown): DemoDayPipelineData {
  const root = asRecord(payload);
  const pipeline = asRows(root.pipeline)
    .map((row): DemoDayEntry | null => {
      const id = asText(row.id);
      if (!id) return null;
      return {
        id,
        title: asText(row.title) || "Untitled",
        industry: asText(row.industry),
        stage: asText(row.stage) || "idea",
        gsisScore: asPercent(row.gsisScore),
        mrr: Math.max(0, asNumber(row.mrr)),
        investorReady: asBoolean(row.investorReady),
        published: asBoolean(row.published),
        checklist: asRows(row.checklist).map((c) => ({
          key: asText(c.key),
          label: asText(c.label),
          met: asBoolean(c.met),
        })),
        readyPct: asPercent(row.readyPct),
      };
    })
    .filter((row): row is DemoDayEntry => row !== null);
  return { threshold: asNumber(root.threshold) || 70, pipeline };
}

export async function fetchDemoDayPipeline(threshold = 70): Promise<DemoDayPipelineData> {
  return normalizeDemoDayPipeline(
    await domainGet<unknown>(`/organization/demo-day/pipeline?threshold=${threshold}`),
  );
}

export async function pushToDealFlow(projectId: string): Promise<void> {
  await domainPost<unknown>("/organization/demo-day/publish", { projectId });
}

export async function fetchInvestorMatches(projectId: string): Promise<InvestorMatch[]> {
  const root = asRecord(
    await domainGet<unknown>(`/organization/demo-day/matches/${encodeURIComponent(projectId)}`),
  );
  return asRows(root.matches)
    .map((row) => ({
      investorId: asText(row.investorId),
      name: asText(row.name) || "Investor",
      score: asNumber(row.score),
      reasons: Array.isArray(row.reasons) ? row.reasons.map((r) => asText(r)).filter(Boolean) : [],
    }))
    .filter((row) => row.investorId);
}
