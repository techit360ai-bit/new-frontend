import { expect, test } from "vitest";

type ScalabilityPlan = {
  enabled: boolean;
  limits: {
    concurrency: number;
    requestsPerTarget: number;
    timeoutMs: number;
  };
  targets: Array<{
    name: string;
    env: string | string[];
    configuredFrom: string | null;
    authConfiguredFrom?: string | null;
    configured: boolean;
    url: string | null;
  }>;
};

type ScalabilityModule = {
  buildPlan: (env?: Record<string, string | undefined>) => ScalabilityPlan;
  joinUrl: (base: string, path: string) => string;
  normalizeBaseUrl: (base: string, strip?: string) => string;
  readConfiguredEnv: (
    env: Record<string, string | undefined>,
    names: string | string[],
  ) => { name: string; value: string } | null;
  runScalabilityCheck: (env?: Record<string, string | undefined>) => Promise<{ mode: string; plan: ScalabilityPlan }>;
};

const scalabilityScriptPath = "../../../scripts/scalability-check.mjs";

async function loadScalabilityScript() {
  return await import(scalabilityScriptPath) as ScalabilityModule;
}

test("scalability check is dry-run by default", async () => {
  const { runScalabilityCheck } = await loadScalabilityScript();
  const result = await runScalabilityCheck({});

  expect(result.mode).toBe("dry-run");
  expect(result.plan.enabled).toBe(false);
  expect(result.plan.targets.length >= 8).toBe(true);
});

test("scalability check caps request pressure", async () => {
  const { buildPlan } = await loadScalabilityScript();
  const plan = buildPlan({
    SCALABILITY_CONCURRENCY: "999",
    SCALABILITY_REQUESTS_PER_TARGET: "999",
    SCALABILITY_TIMEOUT_MS: "999999",
  });

  expect(plan.limits.concurrency).toBe(10);
  expect(plan.limits.requestsPerTarget).toBe(25);
  expect(plan.limits.timeoutMs).toBe(60000);
});

test("scalability check builds configured target urls", async () => {
  const { buildPlan, joinUrl, normalizeBaseUrl, readConfiguredEnv } = await loadScalabilityScript();
  const plan = buildPlan({
    FRONTEND_URL: "https://app.techit.example/",
    NODE_BACKEND_URL: "https://backend.techit.example/api",
    VITE_API_URL: "https://legacy-backend.techit.example/api",
    AI_ROUTER_BASE_URL: "https://ai-router.techit.example",
    VITE_API_BASE_URL: "https://legacy-ai-router.techit.example",
    ADMIN_DASHBOARD_URL: "https://admin.techit.example",
    ADMIN_API_BASE_URL: "https://admin-api.techit.example",
    ADMIN_SMOKE_TOKEN: "admin-token",
  });
  const shell = plan.targets.find((target) => target.name === "frontend-shell");
  const backend = plan.targets.find((target) => target.name === "node-backend-root");
  const aiRouter = plan.targets.find((target) => target.name === "ai-router-health");
  const adminDashboard = plan.targets.find((target) => target.name === "admin-dashboard-shell");
  const adminApi = plan.targets.find((target) => target.name === "admin-api-health");

  expect(joinUrl("https://app.techit.example/", "/founder/dashboard")).toBe(
    "https://app.techit.example/founder/dashboard",
  );
  expect(normalizeBaseUrl("https://backend.techit.example/api", "/api")).toBe(
    "https://backend.techit.example",
  );
  expect(readConfiguredEnv({ A: "", B: "configured" }, ["A", "B"])).toEqual({ name: "B", value: "configured" });
  expect(shell?.configured).toBe(true);
  expect(shell?.url).toBe("https://app.techit.example/");
  expect(backend?.configured).toBe(true);
  expect(backend?.configuredFrom).toBe("NODE_BACKEND_URL");
  expect(backend?.url).toBe("https://backend.techit.example/");
  expect(aiRouter?.configuredFrom).toBe("AI_ROUTER_BASE_URL");
  expect(aiRouter?.url).toBe("https://ai-router.techit.example/health");
  expect(adminDashboard?.url).toBe("https://admin.techit.example/");
  expect(adminApi?.url).toBe("https://admin-api.techit.example/health");
  expect(adminApi?.authConfiguredFrom).toBe("ADMIN_SMOKE_TOKEN");
});

test("scalability check keeps admin targets separate from staging api urls", async () => {
  const { buildPlan } = await loadScalabilityScript();
  const plan = buildPlan({
    FRONTEND_URL: "https://app.techit.example/",
    VITE_API_URL: "https://backend.techit.example/api",
    VITE_API_BASE_URL: "https://ai-router.techit.example",
    VITE_TECHIT_API: "https://backend.techit.example/api/mcp",
    VITE_MESSAGING_BASE_URL: "https://messaging.techit.example",
  });
  const adminDashboard = plan.targets.find((target) => target.name === "admin-dashboard-shell");
  const adminApi = plan.targets.find((target) => target.name === "admin-api-health");

  expect(adminDashboard?.configured).toBe(false);
  expect(adminDashboard?.url).toBeNull();
  expect(adminApi?.configured).toBe(false);
  expect(adminApi?.url).toBeNull();
});
