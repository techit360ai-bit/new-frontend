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
  isOwner?: boolean;
  accessLevel?: "owner" | "contributor" | "viewer";
}

export interface WorkspaceContext {
  workspaceId: string;
  projectId: string | null;
  venture: Record<string, unknown> | null;
  blueprintAvailable: boolean;
  isOwner?: boolean;
  accessLevel?: "owner" | "contributor" | "viewer";
}

export interface WorkspaceInvitation {
  id: string;
  workspaceId: string;
  workspaceName: string;
  projectId: string | null;
  collaboratorId: string;
  inviterName: string;
  requestedRole: string;
  scope: string;
  requiredSkills: string[];
  compensationMode: "equity-heavy" | "equity-cash" | "cash-only";
  equityProposal: number;
  cashReward: number;
  accessLevel: "contributor" | "viewer";
  status: "pending" | "accepted" | "declined" | "expired";
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
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

export function inviteWorkspaceCollaborator(
  workspaceId: string,
  invitation: {
    collaboratorId: string;
    requestedRole: string;
    scope: string;
    requiredSkills: string[];
    compensationMode: "equity-heavy" | "equity-cash" | "cash-only";
    equityProposal?: number;
    cashReward?: number;
    accessLevel: "contributor" | "viewer";
  },
): Promise<WorkspaceInvitation> {
  return domainPost<{ invitation: WorkspaceInvitation }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/invitations`,
    invitation,
  ).then((data) => data.invitation);
}

export function fetchWorkspaceInvitation(invitationId: string): Promise<WorkspaceInvitation> {
  return domainGet<{ invitation: WorkspaceInvitation }>(
    `/workspace-invitations/${encodeURIComponent(invitationId)}`,
  ).then((data) => data.invitation);
}

export function acceptWorkspaceInvitation(invitationId: string): Promise<WorkspaceInvitation> {
  return domainPost<{ invitation: WorkspaceInvitation }>(
    `/workspace-invitations/${encodeURIComponent(invitationId)}/accept`,
  ).then((data) => data.invitation);
}

export function declineWorkspaceInvitation(invitationId: string): Promise<WorkspaceInvitation> {
  return domainPost<{ invitation: WorkspaceInvitation }>(
    `/workspace-invitations/${encodeURIComponent(invitationId)}/decline`,
  ).then((data) => data.invitation);
}
