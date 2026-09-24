import { describe, expect, it } from 'vitest'
import { techITTheme, themeCssVariables } from './theme.config'

describe('TechIT theme contract', () => {
  it('defines every supported role and semantic status', () => {
    expect(Object.keys(techITTheme.role)).toEqual(['explorer', 'founder', 'collaborator', 'investor', 'organization'])
    expect(Object.keys(techITTheme.status)).toEqual(expect.arrayContaining(['success', 'warning', 'error', 'info', 'pending', 'active', 'inactive', 'disabled']))
  })

  it('keeps palette values centralized as editable tokens', () => {
    expect(techITTheme.brand.primary).toMatch(/^#/)
    expect(techITTheme.modes.dark.background.primary).toMatch(/^#/)
    expect(themeCssVariables.shared['brand-primary']).toBe(techITTheme.brand.primary)
    expect(themeCssVariables.shared['role-founder']).toBe(techITTheme.role.founder.primary)
    expect(themeCssVariables.dark.background.primary).toBe(techITTheme.modes.dark.background.primary)
  })
})
