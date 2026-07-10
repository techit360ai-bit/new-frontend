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
    env: string;
    configured: boolean;
    url: string | null;
  }>;
};

type ScalabilityModule = {
  buildPlan: (env?: Record<string, string | undefined>) => ScalabilityPlan;
  joinUrl: (base: string, path: string) => string;
  normalizeBaseUrl: (base: string, strip?: string) => string;
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
  expect(result.plan.targets.length >= 4).toBe(true);
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
  const { buildPlan, joinUrl, normalizeBaseUrl } = await loadScalabilityScript();
  const plan = buildPlan({
    FRONTEND_URL: "https://app.techit.example/",
    VITE_API_URL: "https://backend.techit.example/api",
  });
  const shell = plan.targets.find((target) => target.name === "frontend-shell");
  const backend = plan.targets.find((target) => target.name === "node-backend-root");

  expect(joinUrl("https://app.techit.example/", "/founder/dashboard")).toBe(
    "https://app.techit.example/founder/dashboard",
  );
  expect(normalizeBaseUrl("https://backend.techit.example/api", "/api")).toBe(
    "https://backend.techit.example",
  );
  expect(shell?.configured).toBe(true);
  expect(shell?.url).toBe("https://app.techit.example/");
  expect(backend?.configured).toBe(true);
  expect(backend?.url).toBe("https://backend.techit.example/");
});
