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
export function createConversation(userId: string): Promise<{ id: string } | null> {
  return withFallback(() => msgPost<{ id: string }>("/conversations", { userId }), () => null, "create conversation");
}
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

export function searchMessageRecipients(query: string): Promise<MessageIdentity[]> {
  return withFallback(
    async () => (await msgGet<{ recipients: MessageIdentity[] }>(`/recipients/search?q=${encodeURIComponent(query)}`)).recipients,
    [],
    "search recipients",
  );
}

