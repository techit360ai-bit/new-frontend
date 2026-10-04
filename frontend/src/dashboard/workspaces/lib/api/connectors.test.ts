import { afterEach, expect, test } from 'vitest';
import { setTechitApiTokenGetter } from '@/lib/techitApi';
import { disconnect, getConnectorCredential, listConnectors } from './connectors';

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function stubFetch(handler: (url: string, init?: RequestInit) => Response | Promise<Response>) {
  const original = globalThis.fetch;
  const calls: Array<[string, RequestInit | undefined]> = [];
  globalThis.fetch = (async (url, init) => {
    calls.push([String(url), init]);
    return handler(String(url), init);
  }) as typeof fetch;
  return {
    calls,
    restore: () => {
      globalThis.fetch = original;
    },
  };
}

const connections = [
  { plugin: 'github', label: 'oauth token', kind: 'oauth_token', connected: true, source: 'vault', mode: 'real', optional: false, scopes: ['repo', 'read:user'], scopesVerified: true },
  { plugin: 'gitlab', label: 'api key', kind: 'api_key', connected: false, source: 'none', mode: 'real', optional: false },
  { plugin: 'bitbucket', label: 'api key', kind: 'api_key', connected: false, source: 'none', mode: 'real', optional: false },
  { plugin: 'ai', label: 'ai-router token', kind: 'api_key', connected: false, source: 'none', mode: 'real', optional: true },
];

afterEach(() => {
  setTechitApiTokenGetter(() => null);
});

test('listConnectors composes the live MCP catalogue with vault connection status', async () => {
  setTechitApiTokenGetter(() => 'jwt-connectors');
  const mock = stubFetch((url) => {
    if (url.endsWith('/api/mcp/tools')) {
      return response([
        { plugin: 'github', tool: { name: 'list_repositories', description: 'List repos', input_schema: { type: 'object', properties: { org: { type: 'string' } }, required: ['org'] } } },
        { plugin: 'gitlab', tool: { name: 'list_projects', description: 'List projects', input_schema: { type: 'object', properties: {} } } },
      ]);
    }
    if (url.endsWith('/api/mcp/connections')) return response(connections);
    throw new Error(`unexpected ${url}`);
  });

  try {
    const rows = await listConnectors();
    const ids = rows.map((row) => row.id);
    // Real MCP connectors only — the seeded 'ml' pseudo-connector is gone.
    expect(ids).toEqual(['github', 'gitlab', 'bitbucket', 'ai']);
    expect(ids).not.toContain('ml');

    const github = rows.find((row) => row.id === 'github');
    expect(github?.status).toBe('connected');
    expect(github?.authType).toBe('oauth2');
    expect(github?.tools[0].inputSchema.org).toEqual({ type: 'string', required: true });
    // The vault never returns a credential value to a client.
    expect(github?.credentialMasked).toBeNull();
  } finally {
    mock.restore();
  }
});

test('disconnect issues a workspace-scoped MCP DELETE', async () => {
  setTechitApiTokenGetter(() => 'jwt-connectors');
  const mock = stubFetch((url, init) => {
    if (url.endsWith('/api/mcp/connections/github') && init?.method === 'DELETE') {
      return response({ ok: true, connection: connections[0], removed: true, envFallback: false });
    }
    if (url.endsWith('/api/mcp/tools')) return response([]);
    if (url.endsWith('/api/mcp/connections')) return response([{ ...connections[0], connected: false, source: 'none' }]);
    throw new Error(`unexpected ${url}`);
  });

  try {
    await disconnect('github');
    expect(mock.calls.some(([url, init]) => url.endsWith('/api/mcp/connections/github') && init?.method === 'DELETE')).toBe(true);
  } finally {
    mock.restore();
  }
});

test('getConnectorCredential surfaces scope verification without the secret', async () => {
  setTechitApiTokenGetter(() => 'jwt-connectors');
  const mock = stubFetch((url) => {
    if (url.endsWith('/api/mcp/connections')) return response(connections);
    throw new Error(`unexpected ${url}`);
  });

  try {
    const status = await getConnectorCredential('github');
    expect(status?.credential?.maskedIdentifier).toContain('vault');
    expect(status?.scopesVerified).toBe(true);
    expect(status?.scopes).toEqual(['repo', 'read:user']);
  } finally {
    mock.restore();
  }
});
