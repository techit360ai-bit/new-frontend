import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(new URL("../..", import.meta.url).pathname);

const workflows = [
  {
    filePath: ".github/workflows/frontend.yml",
    buildStep: "TypeScript and Vite production build",
  },
  {
    filePath: ".github/workflows/deploy.yml",
    buildStep: "Vite production build",
  },
];

const requiredBuildEnv = {
  VITE_API_URL: "https://techit-backend.onrender.com/api",
  VITE_API_BASE_URL: "https://techit-api-u1ek.onrender.com",
  VITE_TECHIT_API: "https://techit-backend.onrender.com/api/mcp",
  VITE_MESSAGING_BASE_URL: "https://techit-messaging.onrender.com",
  VITE_MESSAGING_WS_URL: "wss://techit-messaging.onrender.com/ws",
  VITE_API_STRICT: "1",
};

function fail(message) {
  throw new Error(message);
}

function readWorkflow(filePath) {
  const absolute = path.join(ROOT, filePath);
  if (!fs.existsSync(absolute)) fail(`workflow missing: ${filePath}`);
  return fs.readFileSync(absolute, "utf8");
}

function assertBuildEnv(filePath, content, buildStep) {
  const buildEnv = getBuildStepEnv(filePath, content, buildStep);

  for (const [key, value] of Object.entries(requiredBuildEnv)) {
    if (buildEnv.get(key) !== value) {
      fail(`${filePath} build env is missing ${key}: ${value}`);
    }
  }
}

function getBuildStepEnv(filePath, content, buildStep) {
  const lines = content.split(/\r?\n/);
  const stepStart = lines.findIndex((line) => line.trim() === `- name: ${buildStep}`);
  if (stepStart === -1) fail(`${filePath} is missing build step: ${buildStep}`);

  const nextStep = lines.findIndex(
    (line, index) => index > stepStart && /^\s{6}- name: /.test(line),
  );
  const stepLines = lines.slice(stepStart, nextStep === -1 ? undefined : nextStep);
  const envStart = stepLines.findIndex((line) => line.trim() === "env:");
  if (envStart === -1) fail(`${filePath} build step is missing an env block`);

  const env = new Map();
  for (const line of stepLines.slice(envStart + 1)) {
    const match = line.match(/^\s{10}([A-Z0-9_]+):\s*(.+?)\s*$/);
    if (!match) continue;
    const value = match[2].replace(/^("|')(.*)\1$/, "$2");
    env.set(match[1], value);
  }
  return env;
}

function assertNoBackendUrlDrift(filePath, content) {
  const wrongAiRouter = "VITE_API_BASE_URL: https://techit-backend.onrender.com";
  const wrongAuthBackend = "VITE_API_URL: https://techit-api-u1ek.onrender.com/api";
  const wrongMcpBackend = "VITE_TECHIT_API: https://techit-api-u1ek.onrender.com/api/mcp";
  if (content.includes(wrongAiRouter)) {
    fail(`${filePath} points VITE_API_BASE_URL at the Node backend instead of ai-router`);
  }
  if (content.includes(wrongAuthBackend)) {
    fail(`${filePath} points VITE_API_URL at the ai-router instead of the Node backend`);
  }
  if (content.includes(wrongMcpBackend)) {
    fail(`${filePath} points VITE_TECHIT_API at the ai-router instead of the Node backend`);
  }
}

function assertRenderDeployIsExplicitlyEnabled(filePath, content) {
  if (!content.includes("secrets.RENDER_FRONTEND_DEPLOY_HOOK")) return;

  const enablementGate = "vars.RENDER_FRONTEND_DEPLOY_ENABLED == 'true'";
  if (!content.includes(enablementGate)) {
    fail(`${filePath} Render deploy job must require ${enablementGate}`);
  }
}

try {
  for (const workflow of workflows) {
    const content = readWorkflow(workflow.filePath);
    assertBuildEnv(workflow.filePath, content, workflow.buildStep);
    assertNoBackendUrlDrift(workflow.filePath, content);
    assertRenderDeployIsExplicitlyEnabled(workflow.filePath, content);
  }
  console.log("frontend workflow env contract OK");
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
