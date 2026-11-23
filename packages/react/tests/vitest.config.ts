import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

import { createSourceBackedRuntimeAliases } from "./source-backed-runtime-aliases";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const demoRequire = createRequire(path.join(repoRoot, "apps/react-demo/package.json"));
const { default: tailwindcss } = await import(demoRequire.resolve("@tailwindcss/vite"));
const resolve = {
  alias: [
    ...createSourceBackedRuntimeAliases(repoRoot),
    ...[
      "alert-dialog",
      "button",
      "combobox",
      "dialog",
      "drawer",
      "field",
      "input",
      "menu",
      "sidebar",
    ].map((component) => ({
      find: `@starwind-ui/react/${component}`,
      replacement: path.join(repoRoot, `packages/react/src/${component}/index.ts`),
    })),
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
        plugins: [tailwindcss()],
        resolve,
        test: {
          browser: {
            enabled: true,
            headless: true,
            instances: [{ browser: "chromium" }],
            provider: playwright({ launchOptions: { channel: "chrome" } }),
          },
          include: ["packages/react/tests/**/*.browser.test.tsx"],
          name: "browser",
        },
      },
    ],
  },
});
