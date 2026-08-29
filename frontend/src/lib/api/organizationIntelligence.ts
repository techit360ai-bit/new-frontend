import { apiGet } from "@/lib/api/client";

type UnknownRecord = Record<string, unknown>;

export interface OrganizationHealth {
  score: number | null;
  dimensions: Record<string, number | null>;
  availability: Record<string, boolean>;
}

export interface OrganizationIntelligenceOverview {
  organizationId: string;
  metrics: Record<string, number>;
  health: OrganizationHealth;
  risks: { total: number; critical: number; high: number; medium: number; low: number };
  actions: { total: number; critical: number; high: number };
  generatedAt: string;
}

export interface OrganizationPulse {
  window: string;
  changes: Record<string, number>;
  activity: Array<{ id: string; type: string; message: string; updatedAt?: string; createdAt?: string }>;
}

export interface OrganizationRisk {
  id: string;
  title: string;
  reason?: string | null;
  severity: "critical" | "high" | "medium" | "low" | string;
  status?: string;
}

export interface OrganizationAction {
  id: string;
  title: string;
  reason?: string | null;
  priority: "critical" | "high" | "normal" | "low" | string;
  status: string;
  dueDate?: string | null;
}

export interface OrganizationKpi {
  id: string;
  name: string;
  unit?: string;
  target?: number | null;
  values: Array<{ value: number; periodEnd?: string | null; periodStart?: string | null }>;
}

function record(value: unknown): UnknownRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as UnknownRecord : {};
}

function rows(value: unknown): UnknownRecord[] {
  return Array.isArray(value) ? value.map(record) : [];
}

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function number(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function nullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function fetchOrganizationIntelligenceOverview(): Promise<OrganizationIntelligenceOverview> {
  const root = record(await apiGet<unknown>("/organization-intelligence/overview"));
  const metrics = record(root.metrics);
  const health = record(root.health);
  const dimensions = record(health.dimensions);
  const availability = record(health.availability);
  const riskSummary = record(root.risks);
  const actionSummary = record(root.actions);
  return {
    organizationId: text(root.organizationId),
    metrics: Object.fromEntries(Object.entries(metrics).map(([key, value]) => [key, number(value)])),
    health: {
      score: nullableNumber(health.score),
      dimensions: Object.fromEntries(Object.entries(dimensions).map(([key, value]) => [key, nullableNumber(value)])),
      availability: Object.fromEntries(Object.entries(availability).map(([key, value]) => [key, Boolean(value)])),
    },
    risks: {
      total: number(riskSummary.total),
      critical: number(riskSummary.critical),
      high: number(riskSummary.high),
      medium: number(riskSummary.medium),
      low: number(riskSummary.low),
    },
    actions: {
      total: number(actionSummary.total),
      critical: number(actionSummary.critical),
      high: number(actionSummary.high),
    },
    generatedAt: text(root.generatedAt),
  };
}

export async function fetchOrganizationPulse(window = "7d"): Promise<OrganizationPulse> {
  const root = record(await apiGet<unknown>(`/organization-intelligence/pulse?window=${encodeURIComponent(window)}`));
  return {
    window: text(root.window) || window,
    changes: Object.fromEntries(Object.entries(record(root.changes)).map(([key, value]) => [key, number(value)])),
    activity: rows(root.activity).map((row, index) => ({
      id: text(row.id) || `pulse-${index}`,
      type: text(row.type) || "info",
      message: text(row.message) || "Organization activity updated",
      updatedAt: text(row.updatedAt),
      createdAt: text(row.createdAt),
    })),
  };
}

export async function fetchOrganizationRisks(): Promise<OrganizationRisk[]> {
  const root = record(await apiGet<unknown>("/organization-intelligence/risks"));
  return rows(root.risks).map((row, index) => ({
    id: text(row.id) || `risk-${index}`,
    title: text(row.title) || "Organization risk",
    reason: text(row.reason) || null,
    severity: text(row.severity) || "medium",
    status: text(row.status) || "open",
  }));
}

export async function fetchOrganizationActions(): Promise<OrganizationAction[]> {
  const root = record(await apiGet<unknown>("/organization-intelligence/actions"));
  return rows(root.actions).map((row, index) => ({
    id: text(row.id) || `action-${index}`,
    title: text(row.title) || "Organization action",
    reason: text(row.reason) || null,
    priority: text(row.priority) || "normal",
    status: text(row.status) || "open",
    dueDate: text(row.dueDate) || null,
  }));
}

export async function fetchOrganizationKpis(): Promise<OrganizationKpi[]> {
  const root = record(await apiGet<unknown>("/organization-intelligence/kpis"));
  return rows(root.kpis).map((row, index) => ({
    id: text(row.id) || `kpi-${index}`,
    name: text(row.name) || "Organization KPI",
    unit: text(row.unit),
    target: nullableNumber(row.target),
    values: rows(row.values).map((value) => ({
      value: number(value.value),
      periodEnd: text(value.periodEnd) || null,
      periodStart: text(value.periodStart) || null,
    })),
  }));
}

export interface OrganizationAllocation { projectId: string; title: string; resources: number; tasks: number; completedTasks: number; execution: number | null; utilization: number | null }
export interface OrganizationAlumni { id: string; title: string; status: string; funding: number | null; jobs: number | null; revenue: number | null; completedAt: string | null }
export interface OrganizationBenchmark { cohortId: string; name: string; startups: number; avgHealth: number | null; avgProgress: number | null; avgMilestoneProgress: number | null; engagement: number | null }

export async function fetchOrganizationResourceAllocation() {
  const root = record(await apiGet<unknown>("/organization-intelligence/resource-allocation"));
  return { totals: record(root.totals), byKind: rows(root.byKind), allocation: rows(root.allocation) as unknown as OrganizationAllocation[] };
}
export async function fetchOrganizationAlumni() {
  const root = record(await apiGet<unknown>("/organization-intelligence/alumni"));
  return { summary: record(root.summary), outcomes: rows(root.outcomes) as unknown as OrganizationAlumni[] };
}
export async function fetchOrganizationCohortBenchmarks() {
  const root = record(await apiGet<unknown>("/organization-intelligence/cohort-benchmarks"));
  return rows(root.benchmark) as unknown as OrganizationBenchmark[];
}
