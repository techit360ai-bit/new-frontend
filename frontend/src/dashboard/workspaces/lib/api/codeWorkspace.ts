import { platformDelete, platformGet, platformPatch, platformPost } from '@/lib/platformApi';

export interface CodeFileMeta { id: string; workspaceId: string; projectId: string; path: string; language: string; sizeBytes: number; version: number; contentHash: string; updatedAt: string; updatedBy: string }
export interface CodeFile extends CodeFileMeta { content: string }
export interface CodeSnapshot { workspace: { id: string; projectId: string; name: string }; files: Array<{ path: string; content: string; version: number; contentHash: string; language: string }>; sync: { provider: string; repo: string; branch: string; baseHeadSha: string; baseFiles?: Array<{ path: string; content?: string; contentHash: string }> } | null; snapshotHash: string }
export interface ProjectAdapter { adapter: 'react' | 'nextjs' | 'node' | 'python' | 'static'; packageManager: 'npm' | 'pnpm' | 'yarn' | null; commands: { install: string | null; dev: string | null; test: string | null; build: string | null }; supportedInBrowser: boolean; deterministic: true }

const base = (workspaceId: string) => `/code/${encodeURIComponent(workspaceId)}`;
// Coding-intelligence generation can outrun the default request budget; the backend
// caps the AI-router call at 45s, so allow a slightly longer window before aborting.
const CODE_AI_TIMEOUT_MS = 60_000;
export const listCodeFiles = (workspaceId: string) => platformGet<{ files: CodeFileMeta[] }>(`${base(workspaceId)}/files`).then(row => row.files);
export const readCodeFile = (workspaceId: string, path: string) => platformGet<{ file: CodeFile }>(`${base(workspaceId)}/file?path=${encodeURIComponent(path)}`).then(row => row.file);
export const saveCodeFile = (workspaceId: string, input: { path: string; content: string; expectedVersion?: number; source?: string }) => platformPost<{ file: CodeFile }>(`${base(workspaceId)}/file`, input).then(row => row.file);
export const moveCodeFile = (workspaceId: string, path: string, nextPath: string, expectedVersion: number) => platformPatch<{ file: CodeFileMeta }>(`${base(workspaceId)}/file/move?path=${encodeURIComponent(path)}`, { path: nextPath, expectedVersion }).then(row => row.file);
export const deleteCodeFile = (workspaceId: string, path: string, expectedVersion?: number) => platformDelete<{ file: CodeFileMeta }>(`${base(workspaceId)}/file?path=${encodeURIComponent(path)}`, { expectedVersion }).then(row => row.file);
export const getCodeSnapshot = (workspaceId: string) => platformGet<CodeSnapshot>(`${base(workspaceId)}/snapshot`);
export const getProjectAdapter = (workspaceId: string) => platformGet<ProjectAdapter>(`${base(workspaceId)}/adapter`);
export const recordRuntime = (workspaceId: string, body: Record<string, unknown>) => platformPost<{ session: { id: string; status: string; exitCode: number | null } }>(`${base(workspaceId)}/runtime-sessions`, body).then(row => row.session);
export const saveCodeSyncState = (workspaceId: string, body: Record<string, unknown>) => platformPost(`${base(workspaceId)}/sync-state`, body);
export const createVsCodeGrant = (workspaceId: string, body: { selectedRoot?: string; allowCommands?: boolean }) => platformPost<{ grant: { id: string; token: string; expiresAt: string; permissions: string[] } }>(`${base(workspaceId)}/vscode-grants`, body).then(row => row.grant);
export interface CodeDeployment { id: string; status: string; commitSha: string; destination: string; environment: string }
export const prepareCodeDeployment = (workspaceId: string, body: Record<string, unknown>) => platformPost<{ deployment: CodeDeployment }>(`${base(workspaceId)}/deployments`, body).then(row => row.deployment);
export const verifyCodeDeployment = (workspaceId: string, deploymentId: string, body: Record<string, unknown>) => platformPost<{ deployment: CodeDeployment }>(`${base(workspaceId)}/deployments/${encodeURIComponent(deploymentId)}/verify`, body).then(row => row.deployment);
export interface CodeDestination { id: string; provider: 'github' | 'gitlab' | 'bitbucket' | 'local'; repository: string | null; capabilities: { pull: boolean; push: boolean; deploy: boolean }; connectorId: string | null }
export const listCodeDestinations = (workspaceId: string) => platformGet<{ destinations: CodeDestination[] }>(`${base(workspaceId)}/destinations`).then(row => row.destinations);

export type CodeExecutionStage = 'execution_intelligence' | 'mvp_builder' | 'product_architect' | 'code' | 'test' | 'debugger' | 'security' | 'review' | 'deployment';
export interface CodeHunk { id: string; oldStart: number; oldEnd: number; replacement: string; replacementHash?: string }
export interface CodeExecutionRun { id: string; workspaceId: string; requirement: string; mode: string; status: string; proposedChanges: Array<{ path: string; contentHash: string; baseContentHash?: string; hunks?: CodeHunk[] }>; steps: Array<{ stage: CodeExecutionStage; status: string; summary?: string; evidence?: Record<string, unknown> }>; reviews: Array<{ path: string; decision: string; hunks: Array<{ id: string; decision: string }> }> }
export const createCodeExecutionRun = (workspaceId: string, body: Record<string, unknown>) => platformPost<{ run: CodeExecutionRun }>(`${base(workspaceId)}/execution-runs`, body).then(row => row.run);
export const getCodeExecutionRun = (workspaceId: string, runId: string) => platformGet<{ run: CodeExecutionRun }>(`${base(workspaceId)}/execution-runs/${encodeURIComponent(runId)}`).then(row => row.run);
export const recordCodeExecutionStage = (workspaceId: string, runId: string, body: Record<string, unknown>) => platformPost<{ run: CodeExecutionRun }>(`${base(workspaceId)}/execution-runs/${encodeURIComponent(runId)}/stages`, body).then(row => row.run);
export const recordCodeReview = (workspaceId: string, runId: string, body: Record<string, unknown>) => platformPost(`${base(workspaceId)}/execution-runs/${encodeURIComponent(runId)}/reviews`, body);
export const finalizeCodeExecutionRun = (workspaceId: string, runId: string) => platformPost<{ run: CodeExecutionRun }>(`${base(workspaceId)}/execution-runs/${encodeURIComponent(runId)}/finalize`, {}).then(row => row.run);
export const applyCodeExecutionRun = (workspaceId: string, runId: string, changes: Array<{ path: string; content?: string; expectedVersion: number }>) => platformPost<{ run: CodeExecutionRun; applied: Array<{ path: string; version: number; contentHash: string }> }>(`${base(workspaceId)}/execution-runs/${encodeURIComponent(runId)}/apply`, { changes });

export interface CodeAiRouting { requested: 'platform' | 'byok'; applied: 'platform' | 'byok'; reason: string | null; connectionId: string | null; connectionName: string | null; modelId: string | null }
export interface CodePlanResponse { plan: { summary: string; existingSystems: string[]; changes: Array<{ path: string; action: string; reason: string }>; tests: string[]; securityChecks: string[]; recommendedAgentFlow: string[]; aiNarrative?: string | null; aiModel?: string | null }; context_injected: boolean; authoritative: false; ai_routing: CodeAiRouting }
export const planCodeTask = (workspaceId: string, body: Record<string, unknown>) => platformPost<CodePlanResponse>(`${base(workspaceId)}/plan`, body);
export interface CodeProposalResponse { proposal: { summary: string; changes: Array<{ path: string; content: string; reason: string }>; tests: string[]; securityNotes: string[] }; authoritative: false; applied: false; ai_routing: CodeAiRouting; ai_model: string | null }
export const proposeCodeChanges = (workspaceId: string, body: Record<string, unknown>) => platformPost<CodeProposalResponse>(`${base(workspaceId)}/propose`, body, CODE_AI_TIMEOUT_MS);
export interface CodeOrchestrationResponse { orchestration: { summary: string; stages: Array<{ stage: CodeExecutionStage; agent: string; summary: string; actions: string[]; risks: string[]; requiresEvidence: string[] }>; recommendedFlow: string[] }; authoritative: false; execution: { performed: false; requires_backend_run: true; requires_mcp: true; mutation_free: true }; ai_routing: CodeAiRouting }
export const orchestrateCodeTask = (workspaceId: string, body: Record<string, unknown>) => platformPost<CodeOrchestrationResponse>(`${base(workspaceId)}/orchestrate`, body);
