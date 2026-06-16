import { test, expect } from "vitest";
import type { HackathonRegistration, BriefScore, FinalSubmission } from "@/contexts/UserContext";
import { deriveJudgeFeedback } from "./results";

const NOW = 1_700_000_000_000; // fixed epoch ms — deterministic, no Date.now()
const AT = "2026-06-16T00:00:00.000Z";

function briefScore(overall: number, pc = overall, ig = overall, ii = overall): BriefScore {
  return {
    problemClarity: pc,
    innovationGap: ig,
    initialImpact: ii,
    overall,
    critiques: { problemClarity: [], innovationGap: [], initialImpact: [] },
    computedAt: AT,
  };
}

const DEMO: FinalSubmission = {
  demoUrl: "https://demo.example.com",
  deckUrl: "https://deck.example.com",
  videoUrl: "https://video.example.com",
  summary: "x".repeat(40),
  submittedAt: AT,
};

function reg(overrides: Partial<HackathonRegistration> = {}): HackathonRegistration {
  return {
    hackathonId: "h1",
    teamId: "t1",
    teamName: "Team",
    teamSize: 3,
    role: "leader",
    inviteToken: "tok",
    registeredAt: AT,
    members: [],
    openRoles: [],
    stage: "submitted-final",
    checkIns: [],
    ...overrides,
  };
}

test("placement is deterministic for the same input", () => {
  const r = reg({ briefScore: briefScore(80), finalSubmission: DEMO });
  const a = deriveJudgeFeedback(r, NOW, AT);
  const b = deriveJudgeFeedback(r, NOW, AT);
  expect(a.placement).toBe(b.placement);
  expect(a.comments).toEqual(b.comments);
});

test("higher score + momentum places strictly better (lower) than lower", () => {
  const strong = reg({ briefScore: briefScore(95), finalSubmission: DEMO });
  const weak = reg({ briefScore: briefScore(10) });
  const better = deriveJudgeFeedback(strong, NOW, AT).placement
    < deriveJudgeFeedback(weak, NOW, AT).placement;
  expect(better).toBe(true);
});

test("placement stays within [1, cohortSize] for degenerate and maxed inputs", () => {
  const empty = deriveJudgeFeedback(reg(), NOW, AT); // no briefScore, no check-ins
  expect(empty.placement >= 1 && empty.placement <= empty.cohortSize).toBe(true);
  expect(empty.placement).toBe(empty.cohortSize); // floor of the field

  const maxed = deriveJudgeFeedback(
    reg({
      briefScore: briefScore(100),
      finalSubmission: DEMO,
      members: [1, 2, 3, 4, 5].map((n) => ({ collaboratorId: `c${n}`, name: `M${n}`, role: "eng", acceptedAt: AT })),
      checkIns: Array.from({ length: 10 }, (_, i) => ({
        id: `k${i}`, loggedAt: AT, status: "on-track" as const, update: "u",
      })),
    }),
    NOW,
    AT,
  );
  expect(maxed.placement).toBe(1);
});

test("overall tier selects the headline comment", () => {
  expect(deriveJudgeFeedback(reg({ briefScore: briefScore(80) }), NOW, AT).comments[0])
    .toContain("standout");
  expect(deriveJudgeFeedback(reg({ briefScore: briefScore(60) }), NOW, AT).comments[0])
    .toContain("well-rounded");
  expect(deriveJudgeFeedback(reg({ briefScore: briefScore(20) }), NOW, AT).comments[0])
    .toContain("another iteration");
});

test("demo presence appends the demoShipped comment, absence omits it", () => {
  const withDemo = deriveJudgeFeedback(reg({ briefScore: briefScore(50), finalSubmission: DEMO }), NOW, AT);
  const without = deriveJudgeFeedback(reg({ briefScore: briefScore(50) }), NOW, AT);
  expect(withDemo.comments.some((c) => c.includes("working demo"))).toBe(true);
  expect(without.comments.some((c) => c.includes("working demo"))).toBe(false);
});

test("per-rubric branches key off the matching sub-score threshold", () => {
  const clear = deriveJudgeFeedback(reg({ briefScore: briefScore(50, 80, 10, 10) }), NOW, AT);
  expect(clear.comments.some((c) => c.includes("problem framing"))).toBe(true);
  expect(clear.comments.some((c) => c.includes("credible wedge"))).toBe(false);

  const fuzzy = deriveJudgeFeedback(reg({ briefScore: briefScore(50, 10, 10, 10) }), NOW, AT);
  expect(fuzzy.comments.some((c) => c.includes("sharper problem statement"))).toBe(true);
});

test("judgedAt echoes submittedAt and cohortSize is the constant", () => {
  const f = deriveJudgeFeedback(reg({ briefScore: briefScore(50) }), NOW, "2026-01-02T03:04:05.000Z");
  expect(f.judgedAt).toBe("2026-01-02T03:04:05.000Z");
  expect(f.cohortSize).toBe(12);
});
