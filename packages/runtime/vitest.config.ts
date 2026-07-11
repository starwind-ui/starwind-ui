import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          include: [
            "src/**/*.test.ts",
            "src/**/*.spec.ts",
            "tests/**/*.test.ts",
            "tests/**/*.spec.ts",
          ],
          exclude: [
            "src/**/*.browser.test.ts",
            "src/**/*.browser.spec.ts",
            "tests/**/*.browser.test.ts",
            "tests/**/*.browser.spec.ts",
          ],
          name: "unit",
          environment: "node",
        },
      },
      {
        test: {
          include: [
            "src/**/*.browser.test.ts",
            "src/**/*.browser.spec.ts",
            "tests/**/*.browser.test.ts",
            "tests/**/*.browser.spec.ts",
          ],
          name: "browser",
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
  },
});
