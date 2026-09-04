import { msgGet, msgPost, msgDelete, withFallback } from "./client";
import { messagingUrl } from './config';
import { enqueue } from '@/lib/resilience/queue';
import { isNetworkFailure } from '@/lib/resilience/connectivity';
import { cacheSnapshot, readSnapshot } from '@/lib/resilience/cache';
import type { WireComment, WirePost } from "./types";

export function fetchPosts(zone: "global" | "tribe" = "global"): Promise<WirePost[]> {
  const key = `feed:posts:${zone}`;
  return msgGet<{ posts?: WirePost[] }>(`/posts?zone=${zone}`).then(result => { const posts = result.posts ?? []; void cacheSnapshot(key, posts); return posts; }).catch(async error => {
    const cached = await readSnapshot<WirePost[]>(key);
    if (cached) return cached.value;
    return withFallback(() => Promise.reject(error), [], 'posts');
  });
}

export interface FeedPageResponse { posts: WirePost[]; category?: string; nextCursor?: string; hasMore?: boolean }

export function fetchPostsPage(options: { zone?: 'global' | 'tribe'; category?: string; before?: string; limit?: number } = {}): Promise<FeedPageResponse> {
  const params = new URLSearchParams();
  if (options.zone) params.set('zone', options.zone);
  if (options.category) params.set('category', options.category);
  if (options.before) params.set('before', options.before);
  if (options.limit) params.set('limit', String(options.limit));
  return withFallback(
    () => msgGet<FeedPageResponse>(`/posts?${params.toString()}`).then(page => ({ ...page, posts: page.posts ?? [] })),
    { posts: [], category: options.category, nextCursor: '', hasMore: false },
    'posts page',
  );
}
export async function createPost(kind: string, body: string, audience?: string[]): Promise<WirePost | null> {
  const payload = { kind, body, ...(audience && audience.length ? { audience } : {}) };
  try { return await msgPost<WirePost>('/posts', payload); }
  catch (error) {
    if (!isNetworkFailure(error)) return withFallback(() => Promise.reject(error), () => null, 'create post');
    const id = `offline_post_${Date.now().toString(36)}`;
    await enqueue({ type: 'feed.post.create', endpoint: messagingUrl('/posts'), payload, entityKey: 'feed' });
    return { id, authorId: '', authorRole: 'community', audience: audience || ['all'], kind, body, ts: new Date().toISOString(), pending: true };
  }
}
export async function fetchPost(postId: string): Promise<WirePost | null> {
  const posts = await fetchPosts("global");
  return posts.find((post) => post.id === postId) ?? null;
}
export function likePost(postId: string): Promise<{ likeCount: number } | null> {
  return withFallback(() => msgPost<{ likeCount: number }>(`/posts/${postId}/like`, {}), () => null, "like post");
}
export function unlikePost(postId: string): Promise<{ likeCount: number } | null> {
  return withFallback(() => msgDelete<{ likeCount: number }>(`/posts/${postId}/like`), () => null, "unlike post");
}
export function fetchComments(postId: string): Promise<WireComment[]> {
  const key = `feed:comments:${postId}`;
  return msgGet<{ comments?: WireComment[] }>(`/posts/${postId}/comments`).then(result => { const comments = result.comments ?? []; void cacheSnapshot(key, comments); return comments; }).catch(async error => {
    const cached = await readSnapshot<WireComment[]>(key);
    if (cached) return cached.value;
    return withFallback(() => Promise.reject(error), [], 'post comments');
  });
}
export async function createComment(postId: string, body: string): Promise<WireComment | null> {
  const payload = { body };
  try { return await msgPost<WireComment>(`/posts/${postId}/comments`, payload); }
  catch (error) {
    if (!isNetworkFailure(error)) return withFallback(() => Promise.reject(error), () => null, 'create comment');
    const id = `offline_comment_${Date.now().toString(36)}`;
    await enqueue({ type: 'feed.comment.create', endpoint: messagingUrl(`/posts/${postId}/comments`), payload, entityKey: `post:${postId}` });
    return { id, postId, authorId: '', body, ts: new Date().toISOString(), pending: true };
  }
}
