# TechIT Theme Tokens

The frontend theme has one semantic contract:

- `src/config/theme.config.ts` is the single source of truth for the approved brand, surface, text, status, role, feature, chart, and integration palette.
- `src/styles/themes.css` is generated from the config and exposes the runtime light/dark CSS variables. Do not edit it directly.
- `src/styles/tokens.css` maps semantic CSS variables into Tailwind v4 utilities.
- `src/App.css` contains legacy aliases and layout primitives only.

Use semantic utilities such as `bg-surface-primary`, `text-text-muted`, `border-border-default`, `bg-action-primary`, `text-status-success`, and `text-role-founder`.

Do not add reusable TechIT colors as hex values in TSX, inline styles, or arbitrary Tailwind classes. Add a semantic token first. Contextual colors (for example a user-provided chart color) may remain local when they are not part of the product theme.

Token families are intentionally separate:

- Brand tokens identify TechIT.
- Semantic tokens describe UI meaning and state.
- Role tokens identify Explorer, Founder, Collaborator, Investor, and Organization experiences.
- Feature tokens cover stable product domains such as Incubation and Code.
- Chart and integration tokens centralize reusable visualization series and third-party identity colors without treating them as TechIT brand colors.

Light and dark mode override semantic mode values in the generated CSS. The active authenticated role is applied to `data-techit-role` on the root element, which resolves `role-primary` without component-level role color logic.

When adding a reusable color, add it to `theme.config.ts`, expose its CSS variable through `themeCssVariables`, and map it in `tokens.css` when a Tailwind utility is needed. Never edit generated `themes.css` or introduce a parallel Tailwind palette.

## Migration coverage

The migration covers shared components, authentication, feed, messaging, Academy, Havi, founder, collaborator, investor, organization, and Workspace surfaces. The role shells consume centralized role tokens, and `/workspaces/components` is the internal theme preview for light, dark, status, role, form, card, and action states.

Run `npm run theme:audit` to inspect both total color sources and product-only counts. The audit separates the canonical config and generated CSS from product code so palette definitions are not mistaken for migration debt.

Intentional local exceptions are limited to values whose meaning is not the TechIT application theme, including user/data-driven visualization series, Recharts rendering props that require concrete color values, social-provider identity colors, and syntax/editor rendering owned by Monaco. Repeated exceptions belong in the chart, integration, or editor token families.

To rebrand TechIT, update `theme.config.ts`, run `npm run theme:generate`, verify the `/workspaces/components` preview in light and dark mode, then run the frontend build and visual checks. `npm run build` also regenerates the CSS automatically.
