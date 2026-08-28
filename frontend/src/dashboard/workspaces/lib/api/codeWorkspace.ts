import { apiPost } from '@/lib/api/client';
import { platformDelete, platformGet, platformPatch, platformPost } from '@/lib/platformApi';

export interface CodeFileMeta { id: string; workspaceId: string; projectId: string; path: string; language: string; sizeBytes: number; version: number; contentHash: string; updatedAt: string; updatedBy: string }
export interface CodeFile extends CodeFileMeta { content: string }
export interface CodeSnapshot { workspace: { id: string; projectId: string; name: string }; files: Array<{ path: string; content: string; version: number; contentHash: string; language: string }>; sync: { repo: string; branch: string; baseHeadSha: string } | null; snapshotHash: string }
export interface ProjectAdapter { adapter: 'react' | 'nextjs' | 'node' | 'python' | 'static'; packageManager: 'npm' | 'pnpm' | 'yarn' | null; commands: { install: string | null; dev: string | null; test: string | null; build: string | null }; supportedInBrowser: boolean; deterministic: true }

const base = (workspaceId: string) => `/code/${encodeURIComponent(workspaceId)}`;
export const listCodeFiles = (workspaceId: string) => platformGet<{ files: CodeFileMeta[] }>(`${base(workspaceId)}/files`).then(row => row.files);
export const readCodeFile = (workspaceId: string, path: string) => platformGet<{ file: CodeFile }>(`${base(workspaceId)}/file?path=${encodeURIComponent(path)}`).then(row => row.file);
export const saveCodeFile = (workspaceId: string, input: { path: string; content: string; expectedVersion?: number; source?: string }) => platformPost<{ file: CodeFile }>(`${base(workspaceId)}/file`, input).then(row => row.file);
export const moveCodeFile = (workspaceId: string, path: string, nextPath: string, expectedVersion: number) => platformPatch<{ file: CodeFileMeta }>(`${base(workspaceId)}/file/move?path=${encodeURIComponent(path)}`, { path: nextPath, expectedVersion }).then(row => row.file);
export const deleteCodeFile = (workspaceId: string, path: string, expectedVersion?: number) => platformDelete<{ file: CodeFileMeta }>(`${base(workspaceId)}/file?path=${encodeURIComponent(path)}`, { expectedVersion }).then(row => row.file);
export const getCodeSnapshot = (workspaceId: string) => platformGet<CodeSnapshot>(`${base(workspaceId)}/snapshot`);
export const getProjectAdapter = (workspaceId: string) => platformGet<ProjectAdapter>(`${base(workspaceId)}/adapter`);
export const recordRuntime = (workspaceId: string, body: Record<string, unknown>) => platformPost(`${base(workspaceId)}/runtime-sessions`, body);
export const saveCodeSyncState = (workspaceId: string, body: Record<string, unknown>) => platformPost(`${base(workspaceId)}/sync-state`, body);
export const createVsCodeGrant = (workspaceId: string, body: { selectedRoot?: string; allowCommands?: boolean }) => platformPost<{ grant: { id: string; token: string; expiresAt: string; permissions: string[] } }>(`${base(workspaceId)}/vscode-grants`, body).then(row => row.grant);
export const prepareCodeDeployment = (workspaceId: string, body: Record<string, unknown>) => platformPost(`${base(workspaceId)}/deployments`, body);

export interface CodePlanResponse { plan: { summary: string; existingSystems: string[]; changes: Array<{ path: string; action: string; reason: string }>; tests: string[]; securityChecks: string[]; recommendedAgentFlow: string[] }; context_injected: boolean; authoritative: false }
export const planCodeTask = (body: Record<string, unknown>) => apiPost<CodePlanResponse>('/workspace/code/plan', body);
export interface CodeProposalResponse { proposal: { summary: string; changes: Array<{ path: string; content: string; reason: string }>; tests: string[]; securityNotes: string[] }; authoritative: false; applied: false }
export const proposeCodeChanges = (body: Record<string, unknown>) => apiPost<CodeProposalResponse>('/workspace/code/propose', body);
