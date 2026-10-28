const PUBLIC_PREFIX = "VITE_";

const requiredUrls = [
  "VITE_API_URL",
  "VITE_API_BASE_URL",
  "VITE_TECHIT_API",
  "VITE_MESSAGING_BASE_URL",
  "VITE_MESSAGING_WS_URL",
];

const secretPatterns = [
  /SECRET/i,
  /PRIVATE/i,
  /TOKEN/i,
  /PASSWORD/i,
  /DATABASE/i,
  /REDIS/i,
  /OPENAI/i,
  /ANTHROPIC/i,
  /COHERE/i,
  /GEMINI/i,
  /LIVEKIT_API_SECRET/i,
];

function requireUrl(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  const parsed = new URL(value);
  if (name.endsWith("_WS_URL") && !["ws:", "wss:"].includes(parsed.protocol)) {
    throw new Error(`${name} must use ws:// or wss://`);
  }
  if (!name.endsWith("_WS_URL") && !["http:", "https:"].includes(parsed.protocol)) {
    throw new Error(`${name} must use http:// or https://`);
  }
  if (process.env.NODE_ENV === "production" && parsed.hostname === "localhost") {
    throw new Error(`${name} cannot point at localhost in production`);
  }
}

function assertNoPublicSecrets() {
  for (const key of Object.keys(process.env)) {
    if (!key.startsWith(PUBLIC_PREFIX)) continue;
    if (secretPatterns.some((pattern) => pattern.test(key))) {
      throw new Error(`${key} is prefixed with ${PUBLIC_PREFIX} and would be exposed to the browser`);
    }
  }
}

function assertProductionStrictness() {
  if (process.env.NODE_ENV !== "production") return;
  if (process.env.VITE_API_STRICT !== "1") {
    throw new Error("VITE_API_STRICT=1 is required in production");
  }
  if (process.env.VITE_API_FALLBACK === "1") {
    throw new Error("VITE_API_FALLBACK=1 is forbidden in production");
  }
}

try {
  for (const name of requiredUrls) requireUrl(name);
  assertNoPublicSecrets();
  assertProductionStrictness();
  console.log("frontend env contract OK");
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
