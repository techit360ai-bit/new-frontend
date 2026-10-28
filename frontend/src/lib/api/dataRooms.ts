// frontend/src/lib/api/dataRooms.ts
//
// Investor Data Rooms domain — BACKEND /api/domain/investor/data-rooms.

import { domainGet, domainPost } from "@/lib/domainApi";

export const SECTION_LABELS = [
  "Metrics Dashboard", "Financials", "Testing Reports",
  "Compliance", "Governance", "Execution History",
];

export interface DataRoomMeta {
  projectId: string;
  sections: string[];
  docCount: number;
  complianceVerified: boolean;
  aiGovernanceVerified: boolean;
  updatedLabel: string;
  startupName?: string;
  sector?: string;
}

export interface DataRoomsResponse {
  rooms: DataRoomMeta[];
  sections: string[];
  totals: {
    activeRooms: number;
    totalDocs: number;
    complianceVerified: number;
    aiSummaries: number;
  };
}

function normalizeRoom(row: Partial<DataRoomMeta> & Record<string, unknown>): DataRoomMeta {
  return {
    projectId: String(row.projectId ?? row.startupId ?? row.id),
    startupName: typeof row.startupName === "string" ? row.startupName : undefined,
    sector: typeof row.sector === "string" ? row.sector : undefined,
    sections: Array.isArray(row.sections) ? row.sections as string[] : [],
    docCount: Number(row.docCount ?? row.doc_count ?? 0),
    complianceVerified: Boolean(row.complianceVerified ?? row.compliance_verified),
    aiGovernanceVerified: Boolean(row.aiGovernanceVerified ?? row.ai_governance_verified),
    updatedLabel: String(row.updatedLabel ?? row.updatedAt ?? "—"),
  };
}

function totalsFor(rooms: DataRoomMeta[]) {
  return {
    activeRooms: rooms.length,
    totalDocs: rooms.reduce((sum, room) => sum + room.docCount, 0),
    complianceVerified: rooms.filter((room) => room.complianceVerified).length,
    aiSummaries: rooms.filter((room) => room.aiGovernanceVerified).length,
  };
}

/** GET /api/domain/investor/data-rooms — per-startup vault metadata + totals. */
export function fetchDataRooms(): Promise<DataRoomsResponse> {
  return domainGet<{ dataRooms: Array<Partial<DataRoomMeta> & Record<string, unknown>> }>("/investor/data-rooms")
    .then(({ dataRooms }) => {
      const rooms = (dataRooms ?? []).map(normalizeRoom);
      const sections = Array.from(new Set(rooms.flatMap((room) => room.sections)));
      return { rooms, sections: sections.length ? sections : SECTION_LABELS, totals: totalsFor(rooms) };
    });
}

/** POST /api/domain/investor/data-rooms — record a data-room access request. */
export function grantDataRoomAccess(
  projectId: string,
  investorId: string,
  canDownload = false,
): Promise<{ ok: boolean }> {
  return domainPost("/investor/data-rooms", { projectId, investorId, canDownload, accessRequestedAt: new Date().toISOString() })
    .then(() => ({ ok: true }));
}
