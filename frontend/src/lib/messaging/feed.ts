import { msgGet, msgPost, msgDelete, withFallback } from "./client";
import type { WireComment, WirePost } from "./types";

export function fetchPosts(zone: "global" | "tribe" = "global"): Promise<WirePost[]> {
  return withFallback(
    async () => (await msgGet<{ posts?: WirePost[] }>(`/posts?zone=${zone}`)).posts ?? [],
    [],
    "posts",
  );
}
export function createPost(kind: string, body: string, audience?: string[]): Promise<WirePost | null> {
  return withFallback(
    () => msgPost<WirePost>("/posts", { kind, body, ...(audience && audience.length ? { audience } : {}) }),
    () => null,
    "create post",
  );
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
  return withFallback(
    async () => (await msgGet<{ comments?: WireComment[] }>(`/posts/${postId}/comments`)).comments ?? [],
    [],
    "post comments",
  );
}
export function createComment(postId: string, body: string): Promise<WireComment | null> {
  return withFallback(
    () => msgPost<WireComment>(`/posts/${postId}/comments`, { body }),
    () => null,
    "create comment",
  );
}
