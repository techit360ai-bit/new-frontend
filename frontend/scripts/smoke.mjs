export const baseChecks = [
  { name: "frontend", env: "FRONTEND_URL", path: "/", statuses: [200] },
  {
    name: "node-backend",
    env: "VITE_API_URL",
    strip: "/api",
    path: "/",
    statuses: [200],
    expectJson: { status: "TechIT API running" },
  },
  {
    name: "mcp-auth-boundary",
    env: "VITE_TECHIT_API",
    path: "/health",
    statuses: [401],
    expectJson: { "error.code": "unauthenticated" },
  },
  {
    name: "ai-router",
    env: "VITE_API_BASE_URL",
    path: "/health",
    statuses: [200],
    expectJson: { ai_brain: "operational" },
  },
  { name: "messaging", env: "VITE_MESSAGING_BASE_URL", path: "/health", statuses: [200] },
];

export function buildChecks(env = process.env) {
  const checks = [...baseChecks];
  if (env.SMOKE_BEARER_TOKEN) {
    checks.push({
      name: "mcp-authenticated",
      env: "VITE_TECHIT_API",
      path: "/health",
      statuses: [200],
      token: env.SMOKE_BEARER_TOKEN,
    });
  }
  return checks;
}

function joinUrl(base, path) {
  return `${base.replace(/\/$/, "")}${path}`;
}

function readPath(value, path) {
  return path.split(".").reduce((current, key) => {
    if (current && typeof current === "object") return current[key];
    return undefined;
  }, value);
}

async function assertExpectedJson(check, res, url) {
  if (!check.expectJson) return;

  let body;
  try {
    body = await res.json();
  } catch {
    throw new Error(`${url} did not return JSON for ${check.name}`);
  }

  for (const [path, expected] of Object.entries(check.expectJson)) {
    const actual = readPath(body, path);
    if (actual !== expected) {
      throw new Error(`${url} returned JSON ${path}=${String(actual)}; expected ${String(expected)}`);
    }
  }
}

export async function probe(check, env = process.env) {
  let base = env[check.env];
  if (!base) {
    console.log(`skip ${check.name}: ${check.env} unset`);
    return;
  }
  if (check.strip && base.endsWith(check.strip)) {
    base = base.slice(0, -check.strip.length);
  }
  const url = joinUrl(base, check.path);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(env.SMOKE_TIMEOUT_MS || 10_000));
  const headers = check.token ? { Authorization: `Bearer ${check.token}` } : undefined;
  try {
    let res;
    try {
      res = await fetch(url, { headers, signal: controller.signal });
    } catch (error) {
      throw new Error(`${check.name} ${url} request failed: ${error instanceof Error ? error.message : String(error)}`);
    }
    if (!check.statuses.includes(res.status)) {
      throw new Error(`${url} returned ${res.status}; expected ${check.statuses.join("/")}`);
    }
    await assertExpectedJson(check, res, url);
    console.log(`ok ${check.name} ${res.status}`);
  } finally {
    clearTimeout(timeout);
  }
}

export async function runSmoke(env = process.env) {
  for (const check of buildChecks(env)) {
    await probe(check, env);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    await runSmoke();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
