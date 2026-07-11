import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "packages/cli/src"),
    },
  },
  test: {
    globals: true,
    environment: "node",
    testTimeout: 60_000,
    include: [
      "scripts/**/*.test.ts",
      "scripts/**/*.spec.ts",
      "scripts/**/*.test.mjs",
      "scripts/**/*.spec.mjs",
      "packages/cli/src/**/*.test.ts",
      "packages/cli/src/**/*.spec.ts",
      "packages/cli/tests/**/*.test.ts",
      "packages/cli/tests/**/*.spec.ts",
    ],
  },
});
