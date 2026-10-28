# Startup Passport Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a pure-derived, in-memory "Startup Passport" that surfaces a founder's accumulated hackathon history on their profile, makes it investor-discoverable in Deal Intelligence, and links teammates into the network.

**Architecture:** A pure deriver (`derivePassport`) aggregates real signals from `founderProfile.hackathonRegistrations[]` (no new context state, no persistence). Three presentational surfaces consume it: a profile section (`StartupPassport.tsx`), teammate chips linking to `/matchresults`, and a founder-injection + filter in the investor `DealIntelligence` screen.

**Tech Stack:** React 18 + TypeScript, React Router, Tailwind, lucide-react icons. Local test gate: `npm run test:local` (node `--experimental-strip-types` harness; vitest proper SIGBUS-cores on this box). Type gate: `tsc -b --noEmit`.

**Branch:** `feat/startup-passport` (already created off `origin/main`; the spec is already committed there).

**Spec:** `docs/superpowers/specs/2026-06-16-startup-passport-design.md`

**CRITICAL — test gate matcher constraint:** the local `expect` shim supports ONLY `toBe`, `toEqual`, `toContain`, `toHaveLength`, `toBeTruthy`, `toBeFalsy`, `toBeNull`, and `.not.toBe` / `.not.toContain`. There are **no numeric matchers** (`toBeGreaterThan`, etc.). Express all comparisons as booleans: `expect(a < b).toBe(true)`. All test code below already follows this.

**Run all commands from `/home/faithsax/new-frontend/frontend`** (the Vite app root) unless stated otherwise.

**Before EVERY commit:** verify you are on the feature branch — `git branch --show-current` must print `feat/startup-passport`. The session intermittently checks out `main` between turns (known gotcha). If it shows `main`, run `git checkout feat/startup-passport` first.

---

## File Structure

| File | Responsibility |
|---|---|
| `src/dashboard/_shared/passport/passportBadges.ts` | NEW — `PassportBadge` type, canned badge catalog, pure `deriveBadges()` |
| `src/dashboard/_shared/passport/passport.ts` | NEW — `Passport`/`PassportRecord`/`PassportTeammate` types + pure `derivePassport()` |
| `src/dashboard/_shared/passport/passport.test.ts` | NEW — node-gate unit tests for both pure modules |
| `src/dashboard/founders/section/components/founder/StartupPassport.tsx` | NEW — profile passport section (incl. teammate chips → network) |
| `src/dashboard/founders/section/components/founder/FounderProfile.tsx` | MODIFY — render `<StartupPassport>` between Endorsements and Pinned work |
| `src/dashboard/investors/section/data/mockData.ts` | MODIFY — `PassportSummary` type, `passport?` on `Startup`, summaries on 3 mock startups |
| `src/dashboard/investors/section/components/investor/DealIntelligence.tsx` | MODIFY — inject founder entry, track-record filter, card badge |

---

## Task 1: Passport badge catalog + `deriveBadges` (pure)

**Files:**
- Create: `src/dashboard/_shared/passport/passportBadges.ts`
- Test: `src/dashboard/_shared/passport/passport.test.ts` (created here, extended in Task 2)

- [ ] **Step 1: Write the failing test**

Create `src/dashboard/_shared/passport/passport.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:local`
Expected: FAIL — cannot resolve `./passportBadges` / `deriveBadges is not a function`.

- [ ] **Step 3: Write minimal implementation**

Create `src/dashboard/_shared/passport/passportBadges.ts`:

```ts
// Canned passport badge catalog + pure, deterministic rule evaluator.
// Mirrors judgeComments.ts / critiques.ts — the deriver carries no copy of
// the badge copy. No randomness. A badge appears at most once, in catalog order.

export interface PassportBadge {
  id: string;
  label: string;
  description: string;
}

interface BadgeRecordInput {
  placement?: number;
  completed: boolean;
  briefOverall?: number;
  demoShipped: boolean;
  checkInCount: number;
}

export interface BadgeInput {
  records: BadgeRecordInput[];
  hackathonsEntered: number;
  demosShipped: number;
}

// Catalog order IS display order. Each entry: badge + predicate over the input.
const CATALOG: { badge: PassportBadge; earned: (i: BadgeInput) => boolean }[] = [
  {
    badge: { id: "champion", label: "Champion", description: "Placed 1st in a hackathon." },
    earned: (i) => i.records.some((r) => r.completed && r.placement === 1),
  },
  {
    badge: { id: "podium", label: "Top-3 Finish", description: "Placed in the top 3 of a hackathon." },
    earned: (i) => i.records.some((r) => r.completed && r.placement != null && r.placement <= 3),
  },
  {
    badge: { id: "demo-shipper", label: "Demo Shipper", description: "Shipped a working demo at submission." },
    earned: (i) => i.demosShipped >= 1,
  },
  {
    badge: { id: "serial-builder", label: "Serial Builder", description: "Entered 3 or more hackathons." },
    earned: (i) => i.hackathonsEntered >= 3,
  },
  {
    badge: { id: "strong-brief", label: "Strong Brief", description: "Scored 80+ on an idea brief." },
    earned: (i) => i.records.some((r) => r.briefOverall != null && r.briefOverall >= 80),
  },
  {
    badge: { id: "consistent", label: "Consistent Builder", description: "Logged 5+ check-ins in a single build." },
    earned: (i) => i.records.some((r) => r.checkInCount >= 5),
  },
];

export function deriveBadges(input: BadgeInput): PassportBadge[] {
  return CATALOG.filter((c) => c.earned(input)).map((c) => c.badge);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:local`
Expected: PASS — the 5 new tests pass (existing suite total grows; "0 failed").

- [ ] **Step 5: Commit**

```bash
git branch --show-current   # must print feat/startup-passport
git add src/dashboard/_shared/passport/passportBadges.ts src/dashboard/_shared/passport/passport.test.ts
git commit -m "feat(passport): badge catalog + pure deriveBadges"
```

---

## Task 2: `derivePassport` (pure aggregator)

**Files:**
- Create: `src/dashboard/_shared/passport/passport.ts`
- Test: `src/dashboard/_shared/passport/passport.test.ts` (append)

- [ ] **Step 1: Write the failing test**

Append to `src/dashboard/_shared/passport/passport.test.ts`:

```ts
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
  // newest first: teamId b (2026-06-10) before teamId a (2026-06-01)
  expect(p.records[0].teammates[0].collaboratorId).toBe("c1");
  expect(p.records[1].teammates).toHaveLength(0);
});

test("a registered-only reg yields a record without throwing", () => {
  const p = derivePassport([reg({ teamId: "a", stage: "registered" })], NOW);
  expect(p.records[0].completed).toBe(false);
  expect(p.records[0].placement).toBe(undefined);
  expect(p.records[0].briefOverall).toBe(undefined);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:local`
Expected: FAIL — cannot resolve `./passport` / `derivePassport is not a function`.

- [ ] **Step 3: Write minimal implementation**

Create `src/dashboard/_shared/passport/passport.ts`:

```ts
// derivePassport — pure, deterministic aggregation of a founder's hackathon
// history into a Passport view. Reads only real signals already pinned on the
// registrations (placement, briefScore, momentum, check-ins, demo). No new
// state, no persistence, no randomness. now is passed in (caller owns Date.now()).

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
  completed: boolean;
  placement?: number;
  cohortSize?: number;
  briefOverall?: number;
  topJudgeComment?: string;
  momentum: number;
  demoShipped: boolean;
  checkInCount: number;
  submittedAt?: string;
  teammates: PassportTeammate[];
}

export interface Passport {
  hackathonsEntered: number;
  hackathonsCompleted: number;
  bestPlacement?: { placement: number; cohortSize: number };
  avgBriefScore?: number;
  demosShipped: number;
  totalCheckIns: number;
  badges: PassportBadge[];
  records: PassportRecord[];
  hasActivity: boolean;
}

function toRecord(reg: HackathonRegistration, now: number): PassportRecord {
  const completed = reg.stage === "submitted-final";
  return {
    hackathonId: reg.hackathonId,
    teamName: reg.teamName,
    role: reg.role,
    stage: reg.stage,
    completed,
    placement: reg.judgeFeedback?.placement,
    cohortSize: reg.judgeFeedback?.cohortSize,
    briefOverall: reg.briefScore?.overall,
    topJudgeComment: reg.judgeFeedback?.comments?.[0],
    momentum: computeMomentum(reg, now).score,
    demoShipped: !!reg.finalSubmission?.demoUrl,
    checkInCount: (reg.checkIns ?? []).length,
    submittedAt: reg.finalSubmission?.submittedAt,
    teammates: (reg.members ?? []).map((m) => ({
      collaboratorId: m.collaboratorId,
      name: m.name,
      role: m.role,
    })),
  };
}

export function derivePassport(regs: HackathonRegistration[], now: number): Passport {
  const records = [...regs]
    .sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime())
    .map((r) => toRecord(r, now));

  const completedWithPlacement = records.filter((r) => r.completed && r.placement != null);
  let bestPlacement: Passport["bestPlacement"];
  for (const r of completedWithPlacement) {
    if (
      !bestPlacement ||
      r.placement! < bestPlacement.placement ||
      (r.placement! === bestPlacement.placement && (r.cohortSize ?? 0) < bestPlacement.cohortSize)
    ) {
      bestPlacement = { placement: r.placement!, cohortSize: r.cohortSize ?? 0 };
    }
  }

  const briefScores = records.map((r) => r.briefOverall).filter((s): s is number => s != null);
  const avgBriefScore = briefScores.length
    ? Math.round(briefScores.reduce((a, b) => a + b, 0) / briefScores.length)
    : undefined;

  const demosShipped = records.filter((r) => r.demoShipped).length;

  const badges = deriveBadges({
    records: records.map((r) => ({
      placement: r.placement,
      completed: r.completed,
      briefOverall: r.briefOverall,
      demoShipped: r.demoShipped,
      checkInCount: r.checkInCount,
    })),
    hackathonsEntered: records.length,
    demosShipped,
  });

  return {
    hackathonsEntered: records.length,
    hackathonsCompleted: records.filter((r) => r.completed).length,
    bestPlacement,
    avgBriefScore,
    demosShipped,
    totalCheckIns: records.reduce((sum, r) => sum + r.checkInCount, 0),
    badges,
    records,
    hasActivity: records.length > 0,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:local`
Expected: PASS — all passport tests pass, "0 failed".

- [ ] **Step 5: Type-check**

Run: `npx tsc -b --noEmit 2>&1 | grep -E "passport" || echo "no passport type errors"`
Expected: `no passport type errors` (pre-existing `calendar.tsx`/`resizable.tsx` errors may print but contain no "passport").

- [ ] **Step 6: Commit**

```bash
git branch --show-current   # must print feat/startup-passport
git add src/dashboard/_shared/passport/passport.ts src/dashboard/_shared/passport/passport.test.ts
git commit -m "feat(passport): pure derivePassport aggregator"
```

---

## Task 3: `StartupPassport.tsx` profile section (Surface A + C)

**Files:**
- Create: `src/dashboard/founders/section/components/founder/StartupPassport.tsx`
- Reference (read for palette/props): `src/dashboard/founders/section/components/founder/FounderProfile.tsx`, `src/dashboard/_shared/hackathon/momentum.ts` (`momentumColor`)

This is a presentational component (no unit test — the project does not test presentational React; gate is `tsc`). Follow the light slate/violet/emerald palette and `rounded-xl border border-slate-200 bg-white` card idiom used throughout `FounderProfile.tsx`.

- [ ] **Step 1: Create the component**

Create `src/dashboard/founders/section/components/founder/StartupPassport.tsx`:

```tsx
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Award, Trophy, Users } from "lucide-react";
import { useFounderProfile } from "@/contexts/UserContext";
import { derivePassport, type PassportRecord } from "@/dashboard/_shared/passport/passport";
import { momentumColor } from "@/dashboard/_shared/hackathon/momentum";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-slate-200 rounded-xl p-4 bg-white">
      <p className="text-2xl font-bold text-slate-900 leading-none">{value}</p>
      <p className="text-[11px] text-slate-500 uppercase tracking-wider mt-1.5">{label}</p>
    </div>
  );
}

function RecordCard({ record }: { record: PassportRecord }) {
  const briefColor = record.briefOverall != null ? momentumColor(record.briefOverall) : null;
  return (
    <div className="border border-slate-200 rounded-xl p-4 bg-white">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-slate-900 truncate">{record.teamName}</h4>
          <p className="text-xs text-slate-500 mt-0.5 capitalize">{record.role}</p>
        </div>
        {record.completed && record.placement != null ? (
          <span className="shrink-0 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1">
            #{record.placement} of {record.cohortSize}
          </span>
        ) : (
          <span className="shrink-0 text-xs font-medium text-slate-500 bg-slate-50 border border-slate-200 rounded-full px-2.5 py-1 capitalize">
            {record.stage.replace("-", " ")}
          </span>
        )}
      </div>

      {record.briefOverall != null && briefColor && (
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-slate-700">Brief score</span>
            <span className={`text-xs font-semibold ${briefColor.text}`}>{record.briefOverall}</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-100">
            <div className={`h-1.5 rounded-full ${briefColor.bar}`} style={{ width: `${record.briefOverall}%` }} />
          </div>
        </div>
      )}

      {record.topJudgeComment && (
        <p className="text-xs text-slate-600 italic mt-3">“{record.topJudgeComment}”</p>
      )}

      {record.teammates.length > 0 && (
        <div className="mt-3">
          <p className="text-[11px] text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Users className="w-3 h-3" /> Team
          </p>
          <div className="flex flex-wrap gap-1.5">
            {record.teammates.map((t) => (
              <Link
                key={t.collaboratorId}
                to="/matchresults"
                className="text-xs font-medium text-violet-700 bg-violet-50 border border-violet-200 rounded-full px-2.5 py-1 hover:bg-violet-100"
              >
                {t.name} · {t.role}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function StartupPassport() {
  const { founderProfile } = useFounderProfile();
  const passport = useMemo(
    () => derivePassport(founderProfile.hackathonRegistrations, Date.now()),
    [founderProfile.hackathonRegistrations],
  );

  return (
    <section className="border border-slate-200 rounded-xl p-6 bg-white">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-base font-semibold text-slate-900">Startup Passport</h2>
        <span className="text-xs font-medium text-violet-700 bg-violet-50 border border-violet-200 rounded-full px-2.5 py-1">
          Visible to investors
        </span>
      </div>
      <p className="text-sm text-slate-600 mb-5">Your verified hackathon track record across events.</p>

      {!passport.hasActivity ? (
        <div className="border border-dashed border-slate-300 rounded-xl p-8 text-center">
          <Award className="w-7 h-7 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">
            No hackathon history yet.{" "}
            <Link to="/incubation-hub?panel=hackathon" className="text-violet-600 hover:underline">
              Enter a hackathon
            </Link>{" "}
            to start your passport.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            <StatCard label="Hackathons" value={String(passport.hackathonsEntered)} />
            <StatCard
              label="Best placement"
              value={passport.bestPlacement ? `#${passport.bestPlacement.placement}` : "—"}
            />
            <StatCard label="Avg brief score" value={passport.avgBriefScore != null ? String(passport.avgBriefScore) : "—"} />
            <StatCard label="Demos shipped" value={String(passport.demosShipped)} />
          </div>

          {passport.badges.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-5">
              {passport.badges.map((b) => (
                <span
                  key={b.id}
                  title={b.description}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded-full px-3 py-1.5"
                >
                  <Trophy className="w-3.5 h-3.5" /> {b.label}
                </span>
              ))}
            </div>
          )}

          <div className="space-y-3">
            {passport.records.map((r) => (
              <RecordCard key={`${r.hackathonId}-${r.teamName}`} record={r} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc -b --noEmit 2>&1 | grep -E "StartupPassport|passport" || echo "no passport type errors"`
Expected: `no passport type errors`.

- [ ] **Step 3: Commit**

```bash
git branch --show-current   # must print feat/startup-passport
git add src/dashboard/founders/section/components/founder/StartupPassport.tsx
git commit -m "feat(passport): founder profile passport section + teammate chips"
```

---

## Task 4: Wire `StartupPassport` into `FounderProfile.tsx`

**Files:**
- Modify: `src/dashboard/founders/section/components/founder/FounderProfile.tsx`

The Endorsements section ends just before the Pinned-work section (around line 265, the comment/section that renders `p.pinnedWork`). Insert the passport between them.

- [ ] **Step 1: Add the import**

At the top of `FounderProfile.tsx`, add to the existing import block:

```tsx
import { StartupPassport } from "./StartupPassport";
```

- [ ] **Step 2: Render the section**

Find the end of the Endorsements block and the start of the Pinned-work block (search for `pinnedWork`). Insert `<StartupPassport />` between the two sibling sections, e.g.:

```tsx
        {/* Endorsements ... existing block ends here */}

        <StartupPassport />

        {/* Pinned work ... existing block continues here */}
```

If the surrounding sections are wrapped in a vertical-stack container (e.g. `space-y-*`), place `<StartupPassport />` as a direct sibling so spacing is inherited. Do not change any existing section.

- [ ] **Step 3: Type-check**

Run: `npx tsc -b --noEmit 2>&1 | grep -E "FounderProfile|StartupPassport" || echo "no founder-profile type errors"`
Expected: `no founder-profile type errors`.

- [ ] **Step 4: Commit**

```bash
git branch --show-current   # must print feat/startup-passport
git add src/dashboard/founders/section/components/founder/FounderProfile.tsx
git commit -m "feat(passport): render passport on founder profile"
```

---

## Task 5: Add `PassportSummary` to mock data (Surface B data)

**Files:**
- Modify: `src/dashboard/investors/section/data/mockData.ts`

- [ ] **Step 1: Add the type and field**

In `mockData.ts`, add the `PassportSummary` interface near the top (next to `StartupAbout`) and add an optional `passport` field to the `Startup` interface:

```ts
export interface PassportSummary {
  hackathonsEntered: number;
  bestPlacement?: number;
  cohortSize?: number;
  demosShipped: number;
  avgBriefScore?: number;
}
```

In `interface Startup { ... }` add (anywhere in the body, e.g. after `about`):

```ts
  passport?: PassportSummary;
```

- [ ] **Step 2: Attach summaries to 3 mock startups**

In the `mockStartups` array, add a `passport` field to exactly three entries — one champion, one mid-pack, one with none-but-present — so the filter visibly partitions the list. Use the first three entries; add to each entry's object literal:

Entry 1 (champion):
```ts
  passport: { hackathonsEntered: 4, bestPlacement: 1, cohortSize: 12, demosShipped: 3, avgBriefScore: 88 },
```
Entry 2 (mid-pack):
```ts
  passport: { hackathonsEntered: 2, bestPlacement: 6, cohortSize: 12, demosShipped: 1, avgBriefScore: 71 },
```
Entry 3 (entered, never placed):
```ts
  passport: { hackathonsEntered: 1, demosShipped: 0, avgBriefScore: 64 },
```

Leave all other mock startups without a `passport` (they represent startups with no hackathon history).

- [ ] **Step 3: Type-check**

Run: `npx tsc -b --noEmit 2>&1 | grep -E "mockData" || echo "no mockData type errors"`
Expected: `no mockData type errors`.

- [ ] **Step 4: Commit**

```bash
git branch --show-current   # must print feat/startup-passport
git add src/dashboard/investors/section/data/mockData.ts
git commit -m "feat(passport): PassportSummary on Startup mock data"
```

---

## Task 6: Inject founder + track-record filter + card badge (Surface B)

**Files:**
- Modify: `src/dashboard/investors/section/components/investor/DealIntelligence.tsx`

- [ ] **Step 1: Add imports + founder→Startup adapter**

At the top of `DealIntelligence.tsx`, add imports:

```tsx
import { Trophy } from 'lucide-react';
import { useFounderProfile } from '@/contexts/UserContext';
import { derivePassport } from '@/dashboard/_shared/passport/passport';
import { mockStartups, type Startup } from '../../data/mockData';
```
(The `mockStartups`/`Startup` import already exists — merge, don't duplicate. Add `Trophy` to the existing `lucide-react` import line; the other two are new.)

Below the imports (module scope), add the adapter:

```tsx
// Build a Deal-Intelligence Startup card from the logged-in founder + their
// derived passport, so a real hackathon track record is investor-discoverable.
function founderToStartup(
  fp: ReturnType<typeof useFounderProfile>["founderProfile"],
  now: number,
): Startup | null {
  const passport = derivePassport(fp.hackathonRegistrations, now);
  if (!passport.hasActivity) return null;
  const bestMomentum = passport.records.reduce((m, r) => Math.max(m, r.momentum), 0);
  return {
    id: 'founder-self',
    name: fp.startupName || fp.name,
    sector: fp.industries[0] ?? '—',
    region: fp.location ?? '—',
    readinessScore: passport.avgBriefScore ?? 0,
    executionVelocity: bestMomentum,
    betaRetention: 0,
    revenueGrowth: 0,
    mrr: fp.revenueMonthly ?? 0,
    riskLevel: 'low',
    founderReliability: passport.avgBriefScore ?? 0,
    complianceVerified: false,
    aiGovernanceVerified: false,
    burnEfficiency: 0,
    pivotFrequency: 0,
    experimentVelocity: 0,
    velocityDelta: 0,
    revenueDelta: 0,
    investorsWatching: 0,
    milestones: [],
    riskMetrics: { product: 0, market: 0, team: 0, compliance: 0, financial: 0, execution: 0 },
    about: { summary: fp.oneLiner ?? '', useCase: '', marketSize: '', marketSizeValue: '' },
    passport: {
      hackathonsEntered: passport.hackathonsEntered,
      bestPlacement: passport.bestPlacement?.placement,
      cohortSize: passport.bestPlacement?.cohortSize,
      demosShipped: passport.demosShipped,
      avgBriefScore: passport.avgBriefScore,
    },
  };
}
```

NOTE: the `RiskMetrics` shape was verified against `mockData.ts` — it is `{ product, market, team, compliance, financial, execution }` (all `number`), zeroed above. `Milestone[]` is empty (`[]`), and `StartupAbout` is `{ summary, useCase, marketSize, marketSizeValue }`. These are correct as written; no further file lookup needed.

- [ ] **Step 2: Inject the founder entry + extend filter state**

Inside the `DealIntelligence` component, after the existing `useState` for `filters`, read the founder and build the working list. Replace the line `const filteredStartups = mockStartups.filter(...)` source with an injected list:

```tsx
  const { founderProfile } = useFounderProfile();
  const allStartups = useMemo(() => {
    const self = founderToStartup(founderProfile, Date.now());
    return self ? [self, ...mockStartups] : mockStartups;
  }, [founderProfile]);
```

Add `useMemo` to the React import (`import { useEffect, useMemo, useState } from 'react';`).

Extend the `filters` initial state object with two fields:

```tsx
    hasTrackRecord: false,
    minBestPlacement: 0,
```

And add them to the Reset Filters handler's object (the `setFilters({...})` inside the reset button `onClick`) with the same defaults (`hasTrackRecord: false, minBestPlacement: 0`).

- [ ] **Step 2b: Filter on the injected list + track record**

Change `mockStartups.filter` to `allStartups.filter` and add two predicates inside it (before `return true;`):

```tsx
    if (filters.hasTrackRecord && !(startup.passport && startup.passport.hackathonsEntered > 0)) return false;
    if (
      filters.minBestPlacement > 0 &&
      !(startup.passport?.bestPlacement != null && startup.passport.bestPlacement <= filters.minBestPlacement)
    ) return false;
```

Also update the two count displays that reference `mockStartups.length` — change the denominator `mockStartups.length` to `allStartups.length` so the "Showing X of Y" total includes the injected founder.

- [ ] **Step 3: Add the "Hackathon Track Record" filter section**

After the "Behavioral Patterns" `FilterSection` (and before the Reset button), add a new section:

```tsx
            <FilterSection
              title="Hackathon Track Record"
              isExpanded={expandedFilters.behavioral}
              onToggle={() => toggleFilterSection('behavioral')}
            >
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.hasTrackRecord}
                    onChange={(e) => setFilters({ ...filters, hasTrackRecord: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-gray-900"
                  />
                  <span className="text-sm text-gray-300">Has hackathon track record</span>
                </label>
                <SliderFilter
                  label="Top placement (≤)"
                  value={filters.minBestPlacement}
                  onChange={(value) => setFilters({ ...filters, minBestPlacement: value })}
                  min={0}
                  max={12}
                />
              </div>
            </FilterSection>
```

(Reuses the existing `behavioral` expand key to avoid touching the `expandedFilters` type; acceptable since both relate to discovery filters. If you prefer a dedicated toggle, add `trackRecord: false` to `expandedFilters` initial state and use it here — optional.)

- [ ] **Step 4: Render the track-record badge on the card**

In `StartupCard`, after the metrics block (`</div>` closing `space-y-2 mb-4`) and before the actions row, add:

```tsx
      {startup.passport && (
        <div className="flex items-center gap-1.5 text-xs text-amber-400 mb-3 font-mono">
          <Trophy className="w-3.5 h-3.5" />
          <span>
            {startup.passport.bestPlacement != null
              ? `Best #${startup.passport.bestPlacement} of ${startup.passport.cohortSize}`
              : 'No placement yet'}
            {' · '}{startup.passport.hackathonsEntered} hackathon{startup.passport.hackathonsEntered === 1 ? '' : 's'}
            {' · '}{startup.passport.demosShipped} demo{startup.passport.demosShipped === 1 ? '' : 's'}
          </span>
        </div>
      )}
```

In `StartupListItem`, add a compact version inside the metrics row (after the Risk block):

```tsx
            {startup.passport && (
              <div className="text-center">
                <p className="text-xs text-gray-400 mb-1">Hackathon</p>
                <p className="text-sm font-bold font-mono text-amber-400">
                  {startup.passport.bestPlacement != null ? `#${startup.passport.bestPlacement}` : '—'}
                </p>
              </div>
            )}
```

- [ ] **Step 5: Type-check**

Run: `npx tsc -b --noEmit 2>&1 | grep -E "DealIntelligence" || echo "no deal-intelligence type errors"`
Expected: `no deal-intelligence type errors`.

- [ ] **Step 6: Commit**

```bash
git branch --show-current   # must print feat/startup-passport
git add src/dashboard/investors/section/components/investor/DealIntelligence.tsx
git commit -m "feat(passport): inject founder + track-record filter in Deal Intelligence"
```

---

## Task 7: Full verification + PR

- [ ] **Step 1: Run the full local test gate**

Run: `npm run test:local`
Expected: all tests pass, "0 failed". The passport tests (Tasks 1–2) are included.

- [ ] **Step 2: Full project type-check**

Run: `npx tsc -b --noEmit 2>&1 | grep -vE "calendar.tsx|resizable.tsx" | grep -E "error TS" || echo "no new type errors"`
Expected: `no new type errors` (only the pre-existing shadcn `calendar.tsx`/`resizable.tsx` errors are filtered out; nothing else should remain).

- [ ] **Step 3: Tone audit (manual grep)**

Run: `grep -nE "animate-pulse|Date\.now\(\)|Math\.random\(\)" src/dashboard/_shared/passport/*.ts src/dashboard/founders/section/components/founder/StartupPassport.tsx src/dashboard/investors/section/components/investor/DealIntelligence.tsx`
Expected: any `Date.now()` hits are inside `useMemo` (StartupPassport) or `founderToStartup`'s caller `useMemo` (DealIntelligence) — NOT in a render body. No `animate-pulse`, no `Math.random()`.

- [ ] **Step 4: Push the branch**

```bash
git branch --show-current   # must print feat/startup-passport
git push -u origin feat/startup-passport:pr-e-startup-passport
```

- [ ] **Step 5: Confirm PR scope, then open the PR**

```bash
git fetch -q origin main
git log --oneline origin/main..HEAD          # should be the spec + 6 feat commits, passport files only
gh pr create --repo techit360ai-bit/new-frontend --base main --head pr-e-startup-passport \
  --title "Startup Passport (sub-project ②) — FE-only mock" \
  --body "Pure-derived founder hackathon passport across three surfaces: profile section, investor-discoverable Deal Intelligence (founder injection + track-record filter), and founder-network teammate links. Aggregates only real signals from hackathonRegistrations[]; no new context state, no persistence. Spec: docs/superpowers/specs/2026-06-16-startup-passport-design.md. Gate: local node tests (passport.test.ts) + tsc -b clean on touched files. 🤖 Generated with [Claude Code](https://claude.com/claude-code)"
```

- [ ] **Step 6: Report the PR URL and stop for review.** Do not merge until the user approves (mergeability is the user's call, per established workflow).

---

## Self-Review notes (for the executor)

- **Spec coverage:** Surface A → Tasks 3–4; Surface B → Tasks 5–6; Surface C (teammate chips) → Task 3 (`RecordCard`); core deriver + badges → Tasks 1–2 (tested). All spec sections map to a task.
- **Type consistency:** `derivePassport(regs, now)`, `deriveBadges(input)`, `PassportSummary`, `PassportRecord.teammates`, `Startup.passport` are used identically across tasks.
- **One shape to verify against the file:** `RiskMetrics` / `Milestone` field names in `mockData.ts` (Task 6, Step 1 note) — the only place the plan can't fully pin without the file open.
