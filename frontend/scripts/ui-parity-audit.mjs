import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import ts from 'typescript';

// Compare mounted routes, including nested and index routes, against local main.
function routes(source) {
  const file = ts.createSourceFile('App.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const found = [];
  function visit(node, parent = '') {
    const opening = ts.isJsxElement(node) ? node.openingElement : ts.isJsxSelfClosingElement(node) ? node : null;
    if (opening?.tagName.getText(file) === 'Route') {
      const attrs = opening.attributes.properties;
      const attr = name => attrs.find(item => ts.isJsxAttribute(item) && item.name.getText(file) === name);
      const routePath = attr('path')?.initializer;
      const raw = routePath && ts.isStringLiteral(routePath) ? routePath.text : '';
      const full = raw.startsWith('/') ? raw : [parent, raw].filter(Boolean).join('/');
      const key = `${full || '/'}${attr('index') ? ' [index]' : ''}`;
      found.push({ route: key, element: attr('element')?.initializer?.getText(file).replace(/^\{|\}$/g, '').replace(/\s+/g, ' ').trim() ?? 'layout' });
      if (ts.isJsxElement(node)) node.children.forEach(child => visit(child, full));
      return;
    }
    ts.forEachChild(node, child => visit(child, parent));
  }
  visit(file);
  return found;
}

const baseline = execFileSync('git', ['show', 'origin/main:frontend/src/App.tsx'], { encoding: 'utf8' });
const current = fs.readFileSync('src/App.tsx', 'utf8');
const previous = routes(baseline);
const mounted = routes(current);
const currentKeys = new Set(mounted.map(row => row.route));
const missing = previous.filter(row => !currentKeys.has(row.route));
const mainRevision = execFileSync('git', ['rev-parse', 'origin/main'], { encoding: 'utf8' }).trim();
const report = { baseline: mainRevision, baselineRouteEntries: previous.length, currentRouteEntries: mounted.length, missing, routes: mounted };
fs.mkdirSync('docs', { recursive: true });
fs.writeFileSync(path.join('docs', 'ui-route-parity.json'), `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync(path.join('docs', 'UI_ROUTE_COVERAGE.md'), `# Mounted UI route coverage\n\nBaseline: local origin/main at ${mainRevision}. This checks route presence; it does not certify visual or API behavior.\n\n${previous.length} baseline entries; ${mounted.length} current entries; ${missing.length} missing.\n\n| Route | Mounted destination |\n| --- | --- |\n${mounted.map(row => `| ${row.route} | \`${row.element.replaceAll('|', '\\|')}\` |`).join('\n')}\n`);
console.log(`${previous.length} baseline route entries; ${mounted.length} current; ${missing.length} missing.`);
if (missing.length) { console.error(missing); process.exitCode = 1; }
