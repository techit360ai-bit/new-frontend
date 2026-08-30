# TechIT Theme Tokens

The frontend theme has one semantic contract:

- `src/config/theme.config.ts` documents the approved brand, surface, text, status, and role palette.
- `src/styles/themes.css` exposes the runtime light/dark CSS variables.
- `src/styles/tokens.css` maps semantic CSS variables into Tailwind v4 utilities.
- `src/App.css` contains legacy aliases and layout primitives only.

Use semantic utilities such as `bg-surface-primary`, `text-text-muted`, `border-border-default`, `bg-action-primary`, `text-status-success`, and `text-role-founder`.

Do not add reusable TechIT colors as hex values in TSX, inline styles, or arbitrary Tailwind classes. Add a semantic token first. Contextual colors (for example a user-provided chart color) may remain local when they are not part of the product theme.

To rebrand TechIT, update the matching values in `theme.config.ts` and `themes.css`, verify the `/workspaces/components` preview in light and dark mode, then run the frontend build and visual checks.
