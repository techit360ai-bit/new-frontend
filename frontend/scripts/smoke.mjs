const checks = [
  { name: "frontend", env: "FRONTEND_URL", path: "/", statuses: [200] },
  { name: "node-backend", env: "VITE_API_URL", strip: "/api", path: "/", statuses: [200] },
  { name: "mcp-auth-boundary", env: "VITE_TECHIT_API", path: "/health", statuses: [401] },
  { name: "ai-router", env: "VITE_API_BASE_URL", path: "/health", statuses: [200] },
  { name: "messaging", env: "VITE_MESSAGING_BASE_URL", path: "/health", statuses: [200] },
];

function joinUrl(base, path) {
  return `${base.replace(/\/$/, "")}${path}`;
}

async function probe(check) {
  let base = process.env[check.env];
  if (!base) {
    console.log(`skip ${check.name}: ${check.env} unset`);
    return;
  }
  if (check.strip && base.endsWith(check.strip)) {
    base = base.slice(0, -check.strip.length);
  }
  const url = joinUrl(base, check.path);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(process.env.SMOKE_TIMEOUT_MS || 10_000));
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!check.statuses.includes(res.status)) {
      throw new Error(`${url} returned ${res.status}; expected ${check.statuses.join("/")}`);
    }
    console.log(`ok ${check.name} ${res.status}`);
  } finally {
    clearTimeout(timeout);
  }
}

try {
  for (const check of checks) {
    await probe(check);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
