// frontend/src/lib/api/investorTrust.ts
//
// Investor-safe Trust Engine read model. This contract is intentionally separate
// from founder Trust APIs: it exposes verified metadata, freshness, confidence,
// aggregate activity, approved evidence, and private investor notes only.

import { apiGet, apiPost, withFallback } from "./client";

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

export interface InvestorTrustDashboardList {
  startups: InvestorTrustStartupSummary[];
  watchlistStartupIds: string[];
  privacy: InvestorTrustPrivacy;
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

export const FALLBACK_INVESTOR_TRUST_LIST: InvestorTrustDashboardList = {
  watchlistStartupIds: ["1", "2", "3", "4"],
  privacy: {
    metadataOnly: true,
    approvedEvidenceOnly: true,
    rawPayloadsExposed: false,
    customerDataExposed: false,
    sourceCodeExposed: false,
    investorNotesPrivate: true,
    founderVisible: false,
  },
  startups: [
    {
      startupId: "1",
      name: "QuantumAPI",
      logoText: "QA",
      industry: "SaaS",
      country: "United States",
      stage: "Beta",
      fundingStage: "Seed",
      overallStatus: "Verified",
      verificationHealth: "excellent",
      confidence: 96,
      lastVerified: "2 hours ago",
      evidenceSourcesConnected: 7,
      activeBadges: ["Verified Founder", "Verified Organization", "Domain Verified", "Product Live", "Active Development", "Team Verified"],
      watchlistIncluded: true,
      trustTrend: "improving",
    },
    {
      startupId: "2",
      name: "NeuralEdge AI",
      logoText: "NE",
      industry: "AI/ML",
      country: "United Kingdom",
      stage: "Launch",
      fundingStage: "Series A",
      overallStatus: "Verified",
      verificationHealth: "excellent",
      confidence: 98,
      lastVerified: "12 minutes ago",
      evidenceSourcesConnected: 8,
      activeBadges: ["Verified Founder", "Verified Organization", "Domain Verified", "Product Live", "Active Development", "Team Verified"],
      watchlistIncluded: true,
      trustTrend: "improving",
    },
    {
      startupId: "3",
      name: "FinFlow",
      logoText: "FF",
      industry: "FinTech",
      country: "Singapore",
      stage: "MVP",
      fundingStage: "Pre-seed",
      overallStatus: "Partially Verified",
      verificationHealth: "good",
      confidence: 84,
      lastVerified: "1 day ago",
      evidenceSourcesConnected: 5,
      activeBadges: ["Verified Founder", "Domain Verified", "Product Live"],
      watchlistIncluded: true,
      trustTrend: "stable",
    },
    {
      startupId: "4",
      name: "BioSynth",
      logoText: "BS",
      industry: "BioTech",
      country: "France",
      stage: "Beta",
      fundingStage: "Seed",
      overallStatus: "Verified",
      verificationHealth: "good",
      confidence: 91,
      lastVerified: "6 hours ago",
      evidenceSourcesConnected: 6,
      activeBadges: ["Verified Founder", "Verified Organization", "Product Live", "Team Verified"],
      watchlistIncluded: true,
      trustTrend: "stable",
    },
    {
      startupId: "5",
      name: "CloudMesh",
      logoText: "CM",
      industry: "Infrastructure",
      country: "United States",
      stage: "Launch",
      fundingStage: "Seed",
      overallStatus: "Verified",
      verificationHealth: "excellent",
      confidence: 95,
      lastVerified: "45 minutes ago",
      evidenceSourcesConnected: 7,
      activeBadges: ["Verified Founder", "Domain Verified", "Product Live", "Active Development", "Team Verified"],
      watchlistIncluded: false,
      trustTrend: "improving",
    },
    {
      startupId: "6",
      name: "DataVault",
      logoText: "DV",
      industry: "Security",
      country: "Germany",
      stage: "Beta",
      fundingStage: "Seed",
      overallStatus: "Verified",
      verificationHealth: "needs_attention",
      confidence: 78,
      lastVerified: "18 days ago",
      evidenceSourcesConnected: 5,
      activeBadges: ["Verified Founder", "Verified Organization", "Domain Verified"],
      watchlistIncluded: false,
      trustTrend: "needs_attention",
    },
  ],
};

const defaultNotes: InvestorTrustNote = {
  note: "Track verification freshness before scheduling next diligence call.",
  internalRating: "watch",
  followUpReminder: "Follow up next week",
  checklist: [
    { item: "Review verification sources", done: true },
    { item: "Check milestone evidence", done: true },
    { item: "Confirm continuous verification status", done: false },
    { item: "Add partner notes", done: false },
  ],
  bookmarked: true,
};

export function fallbackInvestorTrustDashboard(startupId = "1"): InvestorTrustDashboard {
  const startup =
    FALLBACK_INVESTOR_TRUST_LIST.startups.find((item) => item.startupId === startupId)
    ?? FALLBACK_INVESTOR_TRUST_LIST.startups[0];
  const needsAttention = startup.verificationHealth === "needs_attention";

  return {
    startup: {
      ...startup,
      founded: startup.startupId === "2" ? "2023" : "2024",
      website: `https://${startup.name.toLowerCase().replace(/[^a-z0-9]+/g, "")}.com`,
      verifiedStatus: startup.overallStatus,
    },
    trustSummary: {
      overallStatus: startup.overallStatus,
      verificationConfidence: startup.confidence,
      verificationFreshness: startup.lastVerified,
      evidenceSources: startup.evidenceSourcesConnected,
      verificationHealth: needsAttention ? "Needs attention" : startup.verificationHealth === "excellent" ? "Excellent" : "Good",
    },
    badges: startup.activeBadges.map((label, index) => ({
      badgeType: label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""),
      label,
      source: ["identity", "organization", "domain", "deployment", "github", "team"][index] ?? "trust",
      status: needsAttention && index === 4 ? "expired" : "verified",
      confidence: Math.max(72, startup.confidence - index),
      lastUpdated: index === 4 && needsAttention ? "18 days ago" : startup.lastVerified,
      expiresAt: index === 4 && needsAttention ? "Expired" : "Active",
    })),
    verificationItems: [
      item("Founder Identity", "identity", "Identity Verification", "verified", 100, "90 days ago", "Current"),
      item("Organization", "organization", "Business Registry", startup.activeBadges.includes("Verified Organization") ? "verified" : "pending", 92, "30 days ago", "Current"),
      item("Domain", "domain", "DNS Challenge", "verified", 98, "7 days ago", "Current"),
      item("GitHub", "github", "GitHub Metadata", needsAttention ? "expired" : "verified", needsAttention ? 64 : 94, needsAttention ? "18 days ago" : "2 hours ago", needsAttention ? "Reconnect required" : "Fresh"),
      item("Team", "team", "Member Verification", "verified", 88, "45 days ago", "Current"),
      item("Deployment", "deployment", "Deployment Platform", "verified", 96, startup.startupId === "2" ? "12 minutes ago" : "3 hours ago", "Fresh"),
      item("Product Activity", "product_analytics", "Analytics Aggregate", "verified", 91, "Today", "Fresh"),
    ],
    founderOverview: {
      founders: 2,
      verificationStatus: "Verified",
      professionalProfilesConnected: 2,
      githubConnected: true,
      linkedinConnected: true,
      companyEmailVerified: true,
      yearsBuildingStartup: 2,
      previousVentures: "1 prior venture",
      responseRate: "92%",
    },
    productDevelopment: {
      developmentStatus: needsAttention ? "Verification refresh required" : "Active",
      repositoryConnected: !needsAttention,
      recentActivity: needsAttention ? "Paused" : "Daily",
      contributorsVerified: startup.startupId === "2" ? 8 : 6,
      deploymentFrequency: startup.startupId === "2" ? "Daily" : "Weekly",
      latestDeployment: startup.startupId === "2" ? "12 minutes ago" : "Yesterday",
      developmentConsistency: needsAttention ? "Needs refresh" : "High",
      activityTrend: [
        { label: "W1", activity: 52, deployments: 2 },
        { label: "W2", activity: 61, deployments: 3 },
        { label: "W3", activity: 58, deployments: 2 },
        { label: "W4", activity: needsAttention ? 30 : 75, deployments: needsAttention ? 0 : 4 },
        { label: "W5", activity: needsAttention ? 24 : 81, deployments: needsAttention ? 0 : 5 },
        { label: "W6", activity: needsAttention ? 18 : 88, deployments: needsAttention ? 0 : 6 },
      ],
    },
    productVerification: {
      productStatus: "Live",
      websiteVerified: true,
      deploymentsVerified: !needsAttention,
      latestDeployment: startup.startupId === "2" ? "12 minutes ago" : "3 hours ago",
      supportedPlatforms: ["Vercel", "GitHub", "Firebase"],
      verificationFreshness: needsAttention ? "18 days old" : "Today",
    },
    productActivity: {
      monthlyActiveUsers: "Verified",
      dailyActiveUsers: "Verified",
      growthTrend: startup.trustTrend === "improving" ? "Positive" : "Stable",
      retention: "Verified",
      dataFreshness: "Today",
    },
    teamOverview: {
      teamMembers: startup.startupId === "2" ? 12 : 8,
      verifiedMembers: startup.startupId === "2" ? 10 : 7,
      pendingVerification: startup.startupId === "2" ? 2 : 1,
      averageVerificationAge: "45 days",
      technicalContributors: startup.startupId === "2" ? 6 : 4,
      activeThisMonth: true,
    },
    timeline: [
      event("today", "Deployment completed", "deployment", "verified", 96),
      event("yesterday", "New team member verified", "team", "verified", 91),
      event("3 days ago", "Founder reverified", "identity", "verified", 100),
      event("last week", "Domain verified", "domain", "verified", 98),
      event("last month", "MVP released", "milestone", "approved", 90),
    ],
    milestones: [
      milestone("MVP Launch", "Verified", "2026-05-12", "TechIT Review"),
      milestone("Beta Launch", "Verified", "2026-06-03", "TechIT Review"),
      milestone("100 Customers", "Verified", "2026-06-28", "Analytics Aggregate"),
      milestone("Accelerator Accepted", "Verified", "2026-07-01", "Admin Review"),
      { id: "patent", title: "Patent Filed", status: "pending_review", evidence: "Evidence URL pending review" },
    ],
    verificationSources: [
      source("Identity", "verified", "Identity Verification", "90 days ago"),
      source("Organization", startup.activeBadges.includes("Verified Organization") ? "verified" : "pending", "Business Registry", "30 days ago"),
      source("Website", "verified", "DNS Challenge", "7 days ago"),
      source("GitHub", needsAttention ? "expired" : "verified", "GitHub Metadata", needsAttention ? "18 days ago" : "2 hours ago"),
      source("Deployment Platform", "verified", "Deployment Metadata", "Today"),
      source("Analytics", "verified", "Aggregate Analytics", "Today"),
    ],
    riskStatus: {
      verificationFreshness: needsAttention ? "Needs attention" : "Excellent",
      missingIntegrations: needsAttention ? 1 : 0,
      expiredVerification: needsAttention ? "GitHub" : "None",
      recentVerificationFailures: "None",
      trustTrend: startup.trustTrend === "improving" ? "Improving" : startup.trustTrend === "stable" ? "Stable" : "Needs attention",
      issues: needsAttention
        ? [{ title: "GitHub disconnected", detail: "Verification expired", lastSync: "18 days ago" }]
        : [],
    },
    continuousVerification: {
      status: "running",
      lastVerification: startup.startupId === "2" ? "12 minutes ago" : "45 minutes ago",
      nextVerification: "2 hours",
      connectedServices: startup.evidenceSourcesConnected,
      successRate: needsAttention ? "91%" : "99%",
    },
    investmentReadiness: {
      founderVerified: true,
      organizationVerified: startup.activeBadges.includes("Verified Organization"),
      productLive: startup.activeBadges.includes("Product Live"),
      developmentActive: startup.activeBadges.includes("Active Development") && !needsAttention,
      teamVerifiedPct: startup.startupId === "2" ? 83 : 88,
      operationalEvidence: needsAttention ? "Moderate" : "Strong",
      verificationFreshness: needsAttention ? "Needs attention" : "Excellent",
    },
    evidenceExplorer: [
      evidence("Deployment Status", "Deployment Platform", "Today", 100, "Live product status and deployment recency."),
      evidence("Development Activity", "GitHub Metadata", needsAttention ? "18 days ago" : "2 hours ago", needsAttention ? 64 : 94, "Repository activity aggregates only; no source code exposed."),
      evidence("Product Activity", "Analytics Aggregate", "Today", 91, "Aggregate usage and retention metadata only."),
      evidence("Team Verification", "Member Verification", "45 days ago", 88, "Counts and verification state only; no HR records exposed."),
      evidence("Milestone Evidence", "Admin Review", "Last month", 90, "Approved milestone references and public evidence URLs."),
    ],
    investorNotes: defaultNotes,
    privacy: FALLBACK_INVESTOR_TRUST_LIST.privacy,
  };
}

function item(
  label: string,
  source: string,
  provider: string,
  status: TrustVerificationState,
  confidence: number,
  lastUpdated: string,
  freshness: string,
): VerificationItem {
  return { label, source, provider, status, confidence, lastUpdated, freshness };
}

function event(
  when: string,
  title: string,
  sourceValue: string,
  status: TrustTimelineEvent["status"],
  confidence: number,
): TrustTimelineEvent {
  return { id: `${sourceValue}-${when}`, when, title, source: sourceValue, status, confidence };
}

function milestone(title: string, statusText: string, approvalDate: string, verifier: string): ApprovedMilestone {
  return {
    id: title.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
    title,
    status: statusText.toLowerCase() === "verified" ? "verified" : "pending_review",
    evidence: "Approved evidence URL",
    approvalDate,
    verifier,
  };
}

function source(label: string, status: TrustVerificationState, origin: string, lastSync: string): VerificationSourceSummary {
  return { label, status, origin, lastSync };
}

function evidence(
  metric: string,
  evidenceSource: string,
  verifiedAt: string,
  confidence: number,
  details: string,
): EvidenceExplorerItem {
  return {
    id: metric.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
    metric,
    status: confidence >= 80 ? "verified" : "expired",
    evidenceSource,
    verifiedAt,
    confidence,
    details,
  };
}

export function fetchInvestorTrustStartups(): Promise<InvestorTrustDashboardList> {
  return withFallback(
    () => apiGet<InvestorTrustDashboardList>("/investor/trust/startups"),
    FALLBACK_INVESTOR_TRUST_LIST,
    "investor trust startups",
  );
}

export function fetchInvestorTrustDashboard(startupId: string): Promise<InvestorTrustDashboard> {
  return withFallback(
    () => apiGet<InvestorTrustDashboard>(`/investor/trust/${encodeURIComponent(startupId)}`),
    () => fallbackInvestorTrustDashboard(startupId),
    "investor trust dashboard",
  );
}

export function saveInvestorTrustNotes(
  startupId: string,
  notes: InvestorTrustNote,
): Promise<{ ok: boolean; investorNotes: InvestorTrustNote }> {
  return withFallback(
    () => apiPost<{ ok: boolean; investorNotes: InvestorTrustNote }>(
      `/investor/trust/${encodeURIComponent(startupId)}/notes`,
      notes,
    ),
    { ok: true, investorNotes: notes },
    "investor trust notes",
  );
}
