import type { WireMessage, WireConvSummary, UIMessage, UIConversation } from "./types";

/** Derive up to two uppercase initials from a display name. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts.slice(0, 2).map((p) => p[0]!.toUpperCase()).join("");
}

/** Map a backend message to the UI message shape relative to the current user. */
export function mapMessage(m: WireMessage, currentUserId: string, authorName = ""): UIMessage {
  const mine = m.senderId === currentUserId;
  return {
    id: m.id,
    fromMe: mine,
    authorName: mine ? "You" : authorName || m.senderId,
    body: m.body,
    timestamp: m.ts,
  };
}

/** Map a backend conversation summary to the UI conversation list item.
 * projectName/subject have no backend source in Phase 1 — left blank (UI shows
 * the participant + last message), consistent with the mock-metadata approach. */
export function mapConvSummary(s: WireConvSummary): UIConversation {
  return {
    id: s.id,
    participantName: s.otherName || s.otherUserId,
    participantAvatar: initials(s.otherName || s.otherUserId),
    projectName: "",
    subject: s.lastBody,
    unread: s.unread > 0,
    thread: [],
  };
}
