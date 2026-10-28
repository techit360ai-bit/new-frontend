# Organization Intelligence — Implementation Plan (Features 1–3 first, then 4–7)

Source: `new-frontend/frontend/ORG_SECTION_ENHANCEMENT_PLAN.md`
Constraint from founder: **do not clutter the org sidebar** (already 15 items) and **build the first 3 recommendations first**, then the rest.

This is a **full-stack, multi-repo** feature spanning:
- `new-frontend/frontend/` (Vite + React + TS + Tailwind v4 + recharts + react-router)
- `BACKEND/backend/` (Express + lowdb; `services/domainService.js`, `routes/domain.js` at `/api/domain/*`)
- `ai-router/` (FastAPI; shares `JWT_SECRET` with backend) — used only for AI narrative, with graceful fallback

**No mock data.** Every number is a persisted record or **deterministically derived** from real fields (`gsisScore`, `updatedAt`, `mrr`, `stage`, `progress`, `memberCount`, `marketReadyScore`, `dealFlowSnapshots`, `investors`). AI is enrichment layered on real aggregates, never the source of a value; if ai-router is offline we fall back to rule-based text and flag `aiAvailable:false` — never fake numbers.

---

## Sidebar decision (the founder's key ask)

Add **ONE** sidebar item — **"Intelligence"** (`/org/intelligence`) — that renders a layout with an internal tab bar + nested routes. Sidebar goes 15 → **16**, and stays there: Features 4–7 later become additional tabs, not new sidebar items.

| Tab | Route | Feature |
|-----|-------|---------|
| Cohort Health | `/org/intelligence/cohort-health` (index) | 1 |
| Impact | `/org/intelligence/impact` | 2 |
| Demo Day | `/org/intelligence/demo-day` | 3 |

Nested routes (mirroring the existing hackathons `Outlet` pattern) keep each tab deep-linkable and independently shippable. Icon: `Gauge` (`Brain` is already used by "AI Operations").

---

## Verified facts that shape the build (checked against source)

1. `listOwned/findOwned/insertOwned/patchOwned(db, name, ..., field='ownerId')` — org records are owned via `'organizationId'`. (domainService.js:30–56)
2. `publishProject` uses `findOwned(db,'projects',id,userId)` with **default `ownerId`** → org projects **cannot** publish through it. Feature 3 must add `publishOrganizationProject` scoped to `'organizationId'`. (domainService.js:469–474)
3. `req.user` does **not** include the raw JWT. Forwarding to ai-router needs one line in `auth.js`: `req.user.token = token`. ai-router verifies the same `JWT_SECRET` (documented in auth.js:8). (middlewares/auth.js)
4. Org routes already guard with `requireRole('organization','organisation')` (both spellings); new routes must too. (routes/domain.js:110–112)
5. Component conventions to mirror exactly: fetch via `@/lib/api/organization`, `loading/error/empty` states, `RefreshCw` refresh, `EmptyPanel`, recharts, emerald/amber/rose Tailwind. (components/org/Dashboard.tsx)

---

## Shared plumbing (PR 0 — build once)

- **domainService.js helpers** (pure functions over real fields): `daysSince(iso)`, `decayFactor(project)` (from `updatedAt` staleness), `healthBand(gsis, decay)`.
- **`aiRouterClient.js`** (new, dependency-free, global `fetch`): `computeGsisNarrative(token, scores)` → `POST {AI_ROUTER_URL}/api/v1/gsis/compute`; 6s timeout; returns `null` on any failure.
- **`auth.js`**: add `req.user.token = token` so controllers can forward the org's Bearer to ai-router.
- **Frontend**: `OrgIntelligenceLayout.tsx` (tab bar + `<Outlet/>`); add sidebar item in `OrgLayout.tsx` + `startsWith('/org/intelligence')` active branch; add nested routes in `App.tsx` under the existing `/org` block.
- **Tests**: seed new collections (`demoDayEvents`, `kpiTargets`, `investors`) in `domain.test.js` `makeDb()`.

---

## Feature 1 — Cohort Health Dashboard (PR 1)

**Derived, not mocked:** decay from `updatedAt` (0–6d healthy → 30d+ dormant); `healthBand` combines real `gsisScore` + decay; alerts = inactivity + low-absolute-GSIS. Week-over-week GSIS deltas need history that doesn't exist yet → **omitted from v1** (UI says "trend deltas require snapshots"); optional fast-follow `gsisSnapshots` collection (1/day, real derived history).

- **Backend**: `organizationCohortHealth(userId, {stage, riskLevel})` → ranked cohort + alerts + summary, aggregating `listOwned(db,'projects',userId,'organizationId')`. Separate `organizationInterventions(userId, token)` → AI (or rule-based) recommendations for at-risk startups.
- **Routes**: `GET /organization/cohort-health`, `GET /organization/interventions` (both role spellings).
- **Frontend API**: `CohortHealthData`/`CohortHealthEntry`/`InterventionRec` interfaces + `normalize*` + `fetchCohortHealth`/`fetchInterventions`.
- **Component**: `intelligence/CohortHealth.tsx` — summary cards, ranked color-coded grid, stage/risk filters, alerts panel, AI-interventions panel (own loading state; degrades to rule-based). Empty state when no projects.

## Feature 2 — Impact Reporting Engine (PR 2)

- **Backend**: `organizationImpact(userId, {template})` aggregates real fields — `startups` (count), `productsLaunched` (stage∈launched/growth/scaling), `totalMrr` (Σ mrr), `jobs` (Σ memberCount), `avgProgress`, `avgMarketReady` + stage/industry/revenue charts. **KPI targets** persisted in an org-scoped `kpiTargets` collection (targets are user data; actuals derived). "Users acquired"/"milestones" have no field today → **omitted from v1**, labelled honestly. Export = client-side print/CSV (no server PDF lib present).
- **Routes**: `GET /organization/impact`, `GET/POST /organization/kpi-targets` (org-scoped via new `organizationCollection` helper to prevent cross-org leakage).
- **Frontend**: `ImpactReporting.tsx` — template selector, metric cards, recharts, KPI target-vs-actual table, export.

## Feature 3 — Demo Day Pipeline & Investor Matchmaking (PR 3)

- **Backend**: `demoDayPipeline(userId,{threshold})` (readiness + derived checklist from real fields); **`publishOrganizationProject`** (org-scoped fix for the ownership gap; stamps snapshot `organizationId`); `investorMatches(userId, projectId)` over real `investors` (sector/stage/check-size); `demoDayEvents` org-owned collection; post-event analytics from real watchlist rows.
- **Routes**: `GET /organization/demo-day/pipeline`, `POST /demo-day/publish`, `GET /demo-day/matches/:projectId`, `GET/POST /demo-day/events`, `GET /demo-day/analytics`.
- **Frontend**: `DemoDayPipeline.tsx` — readiness grid + threshold, "Push to Deal Flow" (→ refetch), investor matches, event builder, analytics.
- **Cross-section proof**: published org project appears in `/investor/deal-flow` (real data flow between roles).

---

## Features 4–7 (after 1–3, later PRs, same "Intelligence" item as new tabs)

4. Early Warning / Intervention System · 5. Resource Allocation Intelligence · 6. Post-Program Alumni Tracking · 7. Cross-Cohort Benchmarking. Each is a new tab under `/org/intelligence`; sidebar stays at 16.

---

## Verify (each PR)

- **Backend**: `npm test` (vitest, extend `domain.test.js`): org-scoped aggregation returns real projects ranked/banded; empty cohort for fresh org; org publish stamps `organizationId` + idempotent; interventions return rule-based with `aiAvailable:false` when ai-router unreachable.
- **Frontend**: `npm run build` (tsc + vite, type-clean), `npm run lint`, `npm test` (vitest) — empty/loading/error states per component.
- **End-to-end (real data)**: create org projects → they aggregate in Cohort Health (ranked, banded, `daysInactive` from real `updatedAt`); patch a project → decay resets; set a KPI target → persists; push a demo-day project → visible in investor deal flow.

## Risks (handled)

Role-name inconsistency (both spellings on new routes) · ownership gap (`publishOrganizationProject`) · empty states (real empty panels, no skeleton-as-data) · no mock fallback (uses throwing `domainApi`, not the ai-router mock seam) · missing fields omitted+labelled, not invented · cross-org leakage (org-scoped collection helper) · ai-router token forwarding (`req.user.token`).

## Staged delivery

PR 0 (shared plumbing + Intelligence shell) → PR 1 (Cohort Health) → PR 2 (Impact) → PR 3 (Demo Day). Each independently shippable and mergeable; 4–7 follow as tabs.
