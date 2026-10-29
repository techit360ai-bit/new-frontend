import { expect, test } from '@playwright/test';
import { authenticateAs } from './helpers/auth';

test.setTimeout(90_000);
const roles = [
  { role: 'founder', path: '/founder/dashboard' },
  { role: 'collaborator', path: '/collaborator/dashboard' },
  { role: 'investor', path: '/investor/dashboard' },
  { role: 'organisation', path: '/org/dashboard' },
] as const;
const emptyExecution = {
  ok: true, role: 'founder', roleFocus: [], generatedAt: '2026-10-29T00:00:00Z',
  signals: { events: 0, activeActors: 0, artifacts: 0 },
  velocity: { eventsPerDay: 0 }, highlights: [], trust: [],
};
for (const { role, path } of roles) {
  test(`${role} dashboard keeps execution intelligence across sizes and themes`, async ({ page }) => {
    await authenticateAs(page, role);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.route('**/execution-intelligence**', route => route.fulfill({ json: { ...emptyExecution, role } }));
    await page.goto(path, { waitUntil: "domcontentloaded" });
    const panel = page.getByRole('region', { name: 'Execution intelligence' });
    await expect(panel).toContainText('No execution activity has been recorded');
    for (const viewport of [{ name: 'mobile', width: 390, height: 844 }, { name: 'desktop', width: 1440, height: 900 }]) {
      await page.setViewportSize(viewport);
      for (const theme of ['light', 'dark']) {
        const isDark = await page.locator('html').evaluate(element => element.classList.contains('dark'));
        if (isDark !== (theme === 'dark')) await page.getByRole('button', { name: 'Toggle theme', exact: true }).first().click();
        await expect.poll(() => page.locator('html').evaluate(element => element.classList.contains('dark'))).toBe(theme === 'dark');
        await panel.scrollIntoViewIfNeeded();
        await expect(panel).toBeVisible();
        await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
        await page.screenshot({ path: `test-results/visual/completion-${role}-${viewport.name}-${theme}.png`, fullPage: true, animations: "disabled" });
      }
    }
  });
}

test('execution service failure can be retried without reloading the dashboard', async ({ page }) => {
  await authenticateAs(page, 'collaborator');
  let attempts = 0;
  await page.route('**/execution-intelligence**', route => {
    attempts += 1;
    return attempts === 1 ? route.fulfill({ status: 503, json: { error: 'unavailable' } }) : route.fulfill({ json: emptyExecution });
  });
  await page.goto('/collaborator/dashboard', { waitUntil: "domcontentloaded" });
  const panel = page.getByRole('region', { name: 'Execution intelligence' });
  await expect(panel).toContainText('could not be loaded');
  await panel.getByRole('button', { name: 'Try again' }).click();
  await expect(panel).toContainText('No execution activity has been recorded');
});

test('execution permission failure has a distinct state', async ({ page }) => {
  await authenticateAs(page, 'investor');
  await page.route('**/execution-intelligence**', route => route.fulfill({ status: 403, json: { error: 'forbidden' } }));
  await page.goto('/investor/dashboard', { waitUntil: "domcontentloaded" });
  const panel = page.getByRole('region', { name: 'Execution intelligence' });
  await expect(panel).toContainText('does not have permission');
  await expect(panel.getByRole('button', { name: 'Try again' })).toHaveCount(0);
});

test('Explorer displays live startup records and an honest empty state', async ({ page }) => {
  await authenticateAs(page, 'explorer');
  await page.route('**/discovery/recommendations**', route => route.fulfill({ json: { recommendations: [{
    id: 'live-recommendation', score: 81, entity: { entityId: 'live-startup', type: 'startup', title: 'Live Research Venture', description: 'A published startup record', industries: ['Research'], stage: 'MVP', skills: ['TypeScript'], url: '/feed/discover', actions: [] },
  }], meta: {} } }));
  await page.goto('/explore/startups', { waitUntil: "domcontentloaded" });
  await expect(page.getByText('Live Research Venture').first()).toBeVisible();
  await expect(page.getByText('AuraAI', { exact: true })).toHaveCount(0);
  await page.getByPlaceholder("Search startup name, sector, tech stack...").fill('no-matching-entry');
  await expect(page.getByRole('status').filter({ hasText: 'No results match' })).toBeVisible();
});

test('Explorer preferences only report success after persistence', async ({ page }) => {
  await authenticateAs(page, 'explorer');
  let saved: unknown;
  await page.route('**/notifications/preferences', route => {
    if (route.request().method() === 'PATCH') {
      saved = route.request().postDataJSON();
      return route.fulfill({ json: { preferences: { explorer: { email: false, inApp: true } } } });
    }
    return route.fulfill({ json: { preferences: { explorer: { email: true, inApp: true } } } });
  });
  await page.goto('/explore/settings', { waitUntil: "domcontentloaded" });
  await page.getByLabel('Email digests for matching startups & opportunities').uncheck();
  await page.getByRole('button', { name: 'Save Preferences' }).click();
  await expect(page.getByRole('button', { name: 'Preferences Saved' })).toBeVisible();
  expect(saved).toEqual({ scope: 'explorer', preferences: { email: false, inApp: true } });
});


test('GitHub discovers connected repositories through the canonical MCP tool', async ({ page }) => {
  await authenticateAs(page, 'founder');
  await page.route('**/mcp/tools', route => route.fulfill({ json: [{ plugin: 'github', tool: { name: 'list_repositories', description: 'List repositories', destructive: false, input_schema: {} } }] }));
  await page.route('**/mcp/connections', route => route.fulfill({ json: [{ plugin: 'github', label: 'GitHub', kind: 'oauth_token', connected: true, source: 'vault', mode: 'real', optional: false, scopes: ['repo'], scopesVerified: true }] }));
  await page.route('**/mcp/audit', route => route.fulfill({ json: [] }));
  let invocation: unknown;
  await page.route('**/mcp/invoke', route => {
    invocation = route.request().postDataJSON();
    return route.fulfill({ json: { ok: true, data: [{ id: 1, fullName: 'team/production-app', defaultBranch: 'main' }] } });
  });
  await page.goto('/workspaces/github', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'team/production-app' })).toBeVisible();
  expect(invocation).toEqual({ plugin: 'github', tool: 'list_repositories', params: {} });
});
