import {
  getPrimitiveFrameworkAdapterTarget,
  type PrimitiveFrameworkAdapterTarget,
} from "./framework-adapters/index.js";
import { getPrimitiveGeneratorEntries } from "./primitive-generator-registry.js";

export type GeneratePrimitiveWrappersForTargetOptions = {
  generatedBy: string;
  outputRoot: string;
};

export async function generatePrimitiveWrappersForTarget(
  target: PrimitiveFrameworkAdapterTarget,
  { generatedBy, outputRoot }: GeneratePrimitiveWrappersForTargetOptions,
): Promise<void> {
  const targetRegistration = getPrimitiveFrameworkAdapterTarget(target);

  await targetRegistration.primitive.generatePackage({
    generatePrimitiveEntries: async ({ componentHeader, moduleHeader, outputRoot }) => {
      await Promise.all(
        getPrimitiveGeneratorEntries().map((entry) =>
          entry.generateTarget({
            componentHeader,
            moduleHeader,
            outputRoot,
            target,
          }),
        ),
      );
    },
    generatedBy,
    outputRoot,
  });
}
