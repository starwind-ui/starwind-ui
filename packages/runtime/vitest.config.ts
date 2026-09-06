import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          include: ["tests/**/*.test.ts", "tests/**/*.spec.ts"],
          exclude: ["tests/**/*.browser.test.ts", "tests/**/*.browser.spec.ts"],
          name: "unit",
          environment: "node",
        },
      },
      {
        test: {
          include: ["tests/**/*.browser.test.ts", "tests/**/*.browser.spec.ts"],
          name: "browser",
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({ launchOptions: { channel: "chromium" } }),
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
  },
});
