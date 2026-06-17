# Startup Passport — Design

**Status:** Approved
**Date:** 2026-06-16
**Branch:** new feature branch off new-frontend `main` (FE-only mock slice, matches PR-B/C/D + PR-D posture)
**Predecessor:** PR-D (Submit & Pitch + founder results) — see `2026-06-16-pr-d-submit-and-pitch-design.md`. Passport consumes the `judgeFeedback` / `finalSubmission` / `briefScore` PR-D pinned onto `HackathonRegistration`.
**Sub-project:** ② of the hackathon completion arc (① PR-D done; ③ promote-to-startup pipeline is the remaining follow-up).

## Goal

Give founders a persistent, cross-event **Startup Passport**: an accumulated record of their hackathon participation (events entered, placements, brief scores, judge feedback, demos shipped, teammates) that (A) shows on their founder profile, (B) is discoverable by investors in the Deal Intelligence screen, and (C) links into the founder/collaborator network via teammate chips.

Frontend-only, mock/in-memory. The Passport is a **pure derived view** over the existing `founderProfile.hackathonRegistrations[]` — no new context state, no updater, no persistence. Refresh wipes state (per PR-B/C/D).

## Non-goals

- New scoring engine / composite "Passport Score". The Passport aggregates **only real computed signals** already on the registration (placement, briefScore.overall, momentum, check-in count, demo presence). CBS/TSS/CRS/GSIS are mock literals elsewhere in the app and are **not** used.
- New persisted state. The Passport is recomputed on render via `derivePassport(...)`; nothing is pinned or stored.
- Real cross-user identity / backend. Investor discoverability is demonstrated in the existing single-user in-memory mock world (see §Surface B).
- Collaborator passports. Scope is the **founder's** hackathon history. (Teammates are linked, not given their own passport here.)
- Editing/curating the Passport. It is a faithful read-only projection of registrations.
- WS6 Contribution Records backend, CBS/TSS/CRS computation, dual-attribution persistence — all out of scope; the Passport is the FE-only, hackathon-sourced analogue.

## Architecture

Three surfaces, one shared pure core. Build order: core logic → profile section (+ network links) → investor surface.

```
_shared/passport/passport.ts        derivePassport(regs, now) → Passport      (pure, tested)
_shared/passport/passportBadges.ts  canned badge defs + deriveBadges()        (pure, tested)
            │
            ├── Surface A: founders/.../founder/StartupPassport.tsx  (in FounderProfile.tsx)
            │       └── Surface C: teammate chips → /matchresults
            └── Surface B: investors/.../investor/DealIntelligence.tsx  (+ mockData passport)
```

### 1. Core logic (`frontend/src/dashboard/_shared/passport/`)

**`passport.ts`** — pure, deterministic, no React. `now` passed in by the caller (same convention as `computeMomentum`/`deriveJudgeFeedback`). Reuses `computeMomentum` for the per-record momentum.

```ts
import type { HackathonRegistration } from "@/contexts/UserContext";
import { computeMomentum } from "../hackathon/momentum";
import { deriveBadges, type PassportBadge } from "./passportBadges";

export interface PassportTeammate {
  collaboratorId: string;
  name: string;
  role: string;
}

export interface PassportRecord {
  hackathonId: string;
  teamName: string;
  role: "leader" | "member";
  stage: HackathonRegistration["stage"];
  completed: boolean;            // stage === "submitted-final"
  placement?: number;            // judgeFeedback.placement
  cohortSize?: number;           // judgeFeedback.cohortSize
  briefOverall?: number;         // briefScore.overall
  topJudgeComment?: string;      // judgeFeedback.comments[0], if any
  momentum: number;              // computeMomentum(reg, now).score
  demoShipped: boolean;          // !!finalSubmission?.demoUrl
  checkInCount: number;          // checkIns.length
  submittedAt?: string;          // finalSubmission.submittedAt
  teammates: PassportTeammate[]; // from reg.members
}

export interface Passport {
  hackathonsEntered: number;
  hackathonsCompleted: number;
  bestPlacement?: { placement: number; cohortSize: number };  // lowest placement among completed
  avgBriefScore?: number;        // mean of briefScore.overall where present, rounded
  demosShipped: number;
  totalCheckIns: number;
  badges: PassportBadge[];
  records: PassportRecord[];     // newest first (by registeredAt desc)
  hasActivity: boolean;          // entered > 0
}

export function derivePassport(regs: HackathonRegistration[], now: number): Passport;
```

Derivation rules (all deterministic):
- One `PassportRecord` per registration; `records` sorted by `registeredAt` descending (newest first).
- `bestPlacement` = the completed record with the smallest `placement` (ties → smallest `cohortSize` then first). Undefined if no completed record has a placement.
- `avgBriefScore` = rounded mean of all `briefOverall` values present; undefined if none.
- `momentum` per record via `computeMomentum(reg, now)` (already accounts for the PR-D `+15` final-submission bump).
- `badges` via `deriveBadges(passportStatsSoFar)` — see below.
- Empty input ⇒ `{ hackathonsEntered: 0, …, badges: [], records: [], hasActivity: false }`.

**`passportBadges.ts`** — canned badge catalog + pure rule evaluator (mirrors `judgeComments.ts` / `critiques.ts`: no logic copy in the deriver).

```ts
export interface PassportBadge { id: string; label: string; description: string; }

// Deterministic, order-stable. Input is the already-computed records + rollups.
export function deriveBadges(input: {
  records: { placement?: number; completed: boolean; briefOverall?: number;
             demoShipped: boolean; checkInCount: number }[];
  hackathonsEntered: number;
  demosShipped: number;
}): PassportBadge[];
```

Badge rules (a badge appears at most once, in this fixed order):

| id | label | rule |
|---|---|---|
| `champion` | Champion | any completed record with `placement === 1` |
| `podium` | Top-3 Finish | any completed record with `placement <= 3` |
| `demo-shipper` | Demo Shipper | `demosShipped >= 1` |
| `serial-builder` | Serial Builder | `hackathonsEntered >= 3` |
| `strong-brief` | Strong Brief | any record with `briefOverall >= 80` |
| `consistent` | Consistent Builder | any record with `checkInCount >= 5` |

### 2. Surface A — Founder profile section (`founders/.../founder/StartupPassport.tsx`)

New presentational component, consumes `derivePassport(founderProfile.hackathonRegistrations, Date.now())` (the `Date.now()` lives in a `useMemo` keyed on the registrations array — not in render body, per the tone rules). Rendered inside `FounderProfile.tsx` as a new section **between Endorsements (~line 239) and Pinned work (~line 265)**.

Layout (light theme, matches the rest of `FounderProfile.tsx` — slate/violet/emerald, `rounded-xl` borders):
- **Header**: "Startup Passport" + a subtle "Visible to investors" pill (truthful — Surface B injects it).
- **Stat cards** (mirror `CollabProfile` reputation strip — 4 cards): Hackathons entered · Best placement (`#X of Y` or "—") · Avg brief score (or "—") · Demos shipped.
- **Badges grid** (mirror `CollabProfile`/`Reputation` badge pattern): icon + label chips for each earned `PassportBadge`; hidden if none.
- **Record cards** (one per `PassportRecord`, newest first): team name + hackathon + role; placement badge (reuse PR-D `ResultsView` placement-color band logic) and/or stage pill if not completed; a compact brief-score bar (reuse the `ScoreBar`/`momentumColor` pattern) for `briefOverall`; `topJudgeComment` as a single quoted line; **teammate chips** (Surface C).
- **Empty state**: when `!passport.hasActivity`, a single card — "No hackathon history yet. Enter a hackathon to start your passport." with a link to `/incubation-hub?panel=hackathon`.

Defensive: every optional field guarded (`placement?`, `briefOverall?`, etc.) so partial registrations (registered-only, brief-but-no-final) render cleanly.

### 3. Surface C — Founder-network links

Each record card renders its `teammates` as chips: `{name} · {role}`. Each chip is a `<Link to="/matchresults">` (the existing founder/collaborator network/discovery route already used in `FounderProfile.tsx`). No new route, no new data — `teammates` comes straight from `registration.members`. If a record has no teammates (solo / no accepted members), the chip row is omitted.

### 4. Surface B — Investor-discoverable (`investors/.../investor/DealIntelligence.tsx`)

Make the founder's real passport discoverable in the Deal Intelligence deal-flow, and enrich the mock startups so the track-record filter is meaningful.

**4a. Passport summary on the Startup type.** Extend the `Startup` interface in `investors/section/data/mockData.ts` with an optional field (additive, non-breaking):

```ts
export interface PassportSummary {
  hackathonsEntered: number;
  bestPlacement?: number;
  cohortSize?: number;
  demosShipped: number;
  avgBriefScore?: number;
}
// on Startup:
passport?: PassportSummary;
```

Attach hand-written `passport` summaries to ~3 of the existing `mockStartups` (varied: a champion, a mid-pack, one with none) so the new filter visibly partitions the list.

**4b. Inject the logged-in founder.** `DealIntelligence` calls `useFounderProfile()`, derives the founder's passport, and — when `passport.hasActivity` — builds one `Startup`-shaped entry from real founder fields + the derived passport, and prepends it to the working list (before filtering/sorting). Mapping:

| Startup field | Source |
|---|---|
| `id` | `"founder-self"` (stable, avoids collisions) |
| `name` | `founderProfile.startupName` (fallback `founderProfile.name`) |
| `sector` | `founderProfile.industries[0]` ?? `"—"` |
| `region` | `founderProfile.location` ?? `"—"` |
| `readinessScore` | `passport.avgBriefScore ?? 0` (keeps the readiness filter coherent) |
| `executionVelocity` | best record `momentum` (or `0`) |
| `founderReliability` | `passport.avgBriefScore ?? 0` |
| `mrr`, `revenueGrowth`, `betaRetention` | `founderProfile.revenueMonthly` / `0` / `0` |
| `riskLevel` | `"low"` |
| `complianceVerified`, `aiGovernanceVerified` | `false` |
| `burnEfficiency`, `pivotFrequency`, `experimentVelocity`, `velocityDelta`, `revenueDelta`, `investorsWatching` | neutral defaults (`0` / `1`) |
| `milestones`, `riskMetrics`, `about` | minimal valid empties (`[]` / zeroed / placeholder strings) |
| `passport` | the derived `PassportSummary` |

A small `founderToStartup(founderProfile, passport)` helper (co-located in DealIntelligence or a tiny adapter module) builds this so the component stays readable. The injected entry is just another card — existing filters/sort apply uniformly.

**4c. Track-record filter + card badge.**
- Filter: add to the existing filter state a `hasTrackRecord` checkbox and a `minBestPlacement` slider (range 0–12, **default `0` = off**) under a new "Hackathon Track Record" `FilterSection`. Predicates: `hasTrackRecord ⇒ startup.passport && passport.hackathonsEntered > 0`; `minBestPlacement > 0 ⇒ passport?.bestPlacement != null && passport.bestPlacement <= minBestPlacement` (a lower number = better, so the slider reads "top N placement"). When `minBestPlacement === 0` the placement predicate is skipped entirely. Startups without a passport fail both track-record predicates when active (expected). Both are added to the existing Reset Filters handler.
- Card: in `StartupCard` (and a compact line in `StartupListItem`), when `startup.passport` is present, render a track-record row styled for the dark terminal theme: `🏆 Best #{bestPlacement} of {cohortSize} · {hackathonsEntered} hackathons · {demosShipped} demo(s)`. (Trophy rendered in a `<span>`, not a heading — tone rule.)

No backend calls added; the existing `fetchDealFlow()` EVI-I ranking path is untouched (the injected founder entry simply won't be in the backend ranking and falls to the mock-order tail, which is fine).

## Error handling & boundaries

- `derivePassport` / `deriveBadges` are pure and total — empty arrays and partial registrations yield a valid `Passport` (no throws). Unit-tested.
- All components are presentational and guard every optional field; the profile section and the injected card render from already-validated context data (no network, no fetch failures).
- State is in-memory React context; refresh wipes (per PR-D). No localStorage, no backend.
- Each unit is independently reasoned: `passport.ts`/`passportBadges.ts` testable alone; `StartupPassport.tsx` consumes context + the pure deriver; the DealIntelligence change is additive (optional field + prepended entry + extra filter) and leaves the existing mock/ranking flow intact.

## Testing & verification

**Local node gate** (`npm run test:local` → `scripts/run-tests.mjs`, the node strip-types harness; vitest proper cores/SIGBUS on this box). NOTE: the gate's `expect` shim supports `toBe`/`toEqual`/`toContain`/`toHaveLength`/`toBeTruthy`/`toBeFalsy`/`toBeNull`/`.not` only — **no numeric matchers**; express comparisons as booleans (`expect(a < b).toBe(true)`), as done in PR-D's `results.test.ts`.

**`passport.test.ts`** — covers `derivePassport` + badges:
- Aggregation: entered/completed counts, `demosShipped`, `totalCheckIns` sum correctly across mixed registrations.
- `bestPlacement`: picks the smallest placement among completed records; undefined when none completed.
- `avgBriefScore`: rounded mean over present scores; undefined when none.
- `records` order: newest `registeredAt` first.
- Badges: each rule fires on a matching fixture and is absent otherwise; order is stable; `champion` and `podium` can co-occur.
- Edge cases: empty `[]` ⇒ `hasActivity:false`, empty records/badges; a registered-only reg (no brief/final) ⇒ record with undefined placement/briefOverall, `completed:false`, no throw.

**Type-check**: `tsc -b --noEmit` over the project (resolves `@/` paths; covers all touched files). Pre-existing shadcn vendor errors (`calendar.tsx`, `resizable.tsx`) are unrelated and ignored.

**Tone/consistency**: no emoji in `<h1>`/`<h2>` (trophy/badges in `<span>`), no `animate-pulse`, real names from context, no bare `Date.now()`/`Math.random()` in render bodies (Passport derivation wrapped in `useMemo`). Surface A matches the light `FounderProfile` palette; Surface B matches the dark DealIntelligence terminal palette.

Not browser-verifiable here (Vite SIGBUS, per project notes) — state that rather than claiming UI verification.

## File-by-file summary

| File | Change |
|---|---|
| `_shared/passport/passport.ts` | NEW — `Passport`/`PassportRecord` types + pure `derivePassport` |
| `_shared/passport/passportBadges.ts` | NEW — `PassportBadge` + canned catalog + pure `deriveBadges` |
| `_shared/passport/passport.test.ts` | NEW — node-gate unit tests |
| `founders/.../founder/StartupPassport.tsx` | NEW — profile passport section (+ teammate chips = Surface C) |
| `founders/.../founder/FounderProfile.tsx` | MODIFY — render `<StartupPassport>` between Endorsements and Pinned work |
| `investors/.../data/mockData.ts` | MODIFY — `PassportSummary` type + `passport?` on `Startup` + summaries on ~3 mock startups |
| `investors/.../investor/DealIntelligence.tsx` | MODIFY — inject founder entry, track-record filter section, card track-record badge |

## Commit plan (vertical slices, gate each)

1. Core: `passport.ts` + `passportBadges.ts` + `passport.test.ts`. (`test:local` + `tsc`)
2. Surface A + C: `StartupPassport.tsx` + wire into `FounderProfile.tsx` (teammate chips included). (`tsc`)
3. Surface B: `mockData.ts` passport field/data + `DealIntelligence.tsx` injection/filter/badge. (`tsc`)

Branch pushed as a new remote branch off `main` → `gh pr create` → `gh pr merge --merge` (verify `git branch --show-current` before each commit — recurring branch-switch gotcha).
