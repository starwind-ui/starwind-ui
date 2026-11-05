import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

import {
  internalPropertyPattern,
  planRuntimeInternalProperties,
} from "./build/mangle-internal-properties";

// tsup owns the esbuild copy that the build uses.
const { transform } = createRequire(createRequire(import.meta.url).resolve("tsup"))(
  "esbuild",
) as typeof import("esbuild");

const plan = planRuntimeInternalProperties(
  fileURLToPath(new URL("./tsconfig.json", import.meta.url)),
);
const mangleProps = internalPropertyPattern(plan);
const mangleCache = Object.fromEntries(plan.names.map((name, index) => [name, `$${index}`]));

/**
 * Runs every Runtime browser test with the internal property rename applied to source and tests, so
 * the rename meets each scenario. One module graph stays in play, so module state is not duplicated.
 */
export default defineConfig({
  plugins: [
    {
      name: "runtime-internal-property-rename",
      enforce: "pre",
      async transform(code, id) {
        const file = id.split("?")[0]!;
        if (!file.endsWith(".ts") || file.includes("node_modules")) return null;
        if (
          !file.includes("/packages/runtime/src/") &&
          !file.includes("/packages/runtime/tests/")
        ) {
          return null;
        }
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
    include: ["tests/**/*.browser.test.ts", "tests/**/*.browser.spec.ts"],
    name: "browser-mangled",
    browser: {
      enabled: true,
      headless: true,
      provider: playwright({ launchOptions: { channel: "chromium" } }),
      instances: [{ browser: "chromium" }],
    },
  },
});
