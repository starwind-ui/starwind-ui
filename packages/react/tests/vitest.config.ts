import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";

import { createSourceBackedRuntimeAliases } from "./source-backed-runtime-aliases";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const resolve = {
  alias: [
    ...createSourceBackedRuntimeAliases(repoRoot),
    {
      find: "@starwind-ui/react/color-picker",
      replacement: path.join(repoRoot, "packages/react/src/color-picker/index.ts"),
    },
    {
      find: "@starwind-ui/react/popover",
      replacement: path.join(repoRoot, "packages/react/src/popover/index.ts"),
    },
    {
      find: "@starwind-ui/react/select",
      replacement: path.join(repoRoot, "packages/react/src/select/index.ts"),
    },
  ],
};

export default defineConfig({
  optimizeDeps: {
    include: ["react/jsx-dev-runtime"],
  },
  root: repoRoot,
  resolve,
  test: {
    projects: [
      {
        resolve,
        test: {
          environment: "node",
          include: ["packages/react/tests/**/*.ssr.test.tsx", "packages/react/tests/**/*.test.ts"],
          name: "ssr",
        },
      },
      {
        resolve,
        test: {
          browser: {
            enabled: true,
            headless: true,
            instances: [{ browser: "chromium" }],
            provider: playwright(),
          },
          include: ["packages/react/tests/**/*.browser.test.tsx"],
          name: "browser",
        },
      },
    ],
  },
});
