import { test, expect } from "vitest";
import type { HackathonRegistration, BriefScore, FounderProfile } from "@/contexts/UserContext";
import { buildTeamWorkspace } from "./workspace";
import { promoteDefaults, buildPromotedProject } from "./promote";

const NOW = 1_700_000_000_000;
const AT = "2026-06-16T00:00:00.000Z";

function brief(over = "") {
  return {
    problem: "p", targetUser: "u", solutionSketch: over || "build a thing", whyNow: "now",
    differentiator: "diff", risk: "risk", successMetric: "metric", submittedAt: AT,
  };
}
function score(overall: number): BriefScore {
  return {
    problemClarity: overall, innovationGap: overall, initialImpact: overall, overall,
    critiques: { problemClarity: [], innovationGap: [], initialImpact: [] }, computedAt: AT,
  };
}
function reg(o: Partial<HackathonRegistration> = {}): HackathonRegistration {
  return {
    hackathonId: "h1", teamId: "t1", teamName: "Rocket", teamSize: 3, role: "leader",
    inviteToken: "tok", registeredAt: AT, members: [], openRoles: [], stage: "building",
    checkIns: [], ...o,
  };
}
const fp = { industries: ["saas"], name: "Sara", startupName: "" } as unknown as FounderProfile;
const finalSub = { demoUrl: "https://d", deckUrl: "https://k", videoUrl: "https://v", summary: "x".repeat(40), submittedAt: AT };

test("buildTeamWorkspace seeds idea from the 7 brief fields", () => {
  const ws = buildTeamWorkspace(reg({ brief: brief() }), NOW);
  expect(ws.idea?.problem).toBe("p");
  expect(ws.idea?.solutionSketch).toBe("build a thing");
  expect(ws.idea?.successMetric).toBe("metric");
});

test("buildTeamWorkspace idea is null without a brief, artifacts null without submission", () => {
  const ws = buildTeamWorkspace(reg(), NOW);
  expect(ws.idea).toBeNull();
  expect(ws.artifacts).toBeNull();
});

test("buildTeamWorkspace maps team from members and artifacts from finalSubmission", () => {
  const ws = buildTeamWorkspace(reg({
    members: [{ collaboratorId: "c1", name: "Ada", role: "eng", acceptedAt: AT }],
    finalSubmission: finalSub,
  }), NOW);
  expect(ws.team).toHaveLength(1);
  expect(ws.team[0].name).toBe("Ada");
  expect(ws.artifacts?.demoUrl).toBe("https://d");
  expect(ws.id).toBe(`ws_team_${NOW}`);
  expect(ws.teamName).toBe("Rocket");
});

test("promoteDefaults derives title/tagline/industry/stage", () => {
  const d = promoteDefaults(reg({ brief: brief("a great solution sketch") }), fp);
  expect(d.title).toBe("Rocket");
  expect(d.tagline).toBe("a great solution sketch");
  expect(d.industry).toBe("saas");
  expect(d.stage).toBe("mvp");
});

test("promoteDefaults yields empty strings with no brief / no industry", () => {
  const d = promoteDefaults(reg(), { industries: [], name: "x", startupName: "" } as unknown as FounderProfile);
  expect(d.tagline).toBe("");
  expect(d.industry).toBe("");
});

test("buildPromotedProject: overrides win, gsis from briefScore, id from now", () => {
  const project = buildPromotedProject(
    reg({ brief: brief(), briefScore: score(88) }), fp,
    { title: "Custom", stage: "beta" }, NOW,
  );
  expect(project.title).toBe("Custom");
  expect(project.stage).toBe("beta");
  expect(project.industry).toBe("saas");
  expect(project.gsisScore).toBe(88);
  expect(project.id).toBe(`proj_local_${NOW}`);
  expect(project.isPrimary).toBe(false);
  expect(project.hasWorkspace).toBe(true);
});

test("buildPromotedProject gsis defaults to 0 with no briefScore; tagline truncates at 120", () => {
  const long = "y".repeat(200);
  const project = buildPromotedProject(reg({ brief: brief(long) }), fp, {}, NOW);
  expect(project.gsisScore).toBe(0);
  expect(project.tagline.length === 120).toBe(true);
});
