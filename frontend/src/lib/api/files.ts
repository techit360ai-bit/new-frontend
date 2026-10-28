// frontend/src/lib/api/files.ts
//
// Workspace-visible file records backed by BACKEND /api/domain/files.

import { domainGet, domainPost, domainDelete } from "@/lib/domainApi";

export type DomainFileType = "folder" | "file";
export type DomainFileKind = "document" | "image" | "code";

export interface DomainFileItem {
  id: string;
  name: string;
  type: DomainFileType;
  size?: string;
  modified: string;
  fileType?: DomainFileKind;
}

type FileRecord = Record<string, unknown>;

function asRecord(value: unknown): FileRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as FileRecord)
    : {};
}

function firstString(record: FileRecord, keys: string[], fallback = ""): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return fallback;
}

function typeFor(value: unknown): DomainFileType {
  return value === "folder" ? "folder" : "file";
}

function kindFor(record: FileRecord): DomainFileKind | undefined {
  const explicit = record.fileType ?? record.file_type ?? record.kind;
  if (explicit === "document" || explicit === "image" || explicit === "code") return explicit;
  const name = firstString(record, ["name", "filename"]).toLowerCase();
  if (/\.(png|jpg|jpeg|gif|webp|svg)$/.test(name)) return "image";
  if (/\.(js|jsx|ts|tsx|py|go|rs|java|md|json|yaml|yml)$/.test(name)) return "code";
  return "document";
}

function formatModified(value: string): string {
  if (!value) return "Unknown";
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return value;
  return new Date(time).toLocaleString();
}

export function normalizeDomainFile(value: unknown): DomainFileItem {
  const record = asRecord(value);
  const name = firstString(record, ["name", "filename", "title"], "Untitled file");
  const type = typeFor(record.type);

  return {
    id: firstString(record, ["id", "fileId"], name),
    name,
    type,
    size: firstString(record, ["size", "sizeLabel", "bytesLabel"]) || undefined,
    modified: formatModified(firstString(record, ["modified", "updatedAt", "createdAt", "uploadedAt"])),
    fileType: type === "file" ? kindFor(record) : undefined,
  };
}

export function fetchDomainFiles(): Promise<DomainFileItem[]> {
  return domainGet<{ files?: unknown[] }>("/files").then((data) => {
    const rows = Array.isArray(data.files) ? data.files : [];
    return rows.map(normalizeDomainFile);
  });
}

export interface CreateFilePayload {
  name: string;
  type?: "file" | "folder";
  fileType?: DomainFileKind;
  size?: string;
  sizeBytes?: number;
  workspaceId?: string;
  url?: string;
}

export function createDomainFile(payload: CreateFilePayload): Promise<DomainFileItem> {
  return domainPost<Record<string, unknown>>("/files", payload).then(normalizeDomainFile);
}

export function deleteDomainFile(id: string): Promise<{ ok: boolean }> {
  return domainDelete<{ ok: boolean }>(`/files/${id}`);
}
