import { techitApi, type InvokeResult } from '@/lib/techitApi';

export interface RemoteRepositoryState {
  repo: string;
  branch: string;
  headSha: string;
  treeSha: string;
  files: Array<{ path: string; sha: string; size: number }>;
}

export interface CodeFileChange { path: string; content?: string; delete?: boolean }
export interface PushDestinationInput {
  projectId: string;
  repo: string;
  branch: string;
  expectedHeadSha: string;
  message: string;
  files: CodeFileChange[];
}

const BLOCKED_CODE_PATH = /(^|\/)(\.env($|\.)|\.git(?:\/|$)|node_modules(?:\/|$)|\.ssh(?:\/|$)|secrets?(?:\/|$)|credentials?(?:\/|$)|[^/]*(?:credential|secret|private[-_]?key)[^/]*\.(?:json|pem|key|txt)$)/i;

export function isCodeSyncPathSafe(value: string): boolean {
  const path = value.trim().replace(/\\/g, '/').replace(/^\.\//, '');
  return Boolean(path) && !path.startsWith('/') && !path.includes('\0') && !path.split('/').includes('..') && !BLOCKED_CODE_PATH.test(path);
}

function data<T>(result: InvokeResult): T {
  if (!result.ok) throw Object.assign(new Error(result.error.detail || result.error.error), { result });
  return result.data as T;
}

export async function getRemoteRepositoryState(projectId: string, repo: string, branch: string): Promise<RemoteRepositoryState> {
  return data<RemoteRepositoryState>(await techitApi.invoke('github', 'get_repository_state', { projectId, repo, branch }));
}

export async function pullRemoteFiles(projectId: string, repo: string, branch: string, paths: string[]): Promise<{ headSha: string; files: Array<{ path: string; content: string }> }> {
  if (paths.length > 50) throw new Error('Pull is limited to 50 selected files per request.');
  if (paths.some(path => !isCodeSyncPathSafe(path))) throw new Error('Pull contains an unsafe or sensitive path.');
  const state = await getRemoteRepositoryState(projectId, repo, branch);
  const files = await Promise.all(paths.map(async path => ({ path, content: data<string>(await techitApi.invoke('github', 'read_file', { projectId, repo, path, ref: state.headSha })) })));
  return { headSha: state.headSha, files };
}

export function pushToDestination(input: PushDestinationInput & { approvalRequestId?: string }): Promise<InvokeResult> {
  return techitApi.invoke('github', 'push_files', input);
}

export async function approveAndPushToDestination(input: PushDestinationInput, approvalRequestId: string): Promise<InvokeResult> {
  await techitApi.approve(approvalRequestId);
  return pushToDestination({ ...input, approvalRequestId });
}
