import { expect, test } from "vitest";
import { deriveOrganizationAnalytics } from "./organizationAnalytics";
import type { OrganizationDashboardData, OrganizationProject } from "./organization";

const emptyDashboard: OrganizationDashboardData = {
  metrics: { activePrograms: 0, hackathons: 0, members: 0, opportunities: 0 },
  projectHealth: [],
  talentActivity: [],
  automation: [],
  activity: [],
};

function project(input: Partial<OrganizationProject> & Pick<OrganizationProject, "id" | "title">): OrganizationProject {
  return {
    tagline: "",
    industry: "",
    stage: "idea",
    status: "planned",
    progress: 0,
    teamName: "",
    memberCount: 0,
    marketReadyScore: 0,
    aiLevel: "",
    hasWorkspace: false,
    createdAt: "",
    updatedAt: "",
    ...input,
  };
}

test("organization analytics preserves a true empty persisted state", () => {
  expect(deriveOrganizationAnalytics(emptyDashboard, [])).toMatchObject({
    totalProjects: 0,
    marketReady: 0,
    marketReadyRate: 0,
    averageProgress: 0,
    averageMarketReadyScore: 0,
    mostCommonStage: "No projects",
    hasData: false,
    growth: [],
    lifecycle: [],
    industries: [],
    readiness: [
      { label: "AI enabled", value: 0, total: 0 },
      { label: "Workspace enabled", value: 0, total: 0 },
      { label: "Market ready", value: 0, total: 0 },
    ],
  });
});

test("organization analytics derives charts and metrics only from persisted rows", () => {
  const analytics = deriveOrganizationAnalytics({
    ...emptyDashboard,
    metrics: { activePrograms: 2, hackathons: 1, members: 14, opportunities: 3 },
    automation: [{ label: "Jul", automated: 9, manual: 3 }],
    activity: [{ id: "activity-1", type: "project", message: "Project updated", at: "2026-07-16" }],
  }, [
    project({
      id: "project-1",
      title: "Live One",
      industry: "FinTech",
      stage: "development",
      status: "on-track",
      progress: 60,
      aiLevel: "assisted",
      hasWorkspace: true,
      createdAt: "2026-06-10T08:00:00Z",
    }),
    project({
      id: "project-2",
      title: "Live Two",
      industry: "FinTech",
      stage: "market-ready",
      status: "completed",
      progress: 100,
      createdAt: "2026-07-10T08:00:00Z",
    }),
    project({
      id: "project-3",
      title: "Live Three",
      industry: "HealthTech",
      stage: "mvp",
      status: "at-risk",
      progress: 20,
      aiLevel: "manual",
      createdAt: "2026-07-11T08:00:00Z",
    }),
  ]);

  expect(analytics.metrics).toEqual([
    { label: "Total Projects", value: "3", detail: "1 at risk" },
    { label: "Market Ready", value: "1", detail: "33% of persisted projects" },
    { label: "Average Progress", value: "60%", detail: "Across persisted projects" },
    { label: "Average Readiness", value: "0%", detail: "Persisted market-ready score" },
  ]);
  expect(analytics).toMatchObject({
    marketReady: 1,
    marketReadyRate: 33,
    averageProgress: 60,
    averageMarketReadyScore: 0,
  });
  expect(analytics.growth.map(({ key, projects }) => ({ key, projects }))).toEqual([
    { key: "2026-06", projects: 1 },
    { key: "2026-07", projects: 2 },
  ]);
  expect(analytics.lifecycle).toEqual([
    { stage: "Development", count: 2 },
    { stage: "Market Ready", count: 1 },
  ]);
  expect(analytics.industries.map(({ name, value }) => ({ name, value }))).toEqual([
    { name: "FinTech", value: 2 },
    { name: "HealthTech", value: 1 },
  ]);
  expect(analytics.readiness).toEqual([
    { label: "AI enabled", value: 1, total: 3 },
    { label: "Workspace enabled", value: 1, total: 3 },
    { label: "Market ready", value: 1, total: 3 },
  ]);
  expect(analytics.hasData).toBe(true);
});
