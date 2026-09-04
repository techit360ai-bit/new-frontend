import { msgGet, msgPost, withFallback } from "./client";
import { messagingUrl } from './config';
import { enqueue } from '@/lib/resilience/queue';
import { cacheSnapshot, readSnapshot } from '@/lib/resilience/cache';
import { isNetworkFailure } from '@/lib/resilience/connectivity';
import type { WireChannel, WireMessage } from "./types";

export function fetchChannels(): Promise<WireChannel[]> {
  const key = 'messaging:channels';
  return msgGet<{ channels: WireChannel[] }>("/channels").then(result => { void cacheSnapshot(key, result.channels); return result.channels; }).catch(async error => {
    const cached = await readSnapshot<WireChannel[]>(key);
    if (cached) return cached.value;
    return withFallback(() => Promise.reject(error), [], 'channels');
  });
}
export function fetchChannelHistory(channelId: string): Promise<WireMessage[]> {
  const key = `messaging:channel-history:${channelId}`;
  return msgGet<{ messages: WireMessage[] }>(`/channels/${channelId}/messages`).then(result => { void cacheSnapshot(key, result.messages); return result.messages; }).catch(async error => {
    const cached = await readSnapshot<WireMessage[]>(key);
    if (cached) return cached.value;
    return withFallback(() => Promise.reject(error), [], 'channel history');
  });
}
export async function restSendChannel(channelId: string, clientMsgId: string, body: string): Promise<{ msgId: string; pending?: boolean } | null> {
  const payload = { clientMsgId, type: 'text', body };
  try { return await msgPost<{ msgId: string; pending?: boolean }>(`/channels/${channelId}/messages`, payload); }
  catch (error) {
    if (!isNetworkFailure(error)) return withFallback(() => Promise.reject(error), () => null, 'rest send channel');
    await enqueue({ type: 'channel.message.send', endpoint: messagingUrl(`/channels/${channelId}/messages`), payload, entityKey: `channel:${channelId}` });
    return { msgId: clientMsgId, pending: true };
  }
}

export function markChannelRead(channelId: string, msgId: string): Promise<unknown> {
  return withFallback(
    () => msgPost(`/channels/${channelId}/read`, { msgId }),
    () => null,
    "mark channel read",
  );
}
