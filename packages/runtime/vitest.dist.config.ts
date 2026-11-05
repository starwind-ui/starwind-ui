import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

import {
  internalPropertyPattern,
  planRuntimeInternalProperties,
} from "./build/mangle-internal-properties";
import {
  DIST_TEST_COPY_DIRECTORY,
  DIST_TEST_COPY_MANGLE_CACHE,
} from "./tests/build/build-dist-test-copy";

// tsup owns the esbuild copy that the build uses.
const { transform } = createRequire(createRequire(import.meta.url).resolve("tsup"))(
  "esbuild",
) as typeof import("esbuild");

const packageRoot = fileURLToPath(new URL(".", import.meta.url));
const sourceRoot = path.join(packageRoot, "src") + path.sep;
const testsRoot = path.join(packageRoot, "tests") + path.sep;
const copyRoot = path.join(packageRoot, DIST_TEST_COPY_DIRECTORY);
const mangleProps = internalPropertyPattern(
  planRuntimeInternalProperties(fileURLToPath(new URL("./tsconfig.json", import.meta.url))),
);

/**
 * Runs the Runtime browser tests against the output of the published build, so the private member
 * and internal property renames meet every scenario. Each source import in a test resolves to the
 * built copy of that file, so a test holds one set of module state. Each test file uses the short
 * property names of that build.
 */
export default defineConfig({
  plugins: [
    {
      name: "runtime-tests-use-built-copy",
      enforce: "pre",
      resolveId(id, importer) {
        if (!importer?.startsWith(testsRoot) || !id.startsWith(".")) return null;
        const resolved = path.resolve(path.dirname(importer), id);
        if (!resolved.startsWith(sourceRoot)) return null;
        const relative = resolved.slice(sourceRoot.length).replace(/\.ts$/, "");
        const candidates = [`${relative}.js`, path.join(relative, "index.js")];
        return candidates.map((file) => path.join(copyRoot, file)).find(existsSync) ?? null;
      },
      async transform(code, id) {
        const file = id.split("?")[0]!;
        if (!file.startsWith(testsRoot) || !file.endsWith(".ts")) return null;
        // Vitest loads the global setup through this pipeline, before the build has run.
        if (file.startsWith(path.join(testsRoot, "build") + path.sep)) return null;
        const mangleCache = JSON.parse(
          readFileSync(path.join(copyRoot, DIST_TEST_COPY_MANGLE_CACHE), "utf8"),
        ) as Record<string, string | false>;
        const result = await transform(code, {
          loader: "ts",
          mangleCache,
          mangleProps,
          sourcefile: file,
          sourcemap: true,
          target: "es2022",
        });
        return { code: result.code, map: result.map };
      },
    },
  ],
  test: {
    globalSetup: ["./tests/build/build-dist-test-copy.ts"],
    include: ["tests/**/*.browser.test.ts", "tests/**/*.browser.spec.ts"],
    name: "browser-dist",
    browser: {
      enabled: true,
      headless: true,
      provider: playwright({ launchOptions: { channel: "chromium" } }),
      instances: [{ browser: "chromium" }],
    },
  },
});
