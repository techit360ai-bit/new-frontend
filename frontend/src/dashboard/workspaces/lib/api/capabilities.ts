import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api/client';
import { resolveWorkspaceId } from './client';

export interface BuildContext { workspaceId: string; projectId: string | null; buildProfile?: { buildPath?: string; lifecycleView?: string } | null; costEstimate?: { estimatedCredits?: number; runtimeMinutes?: number; subscriptionCreditsUsed?: number; creditsToConsume?: number; projectedCreditBalance?: number; confidence?: string } | null; preview?: { url?: string; expiresAt?: string } | null }
export async function getBuildContext(workspaceId?: string): Promise<BuildContext | null> { const id = workspaceId || await resolveWorkspaceId(); return id ? apiGet<BuildContext>(`/code/${id}/build-context`) : null; }
export async function chooseBuildPath(buildPath: 'prototype' | 'mvp', scope?: Record<string, unknown>) { const id = await resolveWorkspaceId(); return id ? apiPost(`/code/${id}/build-path`, { buildPath, scope }) : null; }
export async function setLifecycleView(view: string) { const id = await resolveWorkspaceId(); return id ? apiPatch(`/code/${id}/lifecycle-view`, { view }) : null; }
export async function listModelConnections() { return apiGet<{ connections: Array<{ id: string; provider: string; displayName: string; maskedIdentifier?: string; status: string }> }>('/code/models/connections'); }
export async function createModelConnection(payload: { provider: string; apiKey: string; displayName?: string; endpoint?: string; modelAllowList?: string[] }) { return apiPost('/code/models/connections', payload); }
export async function revokeModelConnection(id: string) { return apiDelete(`/code/models/connections/${encodeURIComponent(id)}`); }
export async function listWorkspaceModels(workspaceId: string) { return apiGet(`/code/${workspaceId}/models`); }
