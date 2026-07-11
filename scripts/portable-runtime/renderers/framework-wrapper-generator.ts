import {
  getPrimitiveFrameworkAdapterTarget,
  type PrimitiveFrameworkAdapterTarget,
} from "./framework-adapters/index.js";
import {
  type GeneratePrimitiveWrappersForTargetOptions,
  generatePrimitiveWrappersForTarget,
} from "./primitive-package-generator.js";

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

  await styledAdapter.write(options);
}
