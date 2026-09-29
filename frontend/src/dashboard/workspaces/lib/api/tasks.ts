import type { AgentTask, TaskEvent } from '../types';
import { workspaceGet, workspacePatch, workspacePost } from './client';

function normalizeTask(row: Partial<AgentTask> & Record<string, unknown>): AgentTask {
  return {
    id: String(row.id),
    agentId: String(row.agentId ?? row.agent_id ?? ''),
    prompt: String(row.prompt ?? row.title ?? ''),
    status: (row.status as AgentTask['status']) ?? 'queued',
    createdAt: String(row.createdAt ?? row.created_at ?? ''),
    events: Array.isArray(row.events) ? row.events as TaskEvent[] : [],
  };
}

export async function listTasks(): Promise<AgentTask[]> {
  const data = await workspaceGet<{ tasks: Array<Partial<AgentTask> & Record<string, unknown>> }>('/tasks');
  return data?.tasks.map(normalizeTask) ?? [];
}

export async function getTask(id: string): Promise<AgentTask | undefined> {
  const data = await workspaceGet<{ task: Partial<AgentTask> & Record<string, unknown> }>(`/tasks/${encodeURIComponent(id)}`);
  return data?.task ? normalizeTask(data.task) : undefined;
}

export async function createTask(agentId: string, prompt: string): Promise<string> {
  const data = await workspacePost<{ task: Partial<AgentTask> & Record<string, unknown> }>('/tasks', {
    agentId,
    prompt,
    status: 'queued',
    events: [],
  });
  if (!data?.task?.id) throw new Error('No active workspace is available for task creation.');
  return String(data.task.id);
}

/** Persist a task's status so Kanban moves survive a reload. */
export async function updateTaskStatus(id: string, status: AgentTask['status']): Promise<AgentTask | undefined> {
  const data = await workspacePatch<{ task: Partial<AgentTask> & Record<string, unknown> }>(
    `/tasks/${encodeURIComponent(id)}`,
    { status },
  );
  return data?.task ? normalizeTask(data.task) : undefined;
}

export async function resolveApproval(taskId: string, approvalId: string, decision: 'approved' | 'rejected'): Promise<void> {
  await workspacePost(`/tasks/${encodeURIComponent(taskId)}/events`, {
    type: 'approval_resolved',
    status: decision === 'approved' ? 'running' : 'cancelled',
    approval: { id: approvalId, resolved: decision },
  });
}

/**
 * Ask the backend to execute a queued task against the AI router. The router call
 * is server-side, so this resolves once the run has been recorded (or failed with
 * an explicit error event).
 */
export async function runTask(id: string): Promise<AgentTask | undefined> {
  const data = await workspacePost<{ task: Partial<AgentTask> & Record<string, unknown> }>(`/tasks/${encodeURIComponent(id)}/run`, {});
  return data?.task ? normalizeTask(data.task) : undefined;
}

function eventKey(event: TaskEvent): string {
  return event.id || `${event.type}|${event.at}|${event.text ?? ''}`;
}

const TERMINAL_STATUSES = new Set<AgentTask['status']>(['done', 'failed', 'cancelled']);
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface StreamTaskOptions { intervalMs?: number; maxWaitMs?: number; signal?: AbortSignal }

/**
 * Polls the backend task record and yields each newly recorded event. The backend
 * is the real producer (see workspaceTaskService.js): it writes a running event,
 * forwards the prompt to the AI router, then records the answer or an explicit
 * failure. Polling stops when the task reaches a terminal status, when the caller
 * aborts, or after `maxWaitMs` (default 90s) — never silently hangs.
 */
export async function* streamTask(taskId: string, options: StreamTaskOptions = {}): AsyncGenerator<TaskEvent> {
  const intervalMs = options.intervalMs ?? 1500;
  const deadline = Date.now() + (options.maxWaitMs ?? 90_000);
  const seen = new Set<string>();
  let task = await getTask(taskId);
  const drain = function* (current?: AgentTask): Generator<TaskEvent> {
    for (const event of current?.events ?? []) {
      const key = eventKey(event);
      if (seen.has(key)) continue;
      seen.add(key);
      yield event;
    }
  };
  yield* drain(task);
  while (task && !TERMINAL_STATUSES.has(task.status) && !options.signal?.aborted && Date.now() < deadline) {
    await sleep(intervalMs);
    if (options.signal?.aborted) return;
    try {
      task = await getTask(taskId);
    } catch {
      return;
    }
    yield* drain(task);
  }
}
