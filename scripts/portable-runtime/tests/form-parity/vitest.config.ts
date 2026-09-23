import path from "node:path";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { defineConfig } from "vitest/config";
import { playwright } from "../../../../packages/react/node_modules/@vitest/browser-playwright/dist/index.js";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { compileVueSfc } from "../../../../packages/vue/tsup.config.js";

const root = fileURLToPath(new URL("../../../../", import.meta.url));
const workspaceId = createHash("sha256").update(root).digest("hex").slice(0, 12);
const temporaryRoot = path.join(tmpdir(), "starwind-form-parity", workspaceId);

export default defineConfig({
  root,
  esbuild: {
    jsx: "automatic",
    tsconfigRaw: JSON.stringify({ compilerOptions: { target: "ES2022", jsx: "automatic" } }),
  },
  cacheDir: path.join(temporaryRoot, "vite"),
  plugins: [
    svelte({ hot: false, configFile: false }),
    {
      name: "form-parity-vue",
      enforce: "pre",
      transform(source, id) {
        if (!id.endsWith(".vue")) return;
        return ts.transpileModule(compileVueSfc(source, id), {
          compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
          fileName: id,
        }).outputText;
      },
    },
  ],
  define: {
    __VUE_OPTIONS_API__: true,
    __VUE_PROD_DEVTOOLS__: false,
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: true,
  },
  resolve: {
    alias: [
      {
        find: /^react(\/.*)?$/,
        replacement: path.join(root, "packages/react/node_modules/react$1"),
      },
      {
        find: /^react-dom(\/.*)?$/,
        replacement: path.join(root, "packages/react/node_modules/react-dom$1"),
      },
      {
        find: "tailwind-variants",
        replacement: path.join(
          root,
          "apps/react-demo/node_modules/tailwind-variants/dist/index.js",
        ),
      },
      {
        find: /^@starwind-ui\/runtime\/([^/]+)$/,
        replacement: path.join(root, "packages/runtime/src/components/$1/index.ts"),
      },
      ...["react", "vue", "svelte"].map((target) => ({
        find: new RegExp(`^@starwind-ui/${target}/([^/]+)$`),
        replacement: path.join(root, `packages/${target}/src/$1/index.ts`),
      })),
    ],
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom/client",
      "react/jsx-dev-runtime",
      "vue",
      "svelte",
      "tailwind-variants",
    ],
  },
  test: {
    include: ["scripts/portable-runtime/tests/form-parity/behavior.browser.tsx"],
    browser: {
      screenshotDirectory: path.join(temporaryRoot, "screenshots"),
      enabled: true,
      headless: true,
      instances: [{ browser: "chromium" }],
      provider: playwright({ launchOptions: { channel: "chromium" } }),
    },
  },
});
