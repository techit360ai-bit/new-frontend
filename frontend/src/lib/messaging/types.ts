export interface Mention {
  userId: string;
  username: string;
  start: number;
  end: number;
}
export interface MessageIdentity {
  id: string;
  displayName: string;
  username?: string;
  avatarUrl?: string;
  role?: string;
  verified?: boolean;
  subscriber?: boolean;
  subscriptionLabel?: string | null;
  credibilityScore?: number;
  sharedContext?: boolean;
  canMessage?: boolean;
  deliveryMode?: "direct" | "request" | "unavailable";
}
// Backend wire shapes (what the Go service returns).
export interface WireMessage {
  id: string;
  convId?: string;
  channelId?: string;
  senderId: string;
  type: string;
  body: string;
  ts: string;
  category?: string;
  mentions?: Mention[];
  pending?: boolean;
  editedAt?: string;
  deletedAt?: string;
  editVersion?: number;
}
export interface WireConvSummary {
  id: string;
  otherUserId: string;
  otherName: string;
  otherUsername?: string;
  otherAvatarUrl?: string;
  otherRole?: string;
  otherVerified?: boolean;
  otherSubscriber?: boolean;
  otherCredibilityScore?: number;
  requestStatus?: "active" | "pending" | "declined";
  initiatedBy?: string;
  lastBody: string;
  lastTs: string;
  lastMsgId: string;
  unread: number;
}
export interface WireChannel { id: string; name: string; kind: string }
export interface WirePost {
  id: string;
  authorId: string;
  authorRole: string;
  audience: string[];
  kind: string;
  body: string;
  ts: string;
  mentions?: Mention[];
  author?: MessageIdentity | null;
  pending?: boolean;
  editedAt?: string;
  deletedAt?: string;
  editVersion?: number;
}
export interface WireComment {
  id: string;
  postId: string;
  authorId: string;
  body: string;
  ts: string;
  mentions?: Mention[];
  author?: MessageIdentity | null;
  pending?: boolean;
  editedAt?: string;
  deletedAt?: string;
  editVersion?: number;
}

// UI shapes the screens already use (kept identical to the existing mock types).
export interface UIMessage {
  id: string;
  fromMe: boolean;
  authorName: string;
  body: string;
  timestamp: string;
  mentions?: Mention[];
  pending?: boolean;
  editedAt?: string;
  deletedAt?: string;
  editVersion?: number;
}
export interface UIConversation {
  id: string;
  participantName: string;
  participantAvatar: string;
  projectName: string;
  subject: string;
  unread: boolean;
  lastMessageId?: string;
  lastActivityAt?: string;
  participantId?: string;
  participantUsername?: string;
  participantRole?: string;
  participantVerified?: boolean;
  participantSubscriber?: boolean;
  participantCredibilityScore?: number;
  requestStatus?: "active" | "pending" | "declined";
  initiatedBy?: string;
  thread: UIMessage[];
}
