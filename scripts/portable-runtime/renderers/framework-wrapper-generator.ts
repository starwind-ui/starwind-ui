import { cp, mkdir, mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  getPrimitiveFrameworkAdapterTarget,
  type PrimitiveFrameworkAdapterTarget,
} from "./framework-adapters/index.js";
import {
  type GeneratePrimitiveWrappersForTargetOptions,
  generatePrimitiveWrappersForTarget,
} from "./primitive-package-generator.js";
import { assertStyledContractFiles } from "./styled-output-model/contract-guard.js";

export type GenerateFrameworkPrimitiveWrappersOptions = {
  generatedBy: GeneratePrimitiveWrappersForTargetOptions["generatedBy"];
  outputRoot: string;
};

export type GenerateFrameworkStyledWrappersOptions = {
  contracts: Parameters<
    NonNullable<ReturnType<typeof getPrimitiveFrameworkAdapterTarget>["styled"]>["write"]
  >[0]["contracts"];
  generatedBy: string;
  outputRoot: string;
  primitiveImportBase?: string;
  primitiveOutputRoot: string;
  roots?: readonly string[];
};

export async function generateFrameworkPrimitiveWrappers(
  target: PrimitiveFrameworkAdapterTarget,
  options: GenerateFrameworkPrimitiveWrappersOptions,
): Promise<void> {
  await generatePrimitiveWrappersForTarget(target, {
    generatedBy: options.generatedBy,
    outputRoot: options.outputRoot,
  });
}

export async function generateFrameworkStyledWrappers(
  target: PrimitiveFrameworkAdapterTarget,
  options: GenerateFrameworkStyledWrappersOptions,
): Promise<void> {
  const targetRegistration = getPrimitiveFrameworkAdapterTarget(target);
  const styledAdapter = targetRegistration.styled;

  if (!styledAdapter) {
    throw new Error(`Framework Adapter target "${target}" does not expose styled generation.`);
  }

  // Inspect complete staged output before replacing a consumer's generated files.
  const staged = await mkdtemp(path.join(os.tmpdir(), "starwind-styled-contract-"));
  try {
    await styledAdapter.write({
      ...options,
      outputRoot: staged,
      // Keep local imports relative to the final output without converting them
      // into a package import override (which also rewrites Runtime imports).
      primitiveOutputRoot: path.resolve(
        staged,
        path.relative(options.outputRoot, options.primitiveOutputRoot),
      ),
    });
    const files: { relativePath: string; content: string }[] = [];
    async function read(directory: string, relative = ""): Promise<void> {
      for (const entry of await readdir(directory, { withFileTypes: true })) {
        const name = path.posix.join(relative, entry.name);
        const full = path.join(directory, entry.name);
        if (entry.isDirectory()) await read(full, name);
        else if (entry.isFile())
          files.push({ relativePath: name, content: await readFile(full, "utf8") });
      }
    }
    await read(staged);
    assertStyledContractFiles(options.contracts, files, target);
    await mkdir(options.outputRoot, { recursive: true });
    for (const entry of await readdir(staged)) {
      const destination = path.join(options.outputRoot, entry);
      await rm(destination, { recursive: true, force: true });
      await cp(path.join(staged, entry), destination, { recursive: true });
    }
  } finally {
    await rm(staged, { recursive: true, force: true });
  }
}
