// frontend/src/lib/api/collaboratorSummary.ts
//
// Derived collaborator summaries from live task/workspace domain data.

import {
  fetchCollaboratorTasks,
  type CollaboratorTask,
  type CollaboratorTaskProject,
} from "@/lib/api/collaboratorTasks";

export interface CollaboratorMetric {
  name: string;
  value: number;
  change: number;
  trend: "up" | "down" | "stable";
}

export interface CollaboratorVelocityPoint {
  week: string;
  tasks: number;
  impact: number;
}

export interface CollaboratorProjectContribution {
  id: string;
  name: string;
  shipped: number;
  impactAvg: number;
  lastContribution: string;
}

export interface CollaboratorAchievement {
  id: string;
  title: string;
  description: string;
  earned: boolean;
  icon: string;
}

export interface CollaboratorLiveSummary {
  tasks: CollaboratorTask[];
  projects: CollaboratorTaskProject[];
  metrics: CollaboratorMetric[];
  weeklyVelocity: CollaboratorVelocityPoint[];
  perProject: CollaboratorProjectContribution[];
  achievements: CollaboratorAchievement[];
  compositeScore: number;
}

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function score(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function taskTime(task: CollaboratorTask): number {
  const time = new Date(task.deadline).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function latestLabel(tasks: CollaboratorTask[]): string {
  const latest = tasks.map(taskTime).filter(Boolean).sort((a, b) => b - a)[0];
  return latest ? new Date(latest).toISOString().slice(0, 10) : "No dated tasks";
}

function weekKey(time: number): string {
  const d = new Date(time);
  const start = new Date(d);
  start.setDate(d.getDate() - d.getDay());
  return start.toISOString().slice(0, 10);
}

function buildVelocity(tasks: CollaboratorTask[]): CollaboratorVelocityPoint[] {
  const dated = tasks.filter((task) => taskTime(task) > 0);
  const groups = new Map<string, CollaboratorTask[]>();
  for (const task of dated) {
    const key = weekKey(taskTime(task));
    groups.set(key, [...(groups.get(key) ?? []), task]);
  }

  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([week, rows]) => ({
      week,
      tasks: rows.filter((task) => task.status === "completed").length,
      impact: avg(rows.map((task) => task.impactScore)),
    }));
}

function buildPerProject(
  tasks: CollaboratorTask[],
  projects: CollaboratorTaskProject[],
): CollaboratorProjectContribution[] {
  const projectIds = new Set([...projects.map((project) => project.id), ...tasks.map((task) => task.projectId)]);
  return [...projectIds].map((id) => {
    const project = projects.find((row) => row.id === id);
    const rows = tasks.filter((task) => task.projectId === id);
    return {
      id,
      name: project?.name || rows[0]?.projectName || id,
      shipped: rows.filter((task) => task.status === "completed").length,
      impactAvg: avg(rows.map((task) => task.impactScore)),
      lastContribution: latestLabel(rows),
    };
  });
}

function buildMetrics(tasks: CollaboratorTask[], projects: CollaboratorTaskProject[]): CollaboratorMetric[] {
  const completed = tasks.filter((task) => task.status === "completed");
  const total = tasks.length;
  const completionRate = total === 0 ? 0 : score((completed.length / total) * 100);
  const impactScore = score(avg(tasks.map((task) => task.impactScore)));
  const executionVelocity = score(avg(completed.map((task) => task.impactScore)));
  const consistencyScore = total === 0 ? 0 : score(completionRate * 0.75 + Math.min(25, total * 5));
  const collaborationScore = projects.length === 0
    ? 0
    : score((new Set(tasks.map((task) => task.projectId)).size / projects.length) * 100);

  return [
    { name: "Execution Velocity", value: executionVelocity, change: 0, trend: "stable" },
    { name: "Consistency Score", value: consistencyScore, change: 0, trend: "stable" },
    { name: "Completion Rate", value: completionRate, change: 0, trend: "stable" },
    { name: "Collaboration Score", value: collaborationScore, change: 0, trend: "stable" },
    { name: "Impact Score", value: impactScore, change: 0, trend: "stable" },
  ];
}

function buildAchievements(tasks: CollaboratorTask[], projects: CollaboratorTaskProject[]): CollaboratorAchievement[] {
  const completed = tasks.filter((task) => task.status === "completed");
  const avgImpact = avg(tasks.map((task) => task.impactScore));

  return [
    {
      id: "shipper",
      title: "Live Shipper",
      description: "Complete at least one persisted workspace task.",
      earned: completed.length > 0,
      icon: "LS",
    },
    {
      id: "impact",
      title: "High Impact",
      description: "Maintain an average impact score of 80 or higher.",
      earned: avgImpact >= 80,
      icon: "HI",
    },
    {
      id: "critical",
      title: "Critical Solver",
      description: "Complete a critical priority workspace task.",
      earned: completed.some((task) => task.priority === "critical"),
      icon: "CS",
    },
    {
      id: "multi-workspace",
      title: "Cross-Workspace Builder",
      description: "Contribute tasks across two or more workspaces.",
      earned: new Set(tasks.map((task) => task.projectId)).size >= 2 && projects.length >= 2,
      icon: "CW",
    },
  ];
}

export function deriveCollaboratorSummary(
  tasks: CollaboratorTask[],
  projects: CollaboratorTaskProject[],
): CollaboratorLiveSummary {
  const metrics = buildMetrics(tasks, projects);
  const compositeScore = avg(metrics.map((metric) => metric.value));

  return {
    tasks,
    projects,
    metrics,
    weeklyVelocity: buildVelocity(tasks),
    perProject: buildPerProject(tasks, projects),
    achievements: buildAchievements(tasks, projects),
    compositeScore,
  };
}

export async function fetchCollaboratorSummary(): Promise<CollaboratorLiveSummary> {
  const snapshot = await fetchCollaboratorTasks();
  return deriveCollaboratorSummary(snapshot.tasks, snapshot.projects);
}
