import { expect, test } from '@playwright/test';

const user = { id: 'visual-founder', email: 'founder@visual.test' };
const profile = {
  ...user,
  firstName: 'Visual', lastName: 'Founder', username: 'visual-founder', role: 'founder', secondaryRoles: [],
  isVerified: true, isOnboarded: true, creditBalance: 0, credibilityScore: 0, skills: [], industries: [],
};

async function prepare(page: import('@playwright/test').Page) {
  await page.addInitScript(({ storedUser }) => {
    sessionStorage.setItem('techit_access_token', 'visual-test-token');
    localStorage.setItem('techit_user', JSON.stringify(storedUser));
    localStorage.setItem('techit_cookie_consent', 'essential-only');
    localStorage.setItem('techit:havi:first-landing:founder', 'visual-test');
  }, { storedUser: user });

  await page.route('http://localhost:3000/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/auth/session')) return route.fulfill({ json: { user } });
    if (path.endsWith('/users/me')) return route.fulfill({ json: profile });
    if (path.endsWith('/context/available')) return route.fulfill({ json: { contexts: [{ role: 'founder', status: 'active', isPrimary: true }], activeContext: { role: 'founder', status: 'active' } } });
    if (path.endsWith('/context/session')) return route.fulfill({ json: { greeting: 'Welcome back', resume: [], newSinceLeft: [] } });
    if (path.endsWith('/domain/workspaces')) return route.fulfill({ json: { workspaces: [{ id: 'workspace-1', projectId: 'project-1', name: 'Validated MVP', status: 'active', seededFromAnalysis: true, isOwner: true, accessLevel: 'owner' }] } });
    if (path.endsWith('/code/workspace-1/snapshot')) return route.fulfill({ json: { workspace: { id: 'workspace-1', projectId: 'project-1', name: 'Validated MVP' }, files: [{ path: 'src/App.tsx', content: 'export function App() { return <main>Validated MVP</main>; }', version: 3, contentHash: 'hash-1', language: 'typescript' }, { path: 'package.json', content: '{"scripts":{"dev":"vite","test":"vitest","build":"vite build"},"dependencies":{"react":"^19.0.0"}}', version: 1, contentHash: 'hash-2', language: 'json' }], sync: { repo: 'techit/example', branch: 'main', baseHeadSha: 'abc123' }, snapshotHash: 'snapshot-1' } });
    if (path.endsWith('/code/workspace-1/adapter')) return route.fulfill({ json: { adapter: 'react', packageManager: 'npm', commands: { install: 'npm install', dev: 'npm run dev', test: 'npm test', build: 'npm run build' }, supportedInBrowser: true, deterministic: true } });
    if (path.endsWith('/code/workspace-1/destinations')) return route.fulfill({ json: { destinations: [{ id: 'github:techit/example', provider: 'github', repository: 'techit/example', capabilities: { pull: true, push: true, deploy: true }, connectorId: 'github' }, { id: 'local:vscode', provider: 'local', repository: null, capabilities: { pull: true, push: true, deploy: false }, connectorId: null }] } });
    if (path.endsWith('/notifications')) return route.fulfill({ json: { notifications: [] } });
    return route.fulfill({ json: { tasks: [], data: [], items: [], results: [] } });
  });
  await page.route('http://localhost:8000/api/**', route => route.fulfill({ json: { plan: { summary: 'Use existing systems', existingSystems: [], changes: [], tests: [], securityChecks: [], recommendedAgentFlow: [] }, authoritative: false } }));
}

test('Workspace Code boots a real WebContainer, runs Node, and opens a live preview', async ({ page }) => {
  test.skip(process.env.TECHIT_LIVE_WEBCONTAINER !== '1', 'Enabled in the production runtime verification job.');
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await prepare(page);
  await page.route('http://localhost:3000/api/code/workspace-1/snapshot', route => route.fulfill({ json: {
    workspace: { id: 'workspace-1', projectId: 'project-1', name: 'Runtime Verification' },
    files: [
      { path: 'package.json', content: '{"scripts":{"dev":"node server.mjs","test":"node test.mjs","build":"node build.mjs"}}', version: 1, contentHash: 'package', language: 'json' },
      { path: 'test.mjs', content: 'console.log("TECHIT_WEBCONTAINER_OK")', version: 1, contentHash: 'test', language: 'javascript' },
      { path: 'build.mjs', content: 'console.log("TECHIT_BUILD_OK")', version: 1, contentHash: 'build', language: 'javascript' },
      { path: 'server.mjs', content: 'import http from "node:http"; http.createServer((_req,res)=>{res.setHeader("content-type","text/html");res.end("<main style=background:#fff;color:#111;padding:40px>TECHIT_PREVIEW_OK</main>")}).listen(4174,"0.0.0.0")', version: 1, contentHash: 'server', language: 'javascript' },
    ], sync: null, snapshotHash: 'runtime-snapshot',
  } }));
  await page.route('http://localhost:3000/api/code/workspace-1/adapter', route => route.fulfill({ json: { adapter: 'node', packageManager: 'npm', commands: { install: 'npm install', dev: 'npm run dev', test: 'npm test', build: 'npm run build' }, supportedInBrowser: true, deterministic: true } }));
  await page.route('http://localhost:3000/api/code/workspace-1/runtime-sessions', route => route.fulfill({ json: { session: { id: 'runtime-1', status: 'completed', exitCode: 0 } } }));
  await page.goto('/workspaces/code?workspace=workspace-1');
  expect(await page.evaluate(() => crossOriginIsolated)).toBe(true);
  await page.getByRole('button', { name: 'Test', exact: true }).click();
  await expect(page.getByText(/TECHIT_WEBCONTAINER_OK/)).toBeVisible({ timeout: 90_000 });
  await page.getByRole('button', { name: 'Run', exact: true }).click();
  const preview = page.locator('iframe[title="Live preview"]');
  await expect(preview).toBeVisible({ timeout: 90_000 });
  await expect(preview.contentFrame().getByText('TECHIT_PREVIEW_OK')).toBeVisible({ timeout: 30_000 });
});

for (const viewport of [{ name: 'desktop', width: 1440, height: 900 }, { name: 'mobile', width: 390, height: 844 }]) {
  test(`Workspace Code renders at ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await prepare(page);
    await page.goto('/workspaces/code?workspace=workspace-1');
    if (viewport.name === 'desktop') await expect(page.getByText('Coding Intelligence')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('src/App.tsx')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Run', exact: true })).toBeVisible();
    await expect(page.locator('.monaco-editor')).toBeVisible({ timeout: 20_000 });
    const dimensions = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: document.documentElement.clientWidth }));
    expect(dimensions.width).toBeLessThanOrEqual(dimensions.viewport + 2);
  });
}
