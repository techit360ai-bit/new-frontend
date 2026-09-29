# Release Candidate Signoff

Status: draft

Production approval must not be granted until this checklist is updated with real run IDs, staging URLs, owners, and approval names.

## Required Gates

| Area | Required evidence | Status |
|---|---|---|
| Frontend clean clone | `npm ci`, `npm run env:check`, `npm run workflow:check`, `npm test`, `npm run test:local`, `npm run build`, `npm run lint` on `new-frontend/main` | pending |
| Node backend | `npm run env:check`, `npm test --prefix backend`, migration dry run, rollback dry run on `BACKEND/main` | pending |
| Plugins-MCP | `npm test --prefix Plugins-MCP`, `npm run typecheck --prefix Plugins-MCP`, authenticated MCP smoke | pending |
| Go messaging | `go test ./... -short -timeout 30s`, migration dry run, integration smoke on `BACKEND/messaging-backend` | pending |
| AI Router | `python3 scripts/release_gate.py`, provider adapter tests, credit ledger tests on `ai-router/main` | pending |
| Full-stack staging | frontend, Node backend, MCP, AI Router, messaging, PostgreSQL, Redis, and optional LiveKit deployed together | pending |
| Security regression | unauthenticated boundaries, role access, CORS, rate limits, JWT mismatch, OTP replay, password reset expiry | partial — local (`security/exposure-hardening-2026-09-26`); staging pending |
| Observability | request ID propagation, structured request/error logs, metrics/error reporting smoke | pending |
| Rollback | frontend rollback, backend rollback, AI Router rollback, messaging rollback, DB restore, JWT rollback decision | pending |
| Post-deploy smoke | signup, OTP, login, session restore, onboarding, messaging, demo Q&A, AI request, MCP approval, logout | pending |

## Approval Record

| Field | Value |
|---|---|
| Release candidate tag | pending |
| Staging URL | pending |
| Frontend run URL | pending |
| BACKEND run URL | pending |
| AI Router run URL | pending |
| Smoke-test operator | pending |
| Release approver | pending |
| Rollback owner | pending |
| Approval timestamp | pending |

## Security hardening evidence — 2026-09-28

Collected locally on branch `security/exposure-hardening-2026-09-26`. This is **not** a
substitute for the CI/staging gates above; every row there stays pending until run IDs
and a staging URL exist. It records what has actually been reproduced and fixed.

| Workstream | Repo / commit | Evidence |
|---|---|---|
| WS-01 token transport | `new-frontend` `0a65cce`, `cf2da21` | Access token is memory-only; web storage key purged; messaging sends credentials. |
| WS-10 client cache scoping | `new-frontend` `560bf89` | `cache.test.ts` — snapshots are account-scoped and purged on account change. |
| WS-10 server no-store | `BACKEND` `1750c09`, `ai-router` `3ee57e7` | Private responses carry `Cache-Control: private, no-store`. |
| WS-15 agent allow-list | `ai-router` `3ee57e7` | pytest `tests/test_workspace_agent_forwards_tools.py` — no provider/cost fields; explicit projections. |
| WS-16 messaging CORS + limiter | `BACKEND` `64a7a86` | Go 1.26.8: `go build ./...` and `go test ./...` green; CORS, rate-limit and origin-pattern tests. Also the root-cause fix for the SPA feed/DM outage. |
| WS-17/WS-18 authz | `BACKEND` `e1218ee` | vitest `authorization.test.js`, `domain.test.js`, `codeWorkspace.test.js` — owner-scope and admin denial. |

Root cause of the feed/DM outage: the messaging service never emitted CORS headers, so
the browser blocked every cross-origin feed/DM call. See
`BACKEND/docs/PLATFORM_SECURITY_AUDIT_2026-09-26.md` §15.

### Branch CI runs (not the `main` gates above)

| Repo | Head | Workflow | Result | Run |
|---|---|---|---|---|
| BACKEND | `64a7a86` (WS-16) | TECHIT Backend Services — Go Messaging Unit + Integration, Node Backend, MCP gates | success | https://github.com/techit360ai-bit/BACKEND/actions/runs/36491997121 |
| BACKEND | `239485e` (WS-21) | TECHIT Backend Services | success | https://github.com/techit360ai-bit/BACKEND/actions/runs/36492312935 |
| new-frontend | `0804fa5` (WS-10/WS-21) | Frontend Quality Gates; Build & Deploy to S3; Dependency Assurance; frontend-security-policy | success | https://github.com/techit360ai-bit/new-frontend/actions/runs/36492322374 |
| ai-router | `3ee57e7` (WS-10/WS-15) | AI Router Quality Gates | **failure — pre-existing** | https://github.com/techit360ai-bit/ai-router/actions/runs/36483430741 |

**Known red, unrelated to this branch's code:**

- ai-router `deployment-env-contract` fails with "model registry is stale for production
  routing" (`MODEL_REGISTRY_MAX_AGE_DAYS`, default 30). This fails on commits before the
  security work too; it needs the model registry review dates refreshed.
- new-frontend CodeQL fails with "Code scanning is not enabled for this repository" —
  governance gap G-4, not a code defect.
- new-frontend "Live WebContainer Runtime" fails even on a docs-only commit — CI flake.

## Hard Stop Conditions

- Any required gate is pending, skipped without written exception, or failed.
- Any production secret is missing, weak, mismatched, or committed to source.
- Any service accepts protected requests without a valid bearer token.
- Staging smoke cannot prove the same BACKEND-issued JWT works across frontend, Node backend, MCP, AI Router, and messaging.
- Rollback owner or rollback procedure is unknown.
