import path from "node:path";
import { fileURLToPath } from "node:url";

import { starwindStyledContracts } from "./contracts/styled/starwind.js";
import type { StyledAdapterContract } from "./contracts/styled/types.js";
import { formatGeneratedOutput as runFormatGeneratedOutput } from "./format-generated-output.js";
import {
  generateFrameworkPrimitiveWrappers,
  generateFrameworkStyledWrappers,
} from "./renderers/framework-wrapper-generator.js";
import type { GeneratePrimitiveWrappersForTargetOptions } from "./renderers/primitive-package-generator.js";
import { toPortablePath } from "./renderers/shared.js";

export const REPO_ROOT = process.cwd();
export const ASTRO_OUTPUT_DIR = "apps/demo/src/components/starwind-runtime";
export const ASTRO_PRIMITIVE_OUTPUT_DIR = "packages/astro/src";
export const ASTRO_PRIMITIVE_IMPORT_BASE = "@starwind-ui/astro";
export const GENERATED_BY = "scripts/portable-runtime/generate-astro-wrappers.ts";

export type GenerateAstroWrappersOptions = {
  astroOutputDir?: string;
  contracts?: StyledAdapterContract[];
  primitiveOutputDir?: string;
  repoRoot?: string;
  styledOutputDir?: string;
};

export type GenerateAstroPrimitiveWrappersOptions = {
  generatedBy?: GeneratePrimitiveWrappersForTargetOptions["generatedBy"];
  outputDir?: string;
  repoRoot?: string;
};

export type GenerateStarwindAstroWrappersOptions = {
  contracts?: StyledAdapterContract[];
  generatedBy?: string;
  outputDir?: string;
  primitiveImportBase?: string;
  primitiveOutputDir?: string;
  repoRoot?: string;
};

export async function generateAstroWrappers(
  options: GenerateAstroWrappersOptions = {},
): Promise<void> {
  const styledOutputDir = options.styledOutputDir ?? options.astroOutputDir ?? ASTRO_OUTPUT_DIR;
  const usesDefaultStyledOutput = styledOutputDir === ASTRO_OUTPUT_DIR;
  const primitiveOutputDir =
    options.primitiveOutputDir ??
    (usesDefaultStyledOutput
      ? ASTRO_PRIMITIVE_OUTPUT_DIR
      : getDefaultPrimitiveOutputDir(styledOutputDir));
  const primitiveImportBase =
    options.primitiveOutputDir || !usesDefaultStyledOutput
      ? undefined
      : ASTRO_PRIMITIVE_IMPORT_BASE;

  await generateAstroPrimitiveWrappers({
    outputDir: primitiveOutputDir,
    repoRoot: options.repoRoot,
  });

  await generateStarwindAstroWrappers({
    contracts: options.contracts,
    outputDir: styledOutputDir,
    primitiveImportBase,
    primitiveOutputDir,
    repoRoot: options.repoRoot,
  });
}

export async function generateAstroPrimitiveWrappers(
  options: GenerateAstroPrimitiveWrappersOptions = {},
): Promise<void> {
  const outputRoot = path.join(
    options.repoRoot ?? REPO_ROOT,
    options.outputDir ?? ASTRO_PRIMITIVE_OUTPUT_DIR,
  );

  await generateFrameworkPrimitiveWrappers("astro", {
    generatedBy: options.generatedBy ?? GENERATED_BY,
    outputRoot,
  });
}

export async function generateStarwindAstroWrappers(
  options: GenerateStarwindAstroWrappersOptions = {},
): Promise<void> {
  const styledOutputDir = options.outputDir ?? ASTRO_OUTPUT_DIR;
  const usesDefaultStyledOutput = styledOutputDir === ASTRO_OUTPUT_DIR;
  const primitiveOutputDir =
    options.primitiveOutputDir ??
    (usesDefaultStyledOutput
      ? ASTRO_PRIMITIVE_OUTPUT_DIR
      : getDefaultPrimitiveOutputDir(styledOutputDir));
  const outputRoot = path.join(options.repoRoot ?? REPO_ROOT, styledOutputDir);
  const primitiveOutputRoot = path.join(options.repoRoot ?? REPO_ROOT, primitiveOutputDir);
  const primitiveImportBase =
    options.primitiveImportBase ??
    (options.primitiveOutputDir || !usesDefaultStyledOutput
      ? undefined
      : ASTRO_PRIMITIVE_IMPORT_BASE);

  await generateFrameworkStyledWrappers("astro", {
    contracts: options.contracts ?? starwindStyledContracts,
    generatedBy: options.generatedBy ?? GENERATED_BY,
    outputRoot,
    primitiveImportBase,
    primitiveOutputRoot,
  });
}

if (isDirectExecution()) {
  await generateAstroWrappers();
  // Local generation prepares the files that get checked in and published; CLI installs should
  // copy those prepared artifacts instead of running a formatter in the user's project.
  await runFormatGeneratedOutput([ASTRO_PRIMITIVE_OUTPUT_DIR, ASTRO_OUTPUT_DIR], REPO_ROOT);
}

function isDirectExecution(): boolean {
  return (
    Boolean(process.argv[1]) && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
  );
}

function getDefaultPrimitiveOutputDir(styledOutputDir: string): string {
  return toPortablePath(path.join(styledOutputDir, "primitives/astro"));
}
