import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { format as formatWithPrettier, resolveConfig as resolvePrettierConfig } from "prettier";

import { getPrimitiveFrameworkAdapterTarget } from "./renderers/framework-adapters/target-registry.js";
import { getPrimitiveGeneratorEntries } from "./renderers/primitive-generator-registry.js";

export const SVELTE_PRIMITIVE_OUTPUT_DIR = "packages/svelte/src";
export const GENERATED_BY = "scripts/portable-runtime/generate-svelte-wrappers.ts";

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
  const components = ["button", "checkbox", "select", "accordion", "dialog", "slider"] as const;

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
  await formatSvelteTypeScriptOutput(outputRoot, repoRoot);
}

if (isDirectExecution()) await generateSveltePrimitiveWrappers();

function isDirectExecution(): boolean {
  return (
    Boolean(process.argv[1]) && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
  );
}

async function formatSvelteTypeScriptOutput(outputRoot: string, repoRoot: string): Promise<void> {
  const files = await listTypeScriptFiles(outputRoot);
  const prettierConfig =
    (await resolvePrettierConfig(path.join(repoRoot, "prettier.config.mjs"))) ?? {};

  await Promise.all(
    files.map(async (file) => {
      const source = await readFile(file, "utf8");
      const formatted = await formatWithPrettier(source, {
        ...prettierConfig,
        filepath: file,
      });
      if (formatted !== source) await writeFile(file, formatted, "utf8");
    }),
  );
}

async function listTypeScriptFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const candidate = path.join(directory, entry.name);
      if (entry.isDirectory()) return listTypeScriptFiles(candidate);
      return entry.isFile() && entry.name.endsWith(".ts") ? [candidate] : [];
    }),
  );
  return files.flat().sort();
}
