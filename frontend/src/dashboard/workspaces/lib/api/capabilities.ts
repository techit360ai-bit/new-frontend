import { platformDelete, platformGet, platformPatch, platformPost } from '@/lib/platformApi';
import { resolveWorkspaceId } from './client';

export interface BuildContext { workspaceId: string; projectId: string | null; buildProfile?: { buildPath?: string; lifecycleView?: string } | null; costEstimate?: { estimatedCredits?: number; runtimeMinutes?: number; subscriptionCreditsUsed?: number; creditsToConsume?: number; projectedCreditBalance?: number; confidence?: string } | null; preview?: { url?: string; expiresAt?: string } | null }
export async function getBuildContext(workspaceId?: string): Promise<BuildContext | null> { const id = workspaceId || await resolveWorkspaceId(); return id ? platformGet<BuildContext>(`/code/${id}/build-context`) : null; }
export async function chooseBuildPath(buildPath: 'prototype' | 'mvp', scope?: Record<string, unknown>) { const id = await resolveWorkspaceId(); return id ? platformPost(`/code/${id}/build-path`, { buildPath, scope }) : null; }
export async function setLifecycleView(view: string) { const id = await resolveWorkspaceId(); return id ? platformPatch(`/code/${id}/lifecycle-view`, { view }) : null; }
export interface ModelConnection { id: string; provider: string; displayName: string; maskedIdentifier?: string; status: string }
export async function listModelConnections() { return platformGet<{ connections: ModelConnection[] }>('/code/models/connections'); }
export async function createModelConnection(payload: { provider: string; apiKey: string; displayName?: string; endpoint?: string; modelAllowList?: string[] }) { return platformPost('/code/models/connections', payload); }
export async function revokeModelConnection(id: string) { return platformDelete(`/code/models/connections/${encodeURIComponent(id)}`); }
export interface WorkspaceModelBinding { id: string; workspaceId: string; connectionId: string; modelId: string; operations: string[]; status: string; connection?: ModelConnection }
export async function listWorkspaceModels(workspaceId: string) { return platformGet<{ bindings: WorkspaceModelBinding[] }>(`/code/${workspaceId}/models`); }
export async function bindWorkspaceModel(workspaceId: string, payload: { connectionId: string; modelId?: string; operations?: string[] }) { return platformPost<{ binding: WorkspaceModelBinding }>(`/code/${workspaceId}/models`, payload); }
export async function unbindWorkspaceModel(workspaceId: string, bindingId: string) { return platformDelete(`/code/${workspaceId}/models/${encodeURIComponent(bindingId)}`); }
