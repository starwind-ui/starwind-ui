import { describe, expect, it } from "vitest";

import { primitiveGeneratorRegistry } from "../renderers/primitive-generator-registry.js";
import { getPrimitiveInventoryEntry } from "../renderers/primitive-inventory.js";

describe("primitive generator registry", () => {
  it("routes Color Picker through its central specialized Adapter Output Model entry", () => {
    const inventory = getPrimitiveInventoryEntry("color-picker");
    const generator = primitiveGeneratorRegistry.find(
      (entry) => entry.component === "color-picker",
    );

    expect(inventory).toEqual(
      expect.objectContaining({
        cliVendoring: true,
        generation: {
          source: "specialized-adapter-spec",
          strategy: "specialized-adapter-spec",
        },
        packageExport: true,
      }),
    );
    expect(generator).toEqual(
      expect.objectContaining({
        component: "color-picker",
        routeFree: {
          kind: "adapter-output-model",
          strategy: "specialized-adapter-spec",
          targets: ["astro", "react"],
        },
        source: "specialized-adapter-spec",
      }),
    );
  });
});
