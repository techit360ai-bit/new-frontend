// Local test runner: registers the vitest resolver hook + type-stripping, finds
// *.test.ts, imports them (collecting via the shim), then runs. Usage:
//   node scripts/run-tests.mjs [rootDir]
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

register("./scripts/vitest-hooks.mjs", pathToFileURL("./").href);

function walk(dir, out) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (p.endsWith(".test.ts")) out.push(p);
  }
}

const root = process.argv[2] ?? "src";
const files = [];
walk(root, files);
const { __run } = await import("./vitest-runtime.mjs");
for (const f of files) await import(pathToFileURL(resolve(f)).href);
await __run();
