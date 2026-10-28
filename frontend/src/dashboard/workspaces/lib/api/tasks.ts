import type { AgentTask, TaskEvent } from '../types';
import { workspaceGet, workspacePost } from './client';

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
  return (await listTasks()).find((task) => task.id === id);
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

export async function resolveApproval(taskId: string, approvalId: string, decision: 'approved' | 'rejected'): Promise<void> {
  await workspacePost('/tasks', {
    taskId,
    approvalId,
    decision,
    status: decision === 'approved' ? 'running' : 'cancelled',
    type: 'approval_resolved',
  });
}

export async function* streamTask(taskId: string): AsyncGenerator<TaskEvent> {
  const task = await getTask(taskId);
  for (const event of task?.events ?? []) {
    yield event;
  }
}
