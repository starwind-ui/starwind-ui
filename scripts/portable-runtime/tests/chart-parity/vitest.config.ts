import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import ts from "typescript";
import { defineConfig } from "vitest/config";
import { playwright } from "../../../../packages/react/node_modules/@vitest/browser-playwright/dist/index.js";
import { createSourceBackedRuntimeAliases } from "../../../../packages/react/tests/source-backed-runtime-aliases.js";
import { compileVueSfc } from "../../../../packages/vue/tsup.config.js";

const root = fileURLToPath(new URL("../../../../", import.meta.url));
const workspaceId = createHash("sha256").update(root).digest("hex").slice(0, 12);
const temporaryRoot = path.join(tmpdir(), "starwind-chart-parity", workspaceId);

const vueSfcPlugin = {
  enforce: "pre" as const,
  name: "starwind-chart-parity-vue-sfc",
  transform(source: string, id: string) {
    if (!id.split("?")[0]?.endsWith(".vue")) return;
    return ts.transpileModule(compileVueSfc(source, id), {
      compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
      fileName: id,
    }).outputText;
  },
};

// Cross-framework chart parity: the same cases in Astro, React, Vue and Svelte, from the
// generated Primitive packages and the generated Styled parts in the demo apps.
export default defineConfig({
  root,
  plugins: [vueSfcPlugin, svelte({ hot: false, configFile: false })],
  define: {
    __VUE_OPTIONS_API__: true,
    __VUE_PROD_DEVTOOLS__: false,
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: true,
  },
  esbuild: {
    jsx: "automatic",
    tsconfigRaw: JSON.stringify({ compilerOptions: { target: "ES2022", jsx: "automatic" } }),
  },
  cacheDir: path.join(temporaryRoot, "vite"),
  // The global setup writes the Astro and Svelte server fixtures to the temporary folder.
  server: { fs: { allow: [root, temporaryRoot] } },
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
      // One Vue copy for the Vue Primitive package and the Vue demo parts.
      {
        find: /^vue(\/server-renderer)?$/,
        replacement: path.join(root, "packages/vue/node_modules/vue$1"),
      },
      ...createSourceBackedRuntimeAliases(root),
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
      "react-dom/server.browser",
      "react/jsx-dev-runtime",
      "tailwind-variants",
      "vue",
      "vue/server-renderer",
      "svelte",
    ],
  },
  test: {
    include: ["scripts/portable-runtime/tests/chart-parity/*.browser.tsx"],
    globalSetup: [
      path.join(root, "scripts/portable-runtime/tests/chart-parity/server/global-setup.ts"),
    ],
    browser: {
      screenshotDirectory: path.join(temporaryRoot, "screenshots"),
      enabled: true,
      headless: true,
      instances: [{ browser: "chromium" }],
      provider: playwright({ launchOptions: { channel: "chrome" } }),
    },
  },
});
