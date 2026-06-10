import { msgGet, msgPost, msgDelete, withFallback } from "./client";
import type { WirePost } from "./types";

export function fetchPosts(): Promise<WirePost[]> {
  return withFallback(async () => (await msgGet<{ posts: WirePost[] }>("/posts")).posts, [], "posts");
}
export function createPost(kind: string, body: string): Promise<WirePost | null> {
  return withFallback(() => msgPost<WirePost>("/posts", { kind, body }), () => null, "create post");
}
export function likePost(postId: string): Promise<{ likeCount: number } | null> {
  return withFallback(() => msgPost<{ likeCount: number }>(`/posts/${postId}/like`, {}), () => null, "like post");
}
export function unlikePost(postId: string): Promise<{ likeCount: number } | null> {
  return withFallback(() => msgDelete<{ likeCount: number }>(`/posts/${postId}/like`), () => null, "unlike post");
}
