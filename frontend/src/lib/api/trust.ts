import { apiGet, apiPost, getAuthToken } from "./client";
import { env } from "./config";

const BACKEND_API = String((env as Record<string, unknown>).VITE_API_URL || "http://localhost:3000/api").replace(/\/$/, "");
const TRUST_AUTHORITY_API = (env.MODE === "production" || typeof (env as Record<string, unknown>).VITE_TRUST_AUTHORITY_URL === "string") ? BACKEND_API : "";
function backendHeaders() {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = getAuthToken(); if (token) headers.Authorization = `Bearer ${token}`;
  try { const csrf = document.cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith("techit_csrf=")); if (csrf) headers["X-CSRF-Token"] = decodeURIComponent(csrf.slice("techit_csrf=".length)); } catch {}
  return headers;
}
async function backendRequest<T>(path: string, method: "GET" | "POST", body?: unknown): Promise<T> {
  const response = await fetch(`${BACKEND_API}${path}`, { method, credentials: "include", headers: backendHeaders(), body: body === undefined ? undefined : JSON.stringify(body) });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(String((payload as { error?: unknown }).error || `Trust API ${response.status}`));
  return payload as T;
}

export type TrustStatus = "unverified" | "pending" | "verified" | "expired" | "failed" | "disconnected";

export interface TrustProfile {
  verification_status?: TrustStatus | string;
  trust_score: number;
  tier: string;
  confidence_score?: number;
  badges?: string[];
  signals?: string[];
  breakdown?: Record<string, number>;
  last_sync_at?: string | null;
  verifiedSkills?: Array<{ skill: string; source: string; confidence: number; verifiedAt?: string; expiresAt?: string }>;
  computed_at?: string;
  privacy?: {
    metadata_only?: boolean;
    raw_payload_stored?: boolean;
    secrets_stored?: boolean;
    history_append_only?: boolean;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface TrustBadge {
  badge_type: string;
  label: string;
  source: string;
  status: TrustStatus | string;
  issued_at?: string;
  expires_at?: string;
  active?: boolean;
}

export interface TrustHistoryItem {
  verification_id: string;
  source: string;
  status: TrustStatus | string;
  confidence?: number;
  metadata_hash?: string;
  reference_id?: string | null;
  event_type?: string;
  expires_at?: string;
  created_at?: string;
}

export interface TrustIntegrationManifest {
  provider: string;
  source: string;
  display_name: string;
  auth_method: string;
  scopes: string[];
  sync_frequency_seconds: number;
  stored_fields: string[];
  forbidden_fields: string[];
  access_description: string;
  storage_description: string;
  token_policy: string;
  revocation_supported: boolean;
  manual_reverification_supported: boolean;
  raw_payload_stored: boolean;
}

export interface TrustNotificationIntent {
  notification_id: string;
  notification_type: string;
  source?: string;
  provider?: string;
  severity: "info" | "warning" | "critical" | string;
  message: string;
  action_required: boolean;
  created_at: string;
  founder_visible: boolean;
  investor_visible: boolean;
  raw_payload_stored: boolean;
}

export interface TrustVerificationResult {
  source: string;
  status: TrustStatus | string;
  confidence: number;
  metadata_hash: string;
  metadata_stored?: Record<string, unknown>;
  raw_payload_stored: boolean;
  dropped_fields?: string[];
  expires_at?: string;
  persisted?: boolean;
  next_action?: string;
  authorizationUrl?: string;
  verification?: TrustHistoryItem & {
    subject_id?: string;
    subject_type?: string;
  };
}

export interface TrustNotificationPreview {
  notification_intents: TrustNotificationIntent[];
  summary: {
    events_seen: number;
    notifications_prepared: number;
  };
  dropped_fields?: string[];
  privacy?: Record<string, unknown>;
  owner_ids_exposed_to_investors?: boolean;
}

export interface FounderTrustAccessRequest {
  id: string;
  projectId: string;
  investorId: string;
  status: "pending" | "approved" | "rejected";
  purpose: string;
  requestedScopes: string[];
  createdAt: string;
}

export function fetchTrustProfile(): Promise<TrustProfile> {
  return TRUST_AUTHORITY_API ? backendRequest<TrustProfile>("/trust/profile", "GET") : apiGet<TrustProfile>("/trust/profile");
}

export function fetchTrustBadges(): Promise<{ badges: TrustBadge[]; active_badges?: string[]; privacy?: string }> {
  return TRUST_AUTHORITY_API ? backendRequest<{ badges: TrustBadge[]; active_badges?: string[]; privacy?: string }>("/trust/badges", "GET") : apiGet<{ badges: TrustBadge[]; active_badges?: string[]; privacy?: string }>("/trust/badges");
}

export function fetchTrustHistory(limit = 25): Promise<{ history: TrustHistoryItem[]; append_only?: boolean; privacy?: string }> {
  return TRUST_AUTHORITY_API ? backendRequest<{ history: TrustHistoryItem[]; append_only?: boolean; privacy?: string }>(`/trust/history?limit=${limit}`, "GET") : apiGet<{ history: TrustHistoryItem[]; append_only?: boolean; privacy?: string }>(`/trust/history?limit=${limit}`);
}

export function fetchTrustIntegrations(): Promise<{ integrations: TrustIntegrationManifest[]; privacy?: Record<string, unknown> }> {
  return TRUST_AUTHORITY_API ? backendRequest<{ integrations: TrustIntegrationManifest[]; privacy?: Record<string, unknown> }>("/trust/integrations", "GET") : apiGet<{ integrations: TrustIntegrationManifest[]; privacy?: Record<string, unknown> }>("/trust/integrations");
}

export function refreshTrustSource(source: string): Promise<TrustVerificationResult> {
  return TRUST_AUTHORITY_API ? backendRequest<TrustVerificationResult>(`/trust/refresh/${encodeURIComponent(source)}`, "POST", {}) : apiPost<TrustVerificationResult>(`/trust/refresh/${encodeURIComponent(source)}`, {});
}

export function disconnectTrustSource(source: string): Promise<TrustVerificationResult> {
  return TRUST_AUTHORITY_API ? backendRequest<TrustVerificationResult>(`/trust/disconnect/${encodeURIComponent(source)}`, "POST", {}) : apiPost<TrustVerificationResult>(`/trust/disconnect/${encodeURIComponent(source)}`, {});
}

export function connectTrustSource(source: string): Promise<TrustVerificationResult> {
  return TRUST_AUTHORITY_API ? backendRequest<TrustVerificationResult>(`/trust/verify/${encodeURIComponent(source)}`, "POST", {}) : apiPost<TrustVerificationResult>(`/trust/verify/${encodeURIComponent(source)}`, {});
}

export function createTrustDomainChallenge(input: Record<string, unknown> = {}) { return backendRequest<Record<string, unknown>>("/trust/domain/challenge", "POST", input); }
export function verifyTrustDomainChallenge(challengeId: string) { return backendRequest<Record<string, unknown>>(`/trust/domain/challenge/${encodeURIComponent(challengeId)}/verify`, "POST", {}); }
export function fetchFounderTrustAccessRequests() { return backendRequest<{ ok: boolean; requests: FounderTrustAccessRequest[] }>("/authorization/founder/trust/access-requests?status=pending", "GET"); }
export function decideFounderTrustAccessRequest(requestId: string, decision: "approved" | "rejected", note = "") { return backendRequest<{ ok: boolean; request: FounderTrustAccessRequest }>(`/authorization/founder/trust/access-requests/${encodeURIComponent(requestId)}/decision`, "POST", { decision, note }); }

export function previewTrustNotifications(events: Array<Record<string, unknown>>): Promise<TrustNotificationPreview> {
  return apiPost<TrustNotificationPreview>("/trust/notifications/preview", { events });
}

export function previewTrustShare(input: Record<string, unknown> = {}) {
  return apiPost<Record<string, unknown>>("/trust/share-profile/preview", input);
}

export function verifyTrustAdapter(provider: string, input: Record<string, unknown> = {}) {
  return apiPost<TrustVerificationResult>(`/trust/adapters/${encodeURIComponent(provider)}/verify`, input);
}

export function createTrustRefreshPlan(connections: Array<Record<string, unknown>>) {
  return apiPost<Record<string, unknown>>("/trust/refresh-plan", { connections });
}

export function runContinuousTrustVerification(input: { connections?: Array<Record<string, unknown>>; adapter_payloads?: Record<string, unknown>; execute?: boolean } = {}) {
  return apiPost<Record<string, unknown>>("/trust/continuous-verification/run", input);
}

export function submitTrustMilestone(input: Record<string, unknown>) {
  return apiPost<TrustVerificationResult>("/trust/milestone", input);
}

export function reviewTrustMilestone(input: Record<string, unknown>) {
  return apiPost<Record<string, unknown>>("/trust/milestone/review", input);
}

export function inviteTrustTeamMember(input: Record<string, unknown>) {
  return apiPost<Record<string, unknown>>("/trust/team/invite", input);
}

export function verifyTrustTeamMember(input: Record<string, unknown>) {
  return apiPost<Record<string, unknown>>("/trust/team/verify", input);
}
