import { afterEach, expect, test, vi } from 'vitest';
import { getCodeSnapshot, planCodeTask, saveCodeFile } from './codeWorkspace';

afterEach(() => vi.restoreAllMocks());

test('routes deterministic project state to BACKEND and reasoning to the AI Router', async () => {
  const calls: string[] = [];
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = String(input);
    calls.push(url);
    if (url.includes('/api/v1/workspace/code/plan')) {
      return new Response(JSON.stringify({ plan: {}, authoritative: false }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (url.endsWith('/api/code/ws-1/snapshot')) {
      return new Response(JSON.stringify({ workspace: { id: 'ws-1', projectId: 'p-1', name: 'Build' }, files: [], sync: null, snapshotHash: 'empty' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({ file: { path: 'src/app.ts', content: 'x' } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  });

  await getCodeSnapshot('ws-1');
  await saveCodeFile('ws-1', { path: 'src/app.ts', content: 'x' });
  await planCodeTask({ workspace_id: 'ws-1', requirement: 'Explain the change' });

  expect(calls[0]).toBe('http://localhost:3000/api/code/ws-1/snapshot');
  expect(calls[1]).toBe('http://localhost:3000/api/code/ws-1/file');
  expect(calls[2]).toBe('http://localhost:8000/api/v1/workspace/code/plan');
});
