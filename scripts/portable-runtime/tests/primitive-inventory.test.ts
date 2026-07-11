import { describe, expect, it } from "vitest";

import { runtimeAdapterContracts } from "../contracts/primitive/representatives.js";
import { loadPrimitiveVersionManifest } from "../generate-cli-registry.js";
import { primitiveGeneratorRegistry } from "../renderers/primitive-generator-registry.js";
import {
  PRIMITIVE_COMPONENTS,
  PRIMITIVE_HELPER_EXPORTS,
  renderPrimitiveIndex,
} from "../renderers/primitive-index.js";
import {
  getManualHelperPrimitiveInventoryEntries,
  getPrimitiveInventoryEntries,
  getPrimitiveInventoryEntry,
  getPrimitivePackageExportNames,
  getPrimitiveRuntimeComponentNames,
  getPrimitiveRuntimeFacadeTypeNames,
  getPrimitiveRuntimeFacadeValueNames,
  getPrimitiveVendoringContracts,
  getRuntimeAdapterPrimitiveInventoryEntries,
} from "../renderers/primitive-inventory.js";

describe("primitive inventory", () => {
  it("drives primitive generation, package exports, helper facades, Runtime facades, and vendoring facts", async () => {
    const entries = getPrimitiveInventoryEntries();
    const runtimeEntries = getRuntimeAdapterPrimitiveInventoryEntries();
    const manualEntries = getManualHelperPrimitiveInventoryEntries();
    const runtimeComponentNames = runtimeEntries.map((entry) => entry.component);
    const manualComponentNames = manualEntries.map((entry) => entry.component);

    expect(entries.map((entry) => entry.component)).toEqual(
      primitiveGeneratorRegistry.map((entry) => entry.component),
    );
    expect(getPrimitiveRuntimeComponentNames()).toEqual(runtimeComponentNames);
    expect(PRIMITIVE_COMPONENTS).toEqual(runtimeComponentNames);
    expect(PRIMITIVE_HELPER_EXPORTS).toEqual(manualComponentNames);
    expect(getPrimitivePackageExportNames()).toEqual([
      ...runtimeComponentNames,
      ...manualComponentNames,
    ]);

    const primitiveIndex = renderPrimitiveIndex("");
    for (const component of getPrimitivePackageExportNames()) {
      expect(primitiveIndex).toContain(`export * from "./${component}";`);
    }

    expect(runtimeEntries.map((entry) => entry.contract.component)).toEqual(runtimeComponentNames);
    expect(sorted(runtimeComponentNames)).toEqual(
      sorted(runtimeAdapterContracts.map((contract) => contract.component)),
    );
    for (const entry of runtimeEntries) {
      expect(entry.generation.source === "specialized-adapter-spec").toBe(
        entry.generation.strategy === "specialized-adapter-spec",
      );
    }

    const vendoringComponentNames = getPrimitiveVendoringContracts().map(
      (contract) => contract.component,
    );
    expect(vendoringComponentNames).toHaveLength(runtimeComponentNames.length);
    expect(new Set(vendoringComponentNames).size).toBe(vendoringComponentNames.length);
    expect(sorted(vendoringComponentNames)).toEqual(sorted(runtimeComponentNames));

    expect(manualEntries).toEqual([
      expect.objectContaining({
        component: "theme",
        generation: expect.objectContaining({
          source: "manual",
        }),
        kind: "manual-helper-facade",
      }),
    ]);
    expect(getPrimitiveInventoryEntry("theme")).not.toHaveProperty("contract");
    for (const component of manualComponentNames) {
      expect(vendoringComponentNames).not.toContain(component);
    }

    expect(getPrimitiveRuntimeFacadeTypeNames("form")).toEqual([
      "FormExternalErrors",
      "FormSchemaResult",
      "FormValidationTiming",
      "FormValues",
    ]);
    expect(getPrimitiveRuntimeFacadeValueNames("form")).toEqual([
      "createForm",
      "createFormSchemaValidator",
      "validateFormSchema",
    ]);

    const versionManifest = await loadPrimitiveVersionManifest();
    expect(Object.keys(versionManifest.primitives).sort()).toEqual(sorted(runtimeComponentNames));
  });
});

function sorted(values: readonly string[]): string[] {
  return [...values].sort();
}
