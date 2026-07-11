import type { PrimitiveGeneratorRegistryEntry } from "./primitive-generator-types.js";
import { getManualHelperPrimitiveInventoryEntries } from "./primitive-inventory.js";
import { createManualPrimitiveGeneratorEntry } from "./primitive-route-free-generator.js";

export const manualPrimitiveGeneratorEntries = getManualHelperPrimitiveInventoryEntries().map(
  (entry) =>
    createManualPrimitiveGeneratorEntry({
      component: entry.component,
      reason: entry.generation.reason,
    }),
) satisfies readonly PrimitiveGeneratorRegistryEntry[];
