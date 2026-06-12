import { msgGet, msgPost, withFallback } from "./client";
import type { WireChannel, WireMessage } from "./types";

export function fetchChannels(): Promise<WireChannel[]> {
  return withFallback(
    async () => (await msgGet<{ channels: WireChannel[] }>("/channels")).channels,
    [],
    "channels",
  );
}
export function fetchChannelHistory(channelId: string): Promise<WireMessage[]> {
  return withFallback(
    async () => (await msgGet<{ messages: WireMessage[] }>(`/channels/${channelId}/messages`)).messages,
    [],
    "channel history",
  );
}
export function restSendChannel(channelId: string, clientMsgId: string, body: string): Promise<{ msgId: string } | null> {
  return withFallback(
    () => msgPost<{ msgId: string }>(`/channels/${channelId}/messages`, { clientMsgId, type: "text", body }),
    () => null,
    "rest send channel",
  );
}
