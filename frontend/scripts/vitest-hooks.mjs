// Resolver hook: redirect `vitest` imports to the local runtime shim.
import { pathToFileURL } from "node:url";
import { resolve as resolvePath } from "node:path";

const SHIM = pathToFileURL(resolvePath("scripts/vitest-runtime.mjs")).href;

export async function resolve(spec, ctx, next) {
  if (spec === "vitest") return { url: SHIM, shortCircuit: true };
  return next(spec, ctx);
}
