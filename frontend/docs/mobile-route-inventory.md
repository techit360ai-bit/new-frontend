# Mobile route inventory

This is the route-level contract for LinkedIn-style mobile refinement. Shared shell behavior is covered by `tests/visual/responsive.spec.ts`; each route below still needs production-shaped visual review when its data or interaction model changes.

| Role | Route family | Mobile primary task | Mobile composition | Main risk |
| --- | --- | --- | --- | --- |
| Explorer | `/explore`, `/feed/*`, `/demos/*` | Discover, participate, message | Feed/list/detail templates; bottom navigation; sheets for filters and compose | Dense cards, composer overlap |
| Founder | `/founder/*`, `/incubation-hub`, `/opportunity-hub`, `/team-workspace/*` | Build, execute, collaborate | Dashboard cards; step forms; workspace drawer; full-height dialogs | Long forms, Havi collision |
| Collaborator | `/collaborator/*` | Complete work, track equity, communicate | Task/list cards; stacked equity records; message sheets | Financial panels and long labels |
| Investor | `/investor/*` | Triage signals, diligence, decide | Signal cards; stacked watchlist; data/deal room sections; filter sheets | Tables, charts, dense diligence |
| Organization | `/org/*` | Operate programs, teams, intelligence | KPI cards; accordion intelligence; list/detail templates | Analytics density and permission states |

Every route should preserve: 44px touch targets, safe-area padding, no horizontal overflow, keyboard focus restoration, light/dark themes, loading/empty/error states, and backend-driven capability visibility.
