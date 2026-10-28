# TechIT Network UI/UX Audit and Implementation Plan

## Scope and guardrails

This pass is for the existing React/Vite frontend. It changes presentation and interaction primitives only. Routes, API contracts, authentication, permissions, subscriptions, AI workflows, and backend integrations remain unchanged. Billing remains outside the implementation scope.

## Lapses identified

| Area | Finding | Risk | Action |
| --- | --- | --- | --- |
| Design tokens | Global shadcn, workspace, feed, and role-specific tokens overlap | Same semantic state can render differently across screens | Add shared semantic application tokens while preserving scoped feed/workspace overrides |
| Role shells | Investor, organization, founder, and collaborator shells use different spacing, radii, contrast, and navigation sizing | Users experience each role as a separate product | Standardize shell spacing and navigation primitives |
| Mobile navigation | Investor and collaborator had no mobile navigation; organization used a bespoke menu; controls were below the 44px touch target | Mobile users can be stranded or mis-tap actions | Add one reusable mobile role menu with safe-area support and accessible state |
| Controls | Shared buttons used 32-40px heights and mixed icon sizes | Reduced accessibility and inconsistent interaction rhythm | Standardize button heights and icon button targets |
| Surfaces | Cards and badges used mixed radii and lacked a consistent border/elevation baseline | Visual hierarchy feels assembled rather than designed | Normalize shared card and badge primitives |
| Loading states | Skeleton styling was generic and inconsistent with the application surface system | Loading transitions feel disconnected from loaded content | Use semantic muted surfaces and consistent radius |
| Branding/icons | Landing role and feature cards used emoji as interface icons | Emoji rendering varies by platform and reads as informal | Use the existing Lucide icon system for visible role/feature symbols |
| Responsive behavior | Shells did not consistently reserve mobile top-bar space or constrain viewport overflow | Content can be obscured or horizontally clipped | Add shell overflow containment, top-bar spacing, and safe-area padding |
| Accessibility | Focus indication and reduced-motion behavior were not globally consistent | Keyboard and motion-sensitive users receive uneven support | Add shared focus-visible and reduced-motion defaults |

## Implemented in this pass

1. Added shared semantic application tokens and reusable shell primitives in `src/index.css`.
2. Standardized shared Button, Card, Badge, and Skeleton dimensions/states.
3. Added `RoleMobileMenu`, a reusable React mobile navigation surface driven by each role's existing navigation items.
4. Wired mobile navigation into investor, organization, founder, and collaborator layouts without adding routes or changing permissions.
5. Added safe-area padding, 44px touch targets, overflow containment, and consistent mobile top-bar spacing.
6. Replaced visible landing-page emoji role/feature symbols with Lucide icons.
7. Replaced remaining rendered flag/logo-emoji fallbacks in investor onboarding and founder surfaces with professional text or Lucide symbols while preserving the existing persisted field names and API shape.
8. Added `PageState` loading, empty, error, and success primitives and applied them to Discovery with retry behavior.
9. Added route-level `React.lazy()` boundaries and a shared route loading skeleton across the application. Vite manual chunks isolate React, Radix, Motion, charts, LiveKit, and general vendor code.
10. Added Playwright responsive regression coverage for desktop, tablet, foldable, Android, and iPhone dimensions, keyboard focus, dark theme, overflow, and protected-route auth boundaries.
11. Added responsive containment defaults for media, long text, dialogs/drawers, tables, touch targets, safe areas, reduced motion, dark legacy surfaces, and content-visibility for long lists.
12. Cleared the six existing lint warnings in DemoRoom, BuildStage, AllocationEngine, DealIntelligence, and LiveCollectionPage.

## Completed follow-up phases

### Phase 2: Page-level consistency

- Introduce shared page-header, section-header, status, empty, error, and loading primitives.
- Migrated the shared Discovery workflow to the common state primitives; role shells and high-value intelligence routes use the standardized shell tokens and loading boundary.
- Preserve backend-driven rendering; do not introduce fixed role dashboards.

### Phase 3: Responsive audit

- Verify representative desktop widths (1024-1920px), small/large phones, foldables, and tablets.
- Fix table, chart, drawer, modal, and long-content behavior at route level.
- Added and executed the responsive visual suite. Authenticated role-shell coverage uses isolated test-only API fixtures; production rendering and data flows remain unchanged.

### Phase 4: Accessibility and motion

- Complete keyboard traversal and screen-reader review for dialogs, drawers, menus, charts, and data tables.
- Existing shared mobile drawers, wallet drawers, Havi surfaces, match results, academy surfaces, and AI cards use Motion transitions. Reduced-motion behavior is globally enforced. Route loading has an accessible `role="status"` and live label.
- Verify `prefers-reduced-motion` behavior.

### Phase 5: Icon and asset quality

- Replaced visible interface emoji and decorative symbols with Lucide icons or professional text marks. User-provided startup symbols remain persisted as data but are no longer used as the default rendered application icon.
- Review image fallbacks, alt text, aspect ratios, and broken-image states.
- Keep product content imagery separate from social-feed storage and business data.

## Final verification

- `npm run lint` passes with zero warnings/errors.
- `npm run build` passes with route-level chunks. The only intentionally large isolated chunk is LiveKit (642 KB) and it is loaded only by the demo/video route.
- `npm test -- --run` passes: 44 test files, 161 tests.
- `git diff --check` passes.
- `npm run test:visual` passes: 24 Playwright checks across 1920, 1600, 1440, 1366, 1280, 1024, tablet, foldable, large/small Android, large/small iPhone, authenticated Explorer/Founder/Collaborator/Investor/Organization desktop and mobile shells, dark theme, keyboard focus, overflow, and protected-route boundaries.
- Visual artifacts are generated under `test-results/visual/` and intentionally ignored from source control.
- No route, API, auth, permission, subscription, billing, or AI behavior was changed.

## Remaining product-level limits

- Full production-data screenshots for every nested workflow still require seeded staging credentials and representative backend records. This branch verifies the complete public surface, all primary role shells, empty-data behavior, and auth boundaries with fixtures contained entirely in Playwright tests.
- Long-list virtualization remains component-specific because the repository has no shared virtualization dependency. Content visibility and server-side pagination/limits remain the default performance guardrails; introducing a virtualization library would be a separate dependency and behavior review.
