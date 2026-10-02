import { msgDelete, msgGet, msgPost, msgPut, withFallback } from './client';

export function savePost(postId: string): Promise<{ saved: boolean } | null> { return withFallback(() => msgPost<{ saved: boolean }>(`/posts/${postId}/save`, {}), () => null, 'save post'); }
export function unsavePost(postId: string): Promise<{ saved: boolean } | null> { return withFallback(() => msgDelete<{ saved: boolean }>(`/posts/${postId}/save`), () => null, 'unsave post'); }
export function postFeedback(postId: string, feedback: 'hide' | 'not_interested' | 'mute' | 'block' | 'report'): Promise<{ feedback: string } | null> { return withFallback(() => msgPost<{ feedback: string }>(`/posts/${postId}/feedback`, { feedback }), () => null, 'post feedback'); }
export function followUser(userId: string): Promise<{ following: boolean } | null> { return withFallback(() => msgPost<{ following: boolean }>(`/users/${encodeURIComponent(userId)}/follow`, {}), () => null, 'follow user'); }
export function unfollowUser(userId: string): Promise<{ following: boolean } | null> { return withFallback(() => msgDelete<{ following: boolean }>(`/users/${encodeURIComponent(userId)}/follow`), () => null, 'unfollow user'); }
// Explicit follow edges only; tribe/role overlap is not counted.
export function fetchFollowCounts(userId: string): Promise<{ followers: number; following: number; viewerFollows: boolean } | null> { return withFallback(() => msgGet<{ userId: string; followers: number; following: number; viewerFollows: boolean }>(`/users/${encodeURIComponent(userId)}/follow-stats`), () => null, 'follow counts'); }
export function muteUser(userId: string): Promise<{ mute: boolean } | null> { return withFallback(() => msgPost<{ mute: boolean }>(`/users/${encodeURIComponent(userId)}/mute`, {}), () => null, 'mute user'); }
export function blockUser(userId: string): Promise<{ block: boolean } | null> { return withFallback(() => msgPost<{ block: boolean }>(`/users/${encodeURIComponent(userId)}/block`, {}), () => null, 'block user'); }
export function recordFeedEvent(eventType: string, postId?: string, metadata?: Record<string, unknown>): Promise<{ recorded: boolean } | null> { return withFallback(() => msgPost<{ recorded: boolean }>('/feed/events', { eventType, postId, metadata }), () => null, 'feed event'); }
export function syncDiscoveryProfile(profile: Record<string, unknown>): Promise<{ saved: boolean } | null> { return withFallback(() => msgPut<{ saved: boolean }>('/feed/discovery/profile', profile), () => null, 'discovery profile'); }
