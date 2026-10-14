// frontend/src/lib/api/workspace.ts
//
// Workspace AI — ai-router /api/v1/workspace/* (task suggestions, code review,
// sprint planning). For the Workspace MCP console (see new-frontend repo PR #6).

import { apiPost } from "./client";

export interface TaskSuggestions {
  suggestions?: unknown;
  next_actions?: unknown;
  [k: string]: unknown;
}

/** POST /api/v1/workspace/tasks/suggest */
export function suggestTasks(workspaceData: Record<string, unknown>): Promise<TaskSuggestions | null> {
  return apiPost<TaskSuggestions>("/workspace/tasks/suggest", workspaceData);
}

export interface CodeReview {
  review?: unknown;
  cost?: number;
  [k: string]: unknown;
}

/** POST /api/v1/workspace/code/review — Body: { code, language, context } */
export function reviewCode(payload: Record<string, unknown>): Promise<CodeReview | null> {
  return apiPost<CodeReview>("/workspace/code/review", payload);
}

/** POST /api/v1/workspace/sprint/plan */
export function planSprint(sprintData: Record<string, unknown>): Promise<Record<string, unknown> | null> {
  return apiPost<Record<string, unknown>>("/workspace/sprint/plan", sprintData);
}
