import { expect, test } from "vitest";
import { deriveCollaboratorSummary } from "./collaboratorSummary";
import type { CollaboratorTask, CollaboratorTaskProject } from "./collaboratorTasks";

const projects: CollaboratorTaskProject[] = [
  { id: "project_1", workspaceId: "ws_1", name: "Live Workspace" },
  { id: "project_2", workspaceId: "ws_2", name: "Second Workspace" },
];

const tasks: CollaboratorTask[] = [
  {
    id: "task_1",
    workspaceId: "ws_1",
    title: "Ship API",
    projectId: "project_1",
    projectName: "Live Workspace",
    priority: "high",
    deadline: "2026-07-15",
    impactScore: 80,
    dependencies: [],
    aiReason: "",
    status: "completed",
    aiRank: 1,
  },
  {
    id: "task_2",
    workspaceId: "ws_1",
    title: "Follow up",
    projectId: "project_1",
    projectName: "Live Workspace",
    priority: "medium",
    deadline: "2026-07-16",
    impactScore: 60,
    dependencies: [],
    aiReason: "",
    status: "pending",
    aiRank: 2,
  },
  {
    id: "task_3",
    workspaceId: "ws_2",
    title: "Fix incident",
    projectId: "project_2",
    projectName: "Second Workspace",
    priority: "critical",
    deadline: "2026-07-17",
    impactScore: 100,
    dependencies: [],
    aiReason: "",
    status: "completed",
    aiRank: 3,
  },
];

test("deriveCollaboratorSummary computes live task metrics without fixture records", () => {
  const summary = deriveCollaboratorSummary(tasks, projects);

  expect(summary.metrics).toEqual([
    { name: "Execution Velocity", value: 90, change: 0, trend: "stable" },
    { name: "Consistency Score", value: 65, change: 0, trend: "stable" },
    { name: "Completion Rate", value: 67, change: 0, trend: "stable" },
    { name: "Collaboration Score", value: 100, change: 0, trend: "stable" },
    { name: "Impact Score", value: 80, change: 0, trend: "stable" },
  ]);
  expect(summary.compositeScore).toBe(80);
  expect(summary.perProject).toEqual([
    { id: "project_1", name: "Live Workspace", shipped: 1, impactAvg: 70, lastContribution: "2026-07-16" },
    { id: "project_2", name: "Second Workspace", shipped: 1, impactAvg: 100, lastContribution: "2026-07-17" },
  ]);
  expect(summary.weeklyVelocity).toHaveLength(1);
  expect(summary.weeklyVelocity[0]).toMatchObject({ tasks: 2, impact: 80 });
  expect(Object.fromEntries(summary.achievements.map((item) => [item.id, item.earned]))).toEqual({
    shipper: true,
    impact: true,
    critical: true,
    "multi-workspace": true,
  });
});

test("deriveCollaboratorSummary returns explicit zero live state", () => {
  const summary = deriveCollaboratorSummary([], []);

  expect(summary.tasks).toEqual([]);
  expect(summary.projects).toEqual([]);
  expect(summary.weeklyVelocity).toEqual([]);
  expect(summary.perProject).toEqual([]);
  expect(summary.metrics.map((metric) => metric.value)).toEqual([0, 0, 0, 0, 0]);
  expect(summary.compositeScore).toBe(0);
  expect(summary.achievements.every((achievement) => !achievement.earned)).toBe(true);
});
