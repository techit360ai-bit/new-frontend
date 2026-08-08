import { msgDelete, msgPost, withFallback } from './client';

export function savePost(postId: string): Promise<{ saved: boolean } | null> { return withFallback(() => msgPost<{ saved: boolean }>(`/posts/${postId}/save`, {}), () => null, 'save post'); }
export function unsavePost(postId: string): Promise<{ saved: boolean } | null> { return withFallback(() => msgDelete<{ saved: boolean }>(`/posts/${postId}/save`), () => null, 'unsave post'); }
export function postFeedback(postId: string, feedback: 'hide' | 'not_interested' | 'mute' | 'block' | 'report'): Promise<{ feedback: string } | null> { return withFallback(() => msgPost<{ feedback: string }>(`/posts/${postId}/feedback`, { feedback }), () => null, 'post feedback'); }
export function followUser(userId: string): Promise<{ following: boolean } | null> { return withFallback(() => msgPost<{ following: boolean }>(`/users/${encodeURIComponent(userId)}/follow`, {}), () => null, 'follow user'); }
export function unfollowUser(userId: string): Promise<{ following: boolean } | null> { return withFallback(() => msgDelete<{ following: boolean }>(`/users/${encodeURIComponent(userId)}/follow`), () => null, 'unfollow user'); }
export function recordFeedEvent(eventType: string, postId?: string, metadata?: Record<string, unknown>): Promise<{ recorded: boolean } | null> { return withFallback(() => msgPost<{ recorded: boolean }>('/feed/events', { eventType, postId, metadata }), () => null, 'feed event'); }
