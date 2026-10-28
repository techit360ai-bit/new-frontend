// frontend/src/lib/api/collaboratorTasks.ts
//
// Collaborator task board backed by BACKEND /api/domain/workspaces/*/tasks.

import { domainGet, domainPatch, domainPost } from "@/lib/domainApi";
import { fetchWorkspaces, type WorkspaceRef } from "@/lib/api/workspaces";

export type CollaboratorTaskPriority = "critical" | "high" | "medium" | "low";
export type CollaboratorTaskStatus = "pending" | "in-progress" | "completed";

export interface CollaboratorTaskProject {
  id: string;
  workspaceId: string;
  name: string;
}

export interface CollaboratorTask {
  id: string;
  workspaceId: string;
  title: string;
  projectId: string;
  projectName: string;
  priority: CollaboratorTaskPriority;
  deadline: string;
  impactScore: number;
  dependencies: string[];
  aiReason: string;
  status: CollaboratorTaskStatus;
  aiRank: number;
}

export interface CollaboratorTasksSnapshot {
  projects: CollaboratorTaskProject[];
  tasks: CollaboratorTask[];
}

export interface CollaboratorTaskCreateInput {
  workspaceId: string;
  projectId: string;
  projectName: string;
  title: string;
  priority: CollaboratorTaskPriority;
  deadline: string;
  impactScore: number;
}

type TaskRecord = Record<string, unknown>;

function asRecord(value: unknown): TaskRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as TaskRecord)
    : {};
}

function firstString(record: TaskRecord, keys: string[], fallback = ""): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return fallback;
}

function firstNumber(record: TaskRecord, keys: string[], fallback = 0): number {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return fallback;
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && allowed.includes(value as T) ? (value as T) : fallback;
}

function statusFor(value: unknown): CollaboratorTaskStatus {
  if (value === "completed" || value === "done") return "completed";
  if (value === "in-progress" || value === "running" || value === "needs_approval") return "in-progress";
  return "pending";
}

function priorityFor(record: TaskRecord): CollaboratorTaskPriority {
  const explicit = oneOf(record.priority, ["critical", "high", "medium", "low"] as const, "medium");
  if (explicit !== "medium") return explicit;
  if (record.status === "failed" || record.status === "needs_approval") return "critical";
  if (record.status === "running") return "high";
  if (record.status === "done" || record.status === "completed") return "low";
  return explicit;
}

function projectFor(workspace: WorkspaceRef): CollaboratorTaskProject {
  return {
    id: workspace.projectId || workspace.id,
    workspaceId: workspace.id,
    name: workspace.name || workspace.projectId || "Workspace",
  };
}

export function normalizeCollaboratorTask(
  value: unknown,
  project: CollaboratorTaskProject,
  index = 0,
): CollaboratorTask {
  const record = asRecord(value);
  const id = firstString(record, ["id", "taskId"], `task-${project.workspaceId}-${index + 1}`);
  const title = firstString(record, ["title", "prompt", "name"], "Untitled task");

  return {
    id,
    workspaceId: firstString(record, ["workspaceId", "workspace_id"], project.workspaceId),
    title,
    projectId: firstString(record, ["projectId", "project_id"], project.id),
    projectName: firstString(record, ["projectName", "project_name", "workspaceName"], project.name),
    priority: priorityFor(record),
    deadline: firstString(record, ["deadline", "dueDate", "due_date"]),
    impactScore: firstNumber(record, ["impactScore", "impact", "score"]),
    dependencies: stringList(record.dependencies),
    aiReason: firstString(record, ["aiReason", "reason", "summary"]),
    status: statusFor(record.status),
    aiRank: firstNumber(record, ["aiRank", "rank"], index + 1),
  };
}

export async function fetchCollaboratorTasks(): Promise<CollaboratorTasksSnapshot> {
  const workspaces = await fetchWorkspaces();
  const projects = workspaces.map(projectFor);
  const taskGroups = await Promise.all(
    projects.map(async (project) => {
      const data = await domainGet<{ tasks?: unknown[] }>(`/workspaces/${project.workspaceId}/tasks`);
      const rows = Array.isArray(data.tasks) ? data.tasks : [];
      return rows.map((row, index) => normalizeCollaboratorTask(row, project, index));
    }),
  );

  return {
    projects,
    tasks: taskGroups.flat().sort((a, b) => a.aiRank - b.aiRank),
  };
}

export function createCollaboratorTask(input: CollaboratorTaskCreateInput): Promise<CollaboratorTask> {
  return domainPost<{ task?: unknown }>(`/workspaces/${input.workspaceId}/tasks`, {
    title: input.title,
    prompt: input.title,
    projectId: input.projectId,
    projectName: input.projectName,
    priority: input.priority,
    deadline: input.deadline,
    impactScore: input.impactScore,
    dependencies: [],
    aiReason: "",
    status: "pending",
  }).then((data) => normalizeCollaboratorTask(data.task, {
    id: input.projectId,
    workspaceId: input.workspaceId,
    name: input.projectName,
  }));
}

export function patchCollaboratorTask(
  task: Pick<CollaboratorTask, "id" | "workspaceId" | "projectId" | "projectName">,
  body: Partial<Pick<CollaboratorTask, "status" | "deadline" | "priority" | "impactScore" | "title">>,
): Promise<CollaboratorTask> {
  return domainPatch<{ task?: unknown }>(`/workspaces/${task.workspaceId}/tasks/${task.id}`, body)
    .then((data) => normalizeCollaboratorTask(data.task, {
      id: task.projectId,
      workspaceId: task.workspaceId,
      name: task.projectName,
    }));
}
