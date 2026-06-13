// Demo-room API client — talks to the Go messaging service /api/v1/demos/*.
// All reads are offline-safe via withFallback so screens render without a backend.
import { msgGet, msgPost, msgPatch, withFallback } from "@/lib/messaging/client";
import type { DemoEvent, RosterEntry } from "./types";

export interface CreateEventInput {
  kind: string;
  title: string;
  description?: string;
  assetUrl?: string;
  assetType?: string;
  scheduledAt?: string | null;
}

export type PatchEventInput = Partial<Pick<DemoEvent, "title" | "description" | "assetUrl" | "assetType" | "scheduledAt">>;

export function listEvents(): Promise<DemoEvent[]> {
  return withFallback(
    async () => (await msgGet<{ events: DemoEvent[] }>("/demos")).events ?? [],
    () => [],
    "list demos",
  );
}

export function getEvent(id: string): Promise<DemoEvent | null> {
  return withFallback(
    () => msgGet<DemoEvent>(`/demos/${encodeURIComponent(id)}`),
    () => null,
    "get demo",
  );
}

export function createEvent(input: CreateEventInput): Promise<DemoEvent> {
  return msgPost<DemoEvent>("/demos", input);
}

export function patchEvent(id: string, input: PatchEventInput): Promise<DemoEvent> {
  return msgPatch<DemoEvent>(`/demos/${encodeURIComponent(id)}`, input);
}

export function transitionStatus(id: string, status: string): Promise<DemoEvent> {
  return msgPost<DemoEvent>(`/demos/${encodeURIComponent(id)}/status`, { status });
}

export function invite(id: string, userId: string, roomRole: string): Promise<RosterEntry> {
  return msgPost<RosterEntry>(`/demos/${encodeURIComponent(id)}/invites`, { userId, roomRole });
}

export function respondInvite(id: string, accept: boolean): Promise<RosterEntry> {
  return msgPost<RosterEntry>(`/demos/${encodeURIComponent(id)}/invites/respond`, { accept });
}
