// frontend/src/lib/api/collaboratorTools.ts
//
// Collaborator tools backed by BACKEND /api/domain/workspaces/*/connectors.

import { domainGet, domainPatch, domainPost } from "@/lib/domainApi";
import { fetchWorkspaces, type WorkspaceRef } from "@/lib/api/workspaces";

export type CollaboratorToolStatus = "connected" | "disconnected";

export interface CollaboratorToolWorkspace {
  id: string;
  name: string;
}

export interface CollaboratorToolIntegration {
  id: string;
  workspaceId: string;
  workspaceName: string;
  name: string;
  status: CollaboratorToolStatus;
  scopes: string[];
  lastSyncedAt: string | null;
  updates: number;
}

export interface CollaboratorToolsSnapshot {
  workspaces: CollaboratorToolWorkspace[];
  tools: CollaboratorToolIntegration[];
}

type ConnectorRecord = Record<string, unknown>;

function asRecord(value: unknown): ConnectorRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as ConnectorRecord)
    : {};
}

function firstString(record: ConnectorRecord, keys: string[], fallback = ""): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return fallback;
}

function firstNumber(record: ConnectorRecord, keys: string[], fallback = 0): number {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return fallback;
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function statusFor(value: unknown): CollaboratorToolStatus {
  return value === "connected" ? "connected" : "disconnected";
}

function toolIdFor(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function workspaceFor(workspace: WorkspaceRef): CollaboratorToolWorkspace {
  return { id: workspace.id, name: workspace.name || workspace.projectId || "Workspace" };
}

export function normalizeCollaboratorTool(
  value: unknown,
  workspace: CollaboratorToolWorkspace,
): CollaboratorToolIntegration {
  const record = asRecord(value);
  const name = firstString(record, ["name", "title"], "Connector");

  return {
    id: firstString(record, ["id", "connectorId", "sourceConnectorId"], toolIdFor(name)),
    workspaceId: firstString(record, ["workspaceId", "workspace_id"], workspace.id),
    workspaceName: firstString(record, ["workspaceName", "workspace_name"], workspace.name),
    name,
    status: statusFor(record.status),
    scopes: stringList(record.scopes ?? record.resources ?? record.capabilities),
    lastSyncedAt: firstString(record, ["lastSyncedAt", "lastSync", "last_synced_at", "last_sync"], "") || null,
    updates: firstNumber(record, ["updates", "updateCount", "events"]),
  };
}

export async function fetchCollaboratorTools(): Promise<CollaboratorToolsSnapshot> {
  const workspaces = (await fetchWorkspaces()).map(workspaceFor);
  const toolGroups = await Promise.all(
    workspaces.map(async (workspace) => {
      const data = await domainGet<{ connectors?: unknown[] }>(`/workspaces/${workspace.id}/connectors`);
      const rows = Array.isArray(data.connectors) ? data.connectors : [];
      return rows.map((row) => normalizeCollaboratorTool(row, workspace));
    }),
  );

  return { workspaces, tools: toolGroups.flat() };
}

export function createCollaboratorTool(workspaceId: string, name: string): Promise<CollaboratorToolIntegration> {
  const id = toolIdFor(name);
  return domainPost<{ connector?: unknown }>(`/workspaces/${workspaceId}/connectors`, {
    id,
    name,
    status: "disconnected",
    scopes: [],
    updates: 0,
    lastSyncedAt: null,
  }).then((data) => normalizeCollaboratorTool(data.connector, { id: workspaceId, name: "Workspace" }));
}

export function patchCollaboratorTool(
  tool: Pick<CollaboratorToolIntegration, "id" | "workspaceId" | "workspaceName">,
  body: Partial<Pick<CollaboratorToolIntegration, "status" | "scopes" | "lastSyncedAt" | "updates">>,
): Promise<CollaboratorToolIntegration> {
  return domainPatch<{ connector?: unknown }>(`/workspaces/${tool.workspaceId}/connectors/${tool.id}`, body)
    .then((data) => normalizeCollaboratorTool(data.connector, { id: tool.workspaceId, name: tool.workspaceName }));
}
