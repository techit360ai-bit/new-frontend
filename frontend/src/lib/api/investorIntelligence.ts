import { apiGet } from "./client";

export interface InvestorIntelligenceStartup {
  startupId: string; name: string; sector: string; health: number | null; executionVelocity: number | null;
  milestoneProgress: number | null; founderEngagement: number | null; consistency: number | null; readiness: number | null;
  riskLevel: "low" | "moderate" | "high" | "unknown"; daysInactive: number | null;
  mentorship: { rooms: number; activeMentees: number; tasks: number; completedTasks: number; completion: number | null };
  milestones: { total: number; completed: number; overdue: number }; evidence: string[]; lastMeaningfulAt: string | null;
}
export interface InvestorIntelligenceOverview { portfolio: { total: number; healthy: number; onTrack: number; highRisk: number }; startups: InvestorIntelligenceStartup[]; changes: Array<{ startupId: string; name: string; type: string; summary: string; severity: string }>; generatedAt: string; deterministic: boolean }
export interface InvestorAdvisoryResponse { advisory: unknown; evidence: { scope: string; startups: InvestorIntelligenceStartup[] }; deterministic: boolean; aiAvailable: boolean; advisoryOnly: boolean }
export const fetchInvestorIntelligenceOverview = () => apiGet<InvestorIntelligenceOverview>("/investor-intelligence/overview");
export const fetchInvestorIntelligenceAdvisory = (scope = "portfolio") => apiGet<InvestorAdvisoryResponse>(`/investor-intelligence/advisory/${encodeURIComponent(scope)}`);
export interface InvestorAlert { id: string; startupId: string; name: string; severity: string; title: string; evidence: string[]; recommendedAction: string; createdAt: string }
export interface InvestorReport { id: string; type: string; generatedAt: string; summary: Record<string, unknown>; deterministic: boolean }
export const fetchInvestorAlerts = () => apiGet<{ alerts: InvestorAlert[]; generatedAt: string; deterministic: boolean }>("/investor-intelligence/alerts");
export const fetchInvestorReports = () => apiGet<{ reports: InvestorReport[]; deterministic: boolean }>("/investor-intelligence/reports");
export const fetchInvestorStartupIntelligence = (startupId: string) => apiGet<{ startup: InvestorIntelligenceStartup; deterministic: boolean }>(`/investor-intelligence/startups/${encodeURIComponent(startupId)}`);
