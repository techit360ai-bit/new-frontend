// deriveJudgeFeedback — pure, deterministic mock judging for a final hackathon
// submission. Reuses the already-pinned briefScore (no re-run of scoreBrief) +
// recomputed momentum to produce a placement and canned judge comments. No
// randomness (would break the gate). now + submittedAt are passed in so the
// caller owns Date.now()/new Date() — same convention as computeMomentum.

import type { HackathonRegistration, JudgeFeedback } from "@/contexts/UserContext";
import { computeMomentum } from "./momentum";
import { judgeComment } from "./judgeComments";

// Deterministic mock cohort size.
const COHORT_SIZE = 12;

export function deriveJudgeFeedback(
  reg: HackathonRegistration,
  now: number,
  submittedAt: string,
): JudgeFeedback {
  const score = reg.briefScore;                 // pinned in PR-C; may be undefined defensively
  const overall = score?.overall ?? 0;
  const momentum = computeMomentum(reg, now).score;
  const hasDemo = !!reg.finalSubmission?.demoUrl;

  // Composite rank signal: brief quality (0-100) + momentum (0-100) + demo credit.
  // Higher composite ⇒ better (lower) placement. Deterministic, monotonic.
  const composite = overall * 0.6 + momentum * 0.4 + (hasDemo ? 5 : 0);

  // Map composite [0..105] onto placement [1..COHORT_SIZE], clamped.
  const ratio = Math.min(1, composite / 105);
  const placement = Math.max(1, Math.min(COHORT_SIZE, Math.round(COHORT_SIZE - ratio * (COHORT_SIZE - 1))));

  const comments: string[] = [];
  if (overall >= 75) comments.push(judgeComment("strongOverall"));
  else if (overall >= 50) comments.push(judgeComment("solidOverall"));
  else comments.push(judgeComment("earlyOverall"));

  comments.push(judgeComment(score && score.problemClarity >= 70 ? "clearProblem" : "fuzzyProblem"));
  comments.push(judgeComment(score && score.innovationGap >= 70 ? "sharpEdge" : "softEdge"));
  comments.push(judgeComment(score && score.initialImpact >= 70 ? "measurable" : "unmeasured"));
  comments.push(judgeComment(momentum >= 60 ? "highMomentum" : "lowMomentum"));
  if (hasDemo) comments.push(judgeComment("demoShipped"));

  return { placement, cohortSize: COHORT_SIZE, comments, judgedAt: submittedAt };
}
