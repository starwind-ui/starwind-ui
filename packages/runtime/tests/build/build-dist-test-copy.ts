import { readdirSync } from "node:fs";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { build, type Options } from "tsup";

import runtimeBuild from "../../tsup.config";

const packageRoot = fileURLToPath(new URL("../..", import.meta.url));

export const DIST_TEST_COPY_DIRECTORY = "node_modules/.cache/runtime-dist-test-copy";
export const DIST_TEST_COPY_MANGLE_CACHE = "mangle-cache.json";

/**
 * A Vitest global setup. It runs the published Runtime build with one entry for each source file, so
 * a test that imports `src/internal/floating-portal` and `src/components/dialog` reaches the same
 * chunks. The published `dist` hides internal modules, and a source copy next to `dist` holds a
 * second set of module state. The build also saves its property names, because tests call internal
 * functions and must use the short names that those functions read.
 */
export default async function buildDistTestCopy(): Promise<void> {
  const outDir = `${packageRoot}${DIST_TEST_COPY_DIRECTORY}`;
  await rm(outDir, { force: true, recursive: true });
  await mkdir(outDir, { recursive: true });
  const options = runtimeBuild as Options;
  await build({
    ...options,
    clean: false,
    config: false,
    dts: false,
    entry: Object.fromEntries(
      readdirSync(`${packageRoot}src`, { recursive: true, encoding: "utf8" })
        .filter((file) => file.endsWith(".ts"))
        .map((file) => [file.replace(/\.ts$/, ""), `src/${file}`]),
    ),
    esbuildOptions(esbuildOptions, context) {
      options.esbuildOptions?.(esbuildOptions, context);
      esbuildOptions.mangleCache = {};
    },
    esbuildPlugins: [
      ...(options.esbuildPlugins ?? []),
      {
        name: "save-mangle-cache",
        setup(pluginBuild) {
          pluginBuild.onEnd((result) =>
            writeFile(
              `${outDir}/${DIST_TEST_COPY_MANGLE_CACHE}`,
              JSON.stringify(result.mangleCache ?? {}),
            ),
          );
        },
      },
    ],
    outDir,
    silent: true,
    sourcemap: false,
  });
}
