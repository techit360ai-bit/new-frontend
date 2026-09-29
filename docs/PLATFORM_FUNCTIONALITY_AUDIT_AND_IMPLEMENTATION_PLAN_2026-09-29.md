# Platform Functionality Audit and Implementation Plan

**Date:** 2026-09-29
**Status:** Phases 0–4 **implemented** (Phase 4 code-complete; see the implementation log below).
**Scope:** founder/collaborator dashboard intelligence coverage, Wallet billing/payment UX, workspace UI mock/non-functional surfaces, coding-area seams, and the two CI blockers currently on `main`.
**Method:** direct source reading of `new-frontend/frontend/src/**`, `BACKEND/backend/src/**`, plus live `gh` PR/CI inspection.

Companion document (commercial model): `BACKEND/docs/TVCE_UNIT_ECONOMICS_PAYMENTS_AND_ENTITLEMENTS.md`.

---

# Part 0 — Implementation log

| Phase | Status | Evidence |
|---|---|---|
| Phase 0 — restore `main` | done | `fix/frontend-vite-vitest-peer-conflict` (new-frontend PR #162) + `frontend.yml` green |
| Phase 1 — wallet ↔ billing truthfulness | done | BACKEND PR #138, new-frontend PR #168 — `GET /api/tvce/checkout/providers`, `GET /api/domain/wallet/analytics`, truthful `walletSummary` fields, hosted checkout wiring, real usage cards |
| Phase 2 — dashboard intelligence coverage | done | new-frontend PR #169 — GSIS v2 metrics + evidence provenance, real signals/tasks/journey/activity, Customer evidence card, collaborator Contribution intelligence |
| **T2.4 — founder equity/cap table** | done | BACKEND PR #139 (`GET /api/domain/founder/equity`), new-frontend PR #170 — derived cap table card. Founder-declared splits, external investors and option pools are **not** tracked, so `retainedPercent` is rendered as a labelled derivation, never as a fabricated split |
| Phase 3 — workspace UI honesty & polish | done | new-frontend PR #170 (T3.1–T3.7) + BACKEND PR #139 (`POST`/`DELETE /api/domain/files`) |
| Phase 4 — coding area polish | done | new-frontend `feat/phase4-coding-transports` + BACKEND same-named branch (T4.1–T4.3). Real `plan`/`propose`/`orchestrate` coding intelligence on the platform backend (the three `/workspace/code/*` ai-router endpoints did not exist), `vscode://` replaced by a labelled copy-to-clipboard setup panel, `window.prompt`/`confirm` replaced by an in-app dialog primitive, and a terminal command input. Also repointed `workspace/lib/api/capabilities.ts` from the ai-router base to the platform base (it was calling non-existent `/api/v1/code/*` routes, breaking BYOK + Build/Preview) |

Deliberately left honest rather than faked:

- **Agents console transport (T3.5):** now a **real polling transport** — `GET /api/domain/workspaces/:id/tasks/:id` reads a backend task record and `POST .../run` drives one real AI-router conversation (`workspaceTaskService.js`). The transcript polls that record and updates live; when the router is unreachable the task is marked `failed` with an explicit error event, never a fabricated reply. (Still polling rather than SSE/WebSocket — the UI says so.)
- **Connectors (T3.6):** now a **real credential handshake** — `POST /api/domain/workspaces/:id/connectors/:id/credential` seals a provider token at rest (same key material as BYOK) and masks it in every response. This is explicitly **not** a browser OAuth redirect: `oauthRedirectSupported: false` and the UI states that no OAuth callback endpoint exists.
- **Files (T3.3):** only metadata (name/type/size) is stored; the UI is relabelled "Register File" and reports real registered bytes rather than a fabricated storage bar.

---

# Part A — Findings

## A1. Blockers on `main` (highest priority)

### A1.1 `npm ci` fails — incompatible vite/vitest pin (regression)
`new-frontend/frontend/package.json` on `origin/main` pins:

- `vite` `^5.4.21`
- `vitest` `^5.0.2`

`vitest@5` declares `peer vite@^6.4.0 || ^7.0.0 || ^8.0.0`. Result: `npm error ERESOLVE could not resolve` in CI install, which fails both **Live WebContainer Runtime** and sometimes **Frontend Quality Gates**. Introduced by a Dependabot merge (runs 36504336363 / 36504372464, titles “Merge pull request #153/#160”).

Impact: every push to `main` fails CI; nothing can be validated or deployed from `main`.

### A1.2 WebContainer E2E test times out
`frontend/tests/visual/code-editor.spec.ts` fails deterministically: the test clicks into a live preview and waits for `TECHIT_WEBCONTAINER_OK`, hitting `Test timeout of 120000ms exceeded` / `locator.click: Test timeout`. Failing since at least 2026-09-17, on `main` too — not intermittent. Until A1.1 is fixed the suite cannot even install, so this is masked.

---

## A2. Founder dashboard — GSIS and related intelligence

**File:** `frontend/src/dashboard/founders/section/components/founder/Dashboard.tsx`

**Present and correctly wired**

- GSIS v2 scorecard via `computeGsisV2()` (`frontend/src/lib/api/gsis.ts` → `POST /api/v2/gsis/scorecard`). Renders: GSIS/100, model version, detected stage + reason, stage health, momentum, PMF, risk level, next-stage readiness + gate status, `data_coverage` %, `confidence` %, primary bottleneck, next-best action + next milestone, and blocking requirements.
- Legacy fallback: `fetchDashboardIntelligence()` (`GET /api/v1/dashboard/intelligence`) renders the legacy GSIS card when v2 is unavailable; renders nothing if both fail.
- Momentum audio briefing: `fetchAudioBriefing()` → TTS “Play momentum briefing”.
- Risk intelligence: `runAnomalyScan()` → risk flags.
- Hackathon momentum (`computeMomentum`), founder opportunity catalog (`fetchFounderOpportunityCatalog`), Journey strip, `WelcomeBack`.
- `ContinuousIntelligencePanel role="founder"` (rendered in `FounderLayout.tsx`): daily intelligence (active risk signals + top recommendation), refreshed every 5 min, plus matching-access note (visibility tier, subscription state, credits, match breadth) from `frontend/src/components/intelligence/ContinuousIntelligencePanel.tsx`.

**Gaps**

1. **Thin evidence → low-confidence scorecard.** The GSIS v2 `metrics` object is built only from a few `founder_profile` fields: `team_size`, `active_users`, `revenue`, and `product` (sourced from project progress). Everything else arrives as `unknown`. So `data_coverage`/`confidence` will be structurally low and most components unobserved.
2. **Hardcoded-empty surrounding surfaces.** `EMPTY_SIGNALS`, `EMPTY_TASKS`, `EMPTY_JOURNEY` are non-fetching constants, so the founder sees “No persisted activity yet.” and an empty signals/journey/tasks view next to a live scorecard.
3. **No evidence provenance in the UI.** `TVCE_FREE_ROLE_ACCESS_PLAN.md` requires GSIS/health responses to expose “score, confidence level, evidence sources, missing evidence, and next-best action”. The card shows coverage/confidence and missing gates, but **not** the evidence sources nor a per-component breakdown.
4. **Related founder intelligence not surfaced on the dashboard:** investor readiness, validation/customer-evidence summary, diligence pack, market/competitor intelligence, financial/runway, cap-table/equity — some of these APIs exist (`frontend/src/lib/api/investorIntelligence.ts`, `investorDeals.ts`, `dealFlow.ts`, `equity.ts`, `incubation.ts`) but are not composed into the founder dashboard.

**Verdict:** the founder dashboard exposes the *core* GSIS scorecard and continuous intelligence, but not a complete, evidence-backed intelligence picture; the timeline/signals/journey around it are placeholders.

---

## A3. Collaborator dashboard — GSIS and related intelligence

**File:** `frontend/src/dashboard/collaborators/section/components/collab/Dashboard.tsx`

**Present and correctly wired**

- `fetchCollaboratorEquity()`, `fetchCollaboratorEarnings()`, `fetchCollaboratorScores()` (`/collaborator/scores`) → CBS/TSS/CRS widgets, Active Builds, Signals.
- `ContinuousIntelligencePanel role="collaborator"` (in `CollabLayout.tsx`) — same daily intelligence + matching-access note as founders.

**Gaps**

1. **No GSIS / startup-intelligence surface at all.** There is no scorecard, no stage/momentum/PMF/risk, no readiness, and no project-health view. Equity, earnings and personal scores are the entire intelligence story.
2. **Two key widgets are hardcoded stubs:** “Today’s focus” → “No live task assignments yet…”, “Recent activity” → “No persisted collaborator activity yet.” No fetch behind either.
3. **No contribution-intelligence framing:** no link between the collaborator’s tasks/evidence and the workspace’s GSIS trajectory (the credibility/progress loop described in `TVCE_FREE_ROLE_ACCESS_PLAN.md`).

**Verdict:** the collaborator dashboard is an equity/earnings/scores view, not an intelligence dashboard. It also lacks the evidence and task data needed for the promised contribution-value loop.

---

## A4. Wallet UI/UX vs. billing + payment logic

**Files:** `frontend/src/TechitWallet/Wallet.tsx`, `frontend/src/lib/api/wallet.ts`, `frontend/src/components/PaymentModal.tsx`, `frontend/src/lib/api/tvce.ts`; backend `BACKEND/backend/src/services/domainService.js`, `backend/src/routes/domain.js`, `backend/src/repositories/financeRepository.js`.

**What the Wallet presents**

- Balance badge; wallet buckets + deduction order; expiration alerts; low-balance alert; restriction/upgrade card (`summary.wallets`, `summary.deductionOrder`, `summary.expirationAlerts`, `summary.lowBalance`, `summary.restriction`).
- Credit-pack purchase view; plan/upgrade view; transactions; free-usage counters (`fetchCreditPackages`, `fetchBillingPlans`, `fetchWalletTransactions`, tvce free-usage).

**What is not functional**

| Surface | Behaviour | Root cause |
|---|---|---|
| “Buy credits” → select package | Calls `createWalletPaymentIntent()` → `POST /api/domain/wallet/payment-intents`; only toasts “Payment intent created with status pending”. No redirect, no checkout. | `createPaymentIntent()` in `domainService.js` inserts a `paymentIntents` row with `status: 'pending'`, `provider: body.provider \|\| null`, and **never** produces a `checkoutUrl` or calls a provider. |
| “Upgrade” plan button | `toast.info('Upgrade checkout is not exposed by the current billing API.')` | No subscription checkout wiring in the Wallet. |
| Subscription usage card | Hardcoded “Unavailable”. | `walletSummary()` in `financeRepository.js` does not return `subscriptionUsage`. |
| Wallet source analytics card | Hardcoded “Unavailable”. | `fetchWalletAnalytics()` targets `GET /wallet/analytics`, which is **not routed** in `routes/domain.js`. |
| Free plan details card | Hardcoded “Unavailable”. | `walletSummary()` does not return `freePlan`. |
| Credits-consumed ledger card | Hardcoded “Unavailable”. | No ledger-analytics endpoint. |
| Real hosted checkout | **Dead code.** | `components/PaymentModal.tsx` is the only caller of the real `createTvceCheckout()` (Stripe/Paystack/Flutterwave with `checkoutUrl` redirect), and it is imported nowhere. |

**Contract drift:** `WalletSummary` in `lib/api/wallet.ts` declares `wallets`, `deductionOrder`, `sourceTotals`, `subscriptionUsage`, `freePlan`, `restriction`; the backend summary returns only `account`, `creditBalance`, `lifetimeCreditsUsed`, `pendingPayments`, `pendingReservations`. The UI therefore promises fields the API never sends.

**Verdict:** the Wallet UI/UX renders billing *state* honestly, but does **not** output working billing/payment *functionality* — there is no functioning purchase, no functioning upgrade, and no analytics/ledger, while the one real checkout component is unused.

---

## A5. Workspace UI — mock / non-functional inventory

Legend: **[REAL]** wired to an API · **[LOCAL]** state-only, not persisted · **[DEAD]** no handler at all · **[FAKE]** hardcoded/fabricated value.

| Page / element | File | Status | Detail |
|---|---|---|---|
| Build — task board | `pages/Build.tsx` | REAL | `listTasks()` populates Kanban. |
| Build — drag between columns | `pages/Build.tsx` + `components/kanban/*` | LOCAL | `handleDrop` mutates React state only; never persists → reorder lost on reload. |
| Build — “New Task” (header) | `pages/Build.tsx` | DEAD | Button has no `onClick`. |
| Build — floating “+” FAB | `pages/Build.tsx` | DEAD | No `onClick`. |
| Build — “GitHub · Live” button | `pages/Build.tsx` | DEAD | No `onClick`; labelled “Live” misleadingly. |
| Build — kanban column “+” | `components/kanban/KanbanColumn.tsx` | DEAD | No `onClick`. |
| Build — “time tracked” | `pages/Build.tsx` | FAKE | Hardcoded `'0h'`. |
| Build — path estimate text | `pages/Build.tsx` | FAKE | Hardcoded “35 credits / 120 credits”. |
| Files — list & upload | `pages/Files.tsx` | PARTIAL | `createDomainFile()` records **metadata only** (name/type/size) — file bytes are never uploaded. |
| Files — Download | `pages/Files.tsx` | DEAD | No `onClick`. |
| Files — row overflow menu | `pages/Files.tsx` | DEAD | No `onClick`. |
| Files — “Storage Records” bar | `pages/Files.tsx` | FAKE | Width = `files.length * 10` %. |
| Chat — channels/messages/send/edit/delete | `pages/Chat.tsx` | REAL | Messaging service + socket merge + mark-read. |
| Chat — attach (📎) / emoji (🙂) / channel actions (⋮) | `pages/Chat.tsx` | DEAD | Buttons present, no `onClick`. |
| Reports | `pages/Reports.tsx` | REAL | Tasks + activity; JSON export works. |
| GitHub | `pages/GitHub.tsx` | REAL-ish | Reads connectors/activity; “New Repository” uses `window.prompt`; no repo actions beyond opening a URL. |
| Notifications | `pages/Notifications.tsx` | REAL | Read/unread/delete/all-read work. |
| Notifications — “Filter” | `pages/Notifications.tsx` | STUB | Only toasts “Notification filters require persisted preferences.” |
| Settings — Profile | `pages/Settings.tsx` | MOCK | Hardcoded `John` / `Doe` / `john.doe@techit.com` / role / bio; “Save Changes” & “Cancel” have **no** `onClick`. |
| Settings — Notification switches | `pages/Settings.tsx` | LOCAL | `useState` only; not persisted. |
| Settings — Appearance (dark mode) | `pages/Settings.tsx` | LOCAL | `useState` only; not applied or persisted. |
| Settings — Auto-save | `pages/Settings.tsx` | LOCAL | `useState` only. |
| Settings — Change Password | `pages/Settings.tsx` | DEAD | Three inputs, no state, “Update Password” no `onClick`. |
| Settings — “Enable 2FA” | `pages/Settings.tsx` | DEAD | No `onClick`. |
| Settings — Active Sessions | `pages/Settings.tsx` | REAL | `getActiveSessions` / `revokeSession` / `revokeOtherSessions`. |
| Settings — Integrations | `pages/Settings.tsx` | MOCK | Hardcoded “Connected as @johndoe”, Slack/Jira “Not connected”; Connect/Disconnect have **no** `onClick`. |
| Agents — catalog | `pages/Agents.tsx` | REAL | `listAgents` / `toggleAgent`. |
| Agents — console transcript | `lib/api/tasks.ts`, `components/console/Transcript.tsx` | FAKE STREAM | `streamTask()` is a one-shot `getTask()` that yields the events already on the task — **no SSE/WebSocket/polling anywhere**. A newly created task typically renders an empty transcript and never updates. |
| Copilot | `pages/Copilot.tsx` | REAL | `converseWithWorkspace()`; history in `sessionStorage`. |
| Connectors | `pages/Connectors.tsx`, `lib/api/connectors.ts` | PARTIAL | `connect()`/`disconnect()` only flip a `status` field via `workspacePost('/connectors', …)` — there is **no provider OAuth/credential handshake**; “connected” is a label, not a live integration. |
| Component Library | `components/ComponentLibrary.tsx` | DEV PAGE | Static design-system showcase, routed in the app at `/workspaces/components` (App.tsx:334). |
| `workspaceAI.ts` header comment | `lib/api/workspaceAI.ts:5` | STALE | Calls `client.ts` a “mock console seam”, but `client.ts` calls the real domain API (`workspaceGet/Post` → `/workspaces/:id/...`). |

---

## A6. Coding area seams (`pages/Code.tsx`)

**Real:** Monaco editor, WebContainer run/test/build, save/pull/push/deploy-preview through the domain API with approval flows, conflict/review UI, BYOK model connections (`createModelConnection`), VS Code grant creation (`createVsCodeGrant`), offline change queue, path-safety checks.

**Non-functional / rough**

1. **“Coding Intelligence” model selector is dead.** The `<select defaultValue="platform">` in the right rail has **no `onChange`** — choosing a personal BYOK connection does nothing.
2. **“VS Code” button does not open VS Code.** `openVSCode()` creates a real grant token but then only shows `window.prompt` containing a CLI command to run manually; there is no editor deep-link/protocol handler.
3. **Prompt-driven CRUD.** Create/rename/delete file, configure repository, and commit message all use `window.prompt` / `window.confirm` (functional, poor UX; also blocks automated UI testing).
4. CI coverage for this page is currently red (A1).

---

## A7. Cross-cutting

- The `ContinuousIntelligencePanel` is the only shared intelligence surface between Founder and Collaborator dashboards; it is otherwise role-agnostic (daily risks + one recommendation + matching-access note).
- Several declared frontend API clients have no consuming UI (e.g., `fetchWalletAnalytics`, `fetchWalletSubscriptions`, `fetchWalletInvoices`, `PaymentModal`) — see A4.

---

# Part B — Implementation Plan

> **Status: implemented.** Phases 0–4 landed (see the implementation log at the top). Phase 4 acceptance is met: the model selection takes effect (it binds/unbinds a workspace model and is passed to the plan/propose calls), and the VS Code entry point performs a real action — it issues a time-boxed bridge grant and shows a copy-to-clipboard setup panel labelled as manual.

## Sequencing principle
Fix the red build first (everything else is unverifiable while `main` is failing), then billing truthfulness (money path), then dashboard intelligence, then workspace UX polish.

## Phase 0 — Restore `main` (blocking, ~0.5–1 day)
- **T0.1** Resolve the vite/vitest conflict: either align `vitest` to a version compatible with `vite@5.4.x`, or upgrade `vite` to `^6.4`/`^7` and re-verify `@vitejs/plugin-react`, `@tailwindcss/vite`, and WebContainer tooling. Regenerate `package-lock.json`; confirm `npm ci` succeeds.
- **T0.2** Re-run `frontend.yml` until Live WebContainer Runtime + Frontend Quality Gates are green.
- **T0.3** Investigate the WebContainer E2E timeout (`tests/visual/code-editor.spec.ts`): decide whether the fixture/`TECHIT_WEBCONTAINER_OK` marker, cross-origin isolation headers, or the WebContainer boot path is at fault; either fix or explicitly quarantine with a tracked issue.
- **Acceptance:** `main` CI green for two consecutive pushes.

## Phase 1 — Wallet ↔ billing truthfulness (~3–5 days)
- **T1.1** Wire the Wallet purchase flow to the **real** TVCE checkout (`createTvceCheckout` → hosted Stripe/Paystack/Flutterwave, redirect on `checkoutUrl`), replacing the placeholder `createWalletPaymentIntent` call. Reuse/replace `PaymentModal` rather than leaving it dead.
- **T1.2** Add the missing `GET /api/domain/wallet/analytics` backend route (or repoint `fetchWalletAnalytics`) and populate `subscriptionUsage`, `freePlan`, `sourceTotals`, `deductionOrder` in `walletSummary()`.
- **T1.3** Enable subscription upgrade checkout (or, if intentionally deferred, replace the toast with an explicit “coming soon / contact sales” state and remove the dead button affordance).
- **T1.4** Reconcile the `WalletSummary` TS contract with what the backend actually returns; make `EMPTY_WALLET_SUMMARY` and the “Unavailable” cards driven by real capability flags.
- **Acceptance:** a buyer can complete a real credit purchase and a plan upgrade end-to-end in staging; no Wallet card says “Unavailable” for data the API can supply.

## Phase 2 — Dashboard intelligence coverage (~4–6 days)
- **T2.1 (Founder)** Expand the GSIS v2 `metrics` payload beyond `founder_profile` (validation, customer evidence, product usage, finance) and surface **evidence sources + per-component breakdown + missing evidence** in the scorecard.
- **T2.2 (Founder)** Replace `EMPTY_SIGNALS`/`EMPTY_TASKS`/`EMPTY_JOURNEY` with real fetches, or remove the empty sections until data exists.
- **T2.3 (Collaborator)** Add a collaborator intelligence card (workspace/project health + contribution signal) and wire “Today’s focus” and “Recent activity” to real task/activity APIs.
- **T2.4** Compose the related founder intelligence surfaces (investor readiness, evidence/validation, finance/runway, equity) into the dashboard using existing API clients.
- **Acceptance:** both dashboards show non-empty, evidence-backed intelligence when data exists, and honest labelled empty states when it does not.

## Phase 3 — Workspace UI honesty & polish (~4–6 days)
- **T3.1** Implement or remove every DEAD control in A5 (Build New Task/FAB/GitHub; Files Download/overflow; Chat attach/emoji/actions; Settings Save/password/2FA/integrations; kanban “+”).
- **T3.2** Persist Kanban moves (task status update API) instead of local-only state.
- **T3.3** Files: either upload real bytes (multipart to storage) or relabel the action as “register file”; replace the fabricated storage bar with a real quota value or remove it.
- **T3.4** Settings: bind profile/notification/appearance to real user APIs; remove hardcoded identity.
- **T3.5** Implement a real task-progress transport for the Agents console (SSE/WebSocket or polling) so the transcript updates live; until then, label it as a snapshot.
- **T3.6** Connectors: either implement provider OAuth/credential handshake or relabel “Connect” as “Mark as connected (metadata only)”.
- **T3.7** Remove stale “mock console seam” comment; gate or remove the `/workspaces/components` dev route in production.
- **Acceptance:** no visible control silently does nothing; no fabricated metrics presented as live.

## Phase 4 — Coding area polish (~2–3 days) — implemented
- **T4.1** Wire the Coding Intelligence model selector to `onChange` and pass the chosen connection to the AI calls.
- **T4.2** Replace the VS Code `window.prompt` command with a real `vscode://` deep link (or an in-app copy-to-clipboard panel clearly labelled as manual setup).
- **T4.3** Replace `window.prompt`/`confirm` CRUD with proper dialogs (also unblocks automated tests).
- **Acceptance:** model selection takes effect; VS Code entry point performs a real action or is honestly labelled.

## Cross-cutting risks
- Phase 0 is a hard prerequisite for verifying anything else.
- Phase 1 touches money paths — needs the webhook/settlement tests in `BACKEND` plus a staging provider sandbox; do not ship purchase changes without idempotency and refund verification.
- Phase 3 touches many files — split into per-page PRs to keep review scope small and avoid conflicts.

## Suggested ownership (to be confirmed)
| Phase | Primary area | Suggested owner |
|---|---|---|
| 0 | Frontend build/CI | Frontend platform |
| 1 | Wallet + TVCE billing | Payments/backend + frontend |
| 2 | Dashboards/GSIS | Intelligence + frontend |
| 3 | Workspace UI | Frontend |
| 4 | Coding area | Editor/frontend |

## Explicit non-goals until approved
- No changes to pricing, quotas, or entitlement values (see the companion note).
- No provider go-live.
- No code edits resulting from this plan.
