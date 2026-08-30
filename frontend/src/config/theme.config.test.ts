import { describe, expect, it } from 'vitest'
import { techITTheme } from './theme.config'

describe('TechIT theme contract', () => {
  it('defines every supported role and semantic status', () => {
    expect(Object.keys(techITTheme.role)).toEqual(['explorer', 'founder', 'collaborator', 'investor', 'organization'])
    expect(Object.keys(techITTheme.status)).toEqual(['success', 'warning', 'error', 'info', 'pending'])
  })

  it('keeps palette values centralized as editable tokens', () => {
    expect(techITTheme.brand.primary).toMatch(/^#/) 
    expect(techITTheme.background.dark).toMatch(/^#/) 
  })
})
