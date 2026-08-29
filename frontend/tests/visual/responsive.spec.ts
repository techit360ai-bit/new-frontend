import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.setTimeout(60_000);

type AuthRole = "explorer" | "founder" | "collaborator" | "investor" | "organisation";

async function authenticateAs(page: import("@playwright/test").Page, role: AuthRole) {
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
    sessionStorage.setItem("techit_access_token", "visual-test-token");
    localStorage.setItem("techit_user", JSON.stringify(storedUser));
    localStorage.setItem("techit-theme", "light");
    localStorage.setItem("techit_cookie_consent", "essential-only");
    localStorage.setItem("techit:havi:first-landing:founder", "visual-test");
    localStorage.setItem("techit:havi:first-landing:collaborator", "visual-test");
  }, { storedUser: user });

  await page.route("http://localhost:3000/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/auth/session")) return route.fulfill({ json: { user } });
    if (path.endsWith("/users/me")) return route.fulfill({ json: profile });
    if (path.endsWith("/context/available")) {
      return route.fulfill({ json: {
        contexts: [{ role, roleAssignmentId: `assignment-${role}`, status: "active", isPrimary: true }],
        activeContext: { id: `context-${role}`, userId: user.id, role, roleAssignmentId: `assignment-${role}`, status: "active" },
      } });
    }
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

const viewports = [
  { name: "desktop-1920", width: 1920, height: 1080 },
  { name: "desktop-1600", width: 1600, height: 1000 },
  { name: "desktop-1440", width: 1440, height: 900 },
  { name: "desktop-1366", width: 1366, height: 768 },
  { name: "desktop-1280", width: 1280, height: 800 },
  { name: "desktop-1024", width: 1024, height: 768 },
  { name: "tablet", width: 820, height: 1180 },
  { name: "foldable", width: 717, height: 512 },
  { name: "large-android", width: 412, height: 915 },
  { name: "small-android", width: 360, height: 800 },
  { name: "large-iphone", width: 430, height: 932 },
  { name: "small-iphone", width: 375, height: 667 },
] as const;

for (const viewport of viewports) {
  test(`landing is responsive at ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect.poll(async () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
    await page.evaluate(async () => {
      const step = Math.max(240, Math.floor(window.innerHeight * 0.8));
      for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((resolve) => setTimeout(resolve, 40));
      }
      window.scrollTo(0, 0);
    });
    await page.screenshot({ path: `test-results/visual/${viewport.name}.png`, fullPage: true });
  });
}

test("keyboard focus and dark theme remain usable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus-visible")).toBeVisible();
  await page.evaluate(() => {
    document.documentElement.classList.remove("light");
    document.documentElement.classList.add("dark");
  });
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.screenshot({ path: "test-results/visual/mobile-dark.png", fullPage: true });
});

const roleRoutes = [
  { role: "explorer", route: "/explore" },
  { role: "founder", route: "/founder/dashboard" },
  { role: "collaborator", route: "/collaborator/dashboard" },
  { role: "investor", route: "/investor/dashboard" },
  { role: "organisation", route: "/org/dashboard" },
] as const;

const mobileNavContracts: Record<AuthRole, string[]> = {
  explorer: ["Personalized Feed", "Discover", "Events and Hackathons", "Opportunities", "Learning and AI Guide"],
  founder: ["Dashboard", "Incubation Hub", "Feed", "Workspaces", "Opportunity Hub"],
  collaborator: ["Dashboard", "Tasks", "Feed", "Opportunities", "Earnings"],
  investor: ["Dashboard", "Deal Intelligence", "Feed", "Mentorship Hub", "Watchlist"],
  organisation: ["Dashboard", "Intelligence", "Feed", "Teams", "Projects"],
};

for (const { role, route } of roleRoutes) {
  for (const viewport of [
    { name: "desktop", width: 1440, height: 900 },
    { name: "mobile", width: 390, height: 844 },
  ]) {
    test(`${role} shell renders at ${viewport.name} width`, async ({ page }) => {
      const pageErrors: string[] = [];
      page.on("pageerror", (error) => pageErrors.push(error.message));
      await authenticateAs(page, role);
      await page.setViewportSize(viewport);
      await page.goto(route);
      await expect(page).toHaveURL(new RegExp(route.replaceAll("/", "\\/")));
      await expect(page.locator("body")).toBeVisible({ timeout: 10000 });
      await expect(page.getByText("Loading page", { exact: true })).toBeHidden({ timeout: 10000 });
      expect(pageErrors).toEqual([]);
      await expect.poll(async () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
      await page.screenshot({ path: `test-results/visual/${role}-${viewport.name}.png`, fullPage: true });
      if (viewport.name === "mobile") {
        const quickNavigation = page.getByRole("navigation", { name: /quick navigation/i });
        await expect(quickNavigation).toBeVisible();
        await expect(quickNavigation.locator("a, [aria-disabled='true']")).toHaveCount(5);
        for (const label of mobileNavContracts[role]) await expect(quickNavigation.getByText(label, { exact: true })).toBeVisible();
        await expect(quickNavigation.getByText("Messages", { exact: true })).toHaveCount(0);
        const accessibility = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
          .analyze();
        expect(accessibility.violations).toEqual([]);
      }
    });
  }
}

test("role mobile chrome hides on downward scroll and returns on upward scroll", async ({ page }) => {
  await authenticateAs(page, "founder");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/founder/dashboard");
  const header = page.locator("header.app-safe-area-top");
  const navigation = page.getByRole("navigation", { name: /quick navigation/i });
  await expect(header).toBeVisible();
  await page.evaluate(() => {
    const scrollContainer = document.querySelector<HTMLElement>(".app-role-content") ?? document.documentElement;
    scrollContainer.scrollTo({ top: 500, behavior: "instant" });
  });
  await expect(header).toHaveClass(/-translate-y-full/);
  await expect(navigation).toHaveClass(/translate-y-full/);
  await page.evaluate(() => {
    const scrollContainer = document.querySelector<HTMLElement>(".app-role-content") ?? document.documentElement;
    scrollContainer.scrollTo({ top: 0, behavior: "instant" });
  });
  await expect(header).not.toHaveClass(/-translate-y-full/);
  await expect(navigation).not.toHaveClass(/translate-y-full/);
});

const allRoleMobileRoutes = [
  { role: "founder", routes: ["/founder/dashboard", "/incubation-hub", "/opportunity-hub", "/founder/trust", "/founder/mentorship", "/founder/messages", "/founder/profile", "/founder/settings"] },
  { role: "collaborator", routes: ["/collaborator/dashboard", "/collaborator/tasks", "/collaborator/performance", "/collaborator/earnings", "/collaborator/equity", "/collaborator/opportunities", "/collaborator/reputation", "/collaborator/messages", "/collaborator/tools", "/collaborator/profile", "/collaborator/settings"] },
  { role: "investor", routes: ["/investor", "/investor/deal-intelligence", "/investor/risk-analysis", "/investor/allocation", "/investor/watchlist", "/investor/capital-pools", "/investor/heatmap", "/investor/data-rooms", "/investor/deal-rooms", "/investor/reputation", "/investor/profile", "/investor/trust", "/investor/mentorship"] },
  { role: "organisation", routes: ["/org/dashboard", "/org/intelligence", "/org/teams", "/org/projects", "/org/incubator", "/org/hackathons", "/org/talent", "/org/ai-ops", "/org/analytics", "/org/marketplace", "/org/market-ready", "/org/hangout", "/org/profile", "/org/settings"] },
] as const;

for (const suite of allRoleMobileRoutes) {
  test(`${suite.role} mobile route family stays full-width`, async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await authenticateAs(page, suite.role);
    await page.setViewportSize({ width: 390, height: 844 });
    for (const route of suite.routes) {
      await test.step(route, async () => {
        await page.goto(route);
        await expect(page.getByText("Loading page", { exact: true })).toBeHidden({ timeout: 15000 });
        await expect.poll(async () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
        await expect(page.getByRole("navigation", { name: /quick navigation/i })).toBeVisible({ timeout: 15000 });
        await expect(page.locator("#root > *").first()).toBeVisible({ timeout: 15000 });
        expect(pageErrors, `page errors on ${route}`).toEqual([]);
      });
    }
  });
}

test("independent workspace layouts remain full-width on mobile", async ({ page }) => {
  await authenticateAs(page, "founder");
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of ["/workspaces", "/workspaces/chat", "/workspaces/files", "/workspaces/settings"]) {
    await test.step(route, async () => {
      await page.goto(route);
      await expect(page.getByText("Loading page", { exact: true })).toBeHidden({ timeout: 15000 });
      await expect.poll(async () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
      await expect(page.locator("#root > *").first()).toBeVisible({ timeout: 15000 });
    });
  }
});

test("mobile role navigation opens and traps the page behind the drawer", async ({ page }) => {
  await authenticateAs(page, "investor");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/investor");
  const navigation = page.getByRole("navigation", { name: /quick navigation/i });
  await expect(navigation).toBeVisible();
  const menuButton = page.getByRole("button", { name: /open navigation/i });
  await menuButton.click();
  await expect(page.getByRole("dialog", { name: /navigation/i })).toBeVisible();
  await expect.poll(async () => page.evaluate(() => document.body.style.overflow)).toBe("hidden");
  await expect(page.getByRole("dialog", { name: /navigation/i }).locator(":focus")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: /navigation/i })).toBeHidden();
  await expect(menuButton).toBeFocused();
});

test("founder idea-validation Q&A resumes after refresh", async ({ page }) => {
  await authenticateAs(page, "founder");
  await page.route("http://localhost:8000/api/v1/incubation/validation/sessions?limit=20", (route) => route.fulfill({ json: {
    sessions: [{
      id: "validation-resume-1",
      projectId: "project-resume-1",
      status: "questions_pending",
      currentPhase: 2,
      version: 3,
      ventureName: "Persistent Mobility",
      summary: "A saved founder validation session.",
      workspaceId: "workspace-resume-1",
      questionCount: 2,
      answeredCount: 1,
      updatedAt: "2026-08-25T08:00:00.000Z",
    }],
  } }));
  await page.route("http://localhost:8000/api/v1/incubation/validation/sessions/validation-resume-1", (route) => route.fulfill({ json: {
    session: {
      id: "validation-resume-1",
      projectId: "project-resume-1",
      status: "questions_pending",
      currentPhase: 2,
      version: 3,
      state: { founder_answers: { customer: "Regional fleet operators" } },
    },
    founder_questions: [
      { id: "customer", question: "Who is the first paying customer?", why_it_matters: "Defines the initial buyer." },
      { id: "problem", question: "Which urgent problem do they have?", why_it_matters: "Tests problem intensity." },
    ],
    founder_answers: { customer: "Regional fleet operators" },
    evidence: { research_mode: "live", sources: [] },
    geography: { primary_geography: { country: "Hungary" } },
    company_building: {},
    pmf_validation: { status: "blocked" },
    mvp_plan: {},
    workspace_id: "workspace-resume-1",
    venture_data: { startup_name: "Persistent Mobility", solution: "Fleet settlement automation", target_geography: "Hungary" },
    blueprint: { venture_name: "Persistent Mobility", investment_score: 62 },
  } }));

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/incubation-hub");
  await expect(page).toHaveURL(/validationSession=validation-resume-1/);
  await expect(page.getByRole("heading", { name: "Founder Validation & Human Decisions" })).toBeVisible();
  await expect(page.getByText("Who is the first paying customer?")).toBeVisible();
  await expect(page.getByText("Who is the first paying customer?").locator("..").locator("textarea")).toHaveValue("Regional fleet operators");

  await page.reload();
  await expect(page.getByRole("heading", { name: "Founder Validation & Human Decisions" })).toBeVisible();
  await expect(page.getByText("Who is the first paying customer?").locator("..").locator("textarea")).toHaveValue("Regional fleet operators");
  await expect.poll(async () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
});

const denseMobileRoutes = [
  { role: "investor", route: "/investor/watchlist", heading: /Watchlist & Signals/i },
  { role: "investor", route: "/investor/data-rooms", heading: /Data Rooms/i },
  { role: "investor", route: "/investor/deal-room/startup-mobile-1", heading: /Deal Room/i },
  { role: "founder", route: "/founder/trust", heading: /Trust/i },
  { role: "founder", route: "/founder/mentorship", heading: /Find a mentor/i },
  { role: "organisation", route: "/org/intelligence", heading: /Intelligence|Cohort/i },
] as const;

for (const scenario of denseMobileRoutes) {
  test(`${scenario.route} is mobile-safe with production-shaped data`, async ({ page }) => {
    await authenticateAs(page, scenario.role);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(scenario.route);
    await expect(page.getByRole("heading", { name: scenario.heading }).first()).toBeVisible({ timeout: 10000 });
    await expect.poll(async () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
    await expect(page.getByRole("navigation", { name: /quick navigation/i })).toBeVisible();
    expect(await page.getByRole("navigation", { name: /quick navigation/i }).locator("a, [aria-disabled='true']").evaluateAll((elements) => elements.every((element) => {
      const rect = element.getBoundingClientRect();
      return rect.width >= 44 && rect.height >= 44;
    }))).toBe(true);
  });
}

test("long mobile notification collections are virtualized", async ({ page }) => {
  await authenticateAs(page, "explorer");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/feed/notifications");
  await expect(page.getByRole("heading", { name: "Notifications" })).toBeVisible();
  await expect(page.locator("[data-testid='virtuoso-item-list']")).toBeVisible();
  expect(await page.getByText(/Production-shaped notification/).count()).toBeLessThan(80);
  await expect.poll(async () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
});

test("mobile filter sheets lock scroll, close with Escape, and restore focus", async ({ page }) => {
  await authenticateAs(page, "investor");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/investor/data-rooms");
  const trigger = page.getByRole("button", { name: "Filters" });
  await trigger.click();
  const sheet = page.getByRole("dialog", { name: "Filter data rooms" });
  await expect(sheet).toBeVisible();
  await expect.poll(async () => page.evaluate(() => document.body.style.overflow)).toBe("hidden");
  await page.keyboard.press("Escape");
  await expect(sheet).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("mobile fixed controls stay above the bottom navigation", async ({ page }) => {
  await authenticateAs(page, "founder");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/founder/dashboard");
  const nav = page.getByRole("navigation", { name: /quick navigation/i });
  const theme = page.getByRole("button", { name: "Theme" });
  const havi = page.getByRole("button", { name: "Open Havi" });
  const [navBox, themeBox, haviBox] = await Promise.all([nav.boundingBox(), theme.boundingBox(), havi.boundingBox()]);
  expect(navBox && themeBox && themeBox.y + themeBox.height <= navBox.y).toBeTruthy();
  expect(navBox && haviBox && haviBox.y + haviBox.height <= navBox.y).toBeTruthy();
});

test("reduced motion removes meaningful mobile transition duration", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await authenticateAs(page, "investor");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/investor");
  const duration = await page.getByRole("button", { name: "Open navigation" }).evaluate((element) => Number.parseFloat(getComputedStyle(element).transitionDuration) || 0);
  expect(duration).toBeLessThanOrEqual(0.001);
});

test("mobile route shell stays within the local performance budget", async ({ page }) => {
  await authenticateAs(page, "investor");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/investor/watchlist");
  await expect(page.getByRole("heading", { name: /Watchlist & Signals/i })).toBeVisible();
  const metrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    return { domContentLoaded: navigation?.domContentLoadedEventEnd ?? Number.POSITIVE_INFINITY };
  });
  expect(metrics.domContentLoaded).toBeLessThan(5_000);
});

test("protected role routes preserve the authentication boundary", async ({ page }) => {
  for (const route of ["/founder/dashboard", "/collaborator/dashboard", "/investor", "/org/dashboard", "/workspaces", "/feed"]) {
    await page.goto(route);
    await expect(page).toHaveURL(/\/signin|\/signup/);
  }
});
