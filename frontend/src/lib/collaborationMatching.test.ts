import { describe, expect, it } from "vitest";
import { rankCollaborators, type CollaborationInviteDraft } from "./collaborationMatching";
import type { CollaboratorDirectoryEntry } from "./api/users";

const draft: CollaborationInviteDraft = {
  projectId: "project-1",
  projectName: "LedgerCare",
  summary: "LedgerCare helps clinics reconcile patient payments.",
  scope: "Build and test the first reconciliation API.",
  requestedRole: "Backend Engineer",
  requiredSkills: ["Node.js", "Postgres"],
  desiredWeeklyHours: 20,
  earliestStart: "2-weeks",
  commitmentStyle: "deep",
  compensationMode: "equity-heavy",
  equityProposal: 4,
  cashReward: 1500,
  industry: "HealthTech",
};

function profile(overrides: Partial<CollaboratorDirectoryEntry>): CollaboratorDirectoryEntry {
  return {
    id: "builder-1",
    name: "Builder One",
    role: "collaborator",
    title: "Backend Engineer",
    headline: "",
    skills: ["Node.js", "Postgres"],
    discipline: "Engineering",
    subSkills: ["API design"],
    techStack: ["Node.js", "Postgres"],
    weeklyHours: 24,
    timezone: "UTC+1",
    location: "Nigeria",
    earliestStart: "this-week",
    commitmentStyle: "deep",
    equityPreference: 70,
    minCashFloor: 1000,
    industries: ["HealthTech"],
    avatarUrl: "",
    credibilityScore: 85,
    isVerified: true,
    ...overrides,
  };
}

describe("rankCollaborators", () => {
  it("ranks disclosed capability, availability, compensation and trust signals", () => {
    const strong = profile({ id: "strong", name: "Strong Match" });
    const sparse = profile({
      id: "sparse",
      name: "Sparse Profile",
      title: "Designer",
      skills: [],
      subSkills: [],
      techStack: [],
      weeklyHours: 0,
      earliestStart: "1-month",
      commitmentStyle: "many",
      equityPreference: 0,
      minCashFloor: 3000,
      industries: [],
      credibilityScore: 10,
      isVerified: false,
    });

    const ranked = rankCollaborators([sparse, strong], draft, { timezone: "UTC+1", location: "Nigeria" });
    expect(ranked.map((row) => row.profile.id)).toEqual(["strong", "sparse"]);
    expect(ranked[0].score).toBeGreaterThan(80);
    expect(ranked[0].reasons).toContain("Role fit: Backend Engineer");
  });

  it("uses profile data only and returns deterministic scores", () => {
    const rows = [profile({ id: "a", name: "A" }), profile({ id: "b", name: "B" })];
    expect(rankCollaborators(rows, draft)).toEqual(rankCollaborators(rows, draft));
  });
});
