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
}
export interface WireConvSummary {
  id: string;
  otherUserId: string;
  otherName: string;
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
}
export interface WireComment {
  id: string;
  postId: string;
  authorId: string;
  body: string;
  ts: string;
}

// UI shapes the screens already use (kept identical to the existing mock types).
export interface UIMessage {
  id: string;
  fromMe: boolean;
  authorName: string;
  body: string;
  timestamp: string;
}
export interface UIConversation {
  id: string;
  participantName: string;
  participantAvatar: string;
  projectName: string;
  subject: string;
  unread: boolean;
  lastMessageId?: string;
  thread: UIMessage[];
}
