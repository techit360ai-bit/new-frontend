# Hackathon → Team Workspace + Startup Promote Pipeline — Design

**Status:** Approved
**Date:** 2026-06-17
**Branch:** `feat/hackathon-promote` (off new-frontend `main`; FE-only mock slice, matches PR-B/C/D + Passport posture)
**Predecessor:** PR-D (Submit & Pitch) + Startup Passport (②) — both merged. Consumes the `stage === "submitted-final"` registrations PR-D produces.
**Sub-project:** ③ (final piece) of the hackathon completion arc.

## Goal

Two connected, **additive** pipelines on top of the existing hackathon flow. Nothing already built is removed or reworked — these extend it:

1. **Real team-workspace pipe.** A founder/team can click **one** button — the existing "Team workspace" control in the **Build stage** — to **generate a populated team workspace**: the idea content (the 7 brief fields), the team roster, and the submission artifacts actually flow into a workspace record that is rendered on a real view — not the current fire-and-forget toast. Generating it also **reports the team's details to the organizers** (best-effort backend call). The workspace id is persisted on the registration so it survives navigation and is reused. **Exactly one create-workspace action exists in the hackathon section** (Build stage); every other stage that references the workspace (Submit, Results, the workspace view) shows an **"Open team workspace"** reuse link — never a second create. The `workspaceId` guard makes a second creation impossible.

2. **Promote to startup.** A founder promotes a completed (`submitted-final`) hackathon project into a full venture in their portfolio (Dashboard "Your ventures"), via an editable confirm modal. Promotion **binds the team's one existing workspace to the new venture** — it does **not** create a second workspace (Option B: exactly one workspace per team). Marks the registration promoted so it can't be promoted twice.

## Honesty boundary (what "real" means here)

This app is **frontend-only**; no server runs in this environment (ai-router can't run; Vite SIGBUS-cores). "Real" therefore means a genuine **in-app data pipe**: content is carried into a workspace record persisted in React context and **rendered on a real view**, instead of a toast that links to an empty dashboard. Backend calls (`provisionTeamWorkspace`, `reportTeamToOrganizers`, `createFounderProject`) are made **best-effort** via the existing `withFallback` for write-seam parity, but the visible source of truth is in-memory context. Refresh wipes (per PR-B/C/D + Passport). No DB, no localStorage.

## Non-goals

- Rebuilding the large MCP `/workspaces` dashboard. The team workspace gets a **focused dedicated view** that mirrors the main-workspace layout with hackathon-team-specific sections — it does not refactor the existing console.
- New org-side UI. `reportTeamToOrganizers` is a best-effort call that structurally feeds the org loop (like the existing `logHackathonCheckIn`); building an org report screen is out of scope.
- Real backend persistence / new scoring. `gsisScore` on a promoted venture is seeded from the real `briefScore.overall`.
- Editing/undoing a promotion or de-provisioning a workspace.
- Altering existing behavior: the current BuildStage "Team workspace" panel, BriefStage, SubmitStage submit flow, ResultsView, and the Passport all stay as-is and are only extended.

## Architecture

```
UserContext
  + teamWorkspaces: TeamWorkspace[]   + addTeamWorkspace(ws)  + bindTeamWorkspaceProject(wsId, projId)
  + founderProjects: FounderProject[] (seeded)   + addFounderProject()
  + HackathonRegistration.workspaceId?   + HackathonRegistration.promotedProjectId?
  (ONE workspace per team: created in Build, reused in Submit/Results, bound to the venture on promote)
        │
_shared/hackathon/workspace.ts   buildTeamWorkspace(reg, now) → TeamWorkspace   (pure, tested)
_shared/hackathon/promote.ts     promoteDefaults / buildPromotedProject(...)    (pure, tested)
lib/api/hackathon.ts             + reportTeamToOrganizers(id, teamId, report)   (best-effort)
        │
incubation/hackathon/
  ├── useTeamWorkspace.ts (or inline helper)  generate(): create record + report + persist + provision
  ├── PromoteToStartupModal.tsx               shared (ResultsView + BuildStage)
  ├── BuildStage.tsx     EXTEND workspace panel: THE single generate (populated) + promote button
  ├── SubmitStage.tsx    ADD "Open team workspace" reuse link only (no create) + promote handled via Results
  └── ResultsView.tsx    ADD promote button / promoted-state
founders/.../founder/TeamWorkspaceView.tsx    NEW focused view (route /team-workspace/:teamId)
founders/.../founder/Dashboard.tsx            venture source: fetch → context
App.tsx                                       + route for TeamWorkspaceView
```

### 1. Data model (`src/contexts/UserContext.tsx`)

Imports (reuse, no redefinition): `import { type FounderProject, FALLBACK_PROJECTS } from "@/lib/api/projects";`

**TeamWorkspace type** (new, exported from UserContext alongside the other hackathon types):
```ts
export interface TeamWorkspaceIdea {
  problem: string; targetUser: string; solutionSketch: string; whyNow: string;
  differentiator: string; risk: string; successMetric: string;
}
export interface TeamWorkspaceMemberRef { collaboratorId: string; name: string; role: string; }
export interface TeamWorkspaceArtifacts { demoUrl: string; deckUrl: string; videoUrl: string; }
export interface TeamWorkspace {
  id: string;            // `ws_team_<now>`
  hackathonId: string;
  teamId: string;
  teamName: string;
  createdAt: string;     // ISO
  idea: TeamWorkspaceIdea | null;        // from brief (null if not yet briefed)
  team: TeamWorkspaceMemberRef[];        // from reg.members
  artifacts: TeamWorkspaceArtifacts | null;  // from finalSubmission (null until submitted)
  projectId?: string;    // set if/when promoted to a venture
}
```

Additions to `FounderProfile`:
- `founderProjects: FounderProject[]` — seeded `FALLBACK_PROJECTS` (first paint unchanged).
- `teamWorkspaces: TeamWorkspace[]` — seeded `[]`.

Additions to `HackathonRegistration`:
- `workspaceId?: string` — presence ⇒ a team workspace exists (gates the generate button → becomes "Open workspace").
- `promotedProjectId?: string` — presence ⇒ promoted (gates the promote button).

Updaters (each wired through the 4 touch-points like `submitFinal`):
- `addFounderProject(project: FounderProject)` — appends.
- `addTeamWorkspace(ws: TeamWorkspace)` — appends to `teamWorkspaces`.
- `bindTeamWorkspaceProject(workspaceId: string, projectId: string)` — sets `projectId` on the matching `TeamWorkspace` (used by promote to bind the one workspace to the new venture). No-op if not found.
- `workspaceId` / `promotedProjectId` are set via the **existing** `updateHackathonRegistration(teamId, { … })` (both are new optional fields on the registration, already covered by its `Partial<Omit<…>>` updates type).

### 2. Pure logic

**`src/dashboard/_shared/hackathon/workspace.ts`**
```ts
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
Pure, deterministic (`now` passed in). Unit-tested.

**`src/dashboard/_shared/hackathon/promote.ts`** — `promoteDefaults(reg, fp)` + `buildPromotedProject(reg, fp, overrides, now)` exactly as previously specified (title←teamName, tagline←trimmed solutionSketch, industry←industries[0], stage←"mvp", gsisScore←briefScore.overall ?? 0, id `proj_local_<now>`, isPrimary false, hasWorkspace true). Pure, unit-tested.

### 3. Org-report seam (`src/lib/api/hackathon.ts`)

Add (additive, best-effort, mirrors `logHackathonCheckIn`):
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

### 4. Generate-workspace action (shared helper)

A small shared function invoked by **BuildStage only** (the single create-workspace action). It can be a hook `useGenerateTeamWorkspace()` in `incubation/hackathon/` or an inline helper; behavior (reuse-aware, so it can never create twice):
```
generate(reg):
  if reg.workspaceId exists → navigate to /team-workspace/<teamId> (reuse, no re-create)
  else:
    ws = buildTeamWorkspace(reg, Date.now())
    addTeamWorkspace(ws)
    updateHackathonRegistration(reg.teamId, { workspaceId: ws.id })
    void provisionTeamWorkspace(reg.hackathonId, reg.teamId, ws.id)              // best-effort
    void reportTeamToOrganizers(reg.hackathonId, reg.teamId, {                    // best-effort
      workspaceId: ws.id, idea: ws.idea, team: ws.team, artifacts: ws.artifacts, stage: reg.stage })
    toast.success("Team workspace generated — organizers notified")
    navigate to /team-workspace/<teamId>
```

### 5. TeamWorkspaceView (`founders/.../founder/TeamWorkspaceView.tsx`, route `/team-workspace/:teamId`)

Focused view that **mirrors the main-workspace layout** (header + sectioned panels) with hackathon-team-peculiar sections, all from the `TeamWorkspace` (looked up by `teamId` from `founderProfile.teamWorkspaces`, falling back to the registration if the record is missing):
- **Header**: team name, hackathon, "Team workspace" label, a "Reported to organizers ✓" pill.
- **Idea** panel: the 7 brief fields (read-only), or an empty state if `idea` is null ("Submit your brief to seed the workspace").
- **Team** panel: roster from `team` (+ "You · Leader"); chips link to `/matchresults`.
- **Build timeline** panel: reuse the check-in list pattern from BuildStage if `registration.checkIns` present (display-only here).
- **Artifacts** panel: demo/deck/video links once `artifacts` present, else "Artifacts appear after final submission."
- **Promote** CTA: "Promote to startup" (opens `PromoteToStartupModal`) or "Promoted ✓" state.
Add the route in `App.tsx` near the other founder routes (the founder Dashboard is at `/dashboard`, `App.tsx:207`).

### 6. PromoteToStartupModal (`incubation/hackathon/PromoteToStartupModal.tsx`)

Props `{ registration; onClose }`. Editable fields (Title required, Tagline, Industry, Stage select) prefilled via `promoteDefaults`. On confirm (handler — `Date.now()` allowed):
1. `project = buildPromotedProject(reg, founderProfile, overrides, Date.now())`
2. `addFounderProject(project)`
3. `void createFounderProject({ title, tagline, industry, stage })` (best-effort write-seam parity)
4. **Reuse the team's ONE workspace — never create a second** (Option B: exactly one workspace per team, all the way through):
   - Ensure the single team workspace exists: if `reg.workspaceId` is set, use it; if it's somehow missing (a team reached `submitted-final` without generating one), create it **once** here via the shared `generate()` path (`buildTeamWorkspace` → `addTeamWorkspace` → persist `workspaceId` → best-effort `provisionTeamWorkspace` + `reportTeamToOrganizers`). This is the same single workspace, created on demand — not a parallel mechanism, and there is **no `provisionWorkspace` / venture-workspace call**.
   - **Bind** that one workspace to the new venture: `bindTeamWorkspaceProject(workspaceId, project.id)` (sets `TeamWorkspace.projectId`). The promoted venture and the hackathon team now point at the same workspace.
5. `updateHackathonRegistration(reg.teamId, { promotedProjectId: project.id })`
6. `toast.success("Promoted to startup — added to your ventures")`; `onClose()`.
Modal overlay follows the `RegisteredTeamCard.tsx` drawer idiom. The modal imports the shared `generate()` helper (for the missing-workspace fallback) and `bindTeamWorkspaceProject` from context — it does **not** import `provisionWorkspace`.

### 7. Surfaces (additive)

- **BuildStage.tsx** — the existing "Team workspace" panel is **extended**, not replaced, and is **the single create-workspace action in the hackathon section**: the existing `Create team workspace` button now calls the shared `generate()` (populated record + report + persist + provision) instead of only `provisionTeamWorkspace`; when `reg.workspaceId` exists it shows "Open workspace" → `/team-workspace/:teamId`. Add a "Promote to startup" button + promoted guard below it.
- **SubmitStage.tsx** — **add only an "Open team workspace" link** (→ `/team-workspace/:teamId`), shown when `reg.workspaceId` exists. It does **not** create a workspace (no second create button). When no workspace exists yet, show a one-line hint: "Create your team workspace in the Build stage." (Existing submit form + locked/results behavior unchanged.)
- **ResultsView.tsx** — **add** a "Promote to startup" button / "Promoted ✓" card (Open workspace + View in portfolio links).

### 8. Dashboard refactor (`Dashboard.tsx`)

Venture source: replace the `fetchFounderProjects()` effect with `const ventures = p.founderProjects;` + a small effect defaulting `activeVentureId` when null (per the lines ~77–88 pattern). Only change on this screen; first paint unchanged (seeded). Promoted ventures appear immediately.

## Error handling & boundaries

- `buildTeamWorkspace`, `promoteDefaults`, `buildPromotedProject` are pure and total — missing brief/members/submission yield `null`/`[]`/empty, never throw. Unit-tested.
- All backend calls (`provisionTeamWorkspace`, `reportTeamToOrganizers`, `createFounderProject`) are best-effort; failures never block the in-context creation. Workspace/venture records and the `workspaceId`/`promotedProjectId` marks are set regardless → consistent offline.
- Double-generate guarded by `workspaceId`; double-promote guarded by `promotedProjectId`.
- In-memory; refresh wipes.
- Units isolated: pure builders testable alone; the generate helper and modal consume context + builders; views are presentational; Dashboard change is a localized source swap.

## Testing & verification

**Local node gate** (`npm run test:local`; matcher constraint: only `toBe`/`toEqual`/`toContain`/`toHaveLength`/`toBeTruthy`/`toBeFalsy`/`toBeNull`/`.not` — use boolean comparisons).

**`workspace.test.ts`** — `buildTeamWorkspace`: idea seeded from all 7 brief fields; `idea` null when no brief; team mapped from members; artifacts from finalSubmission else null; id uses passed `now`; createdAt = ISO of now.

**`promote.test.ts`** — `promoteDefaults` + `buildPromotedProject`: defaults (title/tagline/industry/stage), empty-brief → empty strings, overrides win, gsis from briefScore, id/isPrimary/hasWorkspace, tagline truncation at 120.

**Type-check**: `tsc -b --noEmit` (pre-existing shadcn `calendar.tsx`/`resizable.tsx` errors ignored).

**Tone/consistency**: no emoji in `<h1>`/`<h2>`; no `animate-pulse`; real names from context; `Date.now()`/`Math.random()` only in event handlers (generate/promote), never render bodies. Light palette on founder surfaces; TeamWorkspaceView mirrors the main-workspace sectioned layout.

Not browser-verifiable here (Vite SIGBUS) — stated, not claimed verified.

## File-by-file summary

| File | Change |
|---|---|
| `contexts/UserContext.tsx` | `TeamWorkspace`* types; `founderProjects` (seeded) + `teamWorkspaces`; `addFounderProject` + `addTeamWorkspace` + `bindTeamWorkspaceProject`; `workspaceId?` + `promotedProjectId?` on registration |
| `lib/api/hackathon.ts` | ADD `reportTeamToOrganizers` (best-effort) |
| `_shared/hackathon/workspace.ts` | NEW — pure `buildTeamWorkspace` |
| `_shared/hackathon/workspace.test.ts` | NEW — node-gate tests |
| `_shared/hackathon/promote.ts` | NEW — pure `promoteDefaults` + `buildPromotedProject` |
| `_shared/hackathon/promote.test.ts` | NEW — node-gate tests |
| `incubation/hackathon/teamWorkspace.ts` | NEW — shared `generate()` helper/hook |
| `incubation/hackathon/PromoteToStartupModal.tsx` | NEW — editable confirm modal |
| `incubation/hackathon/BuildStage.tsx` | EXTEND workspace panel (populated generate + open) + promote button |
| `incubation/hackathon/SubmitStage.tsx` | ADD "Open team workspace" reuse link only (no create button) |
| `incubation/hackathon/ResultsView.tsx` | ADD promote button / promoted-state |
| `founders/.../founder/TeamWorkspaceView.tsx` | NEW — focused populated workspace view |
| `founders/.../founder/Dashboard.tsx` | MODIFY — venture source fetch → context |
| `App.tsx` | ADD route `/team-workspace/:teamId` |

## Commit plan (vertical slices, gate each)

1. Context: types + `founderProjects`/`teamWorkspaces` seed + `addFounderProject`/`addTeamWorkspace` + `workspaceId?`/`promotedProjectId?`. (`tsc`)
2. Pure logic: `workspace.ts` + `promote.ts` + their tests. (`test:local` + `tsc`)
3. Seam: `reportTeamToOrganizers`. (`tsc`)
4. Generate helper + `TeamWorkspaceView` + route. (`tsc`)
5. `PromoteToStartupModal`. (`tsc`)
6. Surfaces: extend BuildStage, add SubmitStage button, add ResultsView promote. (`tsc`)
7. Dashboard venture-source refactor. (`tsc`)

Branch pushed as a new remote branch off `main` → `gh pr create` → (merge on user approval). Verify `git branch --show-current` before each commit.
