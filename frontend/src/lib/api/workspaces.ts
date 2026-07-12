// frontend/src/lib/api/workspaces.ts
//
// Workspaces bound to an analyzed venture — BACKEND /api/domain/workspaces.
// Powers the Incubation → Workspace handoff and project-scoped workspace context.

import { domainGet, domainPost } from "@/lib/domainApi";

export interface WorkspaceRef {
  id: string;
  projectId: string;
  name: string;
  status: string;
  seededFromAnalysis: boolean;
}

export interface WorkspaceContext {
  workspaceId: string;
  projectId: string | null;
  venture: Record<string, unknown> | null;
  blueprintAvailable: boolean;
}

/** GET /api/domain/workspaces — the founder's workspaces (each bound to a project). */
export function fetchWorkspaces(): Promise<WorkspaceRef[]> {
  return domainGet<{ workspaces: WorkspaceRef[] }>("/workspaces").then((data) => data.workspaces);
}

/**
 * POST /api/domain/workspaces/provision — create (or fetch) a workspace bound to an
 * analyzed project, seeded from its latest Incubation Hub analysis.
 */
export function provisionWorkspace(
  projectId: string,
  name?: string,
): Promise<{ ok: boolean; workspace?: WorkspaceRef; error?: string }> {
  return domainPost<{ ok: boolean; workspace?: WorkspaceRef }>("/workspaces/provision", { projectId, name });
}

/** GET /api/domain/workspaces/{id}/context — project-scoped context (venture blueprint). */
export function fetchWorkspaceContext(
  workspaceId: string,
  projectId?: string,
): Promise<WorkspaceContext | null> {
  const qs = projectId ? `?project_id=${encodeURIComponent(projectId)}` : "";
  return domainGet<WorkspaceContext>(`/workspaces/${workspaceId}/context${qs}`);
}
