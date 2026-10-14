import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/browser",
  use: { baseURL: "http://127.0.0.1:5194", ...devices["Desktop Chrome"] },
  webServer: {
    command: "npm run dev -- --port 5194 --strictPort",
    url: "http://127.0.0.1:5194",
    reuseExistingServer: !process.env.CI,
  },
});
