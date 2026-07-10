const DEFAULT_LIMITS = {
  concurrency: 2,
  requestsPerTarget: 3,
  maxConcurrency: 10,
  maxRequestsPerTarget: 25,
  timeoutMs: 10_000,
};

export const scalabilityTargets = [
  {
    name: "frontend-shell",
    env: "FRONTEND_URL",
    path: "/",
    statuses: [200],
    p95Ms: 1_500,
  },
  {
    name: "founder-dashboard-shell",
    env: "FRONTEND_URL",
    path: "/founder/dashboard",
    statuses: [200],
    p95Ms: 1_500,
  },
  {
    name: "node-backend-root",
    env: "VITE_API_URL",
    strip: "/api",
    path: "/",
    statuses: [200],
    p95Ms: 1_000,
  },
  {
    name: "ai-router-health",
    env: "VITE_API_BASE_URL",
    path: "/health",
    statuses: [200],
    p95Ms: 800,
  },
  {
    name: "mcp-auth-boundary",
    env: "VITE_TECHIT_API",
    path: "/health",
    statuses: [401],
    p95Ms: 800,
  },
  {
    name: "messaging-health",
    env: "VITE_MESSAGING_BASE_URL",
    path: "/health",
    statuses: [200],
    p95Ms: 800,
  },
];

export function readPositiveInt(env, name, fallback, cap) {
  const value = Number.parseInt(env[name] ?? "", 10);
  if (!Number.isFinite(value) || value < 1) return fallback;
  return Math.min(value, cap);
}

export function joinUrl(base, path) {
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

export function normalizeBaseUrl(base, strip) {
  if (!strip || !base.endsWith(strip)) return base;
  return base.slice(0, -strip.length);
}

export function buildPlan(env = process.env) {
  const limits = {
    concurrency: readPositiveInt(env, "SCALABILITY_CONCURRENCY", DEFAULT_LIMITS.concurrency, DEFAULT_LIMITS.maxConcurrency),
    requestsPerTarget: readPositiveInt(
      env,
      "SCALABILITY_REQUESTS_PER_TARGET",
      DEFAULT_LIMITS.requestsPerTarget,
      DEFAULT_LIMITS.maxRequestsPerTarget,
    ),
    timeoutMs: readPositiveInt(env, "SCALABILITY_TIMEOUT_MS", DEFAULT_LIMITS.timeoutMs, 60_000),
  };

  const targets = scalabilityTargets.map((target) => {
    const base = env[target.env] ? normalizeBaseUrl(env[target.env], target.strip) : null;
    return {
      ...target,
      configured: Boolean(base),
      url: base ? joinUrl(base, target.path) : null,
    };
  });

  return {
    enabled: env.SCALABILITY_PROBE_ENABLED === "true",
    limits,
    targets,
  };
}

async function timedFetch(url, timeoutMs) {
  const started = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    return {
      status: response.status,
      durationMs: Date.now() - started,
    };
  } finally {
    clearTimeout(timeout);
  }
}

function percentile(values, percentileValue) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((percentileValue / 100) * sorted.length) - 1);
  return sorted[index];
}

async function runTarget(target, limits) {
  const durations = [];
  let failures = 0;
  let completed = 0;
  const total = limits.requestsPerTarget;
  let next = 0;

  async function worker() {
    while (next < total) {
      next += 1;
      try {
        const result = await timedFetch(target.url, limits.timeoutMs);
        completed += 1;
        durations.push(result.durationMs);
        if (!target.statuses.includes(result.status)) failures += 1;
      } catch {
        completed += 1;
        failures += 1;
      }
    }
  }

  await Promise.all(Array.from({ length: limits.concurrency }, worker));
  const p95Ms = percentile(durations, 95);
  const errorRate = completed === 0 ? 1 : failures / completed;

  return {
    name: target.name,
    completed,
    failures,
    errorRate,
    p95Ms,
    passed: failures === 0 && p95Ms <= target.p95Ms,
  };
}

export async function runScalabilityCheck(env = process.env) {
  const plan = buildPlan(env);
  const configuredTargets = plan.targets.filter((target) => target.configured);

  if (!plan.enabled) {
    console.log(
      `scalability dry-run OK: ${plan.targets.length} targets, concurrency cap ${plan.limits.concurrency}, request cap ${plan.limits.requestsPerTarget}`,
    );
    return { mode: "dry-run", plan };
  }

  if (configuredTargets.length === 0) {
    throw new Error("SCALABILITY_PROBE_ENABLED=true requires at least one configured target URL");
  }

  const results = [];
  for (const target of configuredTargets) {
    const result = await runTarget(target, plan.limits);
    results.push(result);
    console.log(`${result.passed ? "ok" : "fail"} ${target.name} p95=${result.p95Ms}ms failures=${result.failures}`);
  }

  const failed = results.filter((result) => !result.passed);
  if (failed.length > 0) {
    throw new Error(`scalability probes failed: ${failed.map((result) => result.name).join(", ")}`);
  }

  return { mode: "probe", plan, results };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    await runScalabilityCheck();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
