import { test, expect } from "vitest";
import { deriveBadges } from "./passportBadges";

// deriveBadges input: per-record flags + two rollups.
function rec(o: Partial<{ placement: number; completed: boolean; briefOverall: number; demoShipped: boolean; checkInCount: number }> = {}) {
  return { completed: false, demoShipped: false, checkInCount: 0, ...o };
}

test("champion + podium co-occur for a 1st-place finish", () => {
  const badges = deriveBadges({ records: [rec({ completed: true, placement: 1 })], hackathonsEntered: 1, demosShipped: 0 });
  const ids = badges.map((b) => b.id);
  expect(ids.includes("champion")).toBe(true);
  expect(ids.includes("podium")).toBe(true);
});

test("podium without champion for a 3rd-place finish", () => {
  const ids = deriveBadges({ records: [rec({ completed: true, placement: 3 })], hackathonsEntered: 1, demosShipped: 0 }).map((b) => b.id);
  expect(ids.includes("podium")).toBe(true);
  expect(ids.includes("champion")).toBe(false);
});

test("demo-shipper, serial-builder, strong-brief, consistent fire on their thresholds", () => {
  const ids = deriveBadges({
    records: [rec({ briefOverall: 80, checkInCount: 5 })],
    hackathonsEntered: 3,
    demosShipped: 1,
  }).map((b) => b.id);
  expect(ids.includes("demo-shipper")).toBe(true);
  expect(ids.includes("serial-builder")).toBe(true);
  expect(ids.includes("strong-brief")).toBe(true);
  expect(ids.includes("consistent")).toBe(true);
});

test("no badges for an empty / below-threshold passport", () => {
  const badges = deriveBadges({ records: [rec({ briefOverall: 79, checkInCount: 4 })], hackathonsEntered: 2, demosShipped: 0 });
  expect(badges).toHaveLength(0);
});

test("badge order is stable (catalog order)", () => {
  const ids = deriveBadges({
    records: [rec({ completed: true, placement: 1, briefOverall: 90, checkInCount: 6 })],
    hackathonsEntered: 3,
    demosShipped: 1,
  }).map((b) => b.id);
  expect(ids).toEqual(["champion", "podium", "demo-shipper", "serial-builder", "strong-brief", "consistent"]);
});

import type { HackathonRegistration, BriefScore } from "@/contexts/UserContext";
import { derivePassport } from "./passport";

const NOW = 1_700_000_000_000;
const AT = "2026-06-16T00:00:00.000Z";

function score(overall: number): BriefScore {
  return {
    problemClarity: overall, innovationGap: overall, initialImpact: overall, overall,
    critiques: { problemClarity: [], innovationGap: [], initialImpact: [] }, computedAt: AT,
  };
}

function reg(o: Partial<HackathonRegistration> = {}): HackathonRegistration {
  return {
    hackathonId: "h1", teamId: "t1", teamName: "Team", teamSize: 3, role: "leader",
    inviteToken: "tok", registeredAt: AT, members: [], openRoles: [], stage: "registered",
    checkIns: [], ...o,
  };
}

const finalSub = { demoUrl: "https://d", deckUrl: "https://k", videoUrl: "https://v", summary: "x".repeat(40), submittedAt: AT };

test("empty registrations → inactive passport", () => {
  const p = derivePassport([], NOW);
  expect(p.hasActivity).toBe(false);
  expect(p.hackathonsEntered).toBe(0);
  expect(p.records).toHaveLength(0);
  expect(p.badges).toHaveLength(0);
});

test("counts entered/completed, demos, check-ins across mixed regs", () => {
  const completed = reg({
    teamId: "a", stage: "submitted-final", briefScore: score(70), finalSubmission: finalSub,
    judgeFeedback: { placement: 4, cohortSize: 12, comments: ["Solid"], judgedAt: AT },
    checkIns: [{ id: "c1", loggedAt: AT, status: "on-track", update: "u" }],
  });
  const registeredOnly = reg({ teamId: "b", stage: "registered" });
  const p = derivePassport([completed, registeredOnly], NOW);
  expect(p.hackathonsEntered).toBe(2);
  expect(p.hackathonsCompleted).toBe(1);
  expect(p.demosShipped).toBe(1);
  expect(p.totalCheckIns).toBe(1);
  expect(p.hasActivity).toBe(true);
});

test("bestPlacement picks the smallest placement among completed", () => {
  const r1 = reg({ teamId: "a", stage: "submitted-final", finalSubmission: finalSub, judgeFeedback: { placement: 5, cohortSize: 12, comments: [], judgedAt: AT } });
  const r2 = reg({ teamId: "b", stage: "submitted-final", finalSubmission: finalSub, judgeFeedback: { placement: 2, cohortSize: 10, comments: [], judgedAt: AT } });
  const p = derivePassport([r1, r2], NOW);
  expect(p.bestPlacement?.placement).toBe(2);
  expect(p.bestPlacement?.cohortSize).toBe(10);
});

test("avgBriefScore is the rounded mean of present scores; undefined when none", () => {
  const withScores = derivePassport([reg({ teamId: "a", briefScore: score(70) }), reg({ teamId: "b", briefScore: score(81) })], NOW);
  expect(withScores.avgBriefScore).toBe(76); // (70+81)/2 = 75.5 → 76
  const none = derivePassport([reg({ teamId: "c" })], NOW);
  expect(none.avgBriefScore).toBe(undefined);
});

test("records are newest-first by registeredAt and carry teammates", () => {
  const older = reg({ teamId: "a", registeredAt: "2026-06-01T00:00:00.000Z" });
  const newer = reg({
    teamId: "b", registeredAt: "2026-06-10T00:00:00.000Z",
    members: [{ collaboratorId: "c1", name: "Ada", role: "eng", acceptedAt: AT }],
  });
  const p = derivePassport([older, newer], NOW);
  expect(p.records[0].hackathonId).toBe("h1");
  expect(p.records[0].teamName).toBe("Team");
  expect(p.records[0].teammates).toHaveLength(1);
  expect(p.records[0].teammates[0].name).toBe("Ada");
  expect(p.records[0].teammates[0].collaboratorId).toBe("c1");
  expect(p.records[1].teammates).toHaveLength(0);
});

test("a registered-only reg yields a record without throwing", () => {
  const p = derivePassport([reg({ teamId: "a", stage: "registered" })], NOW);
  expect(p.records[0].completed).toBe(false);
  expect(p.records[0].placement).toBe(undefined);
  expect(p.records[0].briefOverall).toBe(undefined);
});
