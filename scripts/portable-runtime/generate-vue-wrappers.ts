import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { format as formatWithPrettier, resolveConfig as resolvePrettierConfig } from "prettier";

import { formatGeneratedOutput as runFormatGeneratedOutput } from "./format-generated-output.js";
import { starwindStyledContracts } from "./contracts/styled/starwind.js";
import type { StyledAdapterContract } from "./contracts/styled/types.js";
import {
  generateFrameworkPrimitiveWrappers,
  generateFrameworkStyledWrappers,
} from "./renderers/framework-wrapper-generator.js";
import type { GeneratePrimitiveWrappersForTargetOptions } from "./renderers/primitive-package-generator.js";

export const REPO_ROOT = process.cwd();
export const VUE_PRIMITIVE_OUTPUT_DIR = "packages/vue/src";
export const VUE_STYLED_OUTPUT_DIR = "apps/vue-demo/src/components/starwind-runtime";
export const VUE_PRIMITIVE_IMPORT_BASE = "@starwind-ui/vue";
export const GENERATED_BY = "scripts/portable-runtime/generate-vue-wrappers.ts";

export type GenerateVuePrimitiveWrappersOptions = {
  generatedBy?: GeneratePrimitiveWrappersForTargetOptions["generatedBy"];
  outputDir?: string;
  repoRoot?: string;
};

export type GenerateVueWrappersOptions = {
  contracts?: StyledAdapterContract[];
  primitiveOutputDir?: string;
  repoRoot?: string;
  styledOutputDir?: string;
};

export type GenerateStarwindVueWrappersOptions = {
  contracts?: StyledAdapterContract[];
  generatedBy?: string;
  outputDir?: string;
  primitiveImportBase?: string;
  primitiveOutputDir?: string;
  repoRoot?: string;
};

export async function generateVuePrimitiveWrappers(
  options: GenerateVuePrimitiveWrappersOptions = {},
): Promise<void> {
  const outputRoot = path.join(
    options.repoRoot ?? REPO_ROOT,
    options.outputDir ?? VUE_PRIMITIVE_OUTPUT_DIR,
  );
  await generateFrameworkPrimitiveWrappers("vue", {
    generatedBy: options.generatedBy ?? GENERATED_BY,
    outputRoot,
  });
}

export async function generateVueWrappers(options: GenerateVueWrappersOptions = {}): Promise<void> {
  await generateVuePrimitiveWrappers({
    outputDir: options.primitiveOutputDir,
    repoRoot: options.repoRoot,
  });
  await generateStarwindVueWrappers({
    contracts: options.contracts,
    outputDir: options.styledOutputDir,
    primitiveImportBase: VUE_PRIMITIVE_IMPORT_BASE,
    primitiveOutputDir: options.primitiveOutputDir,
    repoRoot: options.repoRoot,
  });
}

export async function generateStarwindVueWrappers(
  options: GenerateStarwindVueWrappersOptions = {},
): Promise<void> {
  const repoRoot = options.repoRoot ?? REPO_ROOT;
  const outputDir = options.outputDir ?? VUE_STYLED_OUTPUT_DIR;
  const primitiveOutputDir = options.primitiveOutputDir ?? VUE_PRIMITIVE_OUTPUT_DIR;

  await generateFrameworkStyledWrappers("vue", {
    contracts: options.contracts ?? starwindStyledContracts,
    generatedBy: options.generatedBy ?? GENERATED_BY,
    outputRoot: path.join(repoRoot, outputDir),
    primitiveImportBase: options.primitiveImportBase ?? VUE_PRIMITIVE_IMPORT_BASE,
    primitiveOutputRoot: path.join(repoRoot, primitiveOutputDir),
  });
}

if (isDirectExecution()) {
  await generateVueWrappers();
  await runFormatGeneratedOutput([VUE_PRIMITIVE_OUTPUT_DIR, VUE_STYLED_OUTPUT_DIR], REPO_ROOT);
  await formatVueTypeScriptOutput(path.join(REPO_ROOT, VUE_PRIMITIVE_OUTPUT_DIR));
}

function isDirectExecution(): boolean {
  return (
    Boolean(process.argv[1]) && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
  );
}

async function formatVueTypeScriptOutput(outputRoot: string): Promise<void> {
  const files = await listTypeScriptFiles(outputRoot);
  const prettierConfig =
    (await resolvePrettierConfig(path.join(REPO_ROOT, "prettier.config.mjs"))) ?? {};

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
