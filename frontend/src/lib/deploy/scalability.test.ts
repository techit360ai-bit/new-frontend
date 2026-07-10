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
  const { buildPlan, joinUrl } = await loadScalabilityScript();
  const plan = buildPlan({ FRONTEND_URL: "https://app.techit.example/" });
  const shell = plan.targets.find((target) => target.name === "frontend-shell");

  expect(joinUrl("https://app.techit.example/", "/founder/dashboard")).toBe(
    "https://app.techit.example/founder/dashboard",
  );
  expect(shell?.configured).toBe(true);
  expect(shell?.url).toBe("https://app.techit.example/");
});
