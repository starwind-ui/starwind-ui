import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { defineConfig } from "tsup";

import { collectRegistryPackageRequirements } from "./src/offline-requirements.js";

// The offline requirements entry carries the bundled registry's package list, so the offline kit
// release can compare the published CLI with the checkout without the 2.5 MB registry itself.
function registryRequirements(): string[] {
  const requirements = new Set<string>();
  for (const file of ["bundled-registry.json", "primitive-vendoring-artifacts.json"]) {
    const registryFile = fileURLToPath(new URL(`./src/registry/${file}`, import.meta.url));
    const document: unknown = JSON.parse(readFileSync(registryFile, "utf8"));
    collectRegistryPackageRequirements(document, requirements);
  }
  return [...requirements].sort();
}

export default defineConfig((options) => ({
  entry: ["src/index.ts", "src/offline-requirements.ts"],
  format: ["esm"],
  // Each entry bundles its own copy, so the small offline requirements entry stays separate.
  splitting: false,
  dts: true,
  clean: true,
  sourcemap: Boolean(options.watch),
  minify: !options.watch,
  keepNames: true,
  target: "esnext",
  outDir: "dist",
  define: {
    __STARWIND_OFFLINE_REGISTRY_REQUIREMENTS__: JSON.stringify(registryRequirements()),
  },
}));
