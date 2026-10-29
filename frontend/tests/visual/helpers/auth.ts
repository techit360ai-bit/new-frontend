export type AuthRole = "explorer" | "founder" | "collaborator" | "investor" | "organisation";

export async function authenticateAs(page: import("@playwright/test").Page, role: AuthRole) {
  page.on("pageerror", error => console.error("Dashboard browser error:", error.message));
  await page.route("https://fonts.googleapis.com/**", route => route.fulfill({ contentType: "text/css", body: "" }));
  const user = { id: `visual-${role}`, email: `${role}@visual.test` };
  const profile = {
    ...user,
    firstName: "Visual",
    lastName: "Reviewer",
    username: `visual-${role}`,
    phone: "",
    country: "Hungary",
    countryCode: "HU",
    avatarUrl: null,
    bio: null,
    role,
    secondaryRoles: [],
    creditBalance: 0,
    credibilityScore: 0,
    isVerified: true,
    isOnboarded: true,
    startupStage: null,
    industries: [],
    experience: null,
    skills: [],
    weeklyHours: null,
    riskTolerance: null,
    investmentFocus: [],
    ticketSize: null,
    orgName: role === "organisation" ? "Visual Organization" : null,
    orgType: role === "organisation" ? "Accelerator" : null,
    website: null,
    linkedinUrl: null,
    githubUrl: null,
    portfolioUrl: null,
    timezone: "Europe/Budapest",
    certifications: [],
    createdAt: "2026-08-23T00:00:00.000Z",
    updatedAt: "2026-08-23T00:00:00.000Z",
  };

  await page.addInitScript(({ storedUser }) => {
    sessionStorage.removeItem("techit_access_token");
    localStorage.setItem("techit_user", JSON.stringify(storedUser));
    localStorage.setItem("techit-theme", "light");
    localStorage.setItem("techit_cookie_consent", "essential-only");
    localStorage.setItem("techit:havi:first-landing:founder", "visual-test");
    localStorage.setItem("techit:havi:first-landing:collaborator", "visual-test");
    for (const role of ["explorer", "investor", "organisation"]) localStorage.setItem(`techit:havi:first-landing:${role}`, "visual-test");
  }, { storedUser: user });

  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/auth/session")) return route.fulfill({ json: { user } });
    if (path.endsWith("/users/me")) return route.fulfill({ json: profile });
    if (path.endsWith("/context/available")) {
      return route.fulfill({ json: {
        contexts: [{ role, roleAssignmentId: `assignment-${role}`, status: "active", isPrimary: true }],
        activeContext: { id: `context-${role}`, userId: user.id, role, roleAssignmentId: `assignment-${role}`, status: "active" },
      } });
    }
    if (path.endsWith("/tvce/next-best-action")) return route.fulfill({ json: { action: "review_workspace", reason: "Continue your current workspace", expectedValue: "Keep execution moving", access: "available", metering: "included", usageEstimateRequired: false, subscriptionRecommendation: false } });
    if (path.endsWith("/tvce/progress")) return route.fulfill({ json: { meter: { ideaClarity: 0, validation: 0, executionReadiness: 0, investorReadiness: 0 }, strongestOpportunity: "", generatedAt: "2026-10-29T00:00:00Z" } });
    if (path.endsWith("/context/session")) return route.fulfill({ json: { greeting: "Welcome back", awayMessage: null, decayStatus: null, currentState: "", gsisScore: 0, resume: [], doNow: null, newSinceLeft: [], weeklyPriority: null } });
    if (path.endsWith("/discovery/return-summary")) return route.fulfill({ json: { available: false, state: "current", categories: [], items: [] } });
    if (path.endsWith("/collaborator/equity")) return route.fulfill({ json: { holdings: [], totals: { totalValueUSD: 0, blendedEquityPercent: 0, vestedThisQuarterUSD: 0, nextVest: null }, vestingTimeline: [] } });
    if (path.endsWith("/collaborator/earnings")) return route.fulfill({ json: { cashEarnings: [], payouts: [], totals: { lifetimeUSD: 0, pendingUSD: 0, revenueShareTTMUsd: 0 } } });
    if (path.endsWith("/collaborator/scores")) return route.fulfill({ json: { scores: { cbs: 0, tss: {}, crs: 0 } } });
    if (path.endsWith("/investor/deal-flow")) return route.fulfill({ json: {
      watchlistProjectIds: ["startup-mobile-1"],
      ranking: [{
        projectId: "startup-mobile-1", startupName: "Mobility Systems International With A Long Name",
        sector: "Climate fintech and infrastructure", region: "Budapest, Hungary", watchlisted: true,
        readinessScore: 82, readinessDelta: 7, executionVelocity: 78, velocityDelta: 7,
        riskLevel: "moderate", riskDelta: "improved", mrr: 128000, revenueGrowth: 18,
        revenueDelta: 18, investorsWatching: 14, complianceVerified: true, aiGovernanceVerified: true,
        about: { summary: "A production-shaped infrastructure platform with a deliberately long summary for mobile wrapping checks.", useCase: "Automated settlement and reporting for distributed mobility operators.", marketSize: "European mobility operations and payments.", marketSizeValue: "$4.2B" },
      }],
    } });
    if (path.endsWith("/investor/watchlist/preferences")) return route.fulfill({ json: { preferences: { velocity: true, risk: true, milestone: false, trust: true, dealStatus: true } } });
    if (path.endsWith("/investor/data-rooms")) return route.fulfill({ json: { dataRooms: [{
      projectId: "startup-mobile-1", startupName: "Mobility Systems International With A Long Name",
      sector: "Climate fintech and infrastructure", sections: ["Metrics Dashboard", "Financials", "Testing Reports", "Compliance", "Governance", "Execution History"],
      docCount: 38, complianceVerified: true, aiGovernanceVerified: true, updatedLabel: "Updated 12 minutes ago",
    }] } });
    if (path.endsWith("/investor/deal-rooms")) return route.fulfill({ json: { dealRooms: [{
      id: "deal-mobile-1", projectId: "startup-mobile-1", startupName: "Mobility Systems International With A Long Name",
      status: "active", stage: "Term Sheet", daysOpen: 12, messages: 27, docs: 8, lastActivity: "12 minutes ago",
      valuationUSD: 6000000,
      termSheet: { valuationUSD: 6000000, investmentUSD: 500000, equityPercent: 8, instrument: "SAFE", discountPercent: 15, valuationCapUSD: 6500000, extraTerms: { proRata: "Included", rights: "Observer" } },
      milestones: [{ milestone: "Enterprise pilot", amount: 200000, condition: "Three paid operators live", status: "pending" }],
      documents: [{ name: "Mobility Systems investor rights agreement final review.pdf", status: "ready" }],
      negotiation: [{ step: "NDA signed", state: "completed" }, { step: "Term sheet review", state: "active" }],
    }] } });
    if (path.endsWith("/notifications")) return route.fulfill({ json: { notifications: Array.from({ length: 80 }, (_, index) => ({
      id: `notification-${index}`, type: index % 2 ? "comment" : "milestone", read: index > 7,
      content: `Production-shaped notification ${index + 1} with enough text to wrap naturally on a narrow mobile viewport.`,
      author: index % 2 ? "Alexandra Longname" : "TechIT Platform", avatar: "from-blue-500 to-violet-500",
      timeAgo: `${index + 1}m`, linkTo: "/feed",
    })) } });
    if (path.endsWith("/investor-intelligence/overview")) return route.fulfill({ json: { portfolio: { total: 0, healthy: 0, onTrack: 0, highRisk: 0 }, startups: [], changes: [], deterministic: true } });
    if (path.endsWith("/investor-intelligence/alerts")) return route.fulfill({ json: { alerts: [], deterministic: true } });
    if (path.endsWith("/investor-intelligence/reports")) return route.fulfill({ json: { reports: [], deterministic: true } });
    if (path.endsWith("/organization/dashboard")) return route.fulfill({ json: { metrics: { activePrograms: 0, hackathons: 0, members: 0, opportunities: 0 }, charts: {}, activity: [] } });
    if (path.endsWith("/organization-intelligence/overview")) return route.fulfill({ json: { metrics: {}, health: { score: null, dimensions: {}, availability: {} }, risks: {}, actions: {} } });
    if (path.includes("/organization-intelligence/pulse")) return route.fulfill({ json: { window: "7d", changes: {}, activity: [] } });
    if (path.endsWith("/organization-intelligence/risks")) return route.fulfill({ json: { risks: [] } });
    if (path.endsWith("/organization-intelligence/actions")) return route.fulfill({ json: { actions: [] } });
    if (path.endsWith("/organization-intelligence/kpis")) return route.fulfill({ json: { kpis: [] } });
    if (path.includes("/capabilities/check")) return route.fulfill({ json: { allowed: true, decision: "allow" } });
    return route.fulfill({ json: {
      data: [], items: [], results: [], projects: [], startups: [], builds: [], tasks: [],
      opportunities: [], recommendations: [], alerts: [], reports: [], events: [], members: [],
      conversations: [], notifications: [], holdings: [], totals: {}, metrics: {}, summary: {},
    } });
  });
}
