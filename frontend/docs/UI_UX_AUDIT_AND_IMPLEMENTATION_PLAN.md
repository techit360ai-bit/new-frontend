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

## Follow-up implementation phases

### Phase 2: Page-level consistency

- Introduce shared page-header, section-header, status, empty, error, and loading primitives.
- Migrate high-traffic dashboards and intelligence pages incrementally.
- Preserve backend-driven rendering; do not introduce fixed role dashboards.

### Phase 3: Responsive audit

- Verify representative desktop widths (1024-1920px), small/large phones, foldables, and tablets.
- Fix table, chart, drawer, modal, and long-content behavior at route level.
- Add visual regression coverage for role shells and high-value workflows.

### Phase 4: Accessibility and motion

- Complete keyboard traversal and screen-reader review for dialogs, drawers, menus, charts, and data tables.
- Add purposeful Framer Motion transitions to existing route/surface transitions where they improve orientation.
- Verify `prefers-reduced-motion` behavior.

### Phase 5: Icon and asset quality

- Replace remaining visible emoji-based UI affordances in chat/feed/onboarding with Lucide or approved TechIT assets.
- Review image fallbacks, alt text, aspect ratios, and broken-image states.
- Keep product content imagery separate from social-feed storage and business data.

## Verification gate

- `npm run build` must pass.
- `npm test -- --run` must pass with the repository's pinned worker configuration.
- `npm run lint` must have no errors; existing hook warnings are tracked separately.
- Review role shells at desktop and mobile widths, including open/closed navigation, focus, empty, loading, and error states.
- Confirm no route, API, auth, permission, subscription, billing, or AI behavior changed.
