#!/usr/bin/env node
import { mkdir, rm } from "node:fs/promises";
// Builds the conformance fixture pages from package source. React, Vue, and Svelte share one Vite
// build in development mode, so dev-only errors and warnings reach the suite. Astro pages use Astro's
// own build. It runs from apps/demo, because Astro resolves its entry points from the working folder.
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import ts from "typescript";
import { build as viteBuild } from "vite";
import { compileVueSfc } from "../../../../packages/vue/tsup.config.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../../../..");
const fixtures = path.join(here, "fixtures");

const runtimeAliases = [
  {
    find: /^@starwind-ui\/runtime\/init-starwind$/,
    replacement: path.join(root, "packages/runtime/src/init-starwind.ts"),
  },
  {
    find: /^@starwind-ui\/runtime\/theme$/,
    replacement: path.join(root, "packages/runtime/src/theme/theme.ts"),
  },
  {
    find: /^@starwind-ui\/runtime\/(.+)$/,
    replacement: path.join(root, "packages/runtime/src/components/$1/index.ts"),
  },
];

function adapterAliases(target) {
  return [
    {
      find: new RegExp(`^@starwind-ui/${target}/(.+)$`),
      replacement: path.join(root, `packages/${target}/src/$1/index.ts`),
    },
  ];
}

async function buildFrameworkPages(outDir) {
  await viteBuild({
    configFile: false,
    root: fixtures,
    logLevel: "warn",
    mode: "development",
    define: {
      __VUE_OPTIONS_API__: true,
      __VUE_PROD_DEVTOOLS__: false,
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: true,
    },
    esbuild: {
      jsx: "automatic",
      jsxDev: false,
      tsconfigRaw: JSON.stringify({ compilerOptions: { target: "ES2022", jsx: "automatic" } }),
    },
    plugins: [
      svelte({ configFile: false, compilerOptions: { dev: true } }),
      {
        name: "conformance-vue",
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
          find: /^@conformance\/styled-react\/(.+)$/,
          replacement: path.join(root, "apps/react-demo/src/components/starwind-runtime/$1"),
        },
        {
          find: /^@conformance\/styled-vue\/(.+)$/,
          replacement: path.join(root, "apps/vue-demo/src/components/starwind-runtime/$1"),
        },
        {
          find: /^@conformance\/styled-svelte\/(.+)$/,
          replacement: path.join(root, "apps/svelte-demo/src/lib/starwind-runtime/$1"),
        },
        ...runtimeAliases,
        ...["react", "vue", "svelte"].flatMap(adapterAliases),
      ],
      dedupe: ["vue", "svelte"],
    },
    build: {
      outDir,
      emptyOutDir: true,
      minify: false,
      chunkSizeWarningLimit: 100_000,
      target: "es2022",
      reportCompressedSize: false,
      rollupOptions: {
        onwarn(warning, warn) {
          if (warning.code !== "MODULE_LEVEL_DIRECTIVE" && warning.code !== "SOURCEMAP_ERROR")
            warn(warning);
        },
        input: ["react", "vue", "svelte"].map((name) => path.join(fixtures, `${name}.html`)),
      },
    },
  });
}

async function buildAstroPages(outDir) {
  const demo = path.join(root, "apps/demo");
  const require = createRequire(path.join(demo, "package.json"));
  const { build } = await import(require.resolve("astro"));
  process.chdir(demo);
  await build({
    configFile: false,
    root: demo,
    srcDir: path.join(fixtures, "astro"),
    outDir,
    base: "/astro",
    logLevel: "error",
    devToolbar: { enabled: false },
    vite: {
      resolve: {
        alias: [
          {
            find: /^@conformance\/styled-astro\/(.+)$/,
            replacement: path.join(demo, "src/components/starwind-runtime/$1"),
          },
          ...runtimeAliases,
          ...adapterAliases("astro"),
        ],
      },
    },
  });
}

const outDir = process.argv[2];
if (!outDir) throw new Error("Usage: build-fixtures.mjs <output folder>");
const started = Date.now();
await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });
process.env.NODE_ENV = "development";
await buildFrameworkPages(path.join(outDir, "app"));
await buildAstroPages(path.join(outDir, "astro"));
console.log(`[conformance] fixtures built in ${Date.now() - started} ms`);
