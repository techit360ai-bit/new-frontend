// frontend/src/lib/api/trust.ts
//
// Trust Engine Lite client. These calls hit ai-router /api/v1/trust/* and
// keep the frontend aligned with the metadata-only Trust contracts.

import { apiGet, apiPost, withFallback } from "./client";

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

const FALLBACK_PROFILE: TrustProfile = {
  verification_status: "pending",
  trust_score: 57.5,
  tier: "Partially Verified",
  confidence_score: 0.575,
  badges: ["Verified Founder", "Verified Domain", "Active Development"],
  signals: ["email_verified", "domain_verified", "github_connected"],
  breakdown: {
    email_verified: 10,
    domain_verified: 15,
    github_connected: 20,
    product_users: 2.5,
    team_verified: 10,
  },
  last_sync_at: "2026-07-04T08:00:00",
  computed_at: "2026-07-05T08:00:00",
  privacy: {
    metadata_only: true,
    raw_payload_stored: false,
    secrets_stored: false,
    history_append_only: true,
  },
};

const FALLBACK_BADGES: TrustBadge[] = [
  {
    badge_type: "verified_founder",
    label: "Verified Founder",
    source: "email",
    status: "verified",
    issued_at: "2026-07-01T08:00:00",
    expires_at: "2027-07-01T08:00:00",
    active: true,
  },
  {
    badge_type: "verified_domain",
    label: "Verified Domain",
    source: "domain",
    status: "verified",
    issued_at: "2026-07-01T08:00:00",
    expires_at: "2026-09-29T08:00:00",
    active: true,
  },
  {
    badge_type: "active_development",
    label: "Active Development",
    source: "github",
    status: "expired",
    issued_at: "2026-06-01T08:00:00",
    expires_at: "2026-07-04T08:00:00",
    active: false,
  },
];

const FALLBACK_HISTORY: TrustHistoryItem[] = [
  {
    verification_id: "trust_demo_email",
    source: "email",
    status: "verified",
    confidence: 1,
    metadata_hash: "demo-email-hash",
    event_type: "email_verified",
    expires_at: "2027-07-01T08:00:00",
    created_at: "2026-07-01T08:00:00",
  },
  {
    verification_id: "trust_demo_github",
    source: "github",
    status: "expired",
    confidence: 0.4,
    metadata_hash: "demo-github-hash",
    event_type: "github_expired",
    expires_at: "2026-07-04T08:00:00",
    created_at: "2026-06-04T08:00:00",
  },
];

const FALLBACK_INTEGRATIONS: TrustIntegrationManifest[] = [
  {
    provider: "github",
    source: "github",
    display_name: "GitHub",
    auth_method: "oauth2",
    scopes: ["read-only metadata"],
    sync_frequency_seconds: 86400,
    stored_fields: ["github_repo_count", "github_commit_count", "github_contributor_count", "github_last_activity_at"],
    forbidden_fields: ["source_code", "repository_contents", "oauth_token"],
    access_description: "Read repository metadata counts and last public activity only.",
    storage_description: "Stores repo count, commit count, contributor count, last activity, and confidence only.",
    token_policy: "Store only an encrypted secret-manager reference; never expose tokens to clients.",
    revocation_supported: true,
    manual_reverification_supported: true,
    raw_payload_stored: false,
  },
  {
    provider: "domain",
    source: "domain",
    display_name: "Domain",
    auth_method: "dns_or_site_challenge",
    scopes: ["dns txt", "meta tag", "verification file"],
    sync_frequency_seconds: 604800,
    stored_fields: ["domain", "method", "verified", "verified_at", "expires_at", "confidence"],
    forbidden_fields: ["dns_records", "website_snapshot"],
    access_description: "Check DNS TXT, meta tag, or verification file challenge result.",
    storage_description: "Stores domain, verification method, status, verification time, expiry, and confidence only.",
    token_policy: "No plaintext secrets or frontend tokens.",
    revocation_supported: true,
    manual_reverification_supported: true,
    raw_payload_stored: false,
  },
  {
    provider: "team",
    source: "team",
    display_name: "Team",
    auth_method: "member_invitation",
    scopes: ["team verification status"],
    sync_frequency_seconds: 2592000,
    stored_fields: ["verified_team_count", "pending_invitations", "verified", "confidence"],
    forbidden_fields: ["employment_contracts", "salary", "payroll", "hr_record"],
    access_description: "Read teammate verification status only.",
    storage_description: "Stores verified teammate count, pending invitation count, and confidence only.",
    token_policy: "No teammate raw email is exposed to investors.",
    revocation_supported: true,
    manual_reverification_supported: true,
    raw_payload_stored: false,
  },
];

const FALLBACK_PREVIEW: TrustNotificationPreview = {
  notification_intents: [
    {
      notification_id: "trust_note_demo_github",
      notification_type: "trust_verification_expired",
      source: "github",
      severity: "critical",
      message: "A Trust verification expired and needs refresh.",
      action_required: true,
      created_at: "2026-07-05T08:00:00",
      founder_visible: true,
      investor_visible: false,
      raw_payload_stored: false,
    },
  ],
  summary: {
    events_seen: 1,
    notifications_prepared: 1,
  },
  dropped_fields: [],
  privacy: {
    metadata_only: true,
    founder_notifications_only: true,
    investor_notifications: false,
    delivery_executed: false,
    raw_payload_stored: false,
  },
  owner_ids_exposed_to_investors: false,
};

export function fetchTrustProfile(): Promise<TrustProfile> {
  return withFallback(
    () => apiGet<TrustProfile>("/trust/profile"),
    FALLBACK_PROFILE,
    "trust profile",
  );
}

export function fetchTrustBadges(): Promise<{ badges: TrustBadge[]; active_badges?: string[]; privacy?: string }> {
  return withFallback(
    () => apiGet<{ badges: TrustBadge[]; active_badges?: string[]; privacy?: string }>("/trust/badges"),
    { badges: FALLBACK_BADGES, active_badges: FALLBACK_BADGES.filter((b) => b.active).map((b) => b.label) },
    "trust badges",
  );
}

export function fetchTrustHistory(limit = 25): Promise<{ history: TrustHistoryItem[]; append_only?: boolean; privacy?: string }> {
  return withFallback(
    () => apiGet<{ history: TrustHistoryItem[]; append_only?: boolean; privacy?: string }>(`/trust/history?limit=${limit}`),
    { history: FALLBACK_HISTORY, append_only: true },
    "trust history",
  );
}

export function fetchTrustIntegrations(): Promise<{ integrations: TrustIntegrationManifest[]; privacy?: Record<string, unknown> }> {
  return withFallback(
    () => apiGet<{ integrations: TrustIntegrationManifest[]; privacy?: Record<string, unknown> }>("/trust/integrations"),
    { integrations: FALLBACK_INTEGRATIONS, privacy: { metadata_only: true, raw_payload_stored: false, tokens_exposed_to_frontend: false } },
    "trust integrations",
  );
}

export function refreshTrustSource(source: string): Promise<TrustVerificationResult> {
  return withFallback(
    () => apiPost<TrustVerificationResult>(`/trust/refresh/${encodeURIComponent(source)}`, {}),
    () => ({
      source,
      status: "pending",
      confidence: 0.5,
      metadata_hash: "fallback-refresh-hash",
      raw_payload_stored: false,
      persisted: false,
      next_action: "Verification pending.",
    }),
    `refresh ${source}`,
  );
}

export function disconnectTrustSource(source: string): Promise<TrustVerificationResult> {
  return withFallback(
    () => apiPost<TrustVerificationResult>(`/trust/disconnect/${encodeURIComponent(source)}`, {}),
    () => ({
      source,
      status: "disconnected",
      confidence: 0,
      metadata_hash: "fallback-disconnect-hash",
      raw_payload_stored: false,
      persisted: false,
      next_action: "Integration disconnected. Existing history remains append-only.",
    }),
    `disconnect ${source}`,
  );
}

export function previewTrustNotifications(events: Array<Record<string, unknown>>): Promise<TrustNotificationPreview> {
  return withFallback(
    () => apiPost<TrustNotificationPreview>("/trust/notifications/preview", { events }),
    FALLBACK_PREVIEW,
    "trust notifications preview",
  );
}
