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
      {
        // WebKit moves focus differently on a pointer press, so these files run there as well.
        test: {
          include: ["tests/cross-browser/**/*.browser.test.ts"],
          name: "webkit",
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: "webkit" }],
          },
        },
      },
    ],
  },
});
