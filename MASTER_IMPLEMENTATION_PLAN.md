# Master Implementation Plan

Audit phase: 22 - Master Implementation Plan

Generated using the checkpointed audit workflow in `AUDIT_PROGRESS.md`.

No application source code was modified during this phase.

## Executive Decision

The TechIT platform must not move to production until the implementation waves in this plan are completed and verified one wave at a time.

The immediate priority is source-of-truth alignment:

- `new-frontend/frontend` is the main frontend.
- `BACKEND/frontend` is misfiled frontend work and must be treated as migration/reference material only.
- The Go messaging/demo backend exists on branch refs and must be merged, tested, deployed, and wired into the platform before messaging/demo capability counts as production ready.
- The three service repositories must be treated as one distributed platform for release gates.

## Checkpointed Execution Rules

Implementation must follow this workflow:

1. Complete exactly one wave at a time.
2. Do not begin the next wave until the current wave passes its listed verification gates.
3. Update a durable Markdown checkpoint after every wave.
4. Keep source edits scoped to the wave objective.
5. Do not mix documentation-only commits with source-code fix commits unless the wave explicitly requires it.
6. Do not deploy from `BACKEND/frontend`.
7. Do not treat branch-present Go messaging code as production capability until it is merged into the chosen release branch and verified in CI.
8. Do not use local JSON/file stores for production state after the persistence wave.

## Remote Reconciliation, 2026-06-28

Authenticated remote checks were run for:

- `https://github.com/techit360ai-bit/new-frontend.git`
- `https://github.com/techit360ai-bit/ai-router.git`
- `https://github.com/techit360ai-bit/BACKEND.git`

The token was used only through an ephemeral Git credential helper in an escalated shell session. It was not written to repository config, remotes, tracked files, or this report.

`git fetch origin --prune` completed successfully for all three repositories after authenticated network access was available.

The workspace root audit directory is not a usable Git repository in this environment. The real Git repositories are:

- `new-frontend/`
- `ai-router/`
- `BACKEND/`

### Current Checkout Parity

| Repository | Current branch | Current branch vs `origin/main` | Working tree | Exact with remote? |
|---|---|---:|---|---|
| `new-frontend` | `audit/platform-audit-2026-06-27-origin-main` | `0 ahead / 0 behind` | Clean | Yes for tracked files on current checkout. |
| `ai-router` | `audit/platform-audit-2026-06-27-origin-main` | `0 ahead / 0 behind` | Clean | Yes for tracked files on current checkout. |
| `BACKEND` | `audit/platform-audit-2026-06-27-origin-main` | `0 ahead / 0 behind` | Has untracked `backend/backend/` | Tracked files match; worktree is not exact because of untracked data. |

### Branch Parity Findings

`new-frontend`:

- `origin/main` is `995ff6d`.
- Current audit branch matches `origin/main`.
- Local `main` is behind `origin/main` by 2 commits.
- Most local feature branches match their configured upstreams.
- Local `feat/messaging-phase1` tracks `origin/pr-d-submit-and-pitch`; it is not the same as remote `origin/feat/messaging-phase1`.
- Local-only branches exist: `audit/platform-audit-2026-06-27`, `merged`.
- Remote-only heads exist as remote-tracking refs, including `origin/backend`, `origin/feature/plugins-mcp-connector-system`, `origin/fix/feed-share-back-navigation`, and `origin/stage/dashboard-frontend`.
- The checkout also has a `backend-repo` remote that points at the `BACKEND` repository. Those refs must not be confused with `new-frontend` source-of-truth refs.

`ai-router`:

- `origin/main` is `38961c6`.
- Current audit branch matches `origin/main`.
- Local `main` is behind `origin/main` by 18 commits.
- Local `feat/workspace-mcp-tools` is behind `origin/feat/workspace-mcp-tools` by 2 commits.
- Local `fix/hydrate-user-context-from-db` is behind `origin/fix/hydrate-user-context-from-db` by 8 commits.
- Remote-only `origin/staging` exists.
- Other inspected local branches match their configured upstreams.

`BACKEND`:

- `origin/main` is `33681d6`.
- Current audit branch matches `origin/main` for tracked files.
- Working tree has untracked `BACKEND/backend/backend/data/plugins-mcp.json`.
- Local `main` is behind `origin/main` by 6 commits.
- Local `feat/messaging-backend` is behind `origin/feat/messaging-backend` by 2 commits.
- `origin/feat/messaging-backend` is `0d44102` and includes the newer Go messaging CI/deploy commits.
- Local `plan/cross-repo-alignment` matches `origin/plan/cross-repo-alignment`.

### Remote Alignment Decision

Use the remote-tracking refs as the source of truth for planning. Before any implementation wave starts, fast-forward or recreate stale local branches from their upstream refs rather than building on stale local `main` branches.

Do not delete or reset the untracked `BACKEND/backend/backend/data/plugins-mcp.json` without explicit approval. It may be generated data or user-local state.

## Wave 0 - Approval And Freeze

Objective: establish the implementation boundary before code changes begin.

Scope:

- All three repositories.
- This plan and the audit reports.
- No product source code changes.

Actions:

- Confirm that implementation is approved.
- Confirm the remote branch strategy for implementation work.
- Confirm which repository owns the Go messaging backend after merge.
- Confirm whether `BACKEND/frontend` should be archived, removed, or retained temporarily as read-only migration reference.
- Confirm whether the master plan should remain in `new-frontend`, `BACKEND`, or all service repos for long-term reference.

Verification gates:

- `MASTER_IMPLEMENTATION_PLAN.md` exists.
- `AUDIT_PROGRESS.md` marks all audit reports complete.
- No product source files are changed in this wave.
- Remote parity notes are captured in this plan.

Exit criteria:

- User explicitly approves starting Wave 1.

## Wave 1 - Repository Ownership And Branch Hygiene

Objective: remove source-of-truth ambiguity before feature fixes start.

Primary repositories:

- `new-frontend`
- `BACKEND`
- `ai-router`

Required work:

- Make `new-frontend/frontend` the only active frontend source in docs, scripts, and CI.
- Mark `BACKEND/frontend` as migration/reference material, or move it to an archive path after needed fixes are migrated.
- Move any valid auth/signup/login fixes from `BACKEND/frontend` into `new-frontend/frontend`.
- Stop deploy workflows from targeting `BACKEND/frontend`.
- Fast-forward stale local branch baselines before implementation:
  - `new-frontend/main` to `origin/main`;
  - `ai-router/main` to `origin/main`;
  - `BACKEND/main` to `origin/main`;
  - `BACKEND/feat/messaging-backend` to `origin/feat/messaging-backend` if used locally.
- Decide whether `origin/feat/messaging-backend` belongs in `BACKEND`, `new-frontend`, or a separate service repo.
- Remove accidental cross-remote confusion from release documentation, especially `new-frontend`'s `backend-repo` remote context.

Verification gates:

- `git -C new-frontend status --short --branch`
- `git -C ai-router status --short --branch`
- `git -C BACKEND status --short --branch`
- `git -C new-frontend branch -vv`
- `git -C ai-router branch -vv`
- `git -C BACKEND branch -vv`
- CI/deploy workflow review proves no production deploy builds `BACKEND/frontend`.

Exit criteria:

- There is one documented frontend source of truth.
- Every implementation branch starts from current remote refs.
- Any retained `BACKEND/frontend` path is explicitly non-production.

## Wave 2 - Active Frontend Quality Gates

Objective: make the main frontend buildable, lintable, and testable before deeper integration work.

Primary repository:

- `new-frontend`

Required work:

- Fix TypeScript errors in `new-frontend/frontend/src/components/ui/calendar.tsx`.
- Fix `react-resizable-panels` type/API mismatch in `new-frontend/frontend/src/components/ui/resizable.tsx`.
- Restore ESLint dependency health around `hermes-parser/dist/traverse/SimpleTraverser`.
- Stabilize Vitest so `npm test` does not crash with a bus error.
- Fix `npm run test:local` by making `import.meta.env` access test-safe in messaging clients.
- Keep `tsc -b` in the production build path.
- Add or update CI in the `new-frontend` repo to run the same gates used locally.

Verification gates:

- `cd new-frontend/frontend && npm run build`
- `cd new-frontend/frontend && npm run lint`
- `cd new-frontend/frontend && npm test`
- `cd new-frontend/frontend && npm run test:local`

Exit criteria:

- Active frontend build, lint, and tests pass locally and in CI.
- No deploy path can bypass TypeScript by calling only Vite unless an explicit release exception is approved.

## Wave 3 - Auth, Signup, OTP, Password Recovery, And Route Guards

Objective: make identity creation and private route access real and durable.

Primary repositories:

- `new-frontend`
- `BACKEND`

Required work:

- Wire active signup in `new-frontend/frontend/src/components/SignUp.tsx` to backend auth APIs.
- Replace client-provided `otpVerified` trust with server-bound OTP proof.
- Make OTP verification consume or bind a verification challenge.
- Implement password reset request, reset-token storage, expiry, and reset completion.
- Add active frontend routes for forgot-password and reset-password.
- Normalize role names, especially organization/org route mapping.
- Add central `RequireAuth` and role guard boundaries for private routes.
- Persist onboarding completion and role profile state through backend APIs.
- Remove local persona state as an authorization source.

Verification gates:

- `cd BACKEND/backend && npm test`
- `cd new-frontend/frontend && npm run build`
- `cd new-frontend/frontend && npm test`
- Auth regression tests for signup, OTP, signin, session restore, password reset, logout, unauthenticated route access, forbidden role access, and expired token behavior.

Exit criteria:

- A new user can create an account, verify email, receive a JWT, complete onboarding, refresh the browser, and resume from backend state.
- Private routes do not render product surfaces without authenticated and authorized backend state.

## Wave 4 - Durable Node Backend Persistence

Objective: remove production dependence on JSON file-backed state.

Primary repository:

- `BACKEND`

Required work:

- Choose the production database for Node backend auth/profile/notification/file metadata state.
- Add migrations for users, profiles, sessions or token revocation metadata, notifications, and file metadata.
- Replace JSON database reads/writes in production paths.
- Keep JSON storage only as an explicit development fixture if needed.
- Add startup validation for database configuration.
- Add concurrency and data integrity tests.
- Add backup and restore notes for the production database.

Verification gates:

- `cd BACKEND/backend && npm test`
- Migration apply/rollback dry run against a disposable database.
- Auth and profile tests run against database-backed state.

Exit criteria:

- Production state no longer depends on mutable JSON files in the repository tree.
- The backend can be restarted without losing or corrupting user/profile/notification/file metadata.

## Wave 5 - Go Messaging And Demo Backend Merge

Objective: convert the branch-present Go service into a verified release service.

Primary repository:

- Chosen service repo for Go messaging backend, likely `BACKEND` unless ownership is changed in Wave 1.

Required work:

- Fast-forward from `origin/feat/messaging-backend` before merging.
- Merge the Go backend source, migrations, Dockerfile, Compose file, and CI workflow into the chosen release branch.
- Preserve the existing REST routes:
  - `/health`
  - `/api/v1/conversations`
  - `/api/v1/channels`
  - `/api/v1/posts`
  - `/api/v1/users/online`
  - `/api/v1/demos`
  - `/api/v1/demos/{id}/questions`
  - `/ws?token=...`
- Install Go in local/CI environments.
- Run Go tests and database-backed integration tests.
- Apply PostgreSQL migrations in a controlled order.
- Configure Redis, shared `JWT_SECRET`, CORS, service URL, and optional LiveKit env.
- Wire active frontend messaging/demo clients to the deployed Go service.

Verification gates:

- `cd <go-service>/backend && go test ./... -short -timeout 30s`
- Migration dry run against disposable PostgreSQL.
- WebSocket smoke test with a valid JWT.
- REST smoke tests for conversations, channels, posts, demo lifecycle, Q&A, RTC token behavior, and presence.
- `cd new-frontend/frontend && npm run build`
- `cd new-frontend/frontend && npm test`

Exit criteria:

- Messaging/feed/demo frontend flows use the real Go service.
- The Go service is in the release branch, covered by CI, and included in deployment manifests.

## Wave 6 - AI Router Provider Execution And Credit Ledger

Objective: replace placeholder AI behavior with production-grade provider execution and accounting.

Primary repository:

- `ai-router`

Required work:

- Replace placeholder central LLM response generation with provider adapter calls.
- Normalize OpenAI, Anthropic, Cohere, Gemini, and OpenRouter-style responses where supported.
- Add timeout, retry, fallback, rate-limit, and provider auth failure behavior.
- Persist AI outputs where product flows require saved state.
- Make credit debit transactional and durable.
- Add a usage ledger tied to user, workspace, provider, model, token usage, and request ID.
- Fail closed in production when provider keys or database configuration are missing.
- Keep demo/fallback behavior behind explicit non-production switches.

Verification gates:

- `cd ai-router && python3 -m compileall -q .`
- `cd ai-router && python3 -m pytest`
- Provider contract tests with mocked provider APIs.
- Credit debit concurrency tests.
- Production env validation tests.

Exit criteria:

- AI routes that claim to generate intelligence call real providers or return explicit production-safe errors.
- Credits cannot be bypassed or double-spent under concurrent requests.

## Wave 7 - MCP Productionization

Objective: make MCP browser and backend integration production-safe.

Primary repository:

- `BACKEND`

Required work:

- Replace or harden MCP file-store persistence for production.
- Ensure browser MCP client sends bearer auth.
- Add HTTP integration tests through the mounted `/api/mcp` routes.
- Verify approval authorization, expiry, and single-use semantics at the HTTP boundary.
- Verify workspace isolation and role mapping from the main app.
- Replace fake/stub connector behavior where it appears in production workflows.
- Ensure audit logs and contribution events are durable.

Verification gates:

- `cd BACKEND/Plugins-MCP && npm test`
- `cd BACKEND/Plugins-MCP && npm run typecheck`
- `cd BACKEND/backend && npm test`
- Browser-to-MCP authenticated integration tests.

Exit criteria:

- MCP tools require real authenticated users, enforce permissions, persist audit state, and behave consistently through the mounted Express API.

## Wave 8 - Full-Stack Deployment Manifest And Environment Contracts

Objective: define one repeatable production topology for all services.

Primary repositories:

- `new-frontend`
- `BACKEND`
- `ai-router`

Required work:

- Add service manifests for:
  - active Vite frontend;
  - Node/Express backend;
  - Plugins-MCP mount/storage;
  - AI Router API;
  - AI Router workers/scheduler;
  - Go messaging/demo backend;
  - PostgreSQL;
  - Redis;
  - LiveKit if enabled;
  - provider integrations.
- Add `.env.example` or schema validation for every service.
- Separate frontend-exposed env vars from server-only secrets.
- Validate required production env vars at startup.
- Define CORS origins, shared JWT settings, service URLs, health checks, migrations, and rollback procedure.
- Add CI jobs for every service.
- Add post-deploy smoke checks.

Verification gates:

- Compose or platform manifest validation.
- Service startup in a production-like environment.
- Migration dry run.
- Health checks for every service.
- Cross-service smoke tests from frontend to Node backend, AI Router, MCP, and messaging backend.

Exit criteria:

- A new operator can deploy or reproduce the full platform from documented manifests and env contracts.
- Services fail closed when production-critical secrets or dependencies are missing.

## Wave 9 - End-To-End, Security, And Observability Gates

Objective: prove critical user journeys and production controls before release candidate.

Primary repositories:

- `new-frontend`
- `BACKEND`
- `ai-router`

Required work:

- Add Playwright or equivalent E2E coverage for:
  - signup and OTP;
  - login and session restore;
  - password reset;
  - onboarding;
  - role dashboard access;
  - messaging;
  - demo room and Q&A;
  - AI request and credit debit;
  - MCP access and approval;
  - logout.
- Add API contract tests for frontend clients.
- Add security regression tests for route guards, profile mutation, role changes, CORS, rate limits, and JWT handling.
- Add structured logs, error reporting, metrics, and trace/request IDs.
- Document incident response and rollback steps.

Verification gates:

- All unit, integration, and E2E suites pass in CI.
- Security regression suite passes.
- Observability smoke checks prove logs/errors/metrics are emitted.
- Release smoke tests pass against a deployed staging environment.

Exit criteria:

- Critical workflows are tested through browser and API boundaries.
- Operators can detect, diagnose, and roll back production failures.

## Wave 10 - Release Candidate And Production Launch

Objective: promote only after all blockers are closed and verified.

Required work:

- Confirm every previous wave is complete.
- Freeze release branches.
- Run full CI from clean clones.
- Run migrations in staging.
- Execute release smoke tests in staging.
- Review secrets, CORS, provider limits, billing/webhooks, and backup configuration.
- Create rollback plan and owner list.
- Obtain explicit production approval.

Verification gates:

- Clean clone build and test for all repositories.
- Full-stack staging deployment.
- E2E suite against staging.
- Manual smoke checklist signed off.
- No critical or high release blockers remain open.

Exit criteria:

- Production deployment can proceed with an explicit approval record.

## Wave Dependency Order

Do not reorder these without a written reason:

1. Approval and freeze.
2. Repository ownership and branch hygiene.
3. Active frontend quality gates.
4. Auth, signup, OTP, password recovery, and route guards.
5. Durable Node backend persistence.
6. Go messaging and demo backend merge.
7. AI Router provider execution and credit ledger.
8. MCP productionization.
9. Full-stack deployment manifest and environment contracts.
10. End-to-end, security, and observability gates.
11. Release candidate and production launch.

The ordering is intentional: the platform cannot safely validate product flows until the active frontend is buildable, identity is real, state is durable, and branch-present messaging work is integrated into release branches.

## Non-Negotiable Release Gates

Production remains blocked until all of the following pass:

- `cd new-frontend/frontend && npm run build`
- `cd new-frontend/frontend && npm run lint`
- `cd new-frontend/frontend && npm test`
- `cd new-frontend/frontend && npm run test:local`
- `cd BACKEND/backend && npm test`
- `cd BACKEND/Plugins-MCP && npm test`
- `cd BACKEND/Plugins-MCP && npm run typecheck`
- `cd ai-router && python3 -m compileall -q .`
- `cd ai-router && python3 -m pytest`
- `cd <go-service>/backend && go test ./... -short -timeout 30s`
- Full-stack deployment manifest validation.
- Migration dry runs.
- E2E suite against staging.
- Post-deploy smoke checks.

## First Implementation Target After Approval

Start with Wave 1, not with feature fixes.

The first concrete implementation checkpoint should be:

- fast-forward stale local branch baselines;
- document repository ownership;
- update CI/deploy targets away from `BACKEND/frontend`;
- decide and document the Go messaging backend's source-of-truth branch;
- migrate only clearly needed `BACKEND/frontend` fixes into `new-frontend/frontend`;
- verify the active frontend remains the only production frontend path.

After Wave 1 passes, proceed to active frontend quality gates in Wave 2.
