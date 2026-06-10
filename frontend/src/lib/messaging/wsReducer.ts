import { mapMessage } from "./map";
import type { UIMessage, WireMessage, WirePost } from "./types";

export interface Envelope {
  type: string;
  id: string;
  ts: string;
  data?: Record<string, unknown>;
}

export interface FeedPost {
  id: string;
  authorId: string;
  kind: string;
  body: string;
  ts: string;
  likeCount: number;
}

export interface MsgStore {
  threads: Record<string, UIMessage[]>;        // convId -> messages
  channelThreads: Record<string, UIMessage[]>; // channelId -> messages
  online: Record<string, boolean>;
  feed: FeedPost[];
}

export function emptyStore(): MsgStore {
  return { threads: {}, channelThreads: {}, online: {}, feed: [] };
}

export function applyEnvelope(s: MsgStore, env: Envelope, me: string): MsgStore {
  const d = env.data ?? {};
  switch (env.type) {
    case "message.new": {
      const wm = d as unknown as WireMessage;
      const ui = mapMessage(wm, me);
      if (wm.channelId) {
        const prev = s.channelThreads[wm.channelId] ?? [];
        return { ...s, channelThreads: { ...s.channelThreads, [wm.channelId]: [...prev, ui] } };
      }
      const cid = wm.convId ?? "";
      const prev = s.threads[cid] ?? [];
      return { ...s, threads: { ...s.threads, [cid]: [...prev, ui] } };
    }
    case "presence.changed": {
      const userId = String(d.userId ?? "");
      const online = Boolean(d.online);
      return { ...s, online: { ...s.online, [userId]: online } };
    }
    case "post.new": {
      const wp = d as unknown as WirePost;
      return { ...s, feed: [{ ...wp, likeCount: 0 }, ...s.feed] };
    }
    case "post.liked": {
      const postId = String(d.postId ?? "");
      const likeCount = Number(d.likeCount ?? 0);
      return { ...s, feed: s.feed.map((p) => (p.id === postId ? { ...p, likeCount } : p)) };
    }
    default:
      return s;
  }
}
