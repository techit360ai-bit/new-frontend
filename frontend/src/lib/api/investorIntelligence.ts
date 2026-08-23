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
export const fetchInvestorIntelligenceOverview = () => apiGet<Partial<InvestorIntelligenceOverview>>("/investor-intelligence/overview").then((data): InvestorIntelligenceOverview => ({
  portfolio: {
    total: Number(data.portfolio?.total) || 0,
    healthy: Number(data.portfolio?.healthy) || 0,
    onTrack: Number(data.portfolio?.onTrack) || 0,
    highRisk: Number(data.portfolio?.highRisk) || 0,
  },
  startups: Array.isArray(data.startups) ? data.startups : [],
  changes: Array.isArray(data.changes) ? data.changes : [],
  generatedAt: data.generatedAt || "",
  deterministic: data.deterministic !== false,
}));
export const fetchInvestorIntelligenceAdvisory = (scope = "portfolio") => apiGet<InvestorAdvisoryResponse>(`/investor-intelligence/advisory/${encodeURIComponent(scope)}`);
export interface InvestorAlert { id: string; startupId: string; name: string; severity: string; title: string; evidence: string[]; recommendedAction: string; createdAt: string }
export interface InvestorReport { id: string; type: string; generatedAt: string; summary: Record<string, unknown>; deterministic: boolean }
export const fetchInvestorAlerts = () => apiGet<{ alerts?: InvestorAlert[]; generatedAt?: string; deterministic?: boolean }>("/investor-intelligence/alerts").then((data) => ({ alerts: Array.isArray(data.alerts) ? data.alerts : [], generatedAt: data.generatedAt || "", deterministic: data.deterministic !== false }));
export const fetchInvestorReports = () => apiGet<{ reports?: InvestorReport[]; deterministic?: boolean }>("/investor-intelligence/reports").then((data) => ({ reports: Array.isArray(data.reports) ? data.reports : [], deterministic: data.deterministic !== false }));
export const fetchInvestorStartupIntelligence = (startupId: string) => apiGet<{ startup: InvestorIntelligenceStartup; deterministic: boolean }>(`/investor-intelligence/startups/${encodeURIComponent(startupId)}`);
