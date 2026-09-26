# new-frontend — Security Remediation Plan

**Date:** 2026-09-26
**Status:** plan only; no code changed yet
**Master report:** `BACKEND/docs/PLATFORM_SECURITY_AUDIT_2026-09-26.md` (full findings, severity, tests)

This file scopes the frontend workstream of the platform-wide DevTools exposure and authorization
audit. It lists only what this repository must change. No new modules, layers, or folders are
introduced — every change lands in an existing file.

## Owned findings

| ID | Finding | Severity |
|---|---|---|
| C-1 | Access token persisted in `sessionStorage` and delivered in response bodies | Critical |
| M-2 | Full user object persisted in `localStorage` as `techit_user` | Medium |
| M-6 | Production mock fallback can mask real authorization state | Medium |
| L-4 | Re-verify source maps disabled and `.env` untracked at release | Low |
| L-5 | Confirm no module reads `sessionStorage` for tokens after C-1 | Low |

## Changes

### WS-1 — Token handling (Critical)
- `src/lib/authStorage.ts` — stop writing the access token to `sessionStorage`; keep in-memory only.
- `src/lib/api/client.ts` — `getAuthToken()` must not fall back to web storage in production; rely on
  the HttpOnly cookie for browser transport and the in-memory copy for the current tab.
- `src/contexts/AuthContext.tsx` — stop consuming `token` from signin/session response bodies; keep
  the cookie-based flow and the existing CSRF double-submit header. Preserve the mobile/non-browser
  path that legitimately needs an explicit token.
- Verify no regression in onboarding, where cookie-only mutations were historically the reason the
  token was mirrored.

### WS-6 — Persisted state minimization (Medium)
- `src/contexts/AuthContext.tsx` — persist only the minimum UI state, not the full user/profile.
- `src/contexts/MessagingProvider.tsx`, `src/dashboard/demos/DemoRoom.tsx` — read current user from
  `AuthContext` instead of parsing `localStorage`.
- `scripts/validate-env.mjs` — fail the production build when `VITE_API_STRICT` is not `1`.

### WS-8 — Rate-limit / abuse UX (Medium)
- No new UI. Ensure 429 responses surface as retryable states using existing error handling so the
  backend limits added in BACKEND WS-8 are not hidden by fallbacks.

## Tests to add (existing runner: `vitest`)
- After signin, `sessionStorage`/`localStorage` contain no JWT.
- Signin/session responses are not parsed for a `token` field.
- `techit_user` absent after signout and on fresh load.
- Production build config rejects `VITE_API_FALLBACK` without `VITE_API_STRICT=1`.

## Acceptance
- `npm test`, `npm run build`, `npm run env:check`, `npm run lint` pass.
- DevTools walkthrough for founder/collaborator/investor/org shows no token in Storage and no
  private data in Network responses.
