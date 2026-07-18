import { apiGet, apiPost } from "./client";

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

export function fetchTrustProfile(): Promise<TrustProfile> {
  return apiGet<TrustProfile>("/trust/profile");
}

export function fetchTrustBadges(): Promise<{ badges: TrustBadge[]; active_badges?: string[]; privacy?: string }> {
  return apiGet<{ badges: TrustBadge[]; active_badges?: string[]; privacy?: string }>("/trust/badges");
}

export function fetchTrustHistory(limit = 25): Promise<{ history: TrustHistoryItem[]; append_only?: boolean; privacy?: string }> {
  return apiGet<{ history: TrustHistoryItem[]; append_only?: boolean; privacy?: string }>(`/trust/history?limit=${limit}`);
}

export function fetchTrustIntegrations(): Promise<{ integrations: TrustIntegrationManifest[]; privacy?: Record<string, unknown> }> {
  return apiGet<{ integrations: TrustIntegrationManifest[]; privacy?: Record<string, unknown> }>("/trust/integrations");
}

export function refreshTrustSource(source: string): Promise<TrustVerificationResult> {
  return apiPost<TrustVerificationResult>(`/trust/refresh/${encodeURIComponent(source)}`, {});
}

export function disconnectTrustSource(source: string): Promise<TrustVerificationResult> {
  return apiPost<TrustVerificationResult>(`/trust/disconnect/${encodeURIComponent(source)}`, {});
}

export function previewTrustNotifications(events: Array<Record<string, unknown>>): Promise<TrustNotificationPreview> {
  return apiPost<TrustNotificationPreview>("/trust/notifications/preview", { events });
}
