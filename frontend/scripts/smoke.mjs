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

// Build-identity checks. They always log the deployed SHA, and when
// SMOKE_EXPECT_SHA is set they fail on drift (deployed commit != expected).
export function versionChecks(env = process.env) {
  const checks = [
    { name: "node-backend-version", env: "VITE_API_URL", strip: "/api", path: "/health", statuses: [200], shaPath: "sha" },
    { name: "ai-router-version", env: "VITE_API_BASE_URL", path: "/version", statuses: [200], shaPath: "sha" },
    { name: "messaging-version", env: "VITE_MESSAGING_BASE_URL", path: "/health", statuses: [200], shaPath: "sha" },
  ];
  if (env.VITE_PAYMENT_GATEWAY_URL) {
    checks.push({ name: "payment-gateway-version", env: "VITE_PAYMENT_GATEWAY_URL", path: "/health", statuses: [200], shaPath: "sha" });
  }
  return checks;
}

// Readiness checks are advisory by default (a `/ready` 503 is surfaced as a
// warning) because the AWS origin/URL env is finalized separately. Set
// SMOKE_REQUIRE_READY=1 to make them gate the run.
export function readyChecks(env = process.env) {
  const optional = env.SMOKE_REQUIRE_READY !== "1";
  const checks = [
    { name: "node-backend-ready", env: "VITE_API_URL", strip: "/api", path: "/ready", statuses: [200], optional },
    { name: "ai-router-ready", env: "VITE_API_BASE_URL", path: "/ready", statuses: [200], optional },
    { name: "messaging-ready", env: "VITE_MESSAGING_BASE_URL", path: "/ready", statuses: [200], optional },
  ];
  if (env.VITE_PAYMENT_GATEWAY_URL) {
    checks.push({ name: "payment-gateway-ready", env: "VITE_PAYMENT_GATEWAY_URL", path: "/ready", statuses: [200], optional });
  }
  return checks;
}

export function buildChecks(env = process.env) {
  const checks = [...baseChecks, ...versionChecks(env), ...readyChecks(env)];
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
    body = await res.clone().json();
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

export async function assertExpectedSha(check, res, url, env = process.env) {
  if (!check.shaPath) return;

  let body;
  try {
    body = await res.clone().json();
  } catch {
    return;
  }
  const sha = readPath(body, check.shaPath);
  console.log(`sha ${check.name} ${String(sha)}`);
  if (env.SMOKE_EXPECT_SHA && sha && sha !== "unknown" && sha !== env.SMOKE_EXPECT_SHA) {
    throw new Error(`${url} sha=${String(sha)}; expected ${env.SMOKE_EXPECT_SHA}`);
  }
}

export async function probe(check, env = process.env) {
  let base = env[check.env];
  if (!base) {
    console.log(`skip ${check.name}: ${check.env} unset`);
    return undefined;
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
    await assertExpectedSha(check, res, url, env);
    console.log(`ok ${check.name} ${res.status}`);
    return res;
  } finally {
    clearTimeout(timeout);
  }
}

export async function runSmoke(env = process.env) {
  const failures = [];
  for (const check of buildChecks(env)) {
    try {
      await probe(check, env);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (check.optional) {
        console.warn(`warn ${check.name}: ${message}`);
        continue;
      }
      // Report every failure in one run so a drift alarm shows the whole
      // picture (MCP mount, readiness, SHA…) instead of stopping at the first.
      console.error(`fail ${check.name}: ${message}`);
      failures.push(check.name);
    }
  }
  if (failures.length) {
    throw new Error(`${failures.length} check(s) failed: ${failures.join(", ")}`);
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
