# UI completion handoff

The upgraded landing, auth, onboarding, role shells and dashboard compositions remain the visual foundation. Functional sources were reconciled with local `origin/main` at `2027749`, rather than the older commits named by the 21 October review. The route report records the full baseline SHA.

## Implemented

- Restored the co-founder API, requirement builder, candidate comparison, invitation lifecycle, relationship workspace, objectives, decisions, health and evidence components.
- Restored invitation and workspace routes; added founder and collaborator dashboard entry points, matching settings and co-founder notifications.
- Added loading, retry, no-venture and no-relationship entry states. Existing backend feature gating remains intact. Set `VITE_COFOUNDER_MODE_ENABLED=true` only in an environment with the corresponding backend capability enabled.
- Reused the canonical execution-intelligence API/hook/panel on all four dashboards. Founder readings follow the selected venture. Loading, empty activity, unavailable, session-expired and forbidden states are distinct; obsolete requests are cancelled and previous-scope readings are hidden.
- Restored founder workspace tasks, customer-validation evidence, journey, recent activity and recorded equity; restored collaborator task completion and recent activity within the upgraded compositions.
- Restored memory-only bearer handling, cookie/CSRF requests, account-scoped caches and current session restoration. Restyled OTP requests now include cookies and CSRF headers. The shared OTP engine replaces the broken custom digit handler while retaining the six glass boxes, and restores typing, backspace, paste and mobile autofill behavior.
- Restored MCP credential management, scopes and server-verified actor display. GitHub uses the current connection flow instead of creating a simulated connector row. Repository discovery calls the existing read-only MCP `list_repositories` tool without supplying a client-selected actor role; provider failure and an empty repository list are separate states.
- Restored feed recommendation rows, search, cached/stale notices and reconnect recovery while retaining the upgraded feed cards and shell.
- Kept the already-mounted landing kit, locale provider, route tracker and Explorer routes. Explorer discovery lists now consume live recommendations. Empty/unavailable states replace demo records; detail actions no longer claim an application or connection was submitted.
- Explorer events read the published catalog. Viewing an event does not claim an RSVP; participant-role guidance leads to profile setup. Explorer profile and notification preferences persist through the existing backend APIs.
- Explorer dialogs use the shared focus-trapping dialog; Havi displays service failure instead of inventing an AI response.
- Restored generated theme imports, theme generation in the build, dependency overrides and CI protections. Router declarations are aligned. Validation-script URL handling works on Windows. The Vite config delegates test settings to the separate Vitest config; the existing translation helper now has valid module syntax and template escaping.
- Removed `debug_text.txt` and `step1_ref.tsx`. The pre-existing local CookieConsent edit was preserved.

## Verification and evidence

`npm run ui:parity` compares the mounted route tree with local main and writes `UI_ROUTE_COVERAGE.md` plus `ui-route-parity.json`. The current inventory has 170 baseline route entries and 178 current entries, with zero missing. Route presence alone is not visual or API certification.

The production build passes on the reconciled toolchain. Vite retains a bundle-size warning for the LiveKit chunk. The complete unit suite passes: 248 tests across 66 files. This includes preserved main tests plus regressions for cookie/CSRF requests, scope cancellation with retained deadlines, and GitHub repository discovery. Dependencies are reconciled with local main (Vite 6.4.5 and Vitest 5.0.5), while retaining additions required by the upgraded UI.

`npm run deps:parity` and `npm run workflow:check` pass. Full lint has zero errors and two existing hook-dependency warnings in restored components. Browser journeys are defined in `tests/visual/ui-completion.spec.ts` and the existing signup OTP suite. The dashboard matrix covers desktop/mobile and light/dark. Browser fixtures stub remote font CSS and APIs; screenshots use fallback fonts and do not certify typography. Test screenshots are written under `test-results/visual/` when the browser run succeeds. All 12 targeted browser journeys passed against the production preview: three OTP checks and nine dashboard/Explorer/GitHub checks. The 16 dashboard captures use the actual theme control and cover all four roles at desktop/mobile widths in light/dark. Representative captures were inspected; a complete route/state design sign-off still remains.

## Release checks still required

- Run the final production build and browser suite in the target release environment; review the generated screenshots.
- Exercise the co-founder lifecycle with two real participant accounts, including version conflicts, evidence permissions, proposal acceptance, pause/end and backend feature gating.
- Verify real OAuth redirect/callback, credential expiry/removal, repository discovery, session expiry and reconnect against the deployed services.
- Run payment-provider checkout and failure journeys with supported test accounts. No live purchase or credential mutation was performed during this completion pass.
- `theme:audit` remains an inventory of raw hues in the upgraded UI. The preserved design still contains hard-coded colors; full semantic-token migration and a complete per-route/state screenshot review remain separate sign-off work.
- Explorer saved-item storage is not implemented by the current API. Its profile screen states that saved items are unavailable instead of presenting fabricated bookmarks.

## State coverage map

| Surface | Implemented states / source |
| --- | --- |
| Co-founder matching | Requirement capture, candidate availability/evidence, comparison, invitation lifecycle and settings; restored canonical components |
| Co-founder dashboard | Loading, no venture, no relationship, active relationship and load failure with retry |
| Execution | Loading, zero activity, highlights/trust, partial highlights, unavailable/retry, expired session and forbidden scope |
| Connectors | Credential presence, scopes, OAuth guidance, connect/disconnect/removal and service failure; canonical MCP APIs |
| Auth | Submitting, OTP/resend/error, cookie/CSRF, session restoration and expiry; current auth sources |
| Explorer | Live lists, filters/no results, loading/error/retry, persisted settings/profile and service-unavailable guide |
| Feed | Loading, cached/stale, reconnect, return summary, recommendation freshness and notification type coverage |
| Wallet | Existing upgraded visuals and current billing API/error contracts retained; provider journeys require integration sign-off |

## Preservation boundary

AuthContext, authStorage, API clients, connector APIs, co-founder lifecycle/versioning, evidence scoring, billing contracts, authorization, security workflows and generated theme sources carry product behavior. Future visual edits should wrap these contracts, rather than replace them with older branch versions.
