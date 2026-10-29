import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/visual",
  outputDir: "./test-results/visual",
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    browserName: "chromium",
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
      : undefined,
  },
  webServer: {
    command: process.env.PLAYWRIGHT_USE_PREVIEW === "1"
      ? "node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4173"
      : "node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 4173",
    timeout: 90_000,
    url: "http://127.0.0.1:4173",
    reuseExistingServer: true,
  },
});
