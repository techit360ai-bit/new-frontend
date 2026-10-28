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
| Security regression | unauthenticated boundaries, role access, CORS, rate limits, JWT mismatch, OTP replay, password reset expiry | pending |
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

## Hard Stop Conditions

- Any required gate is pending, skipped without written exception, or failed.
- Any production secret is missing, weak, mismatched, or committed to source.
- Any service accepts protected requests without a valid bearer token.
- Staging smoke cannot prove the same BACKEND-issued JWT works across frontend, Node backend, MCP, AI Router, and messaging.
- Rollback owner or rollback procedure is unknown.
