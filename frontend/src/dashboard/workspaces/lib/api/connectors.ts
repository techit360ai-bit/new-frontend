import type { Connector, ConnectorId, ActivityEvent } from '../types';
import { workspaceDelete, workspaceGet, workspacePost } from './client';

function normalizeConnector(row: Partial<Connector> & Record<string, unknown>): Connector {
  return {
    id: String(row.id) as ConnectorId,
    name: String(row.name ?? 'Connector'),
    category: String(row.category ?? 'Workspace'),
    status: (row.status as Connector['status']) ?? 'disconnected',
    authType: (row.authType as Connector['authType']) ?? (row.auth_type as Connector['authType']) ?? 'api_key',
    capabilities: Array.isArray(row.capabilities) ? row.capabilities as Connector['capabilities'] : [],
    tools: Array.isArray(row.tools) ? row.tools as Connector['tools'] : [],
    resources: Array.isArray(row.resources) ? row.resources as string[] : [],
    authMode: (row.authMode as Connector['authMode']) ?? null,
    credentialMasked: typeof row.credentialMasked === 'string' ? row.credentialMasked : null,
    credentialLabel: typeof row.credentialLabel === 'string' ? row.credentialLabel : null,
    credentialConnectedAt: typeof row.credentialConnectedAt === 'string' ? row.credentialConnectedAt : null,
    deepLink: typeof row.deepLink === 'string' ? row.deepLink : typeof row.deep_link === 'string' ? row.deep_link : undefined,
    lastSync: typeof row.lastSync === 'string' ? row.lastSync : typeof row.last_sync === 'string' ? row.last_sync : undefined,
  };
}

function normalizeActivity(row: Partial<ActivityEvent> & Record<string, unknown>): ActivityEvent {
  return {
    id: String(row.id),
    connectorId: String(row.connectorId ?? row.connector_id ?? '') as ConnectorId,
    kind: (row.kind as ActivityEvent['kind']) ?? 'sync',
    summary: String(row.summary ?? ''),
    at: String(row.at ?? row.createdAt ?? row.created_at ?? ''),
  };
}

export async function listConnectors(): Promise<Connector[]> {
  const data = await workspaceGet<{ connectors: Array<Partial<Connector> & Record<string, unknown>> }>('/connectors');
  const byId = new Map<string, Connector>();
  for (const connector of data?.connectors.map(normalizeConnector) ?? []) {
    if (!byId.has(connector.id)) byId.set(connector.id, connector);
  }
  return [...byId.values()];
}

export async function getConnector(id: ConnectorId): Promise<Connector | undefined> {
  return (await listConnectors()).find((connector) => connector.id === id);
}

export async function connect(id: ConnectorId): Promise<Connector | undefined> {
  const current = await getConnector(id);
  if (!current) return undefined;
  const data = await workspacePost<{ connector: Partial<Connector> & Record<string, unknown> }>('/connectors', {
    ...current,
    status: 'connected',
    sourceConnectorId: id,
  });
  return data?.connector ? normalizeConnector(data.connector) : undefined;
}

export async function disconnect(id: ConnectorId): Promise<Connector | undefined> {
  const current = await getConnector(id);
  if (!current) return undefined;
  const data = await workspacePost<{ connector: Partial<Connector> & Record<string, unknown> }>('/connectors', {
    ...current,
    status: 'disconnected',
    sourceConnectorId: id,
  });
  return data?.connector ? normalizeConnector(data.connector) : undefined;
}

export async function listActivity(id?: ConnectorId): Promise<ActivityEvent[]> {
  const data = await workspaceGet<{ reports: Array<Partial<ActivityEvent> & Record<string, unknown>> }>('/reports');
  const rows = data?.reports.map(normalizeActivity) ?? [];
  return id ? rows.filter((row) => row.connectorId === id) : rows;
}

export interface ConnectorCredential { maskedIdentifier: string; label: string; connectedAt: string }
export interface ConnectorCredentialStatus { credential: ConnectorCredential | null; handshake: 'credential'; oauthRedirectSupported: boolean }

/** Read the sealed-credential status for a connector. Never returns the raw token. */
export async function getConnectorCredential(id: ConnectorId): Promise<ConnectorCredentialStatus | null> {
  return workspaceGet<ConnectorCredentialStatus>(`/connectors/${encodeURIComponent(id)}/credential`);
}

/**
 * Hand a provider token to the backend, which seals it at rest (same key material as
 * BYOK model connections) and stores it outside the connector list. This is a
 * credential handshake, not a browser OAuth redirect — `oauthRedirectSupported` is
 * false and the UI states that explicitly.
 */
export async function setConnectorCredential(id: ConnectorId, body: { token: string; label?: string }): Promise<Connector | undefined> {
  const data = await workspacePost<{ connector: Partial<Connector> & Record<string, unknown> }>(`/connectors/${encodeURIComponent(id)}/credential`, body);
  return data?.connector ? normalizeConnector(data.connector) : undefined;
}

/** Remove the sealed credential and mark the connector disconnected. */
export async function removeConnectorCredential(id: ConnectorId): Promise<Connector | undefined> {
  const data = await workspaceDelete<{ connector: Partial<Connector> & Record<string, unknown> }>(`/connectors/${encodeURIComponent(id)}/credential`);
  return data?.connector ? normalizeConnector(data.connector) : undefined;
}
