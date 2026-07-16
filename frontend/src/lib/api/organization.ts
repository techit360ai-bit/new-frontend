import { domainGet, domainPatch, domainPost } from "@/lib/domainApi";

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
