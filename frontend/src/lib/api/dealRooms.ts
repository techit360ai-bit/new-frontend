// frontend/src/lib/api/dealRooms.ts
//
// Investor Deal Rooms domain — BACKEND /api/domain/investor/deal-rooms.

import { domainGet } from "@/lib/domainApi";

export type DealStatus = "active" | "pending" | "closed";

export interface DealMeta {
  status: DealStatus;
  stage: string;
  daysOpen: number;
  messages: number;
  docs: number;
  lastActivity: string;
}

export const stageOrder = [
  "Intro Call", "NDA Signed", "Due Diligence", "Term Sheet", "Negotiation", "Deal Closed",
];

export interface DealRoomsResponse {
  dealMeta: Record<string, DealMeta>;
  stageOrder: string[];
  rooms: DealRoomRecord[];
}

export interface DealRoomRecord {
  id: string;
  projectId?: string;
  startupId?: string;
  startupName?: string;
  sector?: string;
  status?: DealStatus;
  stage?: string;
  daysOpen?: number;
  messages?: number;
  docs?: number;
  lastActivity?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

function metaFor(room: DealRoomRecord): DealMeta {
  return {
    status: room.status ?? "pending",
    stage: room.stage ?? "Intro Call",
    daysOpen: Number(room.daysOpen ?? 0),
    messages: Number(room.messages ?? 0),
    docs: Number(room.docs ?? 0),
    lastActivity: room.lastActivity ?? room.updatedAt ?? "—",
  };
}

/** GET /api/domain/investor/deal-rooms */
export function fetchDealRooms(): Promise<DealRoomsResponse> {
  return domainGet<{ dealRooms: DealRoomRecord[] }>("/investor/deal-rooms")
    .then(({ dealRooms }) => {
      const rooms = dealRooms ?? [];
      return {
        rooms,
        stageOrder,
        dealMeta: Object.fromEntries(rooms.map((room) => [room.projectId ?? room.startupId ?? room.id, metaFor(room)])),
      };
    });
}

export interface DealRoomDetail {
  projectId: string;
  meta: DealMeta;
  valuationUSD: number;
  termSheet: {
    valuationUSD: number; investmentUSD: number; equityPercent: number;
    instrument: string; discountPercent: number; valuationCapUSD: number;
    extraTerms: Record<string, string>;
  };
  milestones: { milestone: string; amount: number; condition: string; status: string }[];
  documents: { name: string; status: string }[];
  negotiation: { step: string; state: string }[];
  stageOrder: string[];
}

/** GET /api/domain/investor/deal-rooms — detail selected from persisted rooms. */
export function fetchDealRoom(
  projectId: string,
  _legacyStartup?: Record<string, unknown>,
): Promise<DealRoomDetail | null> {
  return fetchDealRooms().then(({ rooms }) => {
    const room = rooms.find((item) => item.projectId === projectId || item.startupId === projectId || item.id === projectId);
    if (!room) return null;
    return {
      projectId,
      meta: metaFor(room),
      valuationUSD: Number(room.valuationUSD ?? 0),
      termSheet: (room.termSheet as DealRoomDetail["termSheet"]) ?? {
        valuationUSD: 0,
        investmentUSD: 0,
        equityPercent: 0,
        instrument: "",
        discountPercent: 0,
        valuationCapUSD: 0,
        extraTerms: {},
      },
      milestones: Array.isArray(room.milestones) ? room.milestones as DealRoomDetail["milestones"] : [],
      documents: Array.isArray(room.documents) ? room.documents as DealRoomDetail["documents"] : [],
      negotiation: Array.isArray(room.negotiation) ? room.negotiation as DealRoomDetail["negotiation"] : [],
      stageOrder,
    };
  });
}
