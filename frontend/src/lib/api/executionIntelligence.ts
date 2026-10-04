/**
 * Canonical execution-intelligence client (WS-H).
 *
 * ONE projection of workspace execution, read the same way by every surface:
 * founder dashboard, collaborator workspace, investor section, organization
 * dashboard and hackathon console. Trust is composed server-side from the
 * canonical Trust Engine — this client never scores anything itself.
 */

import { domainGet } from '@/lib/domainApi';

export type ExecutionIntelligenceRole =
  | 'founder'
  | 'collaborator'
  | 'investor'
  | 'organisation'
  | 'hackathon'
  | 'workspace';

export interface ExecutionIntelligenceView {
  ok: boolean;
  role: string;
  roleFocus: string[];
  generatedAt: string;
  window: { sinceHours: number; from: string; to: string };
  canonical: { executesFrom: 'workspace'; trustEngine: 'canonical'; graphView: 'execution-reputation' };
  signals: {
    events: number;
    weight: number;
    activeActors: number;
    activeTools: string[];
    projects: string[];
    artifacts: number;
    byKind: Record<string, number>;
    byTool: Record<string, number>;
    byActor: Array<{ actorId: string; actorKind: string; events: number; weight: number }>;
  };
  velocity: { eventsPerDay: number; weightPerDay: number };
  highlights: Array<{
    id: string;
    kind: string;
    summary: string;
    at: string;
    sourceTool: string;
    actorId: string;
    projectId?: string;
    artifactId?: string;
  }>;
  /** Actor trust composed from the canonical Trust Engine. */
  trust: Array<Record<string, unknown> & { subjectId: string }>;
}

export interface ExecutionIntelligenceQuery {
  role?: ExecutionIntelligenceRole;
  actorId?: string;
  projectId?: string;
  organizationId?: string;
  programId?: string;
  cohortId?: string;
  hackathonId?: string;
  sinceHours?: number;
}

export async function fetchExecutionIntelligence(
  query: ExecutionIntelligenceQuery = {},
): Promise<ExecutionIntelligenceView> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && String(value).trim() !== '') params.set(key, String(value));
  }
  const qs = params.toString();
  return domainGet<ExecutionIntelligenceView>(`/execution-intelligence${qs ? `?${qs}` : ''}`);
}
