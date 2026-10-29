import { afterEach, expect, test, vi } from 'vitest';
import { createVsCodeGrant, getCodeSnapshot, planCodeTask, saveCodeFile } from './codeWorkspace';

afterEach(() => vi.restoreAllMocks());

test('routes all project + coding-intelligence state to the BACKEND domain API', async () => {
  const calls: string[] = [];
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = String(input);
    calls.push(url);
    if (url.endsWith('/api/code/ws-1/plan')) {
      return new Response(JSON.stringify({ plan: {}, authoritative: false, ai_routing: { requested: 'platform', applied: 'platform' } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (url.endsWith('/api/code/ws-1/vscode-grants')) {
      return new Response(JSON.stringify({ grant: { id: 'g1', token: 't', expiresAt: 'soon', permissions: [] } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (url.endsWith('/api/code/ws-1/snapshot')) {
      return new Response(JSON.stringify({ workspace: { id: 'ws-1', projectId: 'p-1', name: 'Build' }, files: [], sync: null, snapshotHash: 'empty' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({ file: { path: 'src/app.ts', content: 'x' } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  });

  await getCodeSnapshot('ws-1');
  await saveCodeFile('ws-1', { path: 'src/app.ts', content: 'x' });
  await planCodeTask('ws-1', { requirement: 'Explain the change' });
  await createVsCodeGrant('ws-1', {});

  expect(calls).toEqual([
    'http://localhost:3000/api/code/ws-1/snapshot',
    'http://localhost:3000/api/code/ws-1/file',
    'http://localhost:3000/api/code/ws-1/plan',
    'http://localhost:3000/api/code/ws-1/vscode-grants',
  ]);
});
