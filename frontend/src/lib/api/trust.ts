import { apiGet, apiPost, getAuthToken } from "./client";
import { env } from "./config";
import { trustPath } from "./trustRoutes";

const BACKEND_API = String((env as Record<string, unknown>).VITE_API_URL || "http://localhost:3000/api").replace(/\/$/, "");
const TRUST_AUTHORITY_API = (env.MODE === "production" || typeof (env as Record<string, unknown>).VITE_TRUST_AUTHORITY_URL === "string") ? BACKEND_API : "";
function backendHeaders() {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = getAuthToken(); if (token) headers.Authorization = `Bearer ${token}`;
  try { const csrf = document.cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith("techit_csrf=")); if (csrf) headers["X-CSRF-Token"] = decodeURIComponent(csrf.slice("techit_csrf=".length)); } catch {}
  return headers;
}
async function backendRequest<T>(path: string, method: "GET" | "POST" | "DELETE", body?: unknown): Promise<T> {
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

export interface TrustProofDetail {
  status?: TrustStatus | string | null;
  confidence?: number | null;
  attestation_level?: string;
  issued_at?: string | null;
  expires_at?: string | null;
  metrics?: Record<string, unknown> | null;
  manual_review?: boolean;
}

export interface TrustBadge {
  badge_type: string;
  label: string;
  source: string;
  status: TrustStatus | string;
  issued_at?: string;
  expires_at?: string;
  active?: boolean;
  confidence?: number | null;
  attestation_level?: string;
  manual_review?: boolean;
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
  category?: string;
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
  availability?: "available" | "coming_soon" | string;
  availability_reason?: string | null;
  coming_soon?: boolean;
  connected?: boolean;
  latest_proof?: TrustProofDetail | null;
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
  return TRUST_AUTHORITY_API ? backendRequest<TrustProfile>(trustPath("profile"), "GET") : apiGet<TrustProfile>(trustPath("profile"));
}

export function fetchTrustBadges(): Promise<{ badges: TrustBadge[]; active_badges?: string[]; privacy?: string }> {
  return TRUST_AUTHORITY_API ? backendRequest<{ badges: TrustBadge[]; active_badges?: string[]; privacy?: string }>(trustPath("badges"), "GET") : apiGet<{ badges: TrustBadge[]; active_badges?: string[]; privacy?: string }>(trustPath("badges"));
}

export function fetchTrustHistory(limit = 25): Promise<{ history: TrustHistoryItem[]; append_only?: boolean; privacy?: string }> {
  return TRUST_AUTHORITY_API ? backendRequest<{ history: TrustHistoryItem[]; append_only?: boolean; privacy?: string }>(`${trustPath("history")}?limit=${limit}`, "GET") : apiGet<{ history: TrustHistoryItem[]; append_only?: boolean; privacy?: string }>(`${trustPath("history")}?limit=${limit}`);
}

export function fetchTrustIntegrations(): Promise<{ integrations: TrustIntegrationManifest[]; privacy?: Record<string, unknown> }> {
  return TRUST_AUTHORITY_API ? backendRequest<{ integrations: TrustIntegrationManifest[]; privacy?: Record<string, unknown> }>(trustPath("integrations"), "GET") : apiGet<{ integrations: TrustIntegrationManifest[]; privacy?: Record<string, unknown> }>(trustPath("integrations"));
}

export function refreshTrustSource(source: string): Promise<TrustVerificationResult> {
  return TRUST_AUTHORITY_API ? backendRequest<TrustVerificationResult>(trustPath("refreshSource", { source }), "POST", {}) : apiPost<TrustVerificationResult>(trustPath("refreshSource", { source }), {});
}

export function disconnectTrustSource(source: string): Promise<TrustVerificationResult> {
  return TRUST_AUTHORITY_API ? backendRequest<TrustVerificationResult>(trustPath("disconnectSource", { source }), "POST", {}) : apiPost<TrustVerificationResult>(trustPath("disconnectSource", { source }), {});
}

export function connectTrustSource(source: string): Promise<TrustVerificationResult> {
  return TRUST_AUTHORITY_API ? backendRequest<TrustVerificationResult>(trustPath("verifySource", { source }), "POST", {}) : apiPost<TrustVerificationResult>(trustPath("verifySource", { source }), {});
}

export function createTrustDomainChallenge(input: Record<string, unknown> = {}) { return backendRequest<Record<string, unknown>>(trustPath("domainChallenge"), "POST", input); }
export function verifyTrustDomainChallenge(challengeId: string) { return backendRequest<Record<string, unknown>>(trustPath("domainChallengeVerify", { challengeId }), "POST", {}); }
export function fetchFounderTrustAccessRequests() { return backendRequest<{ ok: boolean; requests: FounderTrustAccessRequest[] }>(`${trustPath("founderAccessRequests")}?status=pending`, "GET"); }
export function decideFounderTrustAccessRequest(requestId: string, decision: "approved" | "rejected", note = "") { return backendRequest<{ ok: boolean; request: FounderTrustAccessRequest }>(trustPath("founderAccessDecision", { requestId }), "POST", { decision, note }); }

export function previewTrustNotifications(events: Array<Record<string, unknown>>): Promise<TrustNotificationPreview> {
  return apiPost<TrustNotificationPreview>(trustPath("notificationsPreview"), { events });
}

export function previewTrustShare(input: Record<string, unknown> = {}) {
  return apiPost<Record<string, unknown>>(trustPath("shareProfilePreview"), input);
}

export function verifyTrustAdapter(provider: string, input: Record<string, unknown> = {}) {
  return apiPost<TrustVerificationResult>(trustPath("adapterVerify", { provider }), input);
}

export function createTrustRefreshPlan(connections: Array<Record<string, unknown>>) {
  return apiPost<Record<string, unknown>>(trustPath("refreshPlan"), { connections });
}

export function runContinuousTrustVerification(input: { connections?: Array<Record<string, unknown>>; adapter_payloads?: Record<string, unknown>; execute?: boolean } = {}) {
  return apiPost<Record<string, unknown>>(trustPath("continuousVerification"), input);
}

// --- WS7 outcomes / milestone attestation (node-local) ---
// Evidence is uploaded, scanned, and hashed before a milestone can be reviewed;
// only third-party attestation (e-sign / letter / notary) reaches full weight.
export function fetchMilestones() {
  return backendRequest<{ ok: boolean; milestones: Array<Record<string, unknown>> }>(trustPath("milestoneList"), "GET");
}

export function createMilestoneEvidenceUpload(contentType: string, sizeBytes: number) {
  return backendRequest<{ ok: boolean; evidence: { id: string; status: string }; uploadUrl: string; requiredHeaders: Record<string, string> }>(trustPath("milestoneEvidenceUpload"), "POST", { contentType, sizeBytes });
}

export function finalizeMilestoneEvidence(evidenceId: string) {
  return backendRequest<{ ok: boolean; evidence: { id: string; status: string; sha256?: string } }>(trustPath("milestoneEvidenceFinalize", { evidenceId }), "POST", {});
}

export function submitTrustMilestone(input: Record<string, unknown>) {
  return backendRequest<TrustVerificationResult>(trustPath("milestoneSubmit"), "POST", input);
}

export function reviewTrustMilestone(input: Record<string, unknown>) {
  return backendRequest<Record<string, unknown>>(trustPath("milestoneReview"), "POST", input);
}

// --- WS8 founder identity / KYC + sanctions screening ---
// KYC/registry verification is server-observed and node-local; running a
// screening appends an append-only result row.
export function connectIdentityCredential(provider: string, credential: string, subject?: string) {
  return backendRequest<{ ok: boolean; kind: string; credential: RevenueCredentialDescriptor }>(trustPath("identityConnect"), "POST", subject ? { provider, credential, subject } : { provider, credential });
}

export function fetchIdentityCredentials() {
  return backendRequest<{ ok: boolean; credentials: RevenueCredentialDescriptor[] }>(trustPath("identityCredentials"), "GET");
}

export function fetchIdentity() {
  return backendRequest<{ ok: boolean; verifications: Array<Record<string, unknown>>; screening: Array<Record<string, unknown>>; screening_due: boolean; rescreen_days: number }>(trustPath("identityList"), "GET");
}

export function verifyIdentityKyc(provider: string, reference: string, country?: string) {
  return backendRequest<TrustVerificationResult>(trustPath("identityVerify"), "POST", country ? { provider, reference, country } : { provider, reference });
}

export function verifyIdentityRegistry(provider: string, companyNumber: string, founderName: string) {
  return backendRequest<TrustVerificationResult>(trustPath("identityRegistryVerify"), "POST", { provider, companyNumber, founderName });
}

export function runIdentityScreening(provider: string, name: string, country?: string) {
  return backendRequest<Record<string, unknown>>(trustPath("identityScreeningRun"), "POST", country ? { provider, name, country } : { provider, name });
}

export function fetchIdentityScreening() {
  return backendRequest<{ ok: boolean; screening: Array<Record<string, unknown>> }>(trustPath("identityScreeningList"), "GET");
}

export function disconnectIdentityCredential(provider: string) {
  return backendRequest<Record<string, unknown>>(trustPath("identityDisconnect", { provider }), "DELETE");
}

export function inviteTrustTeamMember(input: Record<string, unknown>) {
  return apiPost<Record<string, unknown>>(trustPath("teamInvite"), input);
}

export function verifyTrustTeamMember(input: Record<string, unknown>) {
  return apiPost<Record<string, unknown>>(trustPath("teamVerify"), input);
}

// --- WS3 revenue verification ---
// `connectRevenueCredential` stores a founder read-only key (encrypted at rest);
// it never mints a proof. `verifyRevenueSource` triggers the server-observed
// read and is the only path that can create a verified revenue proof.
export interface RevenueCredentialDescriptor {
  provider: string;
  scopes: string[];
  mode: string | null;
  stored: boolean;
  created_at?: string | null;
  last_synced_at?: string | null;
  secret_stored: boolean;
  raw_payload_stored: boolean;
}

export function connectRevenueCredential(provider: string, credential: string) {
  return backendRequest<{ ok: boolean; credential: RevenueCredentialDescriptor }>(trustPath("revenueConnect"), "POST", { provider, credential });
}

export function fetchRevenueCredentials() {
  return backendRequest<{ ok: boolean; credentials: RevenueCredentialDescriptor[] }>(trustPath("revenueCredentials"), "GET");
}

export function verifyRevenueSource(provider: string) {
  return backendRequest<Record<string, unknown>>(trustPath("revenueVerify"), "POST", { provider });
}

export function disconnectRevenueSource(provider: string) {
  return backendRequest<Record<string, unknown>>(trustPath("revenueDisconnect", { provider }), "DELETE");
}

// --- WS4 product analytics verification ---
// Provider-observed MAU/DAU/retention only; `connectAnalyticsCredential` stores
// an encrypted read-only key (plus the project/property id) and never mints a proof.
export function connectAnalyticsCredential(provider: string, credential: string, subject?: string) {
  return backendRequest<{ ok: boolean; credential: RevenueCredentialDescriptor }>(trustPath("analyticsConnect"), "POST", subject ? { provider, credential, subject } : { provider, credential });
}

export function fetchAnalyticsCredentials() {
  return backendRequest<{ ok: boolean; credentials: RevenueCredentialDescriptor[] }>(trustPath("analyticsCredentials"), "GET");
}

export function verifyAnalyticsSource(provider: string) {
  return backendRequest<Record<string, unknown>>(trustPath("analyticsVerify"), "POST", { provider });
}

export function disconnectAnalyticsSource(provider: string) {
  return backendRequest<Record<string, unknown>>(trustPath("analyticsDisconnect", { provider }), "DELETE");
}

// --- WS5 shipping / deployment cadence verification ---
// Provider-observed deploy/PR/release cadence only; `connectShippingCredential`
// stores an encrypted read-only token (plus the repo/service/site id) and never
// mints a proof. The verified proof carries cadence metrics, not raw payloads.
export function connectShippingCredential(provider: string, credential: string, subject?: string) {
  return backendRequest<{ ok: boolean; credential: RevenueCredentialDescriptor }>(trustPath("shippingConnect"), "POST", subject ? { provider, credential, subject } : { provider, credential });
}

export function fetchShippingCredentials() {
  return backendRequest<{ ok: boolean; credentials: RevenueCredentialDescriptor[] }>(trustPath("shippingCredentials"), "GET");
}

export function verifyShippingSource(provider: string) {
  return backendRequest<Record<string, unknown>>(trustPath("shippingVerify"), "POST", { provider });
}

export function disconnectShippingSource(provider: string) {
  return backendRequest<Record<string, unknown>>(trustPath("shippingDisconnect", { provider }), "DELETE");
}

// --- WS6 team / work-email / registry / HRIS verification ---
// Work-email proofs require a domain the founder already verified; registry and
// HRIS reads are server-observed aggregates (roles/headcount only, no PII).
export function requestTeamWorkEmailChallenge(email: string, role?: string) {
  return backendRequest<{ ok: boolean; challenge: Record<string, unknown>; dev_code?: string }>(trustPath("teamWorkEmailChallenge"), "POST", role ? { email, role } : { email });
}

export function verifyTeamWorkEmailChallenge(challengeId: string, code: string) {
  return backendRequest<Record<string, unknown>>(trustPath("teamWorkEmailVerify"), "POST", { challengeId, code });
}

export function connectTeamCredential(kind: "registry" | "hris", provider: string, credential: string, subject?: string) {
  return backendRequest<{ ok: boolean; credential: RevenueCredentialDescriptor }>(trustPath("teamConnect"), "POST", subject ? { kind, provider, credential, subject } : { kind, provider, credential });
}

export function fetchTeamCredentials() {
  return backendRequest<{ ok: boolean; credentials: RevenueCredentialDescriptor[] }>(trustPath("teamCredentials"), "GET");
}

export function verifyTeamRegistrySource(provider: string, input?: { companyNumber?: string; subject?: string; founderName?: string }) {
  return backendRequest<Record<string, unknown>>(trustPath("teamRegistryVerify"), "POST", { provider, ...(input || {}) });
}

export function verifyTeamHrisSource(provider: string) {
  return backendRequest<Record<string, unknown>>(trustPath("teamHrisVerify"), "POST", { provider });
}

export function disconnectTeamCredential(provider: string) {
  return backendRequest<Record<string, unknown>>(trustPath("teamDisconnect", { provider }), "DELETE");
}

// --- WS9 manual overrides + re-verification (admin / founder-visible) ---
// Overrides are admin-only and always reason-coded + time-boxed; the founder
// Trust Center only reads them (surfaced through the profile breakdown as
// `manual_override`). The reverification-due view is a read-only preview of
// proofs/skills whose TTL has lapsed.
export interface TrustOverrideRecord {
  id: string;
  userId: string;
  delta: number;
  reasonCode: string;
  source?: string | null;
  projectId?: string | null;
  note?: string | null;
  expiresAt?: string | null;
  adminId?: string;
  revokedAt?: string | null;
  revokedBy?: string | null;
  createdAt?: string;
}

export interface TrustReverificationDue {
  now: string;
  due_proof_count: number;
  due_skill_count: number;
  sources: string[];
}

export function fetchTrustReverificationDue() {
  return backendRequest<TrustReverificationDue>(trustPath("reverificationDue"), "GET");
}

export function applyTrustOverride(input: { userId: string; delta: number; reasonCode: string; expiresAt: string; note?: string; source?: string }) {
  return backendRequest<{ ok: boolean; override: TrustOverrideRecord; score?: Record<string, unknown> }>(trustPath("overrideApply"), "POST", input);
}

export function fetchUserTrustOverrides(userId: string) {
  return backendRequest<{ ok: boolean; overrides: TrustOverrideRecord[] }>(trustPath("overrideList", { userId }), "GET");
}

export function revokeTrustOverride(userId: string, overrideId: string) {
  return backendRequest<{ ok: boolean; override: TrustOverrideRecord; score?: Record<string, unknown> }>(trustPath("overrideRevoke", { userId, overrideId }), "DELETE");
}
