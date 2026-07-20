import path from "node:path";
import { fileURLToPath } from "node:url";

import ts from "typescript";
import { defineConfig } from "vitest/config";

import { compileVueSfc } from "../tsup.config.js";
import { vuePrimitiveComponents } from "../../../scripts/portable-runtime/renderers/framework-adapters/vue/inventory.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const vueSubpathPattern = vuePrimitiveComponents.map(escapeRegExp).join("|");
const sourceResolve = {
  alias: [
    {
      find: new RegExp(`^@starwind-ui/vue/(${vueSubpathPattern})$`),
      replacement: path.join(repoRoot, "packages/vue/src/$1/index.ts"),
    },
    {
      find: "@starwind-ui/vue",
      replacement: path.join(repoRoot, "packages/vue/src/index.ts"),
    },
    {
      find: /^@starwind-ui\/runtime\/theme$/,
      replacement: path.join(repoRoot, "packages/runtime/src/theme/theme.ts"),
    },
    {
      find: /^@starwind-ui\/runtime\/(.+)$/,
      replacement: path.join(repoRoot, "packages/runtime/src/components/$1/index.ts"),
    },
    {
      find: "@starwind-ui/runtime",
      replacement: path.join(repoRoot, "packages/runtime/src/index.ts"),
    },
  ],
};

const vueSfcPlugin = {
  enforce: "pre",
  name: "starwind-vue-package-test-sfc",
  async transform(source: string, id: string) {
    if (!id.split("?")[0]?.endsWith(".vue")) return;
    return ts.transpileModule(compileVueSfc(source, id), {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        sourceMap: true,
        target: ts.ScriptTarget.ES2022,
      },
      fileName: id,
    }).outputText;
  },
};

export default defineConfig({
  define: {
    __VUE_OPTIONS_API__: true,
    __VUE_PROD_DEVTOOLS__: false,
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: true,
  },
  root: repoRoot,
  test: {
    projects: [
      {
        plugins: [vueSfcPlugin],
        resolve: sourceResolve,
        test: {
          environment: "node",
          include: [
            "packages/vue/tests/theme/**/*.test.ts",
            "packages/vue/tests/**/*.ssr.test.ts",
            "packages/vue/tests/integration/**/*.test.ts",
          ],
          exclude: ["packages/vue/tests/**/*.browser.test.ts"],
          name: "source-ssr",
        },
      },
      {
        test: {
          environment: "node",
          include: ["packages/vue/tests/release/**/*.test.ts"],
          name: "release-package",
        },
      },
    ],
  },
});

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
