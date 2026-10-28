import { apiGet, apiPost } from "./client";

export type TrustHealth = "excellent" | "good" | "needs_attention";
export type TrustVerificationState = "verified" | "pending" | "expired" | "failed" | "disconnected";

export interface InvestorTrustStartupSummary {
  startupId: string;
  name: string;
  logoText: string;
  industry: string;
  country: string;
  stage: string;
  fundingStage: string;
  overallStatus: string;
  verificationHealth: TrustHealth;
  confidence: number;
  lastVerified: string;
  evidenceSourcesConnected: number;
  activeBadges: string[];
  watchlistIncluded: boolean;
  trustTrend: "improving" | "stable" | "needs_attention";
}

export interface InvestorTrustPrivacy {
  metadataOnly: boolean;
  approvedEvidenceOnly: boolean;
  rawPayloadsExposed: boolean;
  customerDataExposed: boolean;
  sourceCodeExposed: boolean;
  investorNotesPrivate: boolean;
  founderVisible: boolean;
}

export interface InvestorTrustDashboardList {
  startups: InvestorTrustStartupSummary[];
  watchlistStartupIds: string[];
  privacy: InvestorTrustPrivacy;
}

export interface TrustBadgeDetail {
  badgeType: string;
  label: string;
  source: string;
  status: TrustVerificationState;
  confidence: number;
  lastUpdated: string;
  expiresAt?: string;
}

export interface VerificationItem {
  label: string;
  source: string;
  provider: string;
  status: TrustVerificationState;
  confidence: number;
  lastUpdated: string;
  freshness: string;
  action?: string;
}

export interface FounderProfessionalSummary {
  founders: number;
  verificationStatus: string;
  professionalProfilesConnected: number;
  githubConnected: boolean;
  linkedinConnected: boolean;
  companyEmailVerified: boolean;
  yearsBuildingStartup: number;
  previousVentures?: string;
  responseRate: string;
}

export interface ProductDevelopmentSummary {
  developmentStatus: string;
  repositoryConnected: boolean;
  recentActivity: string;
  contributorsVerified: number;
  deploymentFrequency: string;
  latestDeployment: string;
  developmentConsistency: string;
  activityTrend: Array<{ label: string; activity: number; deployments: number }>;
}

export interface ProductVerificationSummary {
  productStatus: string;
  websiteVerified: boolean;
  deploymentsVerified: boolean;
  latestDeployment: string;
  supportedPlatforms: string[];
  verificationFreshness: string;
}

export interface ProductActivitySummary {
  monthlyActiveUsers: string;
  dailyActiveUsers: string;
  growthTrend: string;
  retention: string;
  dataFreshness: string;
}

export interface TeamTrustSummary {
  teamMembers: number;
  verifiedMembers: number;
  pendingVerification: number;
  averageVerificationAge: string;
  technicalContributors: number;
  activeThisMonth: boolean;
}

export interface TrustTimelineEvent {
  id: string;
  when: string;
  title: string;
  source: string;
  status: TrustVerificationState | "approved";
  confidence: number;
}

export interface ApprovedMilestone {
  id: string;
  title: string;
  status: "verified" | "pending_review";
  evidence: string;
  approvalDate?: string;
  verifier?: string;
}

export interface VerificationSourceSummary {
  label: string;
  status: TrustVerificationState;
  origin: string;
  lastSync: string;
}

export interface RiskStatusSummary {
  verificationFreshness: string;
  missingIntegrations: number;
  expiredVerification: string;
  recentVerificationFailures: string;
  trustTrend: string;
  issues: Array<{ title: string; detail: string; lastSync: string }>;
}

export interface ContinuousVerificationSummary {
  status: "running" | "paused";
  lastVerification: string;
  nextVerification: string;
  connectedServices: number;
  successRate: string;
}

export interface InvestmentReadinessSnapshot {
  founderVerified: boolean;
  organizationVerified: boolean;
  productLive: boolean;
  developmentActive: boolean;
  teamVerifiedPct: number;
  operationalEvidence: string;
  verificationFreshness: string;
}

export interface EvidenceExplorerItem {
  id: string;
  metric: string;
  status: TrustVerificationState;
  evidenceSource: string;
  verifiedAt: string;
  confidence: number;
  details: string;
}

export interface InvestorTrustNote {
  note: string;
  internalRating: "watch" | "priority" | "pass" | "none";
  followUpReminder: string;
  checklist: Array<{ item: string; done: boolean }>;
  bookmarked: boolean;
}

export interface InvestorTrustDashboard {
  startup: InvestorTrustStartupSummary & {
    founded: string;
    website: string;
    verifiedStatus: string;
  };
  trustSummary: {
    overallStatus: string;
    verificationConfidence: number;
    verificationFreshness: string;
    evidenceSources: number;
    verificationHealth: string;
  };
  badges: TrustBadgeDetail[];
  verificationItems: VerificationItem[];
  founderOverview: FounderProfessionalSummary;
  productDevelopment: ProductDevelopmentSummary;
  productVerification: ProductVerificationSummary;
  productActivity: ProductActivitySummary;
  teamOverview: TeamTrustSummary;
  timeline: TrustTimelineEvent[];
  milestones: ApprovedMilestone[];
  verificationSources: VerificationSourceSummary[];
  riskStatus: RiskStatusSummary;
  continuousVerification: ContinuousVerificationSummary;
  investmentReadiness: InvestmentReadinessSnapshot;
  evidenceExplorer: EvidenceExplorerItem[];
  investorNotes: InvestorTrustNote;
  privacy: InvestorTrustPrivacy;
}

export function fetchInvestorTrustStartups(): Promise<InvestorTrustDashboardList> {
  return apiGet<InvestorTrustDashboardList>("/investor/trust/startups");
}

export function fetchInvestorTrustDashboard(startupId: string): Promise<InvestorTrustDashboard> {
  return apiGet<InvestorTrustDashboard>(`/investor/trust/${encodeURIComponent(startupId)}`);
}

export function saveInvestorTrustNotes(
  startupId: string,
  notes: InvestorTrustNote,
): Promise<{ ok: boolean; investorNotes: InvestorTrustNote }> {
  return apiPost<{ ok: boolean; investorNotes: InvestorTrustNote }>(
    `/investor/trust/${encodeURIComponent(startupId)}/notes`,
    notes,
  );
}
