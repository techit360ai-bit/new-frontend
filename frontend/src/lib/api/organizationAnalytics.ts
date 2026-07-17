import type {
  OrganizationActivity,
  OrganizationAutomationPoint,
  OrganizationDashboardData,
  OrganizationProject,
} from "./organization";

export interface OrganizationAnalyticsMetric {
  label: string;
  value: string;
  detail: string;
}

export interface OrganizationProjectGrowthPoint {
  key: string;
  label: string;
  projects: number;
}

export interface OrganizationLifecyclePoint {
  stage: string;
  count: number;
}

export interface OrganizationIndustryPoint {
  name: string;
  value: number;
  color: string;
}

export interface OrganizationReadinessPoint {
  label: string;
  value: number;
  total: number;
}

export interface OrganizationAnalyticsData {
  metrics: OrganizationAnalyticsMetric[];
  growth: OrganizationProjectGrowthPoint[];
  lifecycle: OrganizationLifecyclePoint[];
  industries: OrganizationIndustryPoint[];
  automation: OrganizationAutomationPoint[];
  readiness: OrganizationReadinessPoint[];
  activity: OrganizationActivity[];
  totalProjects: number;
  marketReady: number;
  marketReadyRate: number;
  averageProgress: number;
  averageMarketReadyScore: number;
  mostCommonStage: string;
  hasData: boolean;
}

const STAGE_ORDER = ["idea", "validation", "development", "testing", "market-ready"];
const INDUSTRY_COLORS = ["#4f46e5", "#0891b2", "#059669", "#d97706", "#dc2626", "#6b7280"];

function normalizeStage(value: string): string {
  const stage = value.trim().toLowerCase().replace(/[_\s]+/g, "-");
  if (["mvp", "prototype", "build"].includes(stage)) return "development";
  if (["launch", "launched", "growth", "marketready"].includes(stage)) return "market-ready";
  return stage || "unspecified";
}

function labelFor(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function projectDate(value: string): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function projectGrowth(projects: OrganizationProject[]): OrganizationProjectGrowthPoint[] {
  const months = new Map<string, OrganizationProjectGrowthPoint>();
  for (const project of projects) {
    const date = projectDate(project.createdAt);
    if (!date) continue;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const point = months.get(key) ?? {
      key,
      label: date.toLocaleDateString(undefined, { month: "short", year: "2-digit" }),
      projects: 0,
    };
    point.projects += 1;
    months.set(key, point);
  }
  return [...months.values()]
    .sort((left, right) => left.key.localeCompare(right.key))
    .slice(-6);
}

function lifecycleDistribution(projects: OrganizationProject[]): OrganizationLifecyclePoint[] {
  const counts = new Map<string, number>();
  for (const project of projects) {
    const stage = normalizeStage(project.stage);
    counts.set(stage, (counts.get(stage) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort(([left], [right]) => {
      const leftIndex = STAGE_ORDER.indexOf(left);
      const rightIndex = STAGE_ORDER.indexOf(right);
      if (leftIndex === -1 && rightIndex === -1) return left.localeCompare(right);
      if (leftIndex === -1) return 1;
      if (rightIndex === -1) return -1;
      return leftIndex - rightIndex;
    })
    .map(([stage, count]) => ({ stage: labelFor(stage), count }));
}

function industryDistribution(projects: OrganizationProject[]): OrganizationIndustryPoint[] {
  const counts = new Map<string, number>();
  for (const project of projects) {
    const name = project.industry.trim() || "Unspecified";
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 6)
    .map(([name, value], index) => ({
      name,
      value,
      color: INDUSTRY_COLORS[index % INDUSTRY_COLORS.length],
    }));
}

function isMarketReady(project: OrganizationProject): boolean {
  const status = project.status.toLowerCase();
  return normalizeStage(project.stage) === "market-ready" ||
    status.includes("complete") ||
    status.includes("done");
}

function hasAi(project: OrganizationProject): boolean {
  const level = project.aiLevel.trim().toLowerCase();
  return Boolean(level) && !["none", "manual", "unassigned", "n/a"].includes(level);
}

export function deriveOrganizationAnalytics(
  dashboard: OrganizationDashboardData,
  projects: OrganizationProject[],
): OrganizationAnalyticsData {
  const totalProjects = projects.length;
  const marketReady = projects.filter(isMarketReady).length;
  const atRisk = projects.filter((project) => {
    const status = project.status.toLowerCase();
    return status.includes("risk") || status.includes("blocked");
  }).length;
  const workspaceEnabled = projects.filter((project) => project.hasWorkspace).length;
  const aiEnabled = projects.filter(hasAi).length;
  const averageProgress = totalProjects > 0
    ? Math.round(projects.reduce((sum, project) => sum + project.progress, 0) / totalProjects)
    : 0;
  const averageMarketReadyScore = totalProjects > 0
    ? Math.round(
      projects.reduce((sum, project) => sum + project.marketReadyScore, 0) / totalProjects,
    )
    : 0;
  const marketReadyRate = totalProjects > 0
    ? Math.round((marketReady / totalProjects) * 100)
    : 0;
  const lifecycle = lifecycleDistribution(projects);
  const mostCommonStage = [...lifecycle]
    .sort((left, right) => right.count - left.count)[0]?.stage ?? "No projects";
  const hasDashboardData = Object.values(dashboard.metrics).some((value) => value > 0) ||
    dashboard.projectHealth.length > 0 ||
    dashboard.talentActivity.length > 0 ||
    dashboard.automation.length > 0 ||
    dashboard.activity.length > 0;

  return {
    metrics: [
      {
        label: "Total Projects",
        value: totalProjects.toLocaleString(),
        detail: `${atRisk.toLocaleString()} at risk`,
      },
      {
        label: "Market Ready",
        value: marketReady.toLocaleString(),
        detail: `${marketReadyRate}% of persisted projects`,
      },
      {
        label: "Average Progress",
        value: `${averageProgress}%`,
        detail: "Across persisted projects",
      },
      {
        label: "Average Readiness",
        value: `${averageMarketReadyScore}%`,
        detail: "Persisted market-ready score",
      },
    ],
    growth: projectGrowth(projects),
    lifecycle,
    industries: industryDistribution(projects),
    automation: dashboard.automation,
    readiness: [
      { label: "AI enabled", value: aiEnabled, total: totalProjects },
      { label: "Workspace enabled", value: workspaceEnabled, total: totalProjects },
      { label: "Market ready", value: marketReady, total: totalProjects },
    ],
    activity: dashboard.activity.slice(0, 8),
    totalProjects,
    marketReady,
    marketReadyRate,
    averageProgress,
    averageMarketReadyScore,
    mostCommonStage,
    hasData: totalProjects > 0 || hasDashboardData,
  };
}
