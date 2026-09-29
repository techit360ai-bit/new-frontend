# new-frontend — Security Remediation Plan

**Date:** 2026-09-26
**Status:** plan only; no code changed
**Master report:** `BACKEND/docs/PLATFORM_SECURITY_AUDIT_2026-09-26.md`
**Full plan:** `BACKEND/docs/PLATFORM_SECURITY_IMPLEMENTATION_PLAN_2026-09-26.md`

Scoped frontend workstreams from the platform-wide DevTools exposure and authorization audit. Only
existing files change — no new modules, layers, or folders.

## Owned workstreams

| WS | Finding | Severity | Files |
|---|---|---|---|
| WS-01 | C-1 — access token in `sessionStorage` and in response bodies | Critical | `lib/authStorage.ts`, `lib/api/client.ts`, `contexts/AuthContext.tsx` |
| WS-10 | ETag/response cache in the API client must not cross authorization boundaries | Medium | `lib/api/client.ts` |
| WS-12 | Bundle search for secrets; verify source maps stay disabled; `.env` untracked | Medium | build config, `scripts/` |
| WS-13 | CSP on the static host, compatible with API, ai-router, messaging (WSS), analytics | Medium | `render.yaml`, Vite config |
| WS-19 | Tests: token never in web storage; premium data not rendered from a free entitlement | Medium | `src/__tests__` |
| WS-06/07 | Repo governance + dependency gate (see master plan) | High | GitHub settings |

## WS-01 detail
- Keep the in-memory token for the current tab; rely on the HttpOnly cookie for browser transport.
- Do not read or write a JWT in `sessionStorage`/`localStorage` in production.
- Preserve the existing mobile/non-browser explicit-token path and the CSRF double-submit header.
- Do not regress onboarding, which was the original reason the token was mirrored.

## Verification
- `npm test`, `npm run build`, `npm run env:check`, `npm run lint` pass.
- DevTools walkthrough per role: no JWT in Storage, no private data in Network.
- Confirm the ETag cache never serves one user's authorized response to another.
