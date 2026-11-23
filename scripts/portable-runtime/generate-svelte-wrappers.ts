import path from "node:path";
import { fileURLToPath } from "node:url";

import { formatGeneratedOutput } from "./format-generated-output.js";
import { SVELTE_PACKAGE_COMPONENTS } from "./renderers/framework-adapters/svelte/inventory.js";
import { getPrimitiveFrameworkAdapterTarget } from "./renderers/framework-adapters/target-registry.js";
import { getPrimitiveGeneratorEntries } from "./renderers/primitive-generator-registry.js";

export const SVELTE_PRIMITIVE_OUTPUT_DIR = "packages/svelte/src";
export const GENERATED_BY = "scripts/portable-runtime/generate-svelte-wrappers.ts";
const CHECKOUT_ROOT = fileURLToPath(new URL("../..", import.meta.url));

export type GenerateSveltePrimitiveWrappersOptions = {
  generatedBy?: string;
  outputRoot?: string;
  repoRoot?: string;
};

export async function generateSveltePrimitiveWrappers(
  options: GenerateSveltePrimitiveWrappersOptions = {},
): Promise<void> {
  const repoRoot = options.repoRoot ?? process.cwd();
  const outputRoot = options.outputRoot ?? path.join(repoRoot, SVELTE_PRIMITIVE_OUTPUT_DIR);
  const registration = getPrimitiveFrameworkAdapterTarget("svelte");
  const components = SVELTE_PACKAGE_COMPONENTS;

  await registration.primitive.generatePackage({
    components,
    generatePrimitiveEntries: async ({ componentHeader, moduleHeader, outputRoot }) => {
      const entries = getPrimitiveGeneratorEntries();
      for (const component of components) {
        const entry = entries.find((candidate) => candidate.component === component);
        if (!entry) throw new Error(`${component} Primitive generator entry is missing.`);
        await entry.generateTarget({
          componentHeader,
          moduleHeader,
          outputRoot,
          target: "svelte",
        });
      }
    },
    generatedBy: options.generatedBy ?? GENERATED_BY,
    outputRoot,
  });
  // Format from this checkout: an output repoRoot can be a bare folder with no formatter install.
  await formatGeneratedOutput([outputRoot], CHECKOUT_ROOT);
}

if (isDirectExecution()) await generateSveltePrimitiveWrappers();

function isDirectExecution(): boolean {
  return (
    Boolean(process.argv[1]) && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
  );
}
