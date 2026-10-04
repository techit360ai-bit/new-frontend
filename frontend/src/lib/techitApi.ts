/**
 * Client for the TechIT plugin/MCP API. The backend lives on BACKEND repo
 * branch `feat/plugins-mcp` and mounts mountTechitApi(app, '/api/mcp') onto
 * the platform's existing Node Express service. Base URL is overridable via
 * VITE_TECHIT_API; defaults to the local backend's /api/mcp on :3000.
 */

import { getAuthToken } from "./api/client";

type ViteEnv = Record<string, string | undefined>;

const env: ViteEnv =
  typeof import.meta !== "undefined"
    ? ((import.meta as unknown as { env?: ViteEnv }).env ?? {})
    : {};

const BASE = env.VITE_TECHIT_API ?? "http://localhost:3000/api/mcp";

// The session token is held in memory for the tab (see lib/authStorage.ts).
// Reading `techit_access_token` from sessionStorage here would always return
// null once WS-01 removed the writer, sending every MCP/plugins call
// unauthenticated.
let tokenGetter: () => string | null = () => {
  try {
    return getAuthToken();
  } catch {
    return null;
  }
};

// Double-submit token, needed when the session cookie authenticates the request
// instead of the bearer header (see BACKEND src/middlewares/csrf.js).
function csrfToken(): string | null {
  try {
    const part = document.cookie.split(";").map((v) => v.trim()).find((v) => v.startsWith("techit_csrf="));
    return part ? decodeURIComponent(part.slice("techit_csrf=".length)) : null;
  } catch {
    return null;
  }
}

export function setTechitApiTokenGetter(getter: () => string | null) {
  tokenGetter = getter;
}

export class TechitApiError extends Error {
  status: number;
  body: unknown;

  constructor(path: string, status: number, body: unknown) {
    super(`${path} -> ${status}`);
    this.name = "TechitApiError";
    this.status = status;
    this.body = body;
  }
}

export interface MCPToolMeta {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
  destructive?: boolean;
}
export interface CatalogueEntry {
  plugin: string;
  tool: MCPToolMeta;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  actorKind: "human" | "agent";
  action: string;
  sourceTool: string;
  resource?: string;
  result: "success" | "failure" | "pending_approval" | "denied";
  workspaceId: string;
}

export interface ContributionEvent {
  id: string;
  kind: string;
  actorId: string;
  actorKind: "human" | "agent";
  sourceTool: string;
  workspaceId?: string;
  projectId?: string;
  artifactId?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export interface ApprovalRequest {
  id: string;
  action: string;
  requestedBy: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

export interface PluginError {
  error: string;
  code: string;
  detail?: string;
}
export type InvokeResult =
  | { ok: true; data: unknown }
  | { ok: false; error: PluginError; approvalRequestId?: string };

export interface ActorInput {
  id?: string;
  kind?: "human" | "agent";
  role?: "viewer" | "editor" | "admin" | "owner";
  toolsAllowed?: string[];
}

/**
 * Connector credential status. Mirrors BACKEND `ConnectionStatus` — it carries
 * presence/metadata ONLY and never a secret value (ADR-2: the vault never
 * returns a credential to a client).
 */
export interface ConnectionStatus {
  plugin: string;
  label: string;
  kind: "oauth_token" | "api_key" | "rpc_url";
  /** True when a credential is stored in THIS workspace's canonical vault lane. */
  connected: boolean;
  /** `vault` is the canonical source; `legacy-bootstrap`/`none` are not active. */
  source: "vault" | "legacy-bootstrap" | "none";
  expiresAt?: string;
  mode: "real" | "fake";
  optional: boolean;
  /** Legacy env credential still present (deprecated) — remove it. */
  deprecatedEnv?: boolean;
  /** Disconnect is not permanent while bootstrap import is enabled. */
  envFallback?: boolean;
  /** Granted scope set recorded with the credential (empty when unknown). */
  scopes?: string[];
  /** True when the granted scopes were known and cover what the connector requires. */
  scopesVerified?: boolean;
}

export interface HealthStatus {
  ok: boolean;
  workspaceId: string;
  actor?: { id: string; kind: "human" | "agent"; role: string };
}

function headers(extra?: HeadersInit): HeadersInit {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  const token = tokenGetter();
  if (token) h.Authorization = `Bearer ${token}`;
  const csrf = csrfToken();
  if (csrf) h["X-CSRF-Token"] = csrf;
  return { ...h, ...(extra as Record<string, string>) };
}

async function parseJson<T>(path: string, res: Response): Promise<T> {
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new TechitApiError(path, res.status, data);
  return data as T;
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "GET",
    headers: headers(),
    credentials: "include",
  });
  return parseJson<T>(path, res);
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
    credentials: "include",
  });
  return parseJson<T>(path, res);
}

async function delJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "DELETE",
    headers: headers(),
    credentials: "include",
  });
  return parseJson<T>(path, res);
}

export const techitApi = {
  baseUrl: BASE,
  health: () => getJson<HealthStatus>("/health"),
  tools: () => getJson<CatalogueEntry[]>("/tools"),
  audit: () => getJson<AuditEntry[]>("/audit"),
  contributions: () => getJson<ContributionEvent[]>("/contributions"),
  approvals: () => getJson<ApprovalRequest[]>("/approvals"),
  // Connector credentials are workspace-scoped (ADR-1). The backend derives the
  // workspace from the verified JWT; the client never sends one.
  connections: () => getJson<ConnectionStatus[]>("/connections"),
  connect: (plugin: string, credential: string, ttlSeconds?: number, scopes?: string[]) =>
    postJson<{ ok: boolean; connection: ConnectionStatus }>(`/connections/${encodeURIComponent(plugin)}`, {
      credential,
      ttlSeconds,
      scopes,
    }),
  disconnect: (plugin: string) =>
    delJson<{ ok: boolean; connection: ConnectionStatus; removed: boolean; envFallback: boolean }>(
      `/connections/${encodeURIComponent(plugin)}`,
    ),
  invoke: (plugin: string, tool: string, params: unknown, actor?: ActorInput) =>
    postJson<InvokeResult>("/invoke", { plugin, tool, params, actor }),
  approve: (id: string, decidedBy = "founder") =>
    postJson<{ approved: boolean }>(`/approvals/${id}/approve`, { decidedBy }),
};
