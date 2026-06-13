// Demo-room domain types — mirror backend store.DemoEvent / RosterEntry.

export type DemoKind = "startup" | "investor" | "hackathon" | "launch" | "mentorship";
export type AssetType = "deck" | "slides" | "video" | "link";
export type RoomRole = "host" | "presenter" | "judge" | "audience";
export type DemoStatus = "draft" | "scheduled" | "live" | "ended" | "cancelled";

export interface RosterEntry {
  eventId: string;
  userId: string;
  roomRole: RoomRole | string;
  status: string;
}

export interface DemoEvent {
  id: string;
  hostId: string;
  kind: DemoKind | string;
  title: string;
  description: string;
  assetUrl: string;
  assetType: AssetType | string;
  status: DemoStatus | string;
  scheduledAt: string | null;
  createdAt: string;
  updatedAt: string;
  roster?: RosterEntry[];
}
