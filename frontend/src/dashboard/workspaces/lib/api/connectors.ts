/**
 * Workspace connector surface, backed by the LIVE MCP registry (WS-E).
 *
 * Historically this module read a seeded `/workspaces/:ws/connectors` store that
 * carried an 'ml' pseudo-connector and no tool catalogue. It now composes the
 * canonical MCP endpoints:
 *
 *   GET    /api/mcp/tools            → the tool catalogue agents can call
 *   GET    /api/mcp/connections      → per-workspace credential status (never a secret)
 *   POST   /api/mcp/connections/:p   → store a workspace credential
 *   DELETE /api/mcp/connections/:p   → remove it
 *   GET    /api/mcp/audit            → recent tool activity
 *
 * Connection ≠ credential: the connector says what can be reached; the workspace
 * vault holds the secret. This module never sees a credential value.
 */

import { techitApi, type AuditEntry, type ConnectionStatus, type MCPToolMeta } from '@/lib/techitApi';
import type { ActivityEvent, Capability, Connector, ConnectorId, MCPTool } from '../types';

interface ConnectorMeta {
  name: string;
  category: string;
  capabilities: Capability[];
}

const CONNECTOR_META: Record<ConnectorId, ConnectorMeta> = {
  github: { name: 'GitHub', category: 'Source control', capabilities: ['read', 'write', 'execute'] },
  gitlab: { name: 'GitLab', category: 'Source control', capabilities: ['read', 'write', 'execute'] },
  bitbucket: { name: 'Bitbucket', category: 'Source control', capabilities: ['read', 'write', 'execute'] },
  notion: { name: 'Notion', category: 'Documents', capabilities: ['read', 'write'] },
  figma: { name: 'Figma', category: 'Design', capabilities: ['read'] },
  web3: { name: 'Web3 RPC', category: 'Chain', capabilities: ['read', 'execute'] },
  ai: { name: 'AI Router', category: 'Intelligence', capabilities: ['read', 'execute'] },
};

/** Stable display order, shared by every surface that renders connectors. */
export const CONNECTOR_IDS: ConnectorId[] = ['github', 'gitlab', 'bitbucket', 'notion', 'figma', 'web3', 'ai'];

function authTypeFromKind(kind: ConnectionStatus['kind']): Connector['authType'] {
  if (kind === 'oauth_token') return 'oauth2';
  if (kind === 'rpc_url') return 'rpc_url';
  return 'api_key';
}

/** Flatten a JSON-schema tool input into the compact shape the UI renders. */
function toMCPTool(meta: MCPToolMeta): MCPTool {
  const schema = (meta.input_schema ?? {}) as {
    properties?: Record<string, { type?: string }>;
    required?: unknown;
  };
  const required = new Set(Array.isArray(schema.required) ? schema.required.map(String) : []);
  const inputSchema: MCPTool['inputSchema'] = {};
  for (const [key, value] of Object.entries(schema.properties ?? {})) {
    inputSchema[key] = { type: String(value?.type ?? 'string'), required: required.has(key) };
  }
  return { name: meta.name, description: meta.description, inputSchema, destructive: meta.destructive };
}

function buildConnector(id: ConnectorId, status: ConnectionStatus | undefined, tools: MCPToolMeta[]): Connector {
  const meta = CONNECTOR_META[id];
  const connected = Boolean(status?.connected);
  return {
    id,
    name: meta.name,
    category: meta.category,
    status: connected ? 'connected' : 'disconnected',
    authType: status ? authTypeFromKind(status.kind) : 'api_key',
    capabilities: meta.capabilities,
    tools: tools.map(toMCPTool),
    resources: [],
    authMode: connected ? 'credential' : null,
    // The vault never returns a secret, so there is no masked value to show.
    credentialMasked: null,
    credentialLabel: connected ? status?.label ?? null : null,
    credentialConnectedAt: connected ? status?.expiresAt ?? null : null,
    lastSync: status?.expiresAt,
  };
}

async function fetchConnectors(): Promise<Connector[]> {
  const [tools, connections] = await Promise.all([techitApi.tools(), techitApi.connections()]);
  const toolsByPlugin = new Map<string, MCPToolMeta[]>();
  for (const entry of tools ?? []) {
    const list = toolsByPlugin.get(entry.plugin) ?? [];
    list.push(entry.tool);
    toolsByPlugin.set(entry.plugin, list);
  }
  const statusByPlugin = new Map((connections ?? []).map((row) => [row.plugin, row]));
  const ids = new Set<ConnectorId>();
  for (const row of connections ?? []) if (CONNECTOR_META[row.plugin as ConnectorId]) ids.add(row.plugin as ConnectorId);
  for (const plugin of toolsByPlugin.keys()) if (CONNECTOR_META[plugin as ConnectorId]) ids.add(plugin as ConnectorId);
  return CONNECTOR_IDS
    .filter((id) => ids.has(id))
    .map((id) => buildConnector(id, statusByPlugin.get(id), toolsByPlugin.get(id) ?? []));
}

export async function listConnectors(): Promise<Connector[]> {
  return fetchConnectors();
}

export async function getConnector(id: ConnectorId): Promise<Connector | undefined> {
  return (await fetchConnectors()).find((connector) => connector.id === id);
}

export async function connect(id: ConnectorId, credential: string, scopes?: string[]): Promise<Connector | undefined> {
  await techitApi.connect(id, credential, undefined, scopes);
  return getConnector(id);
}

export async function disconnect(id: ConnectorId): Promise<Connector | undefined> {
  await techitApi.disconnect(id);
  return getConnector(id);
}

function toActivity(row: AuditEntry): ActivityEvent {
  const kind: ActivityEvent['kind'] =
    row.result === 'pending_approval' ? 'approval' : row.actorKind === 'agent' ? 'agent_action' : 'sync';
  return {
    id: row.id,
    connectorId: row.sourceTool as ConnectorId,
    kind,
    summary: `${row.action} · ${row.result}${row.resource ? ` · ${row.resource}` : ''}`,
    at: row.timestamp,
  };
}

export async function listActivity(id?: ConnectorId): Promise<ActivityEvent[]> {
  const rows = (await techitApi.audit()) ?? [];
  const events = rows.map(toActivity);
  return id ? events.filter((row) => row.connectorId === id) : events;
}

export interface ConnectorCredential { maskedIdentifier: string; label: string; connectedAt: string }
export interface ConnectorCredentialStatus {
  credential: ConnectorCredential | null;
  handshake: 'credential';
  oauthRedirectSupported: boolean;
  scopes: string[];
  scopesVerified: boolean;
}

/**
 * Read the vault credential status for a connector. Never returns a secret:
 * `maskedIdentifier` is a fixed placeholder, not a provider value.
 */
export async function getConnectorCredential(id: ConnectorId): Promise<ConnectorCredentialStatus | null> {
  const status = (await techitApi.connections()).find((row) => row.plugin === id);
  if (!status) return null;
  const connected = Boolean(status.connected);
  return {
    credential: connected
      ? { maskedIdentifier: '•••••••• (sealed in workspace vault)', label: status.label, connectedAt: status.expiresAt ?? '' }
      : null,
    handshake: 'credential',
    oauthRedirectSupported: id === 'github',
    scopes: status.scopes ?? [],
    scopesVerified: Boolean(status.scopesVerified),
  };
}

export async function setConnectorCredential(
  id: ConnectorId,
  body: { token: string; label?: string; scopes?: string[] },
): Promise<Connector | undefined> {
  await techitApi.connect(id, body.token, undefined, body.scopes);
  return getConnector(id);
}

export async function removeConnectorCredential(id: ConnectorId): Promise<Connector | undefined> {
  await techitApi.disconnect(id);
  return getConnector(id);
}
