import { expect, test } from "@playwright/test";

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
    if (path.endsWith("/investor/deal-flow")) return route.fulfill({ json: { ranking: [], watchlistProjectIds: [] } });
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
    });
  }
}

test("protected role routes preserve the authentication boundary", async ({ page }) => {
  for (const route of ["/founder/dashboard", "/collaborator/dashboard", "/investor", "/org/dashboard", "/workspaces", "/feed"]) {
    await page.goto(route);
    await expect(page).toHaveURL(/\/signin|\/signup/);
  }
});
