import { mapMessage } from "./map";
import type { UIMessage, WireMessage } from "./types";

export interface Envelope {
  type: string;
  id: string;
  ts: string;
  data?: Record<string, unknown>;
}

export interface FeedPost {
  id: string;
  authorId: string;
  authorRole: string;
  audience: string[];
  kind: string;
  body: string;
  ts: string;
  likeCount: number;
}

export interface MsgStore {
  threads: Record<string, UIMessage[]>;        // convId -> messages
  channelThreads: Record<string, UIMessage[]>; // channelId -> messages
  online: Record<string, boolean>;
  feed: FeedPost[];   // global
  tribe: FeedPost[];  // role-relevant
}

export function emptyStore(): MsgStore {
  return { threads: {}, channelThreads: {}, online: {}, feed: [], tribe: [] };
}

export function inTribe(p: { authorRole: string; audience: string[] }, myRole: string): boolean {
  return p.authorRole === myRole || (Array.isArray(p.audience) && p.audience.includes(myRole));
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
      const wp = d as unknown as { id: string; authorId: string; authorRole?: string; audience?: string[]; kind: string; body: string; ts: string };
      const fp: FeedPost = {
        id: wp.id, authorId: wp.authorId, authorRole: wp.authorRole ?? "community",
        audience: Array.isArray(wp.audience) ? wp.audience : ["all"],
        kind: wp.kind, body: wp.body, ts: wp.ts, likeCount: 0,
      };
      const next = { ...s, feed: [fp, ...s.feed] };
      if (inTribe(fp, me)) next.tribe = [fp, ...s.tribe];
      return next;
    }
    case "post.liked": {
      const postId = String(d.postId ?? "");
      const likeCount = Number(d.likeCount ?? 0);
      const bump = (p: FeedPost) => (p.id === postId ? { ...p, likeCount } : p);
      return { ...s, feed: s.feed.map(bump), tribe: s.tribe.map(bump) };
    }
    default:
      return s;
  }
}
