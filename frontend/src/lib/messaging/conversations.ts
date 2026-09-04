import { msgGet, msgPost, withFallback } from "./client";
import { messagingUrl } from './config';
import { cacheSnapshot, readSnapshot } from '@/lib/resilience/cache';
import { enqueue } from '@/lib/resilience/queue';
import { isNetworkFailure } from '@/lib/resilience/connectivity';
import type { MessageIdentity, WireConvSummary, WireMessage } from "./types";

export function fetchConversations(): Promise<WireConvSummary[]> {
  const key = 'messaging:conversations';
  return msgGet<{ conversations: WireConvSummary[] }>("/conversations").then(result => { void cacheSnapshot(key, result.conversations); return result.conversations; }).catch(async error => {
    const cached = await readSnapshot<WireConvSummary[]>(key);
    if (cached) return cached.value;
    return withFallback(() => Promise.reject(error), [], 'conversations');
  });
}
export function fetchHistory(convId: string): Promise<WireMessage[]> {
  const key = `messaging:history:${convId}`;
  return msgGet<{ messages: WireMessage[] }>(`/conversations/${convId}/messages`).then(result => { void cacheSnapshot(key, result.messages); return result.messages; }).catch(async error => {
    const cached = await readSnapshot<WireMessage[]>(key);
    if (cached) return cached.value;
    return withFallback(() => Promise.reject(error), [], 'dm history');
  });
}
export interface CreateConversationResult { id: string; requestStatus?: "active" | "pending"; deliveryMode?: "direct" | "request"; recipient?: MessageIdentity }
export function createConversation(userId: string): Promise<CreateConversationResult | null> {
	return withFallback(() => msgPost<CreateConversationResult>("/conversations", { userId }), () => null, "create conversation");
}
export function searchMessageRecipients(query: string): Promise<MessageIdentity[]> { return msgGet<{ users: MessageIdentity[] }>(`/users/search?q=${encodeURIComponent(query)}&limit=20`).then(result => result.users); }
export function acceptMessageRequest(convId: string): Promise<{ id: string; requestStatus: string }> { return msgPost(`/conversations/${encodeURIComponent(convId)}/request/accept`, {}); }
export function declineMessageRequest(convId: string): Promise<{ id: string; requestStatus: string }> { return msgPost(`/conversations/${encodeURIComponent(convId)}/request/decline`, {}); }
export async function restSendDM(convId: string, clientMsgId: string, body: string): Promise<{ msgId: string; pending?: boolean } | null> {
  const payload = { clientMsgId, type: 'text', body };
  try { return await msgPost<{ msgId: string; pending?: boolean }>(`/conversations/${convId}/messages`, payload); }
  catch (error) {
    if (!isNetworkFailure(error)) return withFallback(() => Promise.reject(error), () => null, 'rest send dm');
    await enqueue({ type: 'message.send', endpoint: messagingUrl(`/conversations/${convId}/messages`), payload, entityKey: `conversation:${convId}` });
    return { msgId: clientMsgId, pending: true };
  }
}
export function markConvRead(convId: string, msgId: string): Promise<unknown> {
  return withFallback(() => msgPost(`/conversations/${convId}/read`, { msgId }), () => null, "mark read");
}
