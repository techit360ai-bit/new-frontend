import { useEffect, useState } from 'react';
import { fetchWorkspaceCallToken } from '@/lib/api/workspaceCalls';

export type WorkspaceCallState = 'idle' | 'loading' | 'ready' | 'unavailable' | 'error';

export interface WorkspaceCallSession {
  state: WorkspaceCallState;
  reason?: string;
  token?: string;
  url?: string;
  room?: string;
  canPublish?: boolean;
}

/**
 * Resolve a real LiveKit session for a workspace call. The platform backend
 * authorizes membership and mints the token; this hook never fabricates a
 * connected state — an unavailable router/LiveKit surfaces as `unavailable`.
 */
export function useWorkspaceCall(workspaceId: string | undefined): WorkspaceCallSession {
  const [session, setSession] = useState<WorkspaceCallSession>({ state: workspaceId ? 'loading' : 'idle' });

  useEffect(() => {
    if (!workspaceId) {
      setSession({ state: 'idle' });
      return;
    }
    let alive = true;
    setSession({ state: 'loading' });
    fetchWorkspaceCallToken(workspaceId)
      .then((result) => {
        if (!alive) return;
        if (result.available && result.token && result.url) {
          setSession({ state: 'ready', token: result.token, url: result.url, room: result.room, canPublish: result.canPublish !== false });
        } else {
          setSession({ state: 'unavailable', reason: result.reason });
        }
      })
      .catch((error) => {
        if (alive) setSession({ state: 'error', reason: error instanceof Error ? error.message : 'Live call unavailable' });
      });
    return () => { alive = false; };
  }, [workspaceId]);

  return session;
}
