import { msgGet, msgPost, withFallback } from "./client";
import type { MessageIdentity, WireConvSummary, WireMessage } from "./types";

export function fetchConversations(): Promise<WireConvSummary[]> {
  return withFallback(
    async () => (await msgGet<{ conversations: WireConvSummary[] }>("/conversations")).conversations,
    [],
    "conversations",
  );
}
export function fetchHistory(convId: string): Promise<WireMessage[]> {
  return withFallback(
    async () => (await msgGet<{ messages: WireMessage[] }>(`/conversations/${convId}/messages`)).messages,
    [],
    "dm history",
  );
}
export interface CreateConversationResult { id: string; requestStatus?: "active" | "pending"; deliveryMode?: "direct" | "request"; recipient?: MessageIdentity }
export function createConversation(userId: string): Promise<CreateConversationResult | null> {
	return withFallback(() => msgPost<CreateConversationResult>("/conversations", { userId }), () => null, "create conversation");
}
export function searchMessageRecipients(query: string): Promise<MessageIdentity[]> { return msgGet<{ users: MessageIdentity[] }>(`/users/search?q=${encodeURIComponent(query)}&limit=20`).then(result => result.users); }
export function acceptMessageRequest(convId: string): Promise<{ id: string; requestStatus: string }> { return msgPost(`/conversations/${encodeURIComponent(convId)}/request/accept`, {}); }
export function declineMessageRequest(convId: string): Promise<{ id: string; requestStatus: string }> { return msgPost(`/conversations/${encodeURIComponent(convId)}/request/decline`, {}); }
export function restSendDM(convId: string, clientMsgId: string, body: string): Promise<{ msgId: string } | null> {
  return withFallback(
    () => msgPost<{ msgId: string }>(`/conversations/${convId}/messages`, { clientMsgId, type: "text", body }),
    () => null,
    "rest send dm",
  );
}
export function markConvRead(convId: string, msgId: string): Promise<unknown> {
  return withFallback(() => msgPost(`/conversations/${convId}/read`, { msgId }), () => null, "mark read");
}
