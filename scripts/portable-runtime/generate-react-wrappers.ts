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
export const REACT_OUTPUT_DIR = "apps/react-demo/src/components/starwind-runtime";
export const REACT_PRIMITIVE_OUTPUT_DIR = "packages/react/src";
export const REACT_PRIMITIVE_IMPORT_BASE = "@starwind-ui/react";
export const GENERATED_BY = "scripts/portable-runtime/generate-react-wrappers.ts";

export type GenerateReactWrappersOptions = {
  contracts?: StyledAdapterContract[];
  primitiveOutputDir?: string;
  reactOutputDir?: string;
  repoRoot?: string;
  styledOutputDir?: string;
};

export type GenerateReactPrimitiveWrappersOptions = {
  generatedBy?: GeneratePrimitiveWrappersForTargetOptions["generatedBy"];
  outputDir?: string;
  repoRoot?: string;
};

export type GenerateStarwindReactWrappersOptions = {
  contracts?: StyledAdapterContract[];
  generatedBy?: string;
  outputDir?: string;
  primitiveImportBase?: string;
  primitiveOutputDir?: string;
  repoRoot?: string;
};

export async function generateReactWrappers(
  options: GenerateReactWrappersOptions = {},
): Promise<void> {
  const styledOutputDir = options.styledOutputDir ?? options.reactOutputDir ?? REACT_OUTPUT_DIR;
  const usesDefaultStyledOutput = styledOutputDir === REACT_OUTPUT_DIR;
  const primitiveOutputDir =
    options.primitiveOutputDir ??
    (usesDefaultStyledOutput
      ? REACT_PRIMITIVE_OUTPUT_DIR
      : getDefaultPrimitiveOutputDir(styledOutputDir));
  const primitiveImportBase =
    options.primitiveOutputDir || !usesDefaultStyledOutput
      ? undefined
      : REACT_PRIMITIVE_IMPORT_BASE;

  await generateReactPrimitiveWrappers({
    outputDir: primitiveOutputDir,
    repoRoot: options.repoRoot,
  });

  await generateStarwindReactWrappers({
    contracts: options.contracts,
    outputDir: styledOutputDir,
    primitiveImportBase,
    primitiveOutputDir,
    repoRoot: options.repoRoot,
  });
}

export async function generateReactPrimitiveWrappers(
  options: GenerateReactPrimitiveWrappersOptions = {},
): Promise<void> {
  const outputRoot = path.join(
    options.repoRoot ?? REPO_ROOT,
    options.outputDir ?? REACT_PRIMITIVE_OUTPUT_DIR,
  );

  await generateFrameworkPrimitiveWrappers("react", {
    generatedBy: options.generatedBy ?? GENERATED_BY,
    outputRoot,
  });
}

export async function generateStarwindReactWrappers(
  options: GenerateStarwindReactWrappersOptions = {},
): Promise<void> {
  const styledOutputDir = options.outputDir ?? REACT_OUTPUT_DIR;
  const usesDefaultStyledOutput = styledOutputDir === REACT_OUTPUT_DIR;
  const primitiveOutputDir =
    options.primitiveOutputDir ??
    (usesDefaultStyledOutput
      ? REACT_PRIMITIVE_OUTPUT_DIR
      : getDefaultPrimitiveOutputDir(styledOutputDir));
  const outputRoot = path.join(options.repoRoot ?? REPO_ROOT, styledOutputDir);
  const primitiveOutputRoot = path.join(options.repoRoot ?? REPO_ROOT, primitiveOutputDir);
  const primitiveImportBase =
    options.primitiveImportBase ??
    (options.primitiveOutputDir || !usesDefaultStyledOutput
      ? undefined
      : REACT_PRIMITIVE_IMPORT_BASE);

  await generateFrameworkStyledWrappers("react", {
    contracts: options.contracts ?? starwindStyledContracts,
    generatedBy: options.generatedBy ?? GENERATED_BY,
    outputRoot,
    primitiveImportBase,
    primitiveOutputRoot,
  });
}

if (isDirectExecution()) {
  await generateReactWrappers();
  // Local generation prepares the files that get checked in and published; CLI installs should
  // copy those prepared artifacts instead of running a formatter in the user's project.
  await runFormatGeneratedOutput([REACT_PRIMITIVE_OUTPUT_DIR, REACT_OUTPUT_DIR], REPO_ROOT);
}

function isDirectExecution(): boolean {
  return (
    Boolean(process.argv[1]) && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
  );
}

function getDefaultPrimitiveOutputDir(styledOutputDir: string): string {
  return toPortablePath(path.join(styledOutputDir, "primitives/react"));
}
