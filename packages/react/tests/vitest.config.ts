import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";
import { playwright } from "../../runtime/node_modules/@vitest/browser-playwright/dist/index.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const resolve = {
  alias: {
    "@starwind-ui/react/color-picker": path.join(
      repoRoot,
      "packages/react/src/color-picker/index.ts",
    ),
    "@starwind-ui/react/popover": path.join(repoRoot, "packages/react/src/popover/index.ts"),
    "@starwind-ui/react/select": path.join(repoRoot, "packages/react/src/select/index.ts"),
    "@starwind-ui/runtime/color-picker": path.join(
      repoRoot,
      "packages/runtime/src/components/color-picker/index.ts",
    ),
    "@starwind-ui/runtime/popover": path.join(
      repoRoot,
      "packages/runtime/src/components/popover/index.ts",
    ),
    "@starwind-ui/runtime/select": path.join(
      repoRoot,
      "packages/runtime/src/components/select/index.ts",
    ),
  },
};

export default defineConfig({
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
