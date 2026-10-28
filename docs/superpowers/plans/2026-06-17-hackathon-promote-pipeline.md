# Hackathon Team-Workspace + Startup Promote Pipeline — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a real in-app team-workspace pipe (one workspace per team, seeded with the idea/team/artifacts, rendered on a focused view, reported to organizers) and a promote-to-startup flow that binds that same workspace to a new founder venture.

**Architecture:** Pure builders (`buildTeamWorkspace`, `buildPromotedProject`) feed in-memory React-context records (`teamWorkspaces`, `founderProjects`). One create-workspace action in the Build stage; Submit/Results reuse via "Open workspace". Promote binds the existing workspace to a venture — never creates a second. All backend calls best-effort via `withFallback`.

**Tech Stack:** React 18 + TypeScript, React Router, Tailwind, lucide-react. Test gate: `npm run test:local` (node `--experimental-strip-types`; vitest proper SIGBUS-cores). Type gate: `tsc -b --noEmit`.

**Branch:** `feat/hackathon-promote` (already created off `origin/main`; spec already committed there).

**Spec:** `docs/superpowers/specs/2026-06-17-hackathon-promote-pipeline-design.md`

**CRITICAL — node-gate matcher constraint:** the local `expect` shim supports ONLY `toBe`, `toEqual`, `toContain`, `toHaveLength`, `toBeTruthy`, `toBeFalsy`, `toBeNull`, `.not.toBe`, `.not.toContain`. NO numeric matchers — use booleans: `expect(a < b).toBe(true)`. All test code below follows this.

**Run all commands from `/home/faithsax/new-frontend/frontend`.**

**Before EVERY commit:** `git branch --show-current` must print `feat/hackathon-promote`. The session intermittently checks out `main` between turns — if so, `git checkout feat/hackathon-promote` first.

---

## File Structure

| File | Responsibility |
|---|---|
| `src/contexts/UserContext.tsx` | MODIFY — `TeamWorkspace*` types; `founderProjects` (seeded) + `teamWorkspaces`; `addFounderProject`/`addTeamWorkspace`/`bindTeamWorkspaceProject`; `workspaceId?`+`promotedProjectId?` on registration |
| `src/dashboard/_shared/hackathon/workspace.ts` | NEW — pure `buildTeamWorkspace` |
| `src/dashboard/_shared/hackathon/promote.ts` | NEW — pure `promoteDefaults` + `buildPromotedProject` |
| `src/dashboard/_shared/hackathon/promote.test.ts` | NEW — node-gate tests (both pure modules) |
| `src/lib/api/hackathon.ts` | MODIFY — add best-effort `reportTeamToOrganizers` |
| `src/dashboard/founders/section/components/incubation/hackathon/useGenerateTeamWorkspace.ts` | NEW — shared generate() hook |
| `src/dashboard/founders/section/components/founder/TeamWorkspaceView.tsx` | NEW — focused populated workspace view |
| `src/App.tsx` | MODIFY — add `/team-workspace/:teamId` route |
| `src/dashboard/founders/section/components/incubation/hackathon/PromoteToStartupModal.tsx` | NEW — editable confirm modal + orchestration |
| `src/dashboard/founders/section/components/incubation/hackathon/BuildStage.tsx` | MODIFY — generate() + promote button (the one create) |
| `src/dashboard/founders/section/components/incubation/hackathon/SubmitStage.tsx` | MODIFY — "Open team workspace" reuse link (no create) |
| `src/dashboard/founders/section/components/incubation/hackathon/ResultsView.tsx` | MODIFY — promote button / promoted state |
| `src/dashboard/founders/section/components/founder/Dashboard.tsx` | MODIFY — venture source fetch → context |

---

## Task 1: UserContext data model

**Files:**
- Modify: `src/contexts/UserContext.tsx`

- [ ] **Step 1: Add the import (top of file, with the other imports)**

```ts
import { type FounderProject, FALLBACK_PROJECTS } from "@/lib/api/projects";
```

- [ ] **Step 2: Add the TeamWorkspace types**

Place next to the other hackathon types (e.g. just after the `JudgeFeedback` interface):

```ts
export interface TeamWorkspaceIdea {
  problem: string; targetUser: string; solutionSketch: string; whyNow: string;
  differentiator: string; risk: string; successMetric: string;
}
export interface TeamWorkspaceMemberRef { collaboratorId: string; name: string; role: string; }
export interface TeamWorkspaceArtifacts { demoUrl: string; deckUrl: string; videoUrl: string; }
export interface TeamWorkspace {
  id: string;
  hackathonId: string;
  teamId: string;
  teamName: string;
  createdAt: string;
  idea: TeamWorkspaceIdea | null;
  team: TeamWorkspaceMemberRef[];
  artifacts: TeamWorkspaceArtifacts | null;
  projectId?: string;
}
```

- [ ] **Step 3: Extend `HackathonRegistration`**

Add these two optional fields to the `HackathonRegistration` interface (after `judgeFeedback?`):

```ts
  workspaceId?: string;
  promotedProjectId?: string;
```

- [ ] **Step 4: Extend `FounderProfile`**

Add to the `FounderProfile` interface (near `hackathonRegistrations`):

```ts
  founderProjects: FounderProject[];
  teamWorkspaces: TeamWorkspace[];
```

- [ ] **Step 5: Seed the default founder profile**

Find the default founder profile object (it contains `hackathonRegistrations: [],` around line 441). Add directly after that line:

```ts
    founderProjects: [...FALLBACK_PROJECTS],
    teamWorkspaces: [],
```

- [ ] **Step 6: Declare the three updaters in `UserContextType`**

Add to the `UserContextType` interface (after `submitFinal: ...;`):

```ts
  addFounderProject: (project: FounderProject) => void;
  addTeamWorkspace: (ws: TeamWorkspace) => void;
  bindTeamWorkspaceProject: (workspaceId: string, projectId: string) => void;
```

- [ ] **Step 7: Implement the updaters**

Add next to `submitFinal` (after its definition):

```ts
  const addFounderProject = (project: FounderProject) => {
    setFounderProfile((prev) => ({ ...prev, founderProjects: [...prev.founderProjects, project] }));
  };

  const addTeamWorkspace = (ws: TeamWorkspace) => {
    setFounderProfile((prev) => ({ ...prev, teamWorkspaces: [...prev.teamWorkspaces, ws] }));
  };

  const bindTeamWorkspaceProject = (workspaceId: string, projectId: string) => {
    setFounderProfile((prev) => ({
      ...prev,
      teamWorkspaces: prev.teamWorkspaces.map((w) => (w.id === workspaceId ? { ...w, projectId } : w)),
    }));
  };
```

- [ ] **Step 8: Wire into the provider `value`**

In the provider `value={{ ... }}` object, after `submitFinal,` add:

```ts
        addFounderProject,
        addTeamWorkspace,
        bindTeamWorkspaceProject,
```

- [ ] **Step 9: Wire into `useFounderProfile`**

In the `useFounderProfile()` hook, add the three names to BOTH the `useUser()` destructure and the returned object (alongside `submitFinal`):

```ts
    addFounderProject,
    addTeamWorkspace,
    bindTeamWorkspaceProject,
```

- [ ] **Step 10: Type-check**

Run: `npx tsc -b --noEmit 2>&1 | grep -E "UserContext" || echo "no UserContext type errors"`
Expected: `no UserContext type errors`.

- [ ] **Step 11: Commit**

```bash
git branch --show-current   # must print feat/hackathon-promote
git add src/contexts/UserContext.tsx
git commit -m "feat(promote): context — teamWorkspaces, founderProjects, updaters, reg fields"
```

---

## Task 2: Pure logic — buildTeamWorkspace + promote builders + tests

**Files:**
- Create: `src/dashboard/_shared/hackathon/workspace.ts`
- Create: `src/dashboard/_shared/hackathon/promote.ts`
- Create: `src/dashboard/_shared/hackathon/promote.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/dashboard/_shared/hackathon/promote.test.ts`:

```ts
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

// --- buildTeamWorkspace ---
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

// --- promote ---
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
  expect(project.industry).toBe("saas");      // not overridden → default
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
```

- [ ] **Step 2: Run to verify FAIL**

Run: `npm run test:local`
Expected: FAIL — cannot resolve `./workspace` / `./promote`.

- [ ] **Step 3: Implement `workspace.ts`**

Create `src/dashboard/_shared/hackathon/workspace.ts`:

```ts
// buildTeamWorkspace — pure, deterministic. Seeds a TeamWorkspace record from a
// registration: idea (the 7 brief fields), team roster, and submission artifacts.
// now is passed in (caller owns Date.now()). No React, no side effects.

import type { HackathonRegistration, TeamWorkspace } from "@/contexts/UserContext";

export function buildTeamWorkspace(reg: HackathonRegistration, now: number): TeamWorkspace {
  return {
    id: `ws_team_${now}`,
    hackathonId: reg.hackathonId,
    teamId: reg.teamId,
    teamName: reg.teamName,
    createdAt: new Date(now).toISOString(),
    idea: reg.brief
      ? {
          problem: reg.brief.problem, targetUser: reg.brief.targetUser,
          solutionSketch: reg.brief.solutionSketch, whyNow: reg.brief.whyNow,
          differentiator: reg.brief.differentiator, risk: reg.brief.risk,
          successMetric: reg.brief.successMetric,
        }
      : null,
    team: (reg.members ?? []).map((m) => ({ collaboratorId: m.collaboratorId, name: m.name, role: m.role })),
    artifacts: reg.finalSubmission
      ? { demoUrl: reg.finalSubmission.demoUrl, deckUrl: reg.finalSubmission.deckUrl, videoUrl: reg.finalSubmission.videoUrl }
      : null,
  };
}
```

- [ ] **Step 4: Implement `promote.ts`**

Create `src/dashboard/_shared/hackathon/promote.ts`:

```ts
// Pure promote derivation. promoteDefaults prefills the confirm modal from the
// hackathon data; buildPromotedProject applies overrides and seeds gsisScore from
// the real pinned briefScore. now passed in (caller owns Date.now()). No randomness.

import type { HackathonRegistration, FounderProfile } from "@/contexts/UserContext";
import type { FounderProject } from "@/lib/api/projects";

export interface PromoteOverrides {
  title?: string;
  tagline?: string;
  industry?: string;
  stage?: string;
}

export function promoteDefaults(reg: HackathonRegistration, fp: FounderProfile): Required<PromoteOverrides> {
  return {
    title: reg.teamName,
    tagline: (reg.brief?.solutionSketch ?? "").trim().slice(0, 120),
    industry: fp.industries[0] ?? "",
    stage: "mvp",
  };
}

export function buildPromotedProject(
  reg: HackathonRegistration,
  fp: FounderProfile,
  overrides: PromoteOverrides,
  now: number,
): FounderProject {
  const d = promoteDefaults(reg, fp);
  return {
    id: `proj_local_${now}`,
    title: (overrides.title ?? d.title).trim(),
    tagline: (overrides.tagline ?? d.tagline).trim(),
    industry: overrides.industry ?? d.industry,
    stage: overrides.stage ?? d.stage,
    isPrimary: false,
    gsisScore: reg.briefScore?.overall ?? 0,
    hasWorkspace: true,
  };
}
```

- [ ] **Step 5: Run to verify PASS**

Run: `npm run test:local`
Expected: PASS — "0 failed".

- [ ] **Step 6: Type-check**

Run: `npx tsc -b --noEmit 2>&1 | grep -E "_shared/hackathon/(workspace|promote)" || echo "no pure-logic type errors"`
Expected: `no pure-logic type errors`.

- [ ] **Step 7: Commit**

```bash
git branch --show-current
git add src/dashboard/_shared/hackathon/workspace.ts src/dashboard/_shared/hackathon/promote.ts src/dashboard/_shared/hackathon/promote.test.ts
git commit -m "feat(promote): pure buildTeamWorkspace + promote builders + tests"
```

---

## Task 3: Org-report seam

**Files:**
- Modify: `src/lib/api/hackathon.ts`

- [ ] **Step 1: Add the function**

Append to `src/lib/api/hackathon.ts` (after `provisionTeamWorkspace`):

```ts
export function reportTeamToOrganizers(
  id: string, teamId: string,
  report: { workspaceId: string; idea: unknown; team: unknown; artifacts: unknown; stage: string },
): Promise<{ ok: boolean } | null> {
  return withFallback(
    () => apiPost<{ ok: boolean }>(`/hackathons/${id}/teams/${teamId}/report`, report),
    () => ({ ok: true }),
    "report team to organizers",
  );
}
```

(`apiPost` and `withFallback` are already imported in this file — confirm by reading the top; they are used by the existing functions.)

- [ ] **Step 2: Type-check**

Run: `npx tsc -b --noEmit 2>&1 | grep -E "lib/api/hackathon" || echo "no hackathon-api type errors"`
Expected: `no hackathon-api type errors`.

- [ ] **Step 3: Commit**

```bash
git branch --show-current
git add src/lib/api/hackathon.ts
git commit -m "feat(promote): reportTeamToOrganizers best-effort seam"
```

---

## Task 4: Generate hook + TeamWorkspaceView + route

**Files:**
- Create: `src/dashboard/founders/section/components/incubation/hackathon/useGenerateTeamWorkspace.ts`
- Create: `src/dashboard/founders/section/components/founder/TeamWorkspaceView.tsx`
- Modify: `src/App.tsx`

Presentational/integration — gate is `tsc` (no component tests).

- [ ] **Step 1: Create the generate hook**

Create `src/dashboard/founders/section/components/incubation/hackathon/useGenerateTeamWorkspace.ts`:

```ts
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { HackathonRegistration } from "@/contexts/UserContext";
import { useFounderProfile } from "@/contexts/UserContext";
import { buildTeamWorkspace } from "@/dashboard/_shared/hackathon/workspace";
import { provisionTeamWorkspace, reportTeamToOrganizers } from "@/lib/api/hackathon";

// The ONE create-workspace action (Build stage). Reuse-aware: if a workspace
// already exists for the registration it just navigates; otherwise it creates the
// single populated workspace, persists workspaceId, and reports to organizers.
// Returns the workspace id (existing or newly created).
export function useGenerateTeamWorkspace() {
  const { addTeamWorkspace, updateHackathonRegistration } = useFounderProfile();
  const navigate = useNavigate();

  return function generate(reg: HackathonRegistration, opts: { navigateAfter?: boolean } = {}): string {
    let workspaceId = reg.workspaceId;
    if (!workspaceId) {
      const ws = buildTeamWorkspace(reg, Date.now());
      addTeamWorkspace(ws);
      updateHackathonRegistration(reg.teamId, { workspaceId: ws.id });
      void provisionTeamWorkspace(reg.hackathonId, reg.teamId, ws.id);
      void reportTeamToOrganizers(reg.hackathonId, reg.teamId, {
        workspaceId: ws.id, idea: ws.idea, team: ws.team, artifacts: ws.artifacts, stage: reg.stage,
      });
      toast.success("Team workspace generated — organizers notified");
      workspaceId = ws.id;
    }
    if (opts.navigateAfter !== false) navigate(`/team-workspace/${reg.teamId}`);
    return workspaceId;
  };
}
```

- [ ] **Step 2: Create TeamWorkspaceView**

Create `src/dashboard/founders/section/components/founder/TeamWorkspaceView.tsx`:

```tsx
import { useParams, Link } from "react-router-dom";
import { Users, ExternalLink, FileText, CheckCircle2 } from "lucide-react";
import { useFounderProfile } from "@/contexts/UserContext";

const IDEA_FIELDS: { key: "problem" | "targetUser" | "solutionSketch" | "whyNow" | "differentiator" | "risk" | "successMetric"; label: string }[] = [
  { key: "problem", label: "Problem" },
  { key: "targetUser", label: "Target user" },
  { key: "solutionSketch", label: "Solution sketch" },
  { key: "whyNow", label: "Why now" },
  { key: "differentiator", label: "Differentiator" },
  { key: "risk", label: "Biggest risk" },
  { key: "successMetric", label: "Success metric" },
];

export function TeamWorkspaceView() {
  const { teamId } = useParams();
  const { founderProfile } = useFounderProfile();
  const ws = founderProfile.teamWorkspaces.find((w) => w.teamId === teamId);
  const reg = founderProfile.hackathonRegistrations.find((r) => r.teamId === teamId);

  if (!ws) {
    return (
      <div className="p-6 lg:p-8 max-w-5xl mx-auto">
        <div className="border border-slate-200 bg-white rounded-xl p-12 text-center">
          <h1 className="text-base font-semibold text-slate-700 mb-2">Workspace not found</h1>
          <p className="text-sm text-slate-500">
            Generate it from the Build stage.{" "}
            <Link to="/incubation-hub?panel=hackathon&stage=build" className="text-violet-600 hover:underline">Go to Build</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Team workspace</p>
          <h1 className="text-2xl font-bold text-slate-900">{ws.teamName}</h1>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" /> Reported to organizers
        </span>
      </div>

      {/* Idea */}
      <section className="border border-slate-200 bg-white rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-4 h-4 text-slate-400" />
          <h2 className="text-base font-semibold text-slate-900">Idea</h2>
        </div>
        {ws.idea ? (
          <dl className="space-y-3">
            {IDEA_FIELDS.map((f) => (
              <div key={f.key}>
                <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">{f.label}</dt>
                <dd className="text-sm text-slate-800 mt-0.5 whitespace-pre-wrap">{ws.idea![f.key]}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="text-sm text-slate-500">Submit your brief to seed the workspace with your idea.</p>
        )}
      </section>

      {/* Team */}
      <section className="border border-slate-200 bg-white rounded-xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-slate-400" />
          <h2 className="text-base font-semibold text-slate-900">Team</h2>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-full px-2.5 py-1">You · Leader</span>
          {ws.team.map((t) => (
            <Link key={t.collaboratorId} to="/matchresults" className="text-xs font-medium text-violet-700 bg-violet-50 border border-violet-200 rounded-full px-2.5 py-1 hover:bg-violet-100">
              {t.name} · {t.role}
            </Link>
          ))}
        </div>
      </section>

      {/* Build timeline (display-only) */}
      {reg && reg.checkIns.length > 0 && (
        <section className="border border-slate-200 bg-white rounded-xl p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-3">Build timeline</h2>
          <ul className="space-y-2">
            {reg.checkIns.map((c) => (
              <li key={c.id} className="text-sm text-slate-700 flex gap-2">
                <span className="text-slate-300">•</span><span>{c.update}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Artifacts */}
      <section className="border border-slate-200 bg-white rounded-xl p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-3">Artifacts</h2>
        {ws.artifacts ? (
          <div className="flex flex-col gap-2">
            {([["Demo", ws.artifacts.demoUrl], ["Deck", ws.artifacts.deckUrl], ["Video", ws.artifacts.videoUrl]] as const).map(([label, url]) => (
              <a key={label} href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-violet-700 hover:text-violet-800 break-all">
                {label}: {url} <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              </a>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">Artifacts appear after final submission.</p>
        )}
      </section>
    </div>
  );
}
```

- [ ] **Step 3: Add the route in `App.tsx`**

Add the import alongside the other founder-page imports near the top of `App.tsx`:

```tsx
import { TeamWorkspaceView } from "@/dashboard/founders/section/components/founder/TeamWorkspaceView";
```

Add the route next to the founder Dashboard route (`App.tsx:207`, `<Route path="/dashboard" element={<Dashboard />} />`):

```tsx
        <Route path="/team-workspace/:teamId" element={<TeamWorkspaceView />} />
```

(Place it as a sibling at the same nesting level as the `/dashboard` route. If `/dashboard` sits inside a layout wrapper, put this route in the same wrapper so it shares the founder chrome.)

- [ ] **Step 4: Type-check**

Run: `npx tsc -b --noEmit 2>&1 | grep -E "TeamWorkspaceView|useGenerateTeamWorkspace|App.tsx" || echo "no type errors"`
Expected: `no type errors`.

- [ ] **Step 5: Commit**

```bash
git branch --show-current
git add src/dashboard/founders/section/components/incubation/hackathon/useGenerateTeamWorkspace.ts src/dashboard/founders/section/components/founder/TeamWorkspaceView.tsx src/App.tsx
git commit -m "feat(promote): generate hook + TeamWorkspaceView + route"
```

---

## Task 5: PromoteToStartupModal

**Files:**
- Create: `src/dashboard/founders/section/components/incubation/hackathon/PromoteToStartupModal.tsx`

- [ ] **Step 1: Create the modal**

Create `src/dashboard/founders/section/components/incubation/hackathon/PromoteToStartupModal.tsx`:

```tsx
import { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import type { HackathonRegistration } from "@/contexts/UserContext";
import { useFounderProfile } from "@/contexts/UserContext";
import { promoteDefaults, buildPromotedProject } from "@/dashboard/_shared/hackathon/promote";
import { createFounderProject } from "@/lib/api/projects";
import { useGenerateTeamWorkspace } from "./useGenerateTeamWorkspace";

interface Props {
  registration: HackathonRegistration;
  onClose: () => void;
}

const STAGES = ["idea", "mvp", "beta", "launch", "growth"];

export function PromoteToStartupModal({ registration, onClose }: Props) {
  const { founderProfile, addFounderProject, bindTeamWorkspaceProject, updateHackathonRegistration } = useFounderProfile();
  const generate = useGenerateTeamWorkspace();
  const defaults = promoteDefaults(registration, founderProfile);
  const [title, setTitle] = useState(defaults.title);
  const [tagline, setTagline] = useState(defaults.tagline);
  const [industry, setIndustry] = useState(defaults.industry);
  const [stage, setStage] = useState(defaults.stage);

  const canCreate = title.trim().length > 0;

  const handleConfirm = () => {
    if (!canCreate) return;
    const project = buildPromotedProject(registration, founderProfile, { title, tagline, industry, stage }, Date.now());
    addFounderProject(project);
    void createFounderProject({ title: project.title, tagline: project.tagline, industry: project.industry, stage: project.stage });
    // One workspace per team: ensure it exists (create-on-demand if missing), then bind it to the venture.
    const workspaceId = registration.workspaceId ?? generate(registration, { navigateAfter: false });
    bindTeamWorkspaceProject(workspaceId, project.id);
    updateHackathonRegistration(registration.teamId, { promotedProjectId: project.id });
    toast.success("Promoted to startup — added to your ventures");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-xl p-6" role="dialog" aria-label="Promote to startup">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-900">Promote to startup</h2>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-slate-100" aria-label="Close">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <p className="text-sm text-slate-600 mb-4">Create a venture from this hackathon project. It joins your portfolio and reuses your team workspace.</p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 uppercase tracking-wider mb-1.5">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 uppercase tracking-wider mb-1.5">Tagline</label>
            <input value={tagline} onChange={(e) => setTagline(e.target.value)} className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 uppercase tracking-wider mb-1.5">Industry</label>
              <input value={industry} onChange={(e) => setIndustry(e.target.value)} className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 uppercase tracking-wider mb-1.5">Stage</label>
              <select value={stage} onChange={(e) => setStage(e.target.value)} className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400">
                {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button type="button" onClick={onClose} className="text-sm font-medium px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50">Cancel</button>
          <button type="button" disabled={!canCreate} onClick={handleConfirm}
            className={`text-sm font-medium px-4 py-2 rounded-lg ${canCreate ? "bg-violet-600 text-white hover:bg-violet-700" : "bg-slate-100 text-slate-400 cursor-not-allowed"}`}>
            Create startup
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc -b --noEmit 2>&1 | grep -E "PromoteToStartupModal" || echo "no modal type errors"`
Expected: `no modal type errors`.

- [ ] **Step 3: Commit**

```bash
git branch --show-current
git add src/dashboard/founders/section/components/incubation/hackathon/PromoteToStartupModal.tsx
git commit -m "feat(promote): PromoteToStartupModal (bind one workspace, create venture)"
```

---

## Task 6: Wire surfaces (BuildStage, SubmitStage, ResultsView)

**Files:**
- Modify: `src/dashboard/founders/section/components/incubation/hackathon/BuildStage.tsx`
- Modify: `src/dashboard/founders/section/components/incubation/hackathon/SubmitStage.tsx`
- Modify: `src/dashboard/founders/section/components/incubation/hackathon/ResultsView.tsx`

### 6a. BuildStage — the one create + promote button

- [ ] **Step 1: Read `BuildStage.tsx`** to locate the "Team workspace" panel (around lines 150–194) and the existing `handleProvisionWorkspace`/`workspace`/`provisioning` state (around lines 51, 88–103).

- [ ] **Step 2: Add imports + hooks**

Add imports:
```tsx
import { useGenerateTeamWorkspace } from "./useGenerateTeamWorkspace";
import { PromoteToStartupModal } from "./PromoteToStartupModal";
```
Inside the component, add:
```tsx
  const generate = useGenerateTeamWorkspace();
  const [promoteOpen, setPromoteOpen] = useState(false);
```
(`useState` is already imported in BuildStage.)

- [ ] **Step 3: Repoint the existing button to `generate()`**

Replace the existing `handleProvisionWorkspace` async handler usage so the button calls `generate(registration)` (which creates the populated workspace, reports to organizers, persists `workspaceId`, and navigates to the view). Concretely, change the workspace panel so:
- When `registration.workspaceId` exists → render an "Open workspace" link to `/team-workspace/${registration.teamId}`.
- Else → a button `onClick={() => generate(registration)}` labelled "Create team workspace" (keep the existing disabled-until-brief guard: `disabled={!registration.brief}`).

Replace the panel's button/success block with:
```tsx
            {registration.workspaceId ? (
              <Link to={`/team-workspace/${registration.teamId}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-violet-700 hover:text-violet-800">
                Open team workspace <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <button type="button" disabled={!registration.brief}
                  onClick={() => generate(registration)}
                  className={`w-full text-sm font-medium px-4 py-2 rounded-lg ${registration.brief ? "bg-violet-600 text-white hover:bg-violet-700" : "bg-slate-100 text-slate-400 cursor-not-allowed"}`}>
                  Create team workspace
                </button>
                {!registration.brief && <p className="text-xs text-slate-400 mt-2">Submit your brief first to unlock this.</p>}
              </>
            )}
```
Remove the now-unused `handleProvisionWorkspace`, `provisionTeamWorkspace` import, and the `workspace`/`provisioning` `useState` IF they are no longer referenced after this change. (`Link` and `ExternalLink` are already imported in BuildStage.) If anything else still uses them, leave it.

- [ ] **Step 4: Add the promote button + modal**

Below the workspace panel (still in the build column), add:
```tsx
          {registration.promotedProjectId ? (
            <p className="text-xs text-emerald-700 mt-3">Promoted to a startup ✓</p>
          ) : (
            <button type="button" onClick={() => setPromoteOpen(true)}
              className="w-full text-sm font-medium px-4 py-2 rounded-lg border border-violet-300 text-violet-700 hover:bg-violet-50 mt-3">
              Promote to startup
            </button>
          )}
```
And render the modal once near the component's root return:
```tsx
      {promoteOpen && <PromoteToStartupModal registration={registration} onClose={() => setPromoteOpen(false)} />}
```

- [ ] **Step 5: Type-check BuildStage**

Run: `npx tsc -b --noEmit 2>&1 | grep -E "BuildStage" || echo "no BuildStage type errors"`
Expected: `no BuildStage type errors`.

### 6b. SubmitStage — open-workspace reuse link (no create)

- [ ] **Step 6: Add an "Open team workspace" link to the pre-submit form**

In `SubmitStage.tsx`, the pre-submit form returns at `return (<div className="max-w-2xl mx-auto">` (line ~60). Add `Link` import: `import { Link } from "react-router-dom";`. Just below the form header block (before the fields), add:
```tsx
      {registration.workspaceId ? (
        <Link to={`/team-workspace/${registration.teamId}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-violet-700 hover:text-violet-800 mb-4">
          Open team workspace →
        </Link>
      ) : (
        <p className="text-xs text-slate-400 mb-4">Create your team workspace in the Build stage.</p>
      )}
```
Do NOT add a create button here. (The locked branch returning `<ResultsView>` at line 36–37 is unchanged.)

- [ ] **Step 7: Type-check SubmitStage**

Run: `npx tsc -b --noEmit 2>&1 | grep -E "SubmitStage" || echo "no SubmitStage type errors"`
Expected: `no SubmitStage type errors`.

### 6c. ResultsView — promote button / promoted state

- [ ] **Step 8: Add the promote section as the last child of the results container**

In `ResultsView.tsx`, add imports:
```tsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { PromoteToStartupModal } from "./PromoteToStartupModal";
```
Add `const [promoteOpen, setPromoteOpen] = useState(false);` in the component body. As the LAST child inside the top-level `<div className="max-w-2xl mx-auto space-y-6">` (just before it closes), add:
```tsx
      {registration.promotedProjectId ? (
        <div className="border border-emerald-200 bg-emerald-50 rounded-xl p-5">
          <p className="text-sm font-semibold text-emerald-800 mb-2">Promoted to startup ✓</p>
          <div className="flex flex-wrap gap-3">
            <Link to={`/team-workspace/${registration.teamId}`} className="text-sm font-medium text-violet-700 hover:underline">Open workspace</Link>
            <Link to="/dashboard" className="text-sm font-medium text-violet-700 hover:underline">View in portfolio</Link>
          </div>
        </div>
      ) : (
        <div className="flex justify-end">
          <button type="button" onClick={() => setPromoteOpen(true)}
            className="text-sm font-medium px-4 py-2 rounded-lg bg-violet-600 text-white hover:bg-violet-700">
            Promote to startup
          </button>
        </div>
      )}
      {promoteOpen && <PromoteToStartupModal registration={registration} onClose={() => setPromoteOpen(false)} />}
```

- [ ] **Step 9: Type-check ResultsView**

Run: `npx tsc -b --noEmit 2>&1 | grep -E "ResultsView" || echo "no ResultsView type errors"`
Expected: `no ResultsView type errors`.

- [ ] **Step 10: Commit**

```bash
git branch --show-current
git add src/dashboard/founders/section/components/incubation/hackathon/BuildStage.tsx src/dashboard/founders/section/components/incubation/hackathon/SubmitStage.tsx src/dashboard/founders/section/components/incubation/hackathon/ResultsView.tsx
git commit -m "feat(promote): wire generate + promote into Build/Submit/Results"
```

---

## Task 7: Dashboard venture source → context

**Files:**
- Modify: `src/dashboard/founders/section/components/founder/Dashboard.tsx`

- [ ] **Step 1: Replace the fetch with context (lines ~77–88)**

Replace:
```tsx
  // S7 — founder venture portfolio (multiple separate startups).
  const [ventures, setVentures] = useState<FounderProject[]>([]);
  const [activeVentureId, setActiveVentureId] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    fetchFounderProjects().then((list) => {
      if (!alive) return;
      setVentures(list);
      setActiveVentureId((list.find((v) => v.isPrimary) ?? list[0])?.id ?? null);
    });
    return () => { alive = false; };
  }, []);
```
with:
```tsx
  // S7 — founder venture portfolio (multiple separate startups), from context.
  const ventures = p.founderProjects;
  const [activeVentureId, setActiveVentureId] = useState<string | null>(null);
  useEffect(() => {
    setActiveVentureId((cur) => cur ?? (ventures.find((v) => v.isPrimary) ?? ventures[0])?.id ?? null);
  }, [ventures]);
```
(`p` is the `founderProfile` alias already used elsewhere in the component — confirm by reading the top of the component; it uses `p.name`, `p.foundingYear`. If the alias is a different name, use that.)

- [ ] **Step 2: Remove the now-unused `fetchFounderProjects` import**

Delete `fetchFounderProjects` from the `@/lib/api/projects` import line. KEEP the `type FounderProject` import if `FounderProject` is still referenced anywhere in the file; if not, remove it too. (Verify with `grep -n "FounderProject\|fetchFounderProjects" src/dashboard/founders/section/components/founder/Dashboard.tsx` after editing.)

- [ ] **Step 3: Type-check**

Run: `npx tsc -b --noEmit 2>&1 | grep -E "founder/Dashboard" || echo "no Dashboard type errors"`
Expected: `no Dashboard type errors`.

- [ ] **Step 4: Commit**

```bash
git branch --show-current
git add src/dashboard/founders/section/components/founder/Dashboard.tsx
git commit -m "feat(promote): Dashboard ventures from context (promoted startups appear)"
```

---

## Task 8: Full verification + push + PR

- [ ] **Step 1: Full local test gate**

Run: `npm run test:local`
Expected: all tests pass, "0 failed" (includes the new `promote.test.ts`).

- [ ] **Step 2: Full project type-check (only pre-existing vendor errors allowed)**

Run: `npx tsc -b --noEmit 2>&1 | grep -vE "calendar.tsx|resizable.tsx" | grep -E "error TS" || echo "no new type errors"`
Expected: `no new type errors`.

- [ ] **Step 3: Tone audit**

Run: `grep -nE "animate-pulse|Math\.random\(\)" src/dashboard/_shared/hackathon/workspace.ts src/dashboard/_shared/hackathon/promote.ts src/dashboard/founders/section/components/founder/TeamWorkspaceView.tsx src/dashboard/founders/section/components/incubation/hackathon/PromoteToStartupModal.tsx src/dashboard/founders/section/components/incubation/hackathon/useGenerateTeamWorkspace.ts`
Expected: no matches. (`Date.now()` lives only in the generate hook + modal handler — event-handler context, which is allowed.)

- [ ] **Step 4: Push**

```bash
git branch --show-current   # must print feat/hackathon-promote
git push -u origin feat/hackathon-promote:pr-f-hackathon-promote
```

- [ ] **Step 5: Confirm scope, open PR**

```bash
git fetch -q origin main
git log --oneline origin/main..HEAD          # spec + plan + 7 feat commits, promote files only
gh pr create --repo techit360ai-bit/new-frontend --base main --head pr-f-hackathon-promote \
  --title "Hackathon team-workspace pipe + startup promote (sub-project ③) — FE-only mock" \
  --body "Real in-app team-workspace pipe (one workspace per team: seeded idea/team/artifacts, focused TeamWorkspaceView, best-effort organizer report) + promote-to-startup that binds that same workspace to a new founder venture. Dashboard ventures read from context. Spec/plan in docs/superpowers. Gate: npm run test:local + tsc -b clean on touched files. 🤖 Generated with [Claude Code](https://claude.com/claude-code)"
```

- [ ] **Step 6: Report the PR URL and stop for review.** Do not merge until the user approves.

---

## Self-Review notes (for the executor)

- **Spec coverage:** team-workspace pipe → Tasks 2,3,4,6a,6b; one-create rule → 6a (create) + 6b/6c (reuse links); promote + bind → Tasks 1,2,5,6a,6c; Dashboard visibility → Task 7; org report → Tasks 3,4. All spec sections map to a task.
- **Type consistency:** `TeamWorkspace`, `buildTeamWorkspace(reg, now)`, `promoteDefaults`/`buildPromotedProject`, `addFounderProject`/`addTeamWorkspace`/`bindTeamWorkspaceProject`, `workspaceId`/`promotedProjectId`, `useGenerateTeamWorkspace().generate(reg, opts)` are used identically across tasks.
- **One workspace per team:** the only create path is `useGenerateTeamWorkspace` (BuildStage, or on-demand inside the modal if missing); Submit/Results only link; promote binds — there is no `provisionWorkspace` call anywhere.
- **Verify-against-file points:** the `p` alias in Dashboard (Task 7), and which imports become unused in BuildStage after repointing (Task 6a Step 3) — confirm by reading those files.
