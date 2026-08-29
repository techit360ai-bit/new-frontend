import { ApiError, getAuthToken } from './client';

const env =
  typeof import.meta !== 'undefined'
    ? ((import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {})
    : {};

const DEFAULT_TIMEOUT_MS = Number(env.VITE_API_TIMEOUT_MS ?? '30000') || 30_000;
const BACKEND_API_BASE_URL =
  (env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/$/, '');

export interface PublicUserActivity {
  id: string;
  type: string;
  title: string;
  date: string;
}

export interface PublicUserProfile {
  id: string;
  name: string;
  username?: string | null;
  role: string;
  category: string;
  stage: string;
  gsis: number;
  location: string;
  joinedDate: string;
  email: string | null;
  bio: string;
  website: string;
  avatar: string;
  avatarUrl?: string;
  isVerified?: boolean;
  credibilityScore?: number;
  credibilityLevel?: string;
  subscriber?: boolean;
  subscriptionLabel?: string | null;
  sharedContext?: boolean;
  isOwnProfile: boolean;
  stats: {
    decay: number;
    stageProgress: number;
    posts: number;
    answers: number;
    connections: number;
  };
  skills: string[];
  recentActivity: PublicUserActivity[];
}

export interface CollaboratorDirectoryEntry {
  id: string;
  name: string;
  username?: string | null;
  role: string;
  title: string;
  headline: string;
  skills: string[];
  discipline: string;
  subSkills: string[];
  techStack: string[];
  weeklyHours: number;
  timezone: string;
  location: string;
  earliestStart: string;
  commitmentStyle: string;
  equityPreference: number;
  minCashFloor: number;
  industries: string[];
  avatarUrl: string;
  credibilityScore: number;
  isVerified: boolean;
  subscriber?: boolean;
  subscriptionLabel?: string | null;
  credibilityLevel?: string;
  sharedContext?: boolean;
}

export interface CollaborationInvitation {
  projectId: string;
  projectName: string;
  summary: string;
  scope: string;
  requestedRole: string;
  requiredSkills: string[];
  compensationMode?: "equity-heavy" | "equity-cash" | "cash-only";
  equityProposal?: number;
  cashReward?: number;
}

function timeoutSignal(init?: RequestInit): AbortSignal {
  return init?.signal ?? AbortSignal.timeout(DEFAULT_TIMEOUT_MS);
}

function headers(extra?: HeadersInit): HeadersInit {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getAuthToken();
  if (token) h.Authorization = `Bearer ${token}`;
  return { ...h, ...(extra as Record<string, string>) };
}

async function parse<T>(res: Response): Promise<T> {
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new ApiError(res.status, `${res.status} ${res.statusText}`, data);
  }
  return data as T;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const clean = path.startsWith('?') || path.startsWith('/') ? path : `/${path}`;
  const res = await fetch(`${BACKEND_API_BASE_URL}/users${clean}`, {
    method: 'GET',
    ...init,
    headers: headers(init?.headers),
    signal: timeoutSignal(init),
  });
  return parse<T>(res);
}

export function fetchPublicUserProfile(userId: string): Promise<PublicUserProfile> {
  return request<PublicUserProfile>(`/${encodeURIComponent(userId)}`);
}

export function fetchCollaboratorDirectory(): Promise<CollaboratorDirectoryEntry[]> {
  return request<{ users?: CollaboratorDirectoryEntry[] }>('?role=collaborator')
    .then((data) => Array.isArray(data.users) ? data.users : []);
}

export async function connectWithUser(userId: string, invitation?: CollaborationInvitation): Promise<void> {
  await request<{ ok: boolean }>(`/${encodeURIComponent(userId)}/connect`, {
    method: 'POST',
    body: invitation ? JSON.stringify({ invitation }) : undefined,
  });
}

export async function uploadProfileAvatar(file: File): Promise<{ avatarUrl: string }> {
  const base = BACKEND_API_BASE_URL
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  const token = getAuthToken(); if (token) headers.Authorization = `Bearer ${token}`
  const start = await fetch(`${base}/users/me/avatar/upload-url`, { method: "POST", headers, body: JSON.stringify({ contentType: file.type, sizeBytes: file.size }) })
  const upload = await parse<{ uploadUrl: string; objectKey: string; requiredHeaders?: Record<string, string> }>(start)
  const objectResponse = await fetch(upload.uploadUrl, { method: "PUT", headers: upload.requiredHeaders, body: file })
  if (!objectResponse.ok) throw new Error("Avatar upload failed")
  const finalize = await fetch(`${base}/users/me/avatar/finalize`, { method: "POST", headers, body: JSON.stringify({ objectKey: upload.objectKey, contentType: file.type, sizeBytes: file.size }) })
  return parse<{ avatarUrl: string }>(finalize)
}

export async function removeProfileAvatar(): Promise<void> {
  await request<void>("/me/avatar", { method: "DELETE" })
}
