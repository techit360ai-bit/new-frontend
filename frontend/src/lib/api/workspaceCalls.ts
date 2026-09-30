// Workspace audio/video call token — BACKEND /api/domain/workspaces/:id/call-token.
//
// The platform backend authorizes workspace membership and mints a real LiveKit
// participant token. When LiveKit is not configured the backend returns
// { available: false, reason }, which callers must render honestly rather than
// faking a connected call.
import { domainPost } from '@/lib/domainApi';

export interface WorkspaceCallToken {
  available: boolean;
  reason?: string;
  workspaceId?: string;
  token?: string;
  url?: string;
  room?: string;
  identity?: string;
  canPublish?: boolean;
}

export function fetchWorkspaceCallToken(workspaceId: string): Promise<WorkspaceCallToken> {
  return domainPost<WorkspaceCallToken>(`/workspaces/${encodeURIComponent(workspaceId)}/call-token`, {});
}
