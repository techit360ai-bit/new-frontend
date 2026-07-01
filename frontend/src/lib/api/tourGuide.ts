import { apiPost, withFallback } from "./client";

export type TourGuideRole = "founder" | "collaborator";

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
