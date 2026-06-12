// Resolver hook: redirect `vitest` imports to the local runtime shim, and add
// TS extension resolution for extensionless relative imports (./map -> ./map.ts).
import { pathToFileURL } from "node:url";
import { resolve as resolvePath } from "node:path";
import { existsSync } from "node:fs";

const SHIM = pathToFileURL(resolvePath("scripts/vitest-runtime.mjs")).href;

export async function resolve(spec, ctx, next) {
  if (spec === "vitest") return { url: SHIM, shortCircuit: true };
  if (spec.startsWith(".") && !/\.[cm]?[jt]s$/.test(spec)) {
    for (const ext of [".ts", ".tsx", "/index.ts"]) {
      try {
        const base = ctx.parentURL ? new URL(spec + ext, ctx.parentURL) : null;
        if (base && existsSync(base)) return { url: base.href, shortCircuit: true };
      } catch { /* fall through */ }
    }
  }
  return next(spec, ctx);
}
