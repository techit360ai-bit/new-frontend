import { promises as fs } from 'node:fs'
import path from 'node:path'
import { themeCssVariables } from '../src/config/theme.config.ts'

const outputPath = path.resolve('src/styles/themes.css')

const kebab = value => value.replace(/[A-Z]/g, match => `-${match.toLowerCase()}`)

function flatten(value, prefix = '') {
  return Object.entries(value).flatMap(([key, entry]) => {
    const name = prefix ? `${prefix}-${kebab(key)}` : kebab(key)
    return typeof entry === 'object' && entry !== null
      ? flatten(entry, name)
      : [[name, entry]]
  })
}

function declarations(value, indent = '  ') {
  return flatten(value).map(([name, entry]) => `${indent}--techit-${name}: ${entry};`).join('\n')
}

const shared = declarations(themeCssVariables.shared)
const light = declarations(themeCssVariables.light)
const dark = declarations(themeCssVariables.dark)

const css = `/* Generated from src/config/theme.config.ts. Do not edit directly. */
:root {
  color-scheme: light;
  --radius: 0.625rem;
${shared}
${light}
}

.dark {
  color-scheme: dark;
${dark}
}

/* Legacy aliases keep existing feature-scoped styles visually stable while
   components migrate to semantic utilities. */
:root, .dark {
  --techit-app-bg: var(--techit-background-primary);
  --techit-app-surface: var(--techit-surface-primary);
  --techit-app-surface-raised: var(--techit-surface-elevated);
  --techit-app-border: var(--techit-border-default);
  --techit-app-border-strong: var(--techit-border-strong);
  --techit-app-text: var(--techit-text-primary);
  --techit-app-muted: var(--techit-text-muted);
  --techit-app-subtle: var(--techit-background-tertiary);
  --techit-app-brand: var(--techit-brand-primary);
  --techit-app-brand-strong: var(--techit-brand-primary-hover);
  --techit-app-brand-soft: color-mix(in srgb, var(--techit-brand-primary) 10%, transparent);
  --techit-app-success: var(--techit-status-success);
  --techit-app-warning: var(--techit-status-warning);
  --techit-app-danger: var(--techit-status-error);
  --techit-app-info: var(--techit-status-info);
  --bg-base: var(--techit-background-primary);
  --bg-surface: var(--techit-surface-primary);
  --bg-elevated: var(--techit-surface-secondary);
  --bg-overlay: var(--techit-surface-overlay);
  --text-primary: var(--techit-text-primary);
  --text-secondary: var(--techit-text-secondary);
  --text-muted: var(--techit-text-muted);
  --accent-primary: var(--techit-brand-accent);
  --score-green: var(--techit-status-success);
  --score-amber: var(--techit-status-warning);
  --score-red: var(--techit-status-error);
  --score-blue: var(--techit-brand-primary);
  --score-purple: var(--techit-status-pending);
  --landing-bg-primary: var(--techit-landing-background-primary);
  --landing-bg-secondary: var(--techit-landing-background-secondary);
  --landing-bg-tertiary: var(--techit-landing-background-tertiary);
  --landing-text-primary: var(--techit-landing-text-primary);
  --landing-text-secondary: var(--techit-landing-text-secondary);
  --landing-text-tertiary: var(--techit-landing-text-tertiary);
  --landing-border: var(--techit-landing-border);
  --landing-accent-primary: var(--techit-landing-accent-primary);
  --landing-accent-secondary: var(--techit-landing-accent-secondary);
  --landing-accent-success: var(--techit-landing-accent-success);
}

:root, [data-techit-role="explorer"] { --techit-role-primary: var(--techit-role-explorer); }
[data-techit-role="founder"] { --techit-role-primary: var(--techit-role-founder); }
[data-techit-role="collaborator"] { --techit-role-primary: var(--techit-role-collaborator); }
[data-techit-role="investor"] { --techit-role-primary: var(--techit-role-investor); }
[data-techit-role="organisation"], [data-techit-role="organization"] { --techit-role-primary: var(--techit-role-organization); }
`

await fs.writeFile(outputPath, css)
console.log(`Generated ${path.relative(process.cwd(), outputPath)}`)
