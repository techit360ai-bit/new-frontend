/**
 * Client for the TechIT plugin/MCP API. The backend lives on BACKEND repo
 * branch `feat/plugins-mcp` and mounts mountTechitApi(app, '/api/mcp') onto
 * the platform's existing Node Express service. Base URL is overridable via
 * VITE_TECHIT_API; defaults to the local backend's /api/mcp on :3000.
 */

type ViteEnv = Record<string, string | undefined>;

const env: ViteEnv =
  typeof import.meta !== "undefined"
    ? ((import.meta as unknown as { env?: ViteEnv }).env ?? {})
    : {};

const BASE = env.VITE_TECHIT_API ?? "http://localhost:3000/api/mcp";

let tokenGetter: () => string | null = () => {
  try {
    return (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem("techit_access_token") : null) || (import.meta.env.MODE === 'test' ? localStorage.getItem("techit_token") : null);
  } catch {
    return null;
  }
};

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

function headers(extra?: HeadersInit): HeadersInit {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  const token = tokenGetter();
  if (token) h.Authorization = `Bearer ${token}`;
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
  });
  return parseJson<T>(path, res);
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });
  return parseJson<T>(path, res);
}

export const techitApi = {
  baseUrl: BASE,
  health: () => getJson<{ ok: boolean; workspaceId: string }>("/health"),
  tools: () => getJson<CatalogueEntry[]>("/tools"),
  audit: () => getJson<AuditEntry[]>("/audit"),
  contributions: () => getJson<ContributionEvent[]>("/contributions"),
  approvals: () => getJson<ApprovalRequest[]>("/approvals"),
  invoke: (plugin: string, tool: string, params: unknown, actor?: ActorInput) =>
    postJson<InvokeResult>("/invoke", { plugin, tool, params, actor }),
  approve: (id: string, decidedBy = "founder") =>
    postJson<{ approved: boolean }>(`/approvals/${id}/approve`, { decidedBy }),
};
