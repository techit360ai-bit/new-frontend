// Canned judge strings for the mock hackathon results view.
// Keyed by score signal. results.ts pulls from here so it carries no copy of
// its own — mirrors critiques.ts. No real LLM, no judging — deterministic.

export type JudgeSignal =
  | "strongOverall" | "solidOverall" | "earlyOverall"
  | "clearProblem"  | "fuzzyProblem"
  | "sharpEdge"     | "softEdge"
  | "measurable"    | "unmeasured"
  | "highMomentum"  | "lowMomentum"
  | "demoShipped";

const COMMENTS: Record<JudgeSignal, string> = {
  strongOverall: "A standout submission — the panel ranked this near the top of the cohort.",
  solidOverall:  "A solid, well-rounded build that held up against the field.",
  earlyOverall:  "Promising direction, but the panel felt it needs another iteration to compete.",
  clearProblem:  "Judges singled out the problem framing — they knew exactly who hurts and why.",
  fuzzyProblem:  "The panel wanted a sharper problem statement; the target user read as broad.",
  sharpEdge:     "Differentiation landed — judges saw a credible wedge against alternatives.",
  softEdge:      "Judges weren't fully convinced the edge is defensible versus what exists.",
  measurable:    "The success metric gave the panel something concrete to evaluate against.",
  unmeasured:    "Judges noted the impact was hard to measure — quantify the win next time.",
  highMomentum:  "Consistent build cadence stood out — the team clearly shipped throughout.",
  lowMomentum:   "The panel saw limited build activity; more visible progress would strengthen this.",
  demoShipped:   "A working demo at submission earned credit — judges value something they can try.",
};

export function judgeComment(signal: JudgeSignal): string {
  return COMMENTS[signal] ?? "";
}
