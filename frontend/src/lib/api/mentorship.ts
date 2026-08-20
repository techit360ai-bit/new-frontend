import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api/client";

export type MentorshipRoom = { id: string; mentorId: string; name: string; description: string; expertise: string[]; capacity: number; menteeCount?: number; paymentModel: string; pricing?: Record<string, unknown>; status: string; share?: SharePayload };
export type MentorshipApplication = { id: string; roomId: string; applicantId: string; applicantName?: string; roomName?: string; coverLetter: string; skills: string[]; experience: string; status: "pending" | "accepted" | "rejected" };
export type SharePayload = { url: string; text: string; feed: Record<string, unknown>; opportunity: Record<string, unknown>; social: Record<string, string> };
export type MentorshipTask = { id: string; roomId: string; title: string; description: string; assignedTo?: string | null; dueDate?: string | null; status: string; priority: string };

const path = (suffix: string) => `/mentorship${suffix}`;
export const listMentorshipRooms = (mine = false) => apiGet<{ rooms: MentorshipRoom[] }>(path(`/rooms?mine=${mine ? "true" : "false"}`));
export const getMentorshipRoom = (roomId: string) => apiGet<{ room: MentorshipRoom; mentees: Array<Record<string, unknown>>; tasks: MentorshipTask[]; messages: Array<Record<string, unknown>> }>(path(`/rooms/${encodeURIComponent(roomId)}`));
export const createMentorshipRoom = (input: Record<string, unknown>) => apiPost<{ room: MentorshipRoom }>(path("/rooms"), input);
export const updateMentorshipRoom = (roomId: string, input: Record<string, unknown>) => apiPatch<{ room: MentorshipRoom }>(path(`/rooms/${encodeURIComponent(roomId)}`), input);
export const applyToMentorshipRoom = (roomId: string, input: Record<string, unknown>) => apiPost<{ application: MentorshipApplication }>(path(`/rooms/${encodeURIComponent(roomId)}/apply`), input);
export const listMentorshipApplications = () => apiGet<{ applications: MentorshipApplication[] }>(path("/applications"));
export const reviewMentorshipApplication = (id: string, status: "accepted" | "rejected") => apiPatch<{ application: MentorshipApplication }>(path(`/applications/${encodeURIComponent(id)}`), { status });
export const createMentorshipTask = (roomId: string, input: Record<string, unknown>) => apiPost<{ task: MentorshipTask }>(path(`/rooms/${encodeURIComponent(roomId)}/tasks`), input);
export const updateMentorshipTask = (id: string, input: Record<string, unknown>) => apiPatch<{ task: MentorshipTask }>(path(`/tasks/${encodeURIComponent(id)}`), input);
export const getMentorshipShare = (roomId: string) => apiGet<SharePayload>(path(`/rooms/${encodeURIComponent(roomId)}/share`));
export const publishMentorshipToFeed = (roomId: string, message?: string) => apiPost(path(`/rooms/${encodeURIComponent(roomId)}/share/feed`), { message });
export const broadcastMentorshipOpportunity = (roomId: string, input: Record<string, unknown> = {}) => apiPost(path(`/rooms/${encodeURIComponent(roomId)}/share/opportunity`), input);
export const createMentorshipInvite = (roomId: string, input: Record<string, unknown> = {}) => apiPost<{ invitation: { url: string; token: string; expiresAt: string } }>(path(`/rooms/${encodeURIComponent(roomId)}/invites`), input);
export const revokeMentorshipInvite = (id: string) => apiDelete(path(`/invites/${encodeURIComponent(id)}`));
