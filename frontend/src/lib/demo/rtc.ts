// Demo live-video session — fetches a LiveKit token from the messaging service.
// Offline-safe: returns null when the endpoint is unavailable or unconfigured.
import { msgPost, withFallback } from "@/lib/messaging/client";

export interface RtcSession {
  token: string;
  url: string;
  room: string;
  identity: string;
  canPublish: boolean;
}

export function fetchRtcToken(eventId: string): Promise<RtcSession | null> {
  return withFallback(
    () => msgPost<RtcSession>(`/demos/${encodeURIComponent(eventId)}/rtc-token`),
    () => null,
    "rtc token",
  );
}
