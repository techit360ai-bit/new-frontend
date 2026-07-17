import type { OrganizationProject } from "./organization";

export interface OrganizationTeamAggregate {
  key: string;
  name: string;
  projectCount: number;
  recordedSeats: number;
  averageProgress: number;
  marketReadyCount: number;
  atRiskCount: number;
  industries: string[];
  latestUpdatedAt: string;
}

export interface OrganizationTeamActivity {
  id: string;
  projectTitle: string;
  teamName: string;
  status: string;
  progress: number;
  updatedAt: string;
}

export interface OrganizationTeamsData {
  teams: OrganizationTeamAggregate[];
  activity: OrganizationTeamActivity[];
  assignedProjects: number;
  unassignedProjects: OrganizationProject[];
  recordedSeats: number;
}

interface MutableTeam {
  key: string;
  name: string;
  projects: OrganizationProject[];
}

function normalizedStage(value: string): string {
  const stage = value.trim().toLowerCase().replace(/[_\s]+/g, "-");
  if (["mvp", "prototype", "build"].includes(stage)) return "development";
  if (["launch", "launched", "growth", "marketready"].includes(stage)) return "market-ready";
  return stage;
}

function isMarketReady(project: OrganizationProject): boolean {
  const status = project.status.toLowerCase();
  return normalizedStage(project.stage) === "market-ready" ||
    status.includes("complete") ||
    status.includes("done");
}

function isAtRisk(project: OrganizationProject): boolean {
  const status = project.status.toLowerCase();
  return status.includes("risk") || status.includes("blocked");
}

function timestamp(value: string): number {
  if (!value) return 0;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function latestProjectDate(projects: OrganizationProject[]): string {
  const sorted = [...projects].sort((left, right) =>
    timestamp(right.updatedAt || right.createdAt) - timestamp(left.updatedAt || left.createdAt));
  const latest = sorted[0];
  return latest?.updatedAt || latest?.createdAt || "";
}

export function deriveOrganizationTeams(projects: OrganizationProject[]): OrganizationTeamsData {
  const grouped = new Map<string, MutableTeam>();
  const unassignedProjects: OrganizationProject[] = [];

  for (const project of projects) {
    const name = project.teamName.trim();
    if (!name) {
      unassignedProjects.push(project);
      continue;
    }

    const key = name.toLowerCase();
    const team = grouped.get(key) ?? { key, name, projects: [] };
    team.projects.push(project);
    grouped.set(key, team);
  }

  const teams = [...grouped.values()]
    .map(({ key, name, projects: teamProjects }) => {
      const projectCount = teamProjects.length;
      const industries = [...new Set(
        teamProjects.map((project) => project.industry.trim()).filter(Boolean),
      )].sort();
      return {
        key,
        name,
        projectCount,
        recordedSeats: teamProjects.reduce((sum, project) => sum + project.memberCount, 0),
        averageProgress: projectCount > 0
          ? Math.round(teamProjects.reduce((sum, project) => sum + project.progress, 0) / projectCount)
          : 0,
        marketReadyCount: teamProjects.filter(isMarketReady).length,
        atRiskCount: teamProjects.filter(isAtRisk).length,
        industries,
        latestUpdatedAt: latestProjectDate(teamProjects),
      };
    })
    .sort((left, right) => right.projectCount - left.projectCount || left.name.localeCompare(right.name));

  const activity = [...projects]
    .sort((left, right) =>
      timestamp(right.updatedAt || right.createdAt) - timestamp(left.updatedAt || left.createdAt))
    .slice(0, 10)
    .map((project) => ({
      id: project.id,
      projectTitle: project.title,
      teamName: project.teamName.trim() || "Unassigned",
      status: project.status,
      progress: project.progress,
      updatedAt: project.updatedAt || project.createdAt,
    }));

  return {
    teams,
    activity,
    assignedProjects: projects.length - unassignedProjects.length,
    unassignedProjects,
    recordedSeats: projects.reduce((sum, project) => sum + project.memberCount, 0),
  };
}
