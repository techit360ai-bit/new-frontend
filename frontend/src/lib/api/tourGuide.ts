import { apiPost, withFallback } from "./client";

export type TourGuideRole = "founder" | "collaborator" | "explorer";

export interface TourGuideTaskSnapshot {
  id: string;
  title: string;
  completed: boolean;
  estimatedMinutes: number;
}

export interface TourGuideCheckInPayload {
  source: "havi";
  role: TourGuideRole;
  firstLanding: boolean;
  route?: string;
  profile: Record<string, unknown>;
  mvp: {
    targetDate: string;
    daysRemaining: number;
    overdue: boolean;
    completionPercentage: number;
  };
  tasks: TourGuideTaskSnapshot[];
}

export interface TourGuideCheckIn {
  momentum_score?: number | null;
  decay_factor?: number | null;
  daily_plan?: unknown;
  ai_insights?: unknown;
  alerts?: unknown;
  stagnation_risk?: boolean;
  introduction?: {
    title: string;
    summary: string;
    capabilities: Array<{ title: string; description: string; path: string }>;
  } | null;
}

export function fetchTourGuideCheckIn(
  payload: TourGuideCheckInPayload,
): Promise<TourGuideCheckIn | null> {
  return withFallback(
    () => apiPost<TourGuideCheckIn>("/tour-guide/daily-check-in", payload),
    () => null,
    "tour guide check-in",
  );
}

export interface TourGuideConversationResponse {
  message: string;
  model_used?: string | null;
  provider?: string | null;
  context_injected?: boolean;
}

export function converseWithHavi(payload: {
  source: "havi";
  role: TourGuideRole;
  route?: string;
  profile: Record<string, unknown>;
  conversation: Array<{ role: "user" | "assistant"; content: string }>;
  message: string;
}): Promise<TourGuideConversationResponse | null> {
  return withFallback(
    () => apiPost<TourGuideConversationResponse>("/tour-guide/conversation", payload),
    () => null,
    "havi conversation",
  );
}
