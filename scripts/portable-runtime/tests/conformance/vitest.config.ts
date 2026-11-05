import { realpathSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import ts from "typescript";
import { defineConfig } from "vitest/config";
import { compileVueSfc } from "../../../../packages/vue/tsup.config.js";

const root = fileURLToPath(new URL("../../../../", import.meta.url));
const home = path.join(root, "scripts/portable-runtime/tests/conformance");
const { transform: compileAstro } = createRequire(
  realpathSync(path.join(root, "apps/demo/node_modules/astro/package.json")),
)("@astrojs/compiler-rs") as {
  transform(source: string, options: Record<string, unknown>): { code: string };
};

function transpile(source: string, fileName: string) {
  return ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
    fileName,
  }).outputText;
}

export default defineConfig({
  root,
  test: {
    projects: [
      {
        esbuild: {
          jsx: "automatic",
          tsconfigRaw: JSON.stringify({ compilerOptions: { target: "ES2022", jsx: "automatic" } }),
        },
        plugins: [
          svelte({ configFile: false, compilerOptions: { dev: false } }),
          {
            name: "emission-sfc-and-astro",
            enforce: "pre",
            async transform(source: string, id: string) {
              const file = id.split("?")[0]!;
              if (file.endsWith(".vue")) return transpile(compileVueSfc(source, file), file);
              if (!file.endsWith(".astro")) return;
              // Astro's own compiler, so the output matches the runtime it imports.
              const result = compileAstro(source, {
                filename: file,
                internalURL: "astro/compiler-runtime",
                sourcemap: "external",
              });
              return transpile(result.code, file.replace(/\.astro$/, ".ts"));
            },
          },
        ],
        resolve: {
          alias: [
            {
              find: /^astro\/compiler-runtime$/,
              replacement: path.join(home, "emission/astro-compiler-runtime.ts"),
            },
            {
              find: "astro:assets",
              replacement: path.join(home, "emission/astro-assets-stub.ts"),
            },
            {
              find: /^react(\/.*)?$/,
              replacement: path.join(root, "packages/react/node_modules/react$1"),
            },
            {
              find: /^react-dom(\/.*)?$/,
              replacement: path.join(root, "packages/react/node_modules/react-dom$1"),
            },
            {
              find: /^@starwind-ui\/runtime\/(.+)$/,
              replacement: path.join(root, "packages/runtime/src/components/$1/index.ts"),
            },
            ...["astro", "react", "vue", "svelte"].map((target) => ({
              find: new RegExp(`^@starwind-ui/${target}/([^/]+)$`),
              replacement: path.join(root, `packages/${target}/src/$1/index.ts`),
            })),
          ],
        },
        test: {
          name: "conformance",
          root,
          environment: "node",
          include: [
            "scripts/portable-runtime/tests/conformance/conformance.browser.ts",
            "scripts/portable-runtime/tests/conformance/emission/emission.check.ts",
          ],
          globalSetup: [path.join(home, "global-setup.ts")],
          // Each browser scenario has its own context, so scenarios can run at the same time. A
          // failed known-defect entry waits for the poll timeout, so the budget stays small.
          testTimeout: 60_000,
          hookTimeout: 120_000,
          maxConcurrency: 8,
          server: { deps: { inline: [/packages\/(astro|react|vue|svelte)\/src/, /svelte/] } },
        },
      },
    ],
  },
});
