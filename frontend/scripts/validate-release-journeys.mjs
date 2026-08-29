import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const REPO_ROOT = path.resolve(ROOT, "..");
const JOURNEYS_PATH = path.join(ROOT, "release-journeys.json");
const APP_PATH = path.join(ROOT, "src", "App.tsx");
const WORKFLOW_PATH = path.join(REPO_ROOT, ".github", "workflows", "frontend.yml");

function fail(message) {
  throw new Error(message);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function exists(relativePath) {
  return fs.existsSync(path.join(ROOT, relativePath));
}

function routePattern(route) {
  const escaped = route
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\\:[A-Za-z0-9_]+/g, ":[A-Za-z0-9_]+");
  return new RegExp(`path=["']${escaped.replace(/^\//, "\\/?")}["']`);
}

function hasRoute(app, route) {
  if (routePattern(route).test(app)) return true;

  const segments = route.replace(/^\//, "").split("/");
  for (let index = 1; index < segments.length; index += 1) {
    const parent = `/${segments.slice(0, index).join("/")}`;
    const child = segments.slice(index).join("/");
    if (routePattern(parent).test(app) && routePattern(child).test(app)) return true;
  }

  return false;
}

function assertJourneyShape(manifest) {
  if (manifest.version !== 1) fail("release journey manifest version must be 1");
  if (!Array.isArray(manifest.journeys) || manifest.journeys.length === 0) {
    fail("release journey manifest must define at least one journey");
  }

  const ids = new Set();
  for (const journey of manifest.journeys) {
    if (!journey.id) fail("release journey is missing id");
    if (ids.has(journey.id)) fail(`duplicate release journey id: ${journey.id}`);
    ids.add(journey.id);
    for (const field of ["routes", "apiModules", "tests"]) {
      if (!Array.isArray(journey[field]) || journey[field].length === 0) {
        fail(`${journey.id} must list ${field}`);
      }
    }
  }
}

function assertRoutes(manifest) {
  const app = fs.readFileSync(APP_PATH, "utf8");
  for (const journey of manifest.journeys) {
    for (const route of journey.routes) {
      if (!hasRoute(app, route)) {
        fail(`${journey.id} route is not declared in App.tsx: ${route}`);
      }
    }
  }
}

function assertFiles(manifest) {
  for (const journey of manifest.journeys) {
    for (const filePath of [...journey.apiModules, ...journey.tests]) {
      if (!exists(filePath)) fail(`${journey.id} references missing file: ${filePath}`);
    }
  }
}

function assertCiWiring() {
  const workflow = fs.readFileSync(WORKFLOW_PATH, "utf8");
  if (!workflow.includes("npm run release:journeys")) {
    fail("frontend quality workflow must run npm run release:journeys");
  }
}

try {
  const manifest = readJson(JOURNEYS_PATH);
  assertJourneyShape(manifest);
  assertRoutes(manifest);
  assertFiles(manifest);
  assertCiWiring();
  console.log("frontend release journeys OK");
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
