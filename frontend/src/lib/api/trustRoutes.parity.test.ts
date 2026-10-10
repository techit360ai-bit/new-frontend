import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import { TRUST_ROUTES, trustPath, trustRouteParamNames, type TrustRouteName } from "./trustRoutes";

const here = dirname(fileURLToPath(import.meta.url));

// Locate the monorepo root by walking up until we find the sibling services.
// The parity assertions run only when the checkout is present; CI that ships
// only the frontend still runs the registry-consistency checks below.
function findRepoRoot(): string | null {
  let dir = here;
  for (let i = 0; i < 8; i += 1) {
    if (existsSync(resolve(dir, "BACKEND/backend/src/routes/trust.js")) && existsSync(resolve(dir, "ai-router/main.py"))) {
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

const REPO_ROOT = findRepoRoot();

// Param NAMES are authority-specific (backend `:projectId`, ai-router
// `{startup_id}`); only the shape matters for route matching, so collapse every
// param to a single wildcard token.
function normalize(path: string): string {
  return path
    .replace(/\{[A-Za-z0-9_]+\}/g, ":param")
    .replace(/:[A-Za-z0-9_]+/g, ":param")
    .replace(/\/$/, "");
}

function nodeRoutes(): Set<string> {
  const out = new Set<string>();
  if (!REPO_ROOT) return out;
  const files: Array<[string, string]> = [
    ["BACKEND/backend/src/routes/trust.js", "/trust"],
    ["BACKEND/backend/src/routes/authorization.js", "/authorization"],
  ];
  for (const [rel, prefix] of files) {
    const full = resolve(REPO_ROOT, rel);
    if (!existsSync(full)) continue;
    const src = readFileSync(full, "utf8");
    for (const match of src.matchAll(/router\.(get|post|delete|put)\(\s*['"]([^'"]+)['"]/g)) {
      const [, method, path] = match;
      out.add(`${method.toUpperCase()} ${normalize(`${prefix}${path === "/" ? "" : path}`)}`);
    }
  }
  return out;
}

function aiRouterRoutes(): Set<string> {
  const out = new Set<string>();
  if (!REPO_ROOT) return out;
  const full = resolve(REPO_ROOT, "ai-router/main.py");
  if (!existsSync(full)) return out;
  const src = readFileSync(full, "utf8");
  for (const match of src.matchAll(/@app\.(get|post|delete|put)\(\s*["'](\/api\/v1[^"']*)["']/g)) {
    const [, method, rawPath] = match;
    out.add(`${method.toUpperCase()} ${normalize(rawPath.replace(/^\/api\/v1/, ""))}`);
  }
  return out;
}

const NODE = nodeRoutes();
const AI_ROUTER = aiRouterRoutes();

describe("trust route registry consistency", () => {
  test("every route declares a leading-slash path and a valid method", () => {
    for (const [name, route] of Object.entries(TRUST_ROUTES)) {
      expect(route.path.startsWith("/"), `${name} path must start with /`).toBe(true);
      expect(["GET", "POST", "DELETE", "PUT"]).toContain(route.method);
      expect(["backend", "ai-router", "both"]).toContain(route.authority);
    }
  });

  test("no duplicate method+path+authority entries", () => {
    const seen = new Map<string, string>();
    for (const [name, route] of Object.entries(TRUST_ROUTES)) {
      const key = `${route.authority} ${route.method} ${route.path}`;
      expect(seen.has(key), `duplicate registry entry: ${name} == ${seen.get(key)}`).toBe(false);
      seen.set(key, name);
    }
  });

  test("trustPath substitutes params and fails loudly on a missing param", () => {
    expect(trustPath("refreshSource", { source: "git hub" })).toBe("/trust/refresh/git%20hub");
    expect(trustRouteParamNames("overrideRevoke")).toEqual(["userId", "overrideId"]);
    expect(() => trustPath("refreshSource")).toThrow(/requires param "source"/);
  });

  test("client modules never hand-write a trust path outside the registry", () => {
    const offenders: string[] = [];
    for (const rel of ["trust.ts", "investorTrust.ts"]) {
      const src = readFileSync(resolve(here, rel), "utf8");
      for (const match of src.matchAll(/["'`](\/(?:trust|authorization|investor\/trust)[^"'`]*)["'`]/g)) {
        offenders.push(`${rel}: ${match[1]}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  test.runIf(NODE.size > 0)("every backend/both route exists on the Node authority", () => {
    const missing = Object.entries(TRUST_ROUTES)
      .filter(([, route]) => route.authority === "backend" || route.authority === "both")
      .map(([name, route]) => `${name} -> ${route.method} ${normalize(route.path)}`)
      .filter((entry) => !NODE.has(entry.split(" -> ")[1]));
    expect(missing).toEqual([]);
  });

  test.runIf(AI_ROUTER.size > 0)("every ai-router/both route exists on the AI-router", () => {
    const missing = Object.entries(TRUST_ROUTES)
      .filter(([, route]) => route.authority === "ai-router" || route.authority === "both")
      .map(([name, route]) => `${name} -> ${route.method} ${normalize(route.path)}`)
      .filter((entry) => !AI_ROUTER.has(entry.split(" -> ")[1]));
    expect(missing).toEqual([]);
  });

  test("registry exposes a resolvable name for every entry", () => {
    const names = Object.keys(TRUST_ROUTES) as TrustRouteName[];
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) expect(trustPath(name, Object.fromEntries(trustRouteParamNames(name).map((p) => [p, "x"])))).toContain("/");
  });
});
