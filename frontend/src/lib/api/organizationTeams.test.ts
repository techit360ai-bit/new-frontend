import { expect, test } from "vitest";
import type { OrganizationProject } from "./organization";
import { deriveOrganizationTeams } from "./organizationTeams";

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

test("organization teams preserve a true empty persisted state", () => {
  expect(deriveOrganizationTeams([])).toEqual({
    teams: [],
    activity: [],
    assignedProjects: 0,
    unassignedProjects: [],
    recordedSeats: 0,
  });
});

test("organization teams aggregate persisted project assignments without fake people", () => {
  const data = deriveOrganizationTeams([
    project({
      id: "project-1",
      title: "Live One",
      teamName: "Platform",
      industry: "SaaS",
      status: "on-track",
      stage: "development",
      progress: 60,
      memberCount: 4,
      updatedAt: "2026-07-15T10:00:00Z",
    }),
    project({
      id: "project-2",
      title: "Live Two",
      teamName: "platform",
      industry: "FinTech",
      status: "at-risk",
      stage: "market-ready",
      progress: 80,
      memberCount: 3,
      updatedAt: "2026-07-16T10:00:00Z",
    }),
    project({
      id: "project-3",
      title: "Unassigned Live",
      progress: 20,
      memberCount: 2,
      updatedAt: "2026-07-14T10:00:00Z",
    }),
  ]);

  expect(data.teams).toEqual([{
    key: "platform",
    name: "Platform",
    projectCount: 2,
    recordedSeats: 7,
    averageProgress: 70,
    marketReadyCount: 1,
    atRiskCount: 1,
    industries: ["FinTech", "SaaS"],
    latestUpdatedAt: "2026-07-16T10:00:00Z",
  }]);
  expect(data.assignedProjects).toBe(2);
  expect(data.recordedSeats).toBe(9);
  expect(data.unassignedProjects.map((item) => item.id)).toEqual(["project-3"]);
  expect(data.activity.map((item) => item.projectTitle)).toEqual([
    "Live Two",
    "Live One",
    "Unassigned Live",
  ]);
});
