// frontend/src/dashboard/workspaces/lib/api/workspaceAI.ts
//
// Workspace AI — talks to the ai-router backend (github.com/techit360ai-bit/ai-router)
// /api/v1/workspace/* : task suggestions, code review, sprint planning.
// Independent of client.ts (workspace domain API); these hit the real engine and
// return null on failure so the console degrades gracefully.

import { apiPost } from "@/lib/api/client";

async function post<T>(path: string, body: unknown): Promise<T | null> {
  try { return await apiPost<T>(path, body); } catch { return null; }
}

export interface TaskSuggestions {
  suggestions?: unknown;
  next_actions?: unknown;
}

/** POST /api/v1/workspace/tasks/suggest */
export function suggestTasks(workspaceData: Record<string, unknown>): Promise<TaskSuggestions | null> {
  return post<TaskSuggestions>("/workspace/tasks/suggest", workspaceData);
}

export interface CodeReview {
  review?: unknown;
  provider_cost_usd?: number;
}

export interface WorkspaceConversationMessage { role: "user" | "assistant"; content: string; }
export interface WorkspaceConversationResponse {
  message: string;
  model_used?: string;
  provider?: string;
  context_injected: boolean;
  context_version?: string;
  approval_required: boolean;
  approval_action?: string | null;
  executed: false;
}

export function converseWithWorkspace(payload: {
  workspace_id: string;
  message: string;
  messages?: WorkspaceConversationMessage[];
  requested_action?: string;
  model_id?: string;
}): Promise<WorkspaceConversationResponse | null> {
  return post<WorkspaceConversationResponse>("/workspace/conversation", payload);
}
/** POST /api/v1/workspace/code/review — Body: { code, language, context } */
export function reviewCode(payload: Record<string, unknown>): Promise<CodeReview | null> {
  return post<CodeReview>("/workspace/code/review", payload);
}

/** POST /api/v1/workspace/sprint/plan */
export function planSprint(sprintData: Record<string, unknown>): Promise<Record<string, unknown> | null> {
  return post<Record<string, unknown>>("/workspace/sprint/plan", sprintData);
}

/** Normalize the suggest_tasks response into a flat list of suggestion strings. */
export function flattenSuggestions(res: TaskSuggestions | null): string[] {
  if (!res) return [];
  const out: string[] = [];
  const take = (v: unknown) => {
    if (!v) return;
    if (typeof v === "string") out.push(v);
    else if (Array.isArray(v)) v.forEach((x) => {
      if (typeof x === "string") out.push(x);
      else if (x && typeof x === "object" && "title" in x) out.push(String((x as { title: unknown }).title));
      else out.push(String(x));
    });
  };
  take(res.suggestions);
  if (out.length === 0) take(res.next_actions);
  return out.filter(Boolean);
}
