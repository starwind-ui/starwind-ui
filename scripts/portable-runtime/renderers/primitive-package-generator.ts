import {
  getPrimitiveFrameworkAdapterTarget,
  resolvePrimitiveFrameworkAdapterTargetComponents,
  type PrimitiveFrameworkAdapterTarget,
} from "./framework-adapters/target-registry.js";
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
  const resolvedComponents = resolvePrimitiveFrameworkAdapterTargetComponents(target);
  const resolvedComponentSet = new Set(resolvedComponents);

  await targetRegistration.primitive.generatePackage({
    components: resolvedComponents,
    generatePrimitiveEntries: async ({ componentHeader, moduleHeader, outputRoot }) => {
      await Promise.all(
        getPrimitiveGeneratorEntries()
          .filter((entry) => resolvedComponentSet.has(entry.component))
          .map((entry) =>
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
