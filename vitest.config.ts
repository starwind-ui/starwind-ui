import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

import { defineConfig } from "vitest/config";

const sharedTestConfig = {
  globals: true,
  environment: "node" as const,
  testTimeout: 60_000,
};

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "packages/cli/src"),
    },
  },
  test: {
    ...sharedTestConfig,
    projects: [
      {
        extends: true,
        test: {
          name: "repo-scripts",
          include: [
            "scripts/tests/**/*.test.ts",
            "scripts/tests/**/*.spec.ts",
            "scripts/tests/**/*.test.mjs",
            "scripts/tests/**/*.spec.mjs",
          ],
        },
      },
      {
        extends: true,
        test: {
          name: "cli",
          include: [
            "packages/cli/src/**/*.test.ts",
            "packages/cli/src/**/*.spec.ts",
            "packages/cli/tests/**/*.test.ts",
            "packages/cli/tests/**/*.spec.ts",
          ],
        },
      },
      {
        extends: true,
        test: {
          name: "portable-runtime",
          include: [
            "scripts/portable-runtime/**/*.test.ts",
            "scripts/portable-runtime/**/*.spec.ts",
            "scripts/portable-runtime/**/*.test.mjs",
            "scripts/portable-runtime/**/*.spec.mjs",
          ],
          exclude: ["scripts/portable-runtime/tests/generate-vue-wrappers/**"],
        },
      },
      {
        extends: true,
        test: {
          name: "portable-vue",
          include: [
            "scripts/portable-runtime/tests/generate-vue-wrappers/**/*.test.ts",
            "scripts/portable-runtime/tests/generate-vue-wrappers/**/*.spec.ts",
          ],
        },
      },
    ],
  },
});
