/**
 * TechIT visual contract. Values are intentionally kept here as the editable
 * palette; CSS consumes the matching --techit-* variables from themes.css.
 * Components should use semantic tokens rather than these raw values.
 */
export const techITTheme = {
  brand: {
    primary: '#2196f3',
    primaryHover: '#1976d2',
    secondary: '#0a1929',
    accent: '#4f6ef7',
    premium: '#ffd700',
  },
  background: {
    light: '#f6f8fb',
    dark: '#0a0a0f',
  },
  surface: {
    light: '#ffffff',
    lightRaised: '#ffffff',
    dark: '#111118',
    darkRaised: '#1a1a25',
    darkOverlay: '#22222e',
  },
  text: {
    light: '#172033',
    lightMuted: '#64748b',
    dark: '#f0f0f5',
    darkSecondary: '#9090a8',
    darkMuted: '#5c5c78',
    inverse: '#ffffff',
  },
  border: {
    light: '#e4e8ef',
    lightStrong: '#cbd3df',
    dark: 'rgba(255, 255, 255, 0.06)',
    darkActive: 'rgba(79, 110, 247, 0.4)',
  },
  status: {
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#2196f3',
    pending: '#a855f7',
  },
  role: {
    explorer: '#4f6ef7',
    founder: '#2196f3',
    collaborator: '#10b981',
    investor: '#a855f7',
    organization: '#f59e0b',
  },
} as const

export type TechITRole = keyof typeof techITTheme.role
export type TechITTheme = typeof techITTheme
