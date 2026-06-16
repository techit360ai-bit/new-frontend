# PR-D: Submit & Pitch + Founder Results — Design

**Status:** Approved
**Date:** 2026-06-16
**Branch:** `feat/messaging-phase1` (FE-only mock slice off new-frontend `main`, matching PR-B/PR-C posture)
**Predecessor:** PR-C (Validate & Build) — see `2026-05-30-pr-c-validate-and-build.md`
**Successor:** Startup Passport (②) + Hackathon→Startup promote pipeline (③), both depend on this.

## Goal

Complete the hackathon pipeline. A team in the Build stage submits their final pitch (demo link, deck, video, summary), transitions to `submitted-final`, then sees a read-only results view with a placement badge, their score breakdown, and mock judge feedback. Frontend-only, mock/in-memory — matches PR-B/PR-C exactly (no backend, no persistence, refresh wipes state).

After PR-D, a registered team can: submit a brief (PR-C) → log build check-ins (PR-C) → submit a final pitch → see deterministic mock judging results. This unblocks the Startup Passport and promote-to-startup sub-projects.

## Non-goals

- Real judging / org-side scoring UI. Judge feedback is deterministically mock-derived from the already-pinned `briefScore` + momentum. Org-side `HackathonDetail.tsx` is untouched.
- Real LLM, real cross-user identity, real backend persistence — all later. (PR-B's spec once labeled "real backend" as PR-D; the canonical PR-C handoff scopes PR-D as the FRONTEND Submit & Pitch + founder-side results view only. Build that.)
- New scoring engine. Results reuse the existing pinned `briefScore`; no re-run of `scoreBrief`.
- Multi-team picker in the Hackathon panel — still deferred (panel shows most-recent registration).
- Editing/withdrawing a submitted pitch. Submission locks on submit, like the brief.

## Architecture

### 1. Data model additions (`frontend/src/contexts/UserContext.tsx`)

Two new exported interfaces:

```ts
export interface FinalSubmission {
  demoUrl:     string;   // validated http(s) URL
  deckUrl:     string;   // validated http(s) URL
  videoUrl:    string;   // validated http(s) URL
  summary:     string;   // min 40 chars
  submittedAt: string;   // ISO timestamp; presence ⇒ locked + stage advanced
}

export interface JudgeFeedback {
  placement:  number;    // 1..cohortSize (deterministic mock rank)
  cohortSize: number;    // mock cohort size
  comments:   string[];  // canned judge strings keyed to score signals
  judgedAt:   string;    // ISO timestamp, pinned at submit
}
```

Extend `HackathonRegistration` (after `checkIns`):

```ts
  finalSubmission?: FinalSubmission;  // present once final pitch submitted
  judgeFeedback?:   JudgeFeedback;    // pinned at submit, never re-runs
```

One new updater on the context, mirroring `submitBrief`:

```ts
submitFinal: (teamId: string, submission: FinalSubmission, feedback: JudgeFeedback) => void;
```

Implementation (next to `submitBrief`, line ~442):

```ts
const submitFinal = (teamId: string, submission: FinalSubmission, feedback: JudgeFeedback) => {
  setFounderProfile((prev) => ({
    ...prev,
    hackathonRegistrations: prev.hackathonRegistrations.map((r) =>
      r.teamId === teamId
        ? { ...r, finalSubmission: submission, judgeFeedback: feedback, stage: "submitted-final" as const }
        : r,
    ),
  }));
};
```

Wire it through all three touch-points (same pattern as `submitBrief`): add to `UserContextType` interface (~line 277), to the provider `value` object (~line 502), and to the `useFounderProfile()` destructure + return (~line 563). The `stage` union already includes `"submitted-final"` — no union change needed.

### 2. Logic (`frontend/src/dashboard/_shared/hackathon/`)

**New `judgeComments.ts`** — canned judge strings, mirrors `critiques.ts` exactly (no logic, just a keyed lookup + accessor):

```ts
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
```

**New `results.ts`** — pure, deterministic `deriveJudgeFeedback`. Reads the already-pinned `briefScore` and recomputes momentum; no new scoring engine, no `scoreBrief` call, no randomness. Imports are type-only from `@/contexts/UserContext` (stripped at test runtime) plus relative runtime imports of `./momentum` and `./judgeComments`.

```ts
import type { HackathonRegistration, JudgeFeedback } from "@/contexts/UserContext";
import { computeMomentum } from "./momentum";
import { judgeComment } from "./judgeComments";

// Deterministic mock cohort. No randomness (would break the gate + resume).
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
```

Notes:
- `now` and `submittedAt` are passed in (caller owns `Date.now()` / `new Date().toISOString()` inside the event handler), keeping the function pure and unit-testable — same convention as `computeMomentum`.
- The caller (SubmitStage) sets `reg.finalSubmission` via `submitFinal`, but `deriveJudgeFeedback` is called with the freshly-built submission already merged so `hasDemo` is correct (see §3). The deriver reads `reg.finalSubmission?.demoUrl`; pass a `reg` that already carries the new submission, or read the demo flag from a passed arg — implementation passes the merged registration.

**Momentum bump on submit** — `momentum.ts` already special-cases `stage === "submitted-final"` (returns `nextAction: "complete"`, `"Submitted ✓"`). Add a small score bump for a completed final submission so the dashboard momentum reflects it. Minimal extension inside `computeMomentum`, not a rewrite:

```ts
  if (reg.finalSubmission) score += 15;   // final pitch shipped
```

placed alongside the existing additive signals (before the clamp). Then the existing `stage === "submitted-final"` early-return still fires for `nextAction`. This is the only change to `momentum.ts`.

### 3. Components (`frontend/src/dashboard/founders/section/components/incubation/hackathon/`)

**New `SubmitStage.tsx`** — replaces the `ComingInPRD` placeholder for `stage === "submit"`. Two modes, hooks hoisted above the early return (same pattern as `BriefStage`):

- **Pre-submit form** (when `!registration.finalSubmission`):
  - 4 fields: `demoUrl`, `deckUrl`, `videoUrl` (URL inputs), `summary` (textarea, min 40 chars).
  - URL validation: a field is valid when it parses as an `http(s)` URL. Use a small `isHttpUrl(s)` helper (`try { const u = new URL(s); return u.protocol === "http:" || u.protocol === "https:"; } catch { return false; }`). Inline per-field error text when non-empty-and-invalid; empty shows the helper, not an error.
  - Summary counter `{summary.trim().length}/40 min`, amber until satisfied (mirror BriefStage's counter styling).
  - Submit button disabled until all 3 URLs valid AND summary ≥ 40 chars.
  - On submit: build `FinalSubmission` (trimmed, `submittedAt: new Date().toISOString()`), merge into a local `reg` copy, call `deriveJudgeFeedback(merged, Date.now(), submittedAt)`, then `submitFinal(teamId, submission, feedback)`. `toast.success("Pitch submitted — results are in")`. No network call (no ai-router seam for final submission in this PR; the BuildStage `provisionTeamWorkspace`/`logHackathonCheckIn` best-effort calls are not replicated here).
- **Post-submit read-only** (when `registration.finalSubmission` exists): render `<ResultsView registration={registration} />`. SubmitStage owns the form; ResultsView owns results display.

**New `ResultsView.tsx`** — shown for `stage === "submitted-final"` (from the panel) and from SubmitStage's locked branch. Sections:
  - **Placement badge**: `#{placement} of {cohortSize}`, colored by standing (top third emerald / mid amber / lower slate — reuse `momentumColor` thresholds against `(1 - placement/cohortSize)*100` or a simple inline map). Headline like "Final results".
  - **Score breakdown**: reuse the PR-C BriefStage `ScoreBar` + `SUB_SCORES` display pattern over `registration.briefScore` (problemClarity / innovationGap / initialImpact + overall). Extract `ScoreBar` is currently local to `BriefStage`; either lift it into a tiny shared `ScoreBar.tsx` or duplicate the ~12-line component in ResultsView. Prefer duplication (one small presentational component) to avoid touching BriefStage — matches the "three similar lines beats premature abstraction" guidance; lift only if trivially clean.
  - **Judge comments**: `judgeFeedback.comments` as a bulleted list (same `•` styling as critiques).
  - **Locked submission**: read-only display of the 4 final fields with a `Lock` icon + "Locked" tag, mirroring BriefStage's locked-brief `<dl>`. Demo/deck/video render as external links (`<a target="_blank" rel="noreferrer">` with `ExternalLink` icon, matching BuildStage's workspace link).

Defensive empty states: if `briefScore` or `judgeFeedback` is somehow absent, render a minimal "Results unavailable" card rather than crashing (keeps hook order stable; mirrors BriefStage's `if (locked && brief && briefScore)` guard).

**Modify `HackathonPanel.tsx`**:
  - Replace `import`/usage of `ComingInPRD` and delete that component. Import `SubmitStage` and `ResultsView`.
  - `submit` stage content:
    ```tsx
    {activeStage === "submit" && (
      reg && reg.brief
        ? (reg.stage === "submitted-final"
            ? <ResultsView registration={reg} />
            : <SubmitStage registration={reg} />)
        : <NoTeam onRegister={() => setStage(reg ? "brief" : "register")} />
    )}
    ```
  - Gate: Submit requires a brief (same gate Build uses). Optionally also require `stage` to be `building`/`submitted` before allowing the form — but since the form itself is the submit action and ResultsView covers the post state, the brief gate is sufficient. Keep the existing Build-requires-brief redirect; no new redirect needed.

**Modify `StagePill.tsx`** — no code change needed; `pillState` in HackathonPanel already maps `submitted-final → 4`, completing the strip when reached. (StagePill is generic.) Listed here only to confirm it's covered.

**Modify `RegisteredTeamCard.tsx`** — the `NEXT_ACTION_CTA` map keys off `computeMomentum().nextAction`. For `submitted-final`, momentum returns `nextAction: "complete"`, currently mapped to `{ label: "Open team", stage: "build" }`. Update the `"complete"` entry to `{ label: "View results →", stage: "submit" }` so the dashboard CTA routes to the results view. The `cta.stage` type union must widen to `"brief" | "build" | "submit"`.

### 4. Error handling & boundaries

- Form validation is inline and synchronous (bad/empty URL → field error, short summary → counter stays amber, submit disabled). No network ⇒ no fetch failure paths.
- State is in-memory React context; refresh wipes (per PR-C). No localStorage, no backend.
- Each unit is isolated and independently reasoned:
  - `results.ts` / `judgeComments.ts` are pure (no React, no context) → unit-testable in the node gate.
  - `SubmitStage` / `ResultsView` are presentation consuming context + the pure deriver.
- `deriveJudgeFeedback` tolerates a missing `briefScore` (defaults to 0 / "fuzzy" branches) so it never throws.

### 5. Testing & verification

Local node gate (the established `test:local` harness — `npm run test:local` → `node --experimental-strip-types scripts/run-tests.mjs src`, vitest-compatible `test`/`expect` shim, resolves `@/` aliases + `.ts` extensions). Vitest proper cores on this box (SIGBUS); the strip-types harness is the working substitute. This is the "better than PR-B/C's tsc-only" gate the design promised.

**New `results.test.ts`** (co-located in `_shared/hackathon/`), covering `deriveJudgeFeedback`:
  - **Deterministic placement**: same input ⇒ same placement (call twice, `toBe`); a high-`briefScore` + high-momentum registration places strictly better (lower number) than a low one.
  - **Placement bounds**: always `1 ≤ placement ≤ cohortSize`, including degenerate inputs (no `briefScore`, empty `checkIns`, score 0 → placement near `cohortSize`; score 100 + momentum + demo → placement 1).
  - **Comment selection**: high overall ⇒ includes `strongOverall` string; low overall ⇒ `earlyOverall`; demo URL present ⇒ `demoShipped` appended, absent ⇒ not present; per-rubric branches (clear/fuzzy, sharp/soft, measurable/unmeasured) keyed off the matching sub-score threshold.
  - **`judgedAt`** echoes the passed `submittedAt`; `cohortSize` is the constant.
  - Build fixture registrations inline (no context); `briefScore` shaped per the `BriefScore` interface.

**Type-check**: `npm run build`'s `tsc -b` step (or `npx tsc -b --noEmit`) over the project — resolves `@/` via tsconfig paths, covers all touched files. (Single-file `tsc` can't resolve the alias; run the project build.)

**Tone / empty-state consistency**: no emoji in `<h1>`/`<h2>` (poster/badges in spans), no `animate-pulse`, no "Demo User", no bare `Date.now()`/`Math.random()` in render bodies (only inside event handlers), real names from `founderProfile.name`. Match existing stage card styling (slate/violet/emerald palette, rounded-xl borders).

Manual smoke is not browser-verifiable here (Vite SIGBUS, per project notes) — state this explicitly rather than claiming UI verification.

## File-by-file summary

| File | Change |
|---|---|
| `contexts/UserContext.tsx` | + `FinalSubmission`, `JudgeFeedback` interfaces; extend `HackathonRegistration`; + `submitFinal` updater (type, impl, provider value, `useFounderProfile`) |
| `_shared/hackathon/judgeComments.ts` | NEW — canned judge strings + `judgeComment()` |
| `_shared/hackathon/results.ts` | NEW — pure `deriveJudgeFeedback()` |
| `_shared/hackathon/results.test.ts` | NEW — node-gate unit tests |
| `_shared/hackathon/momentum.ts` | + `+15` bump when `finalSubmission` present |
| `incubation/hackathon/SubmitStage.tsx` | NEW — 4-field validated form + locked branch |
| `incubation/hackathon/ResultsView.tsx` | NEW — placement badge, score breakdown, judge comments, locked submission |
| `incubation/HackathonPanel.tsx` | wire SubmitStage/ResultsView; delete `ComingInPRD` |
| `incubation/hackathon/RegisteredTeamCard.tsx` | `"complete"` CTA → "View results →" / `stage: "submit"`; widen `cta.stage` union |

## Commit plan (vertical slices, gate each)

1. Data model: UserContext types + `submitFinal`. (`tsc`)
2. Logic: `judgeComments.ts` + `results.ts` + `results.test.ts` + momentum bump. (`test:local` + `tsc`)
3. UI: `SubmitStage.tsx` + `ResultsView.tsx`. (`tsc`)
4. Wiring: `HackathonPanel.tsx` + `RegisteredTeamCard.tsx`. (`tsc`)

Branch pushed as a new remote branch off `main` → `gh pr create` → `gh pr merge --merge` (per established workflow; verify `git branch --show-current` before each commit — recurring branch-switch gotcha).
