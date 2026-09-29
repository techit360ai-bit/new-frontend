import { beforeEach, expect, test, vi } from 'vitest';

vi.mock('./client', () => ({
  workspaceGet: vi.fn(),
  workspacePost: vi.fn(),
  workspacePatch: vi.fn(),
  workspaceDelete: vi.fn(),
  resolveWorkspaceId: vi.fn(async () => 'ws-1'),
}));

import { workspaceGet, workspacePost } from './client';
import { resolveApproval, runTask, streamTask } from './tasks';

const get = vi.mocked(workspaceGet);
const post = vi.mocked(workspacePost);

const task = (status: string, events: unknown[]) => ({ task: { id: 't1', agentId: 'a1', prompt: 'Add billing', status, createdAt: 'now', events } });

beforeEach(() => { get.mockReset(); post.mockReset(); });

test('runTask posts to the backend run endpoint', async () => {
  post.mockResolvedValue(task('done', []));
  await runTask('t1');
  expect(post).toHaveBeenCalledWith('/tasks/t1/run', {});
});

test('resolveApproval records an approval_resolved event instead of creating a task', async () => {
  post.mockResolvedValue({ task: { id: 't1', status: 'running', events: [] } });
  await resolveApproval('t1', 'ap1', 'approved');
  expect(post).toHaveBeenCalledWith('/tasks/t1/events', { type: 'approval_resolved', status: 'running', approval: { id: 'ap1', resolved: 'approved' } });
});

test('streamTask polls the backend and yields each newly recorded event until it settles', async () => {
  const e1 = { id: 'e1', type: 'status', at: '1', text: 'Running' };
  const e2 = { id: 'e2', type: 'message', at: '2', text: 'Add billing' };
  const e3 = { id: 'e3', type: 'status', at: '3', text: 'Completed' };
  const states = [task('running', [e1]), task('running', [e1, e2]), task('done', [e1, e2, e3])];
  let i = 0;
  get.mockImplementation(async () => states[Math.min(i++, states.length - 1)]);

  const seen: string[] = [];
  for await (const event of streamTask('t1', { intervalMs: 1 })) seen.push(event.id);

  expect(seen).toEqual(['e1', 'e2', 'e3']);
  expect(get).toHaveBeenCalledTimes(3);
});
