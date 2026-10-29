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
    mentions: m.mentions,
    pending: m.pending,
    editedAt: m.editedAt,
    deletedAt: m.deletedAt,
    editVersion: m.editVersion,
  };
}

/** Map a backend conversation summary to the UI conversation list item.
 * projectName/subject have no backend source in Phase 1 — left blank (UI shows
 * the participant + last persisted message), consistent with the live contract. */
export function mapConvSummary(s: WireConvSummary): UIConversation {
  return {
    id: s.id,
    participantName: s.otherName || s.otherUserId,
    participantAvatar: s.otherAvatarUrl || initials(s.otherName || s.otherUserId),
    participantId: s.otherUserId,
    participantUsername: s.otherUsername,
    participantRole: s.otherRole,
    participantVerified: s.otherVerified,
    participantSubscriber: s.otherSubscriber,
    participantCredibilityScore: s.otherCredibilityScore,
    requestStatus: s.requestStatus,
    initiatedBy: s.initiatedBy,
    projectName: "",
    subject: s.lastBody,
    unread: s.unread > 0,
    lastMessageId: s.lastMsgId,
    lastActivityAt: s.lastTs,
    thread: [],
  };
}
