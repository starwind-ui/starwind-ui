import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { vueFrameworkAdapterTarget } from "../../renderers/framework-adapters/vue/index.js";
import { vuePrimitiveComponents } from "../../renderers/framework-adapters/vue/inventory.js";
import {
  getPrimitiveFrameworkAdapterTargetNames,
  getPrimitiveFrameworkAdapterTargetsForComponent,
  resolvePrimitiveFrameworkAdapterTargetComponents,
} from "../../renderers/framework-adapters/target-registry.js";
import { primitiveGeneratorRegistry } from "../../renderers/primitive-generator-registry.js";

describe("registered Vue Framework Adapter target", () => {
  const temporaryRoots: string[] = [];

  afterEach(async () => {
    await Promise.all(
      temporaryRoots.splice(0).map((root) => rm(root, { force: true, recursive: true })),
    );
  });

  it("registers exactly the approved non-shipping Primitive subset", () => {
    expect(getPrimitiveFrameworkAdapterTargetNames()).toEqual(["astro", "react", "vue"]);
    expect(resolvePrimitiveFrameworkAdapterTargetComponents("vue")).toEqual(vuePrimitiveComponents);
    expect(vueFrameworkAdapterTarget.primitive.support).toEqual({
      components: vuePrimitiveComponents,
      kind: "subset",
    });
    expect(vueFrameworkAdapterTarget.publicSupport).toEqual({
      cliRegistry: false,
      demoIntegration: false,
      packageExports: false,
      publicDocsClaim: false,
      status: "non-shipping-tracer",
    });
    expect(vueFrameworkAdapterTarget.cliRegistry.primitiveArtifact).toBeUndefined();
  });

  it("registers only the manual Theme helper in addition to the component subset", async () => {
    expect(getPrimitiveFrameworkAdapterTargetsForComponent("theme")).toEqual([
      "astro",
      "react",
      "vue",
    ]);
    expect(Object.keys(vueFrameworkAdapterTarget.primitive.manualPrimitives ?? {})).toEqual([
      "theme",
    ]);
    expect(getPrimitiveFrameworkAdapterTargetsForComponent("dialog")).toEqual(["astro", "react"]);

    const dialog = primitiveGeneratorRegistry.find((entry) => entry.component === "dialog");
    const outputRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-unsupported-"));
    temporaryRoots.push(outputRoot);

    expect(() =>
      dialog?.generateTarget({
        moduleHeader: "",
        outputRoot,
        target: "vue",
      }),
    ).toThrowError('Primitive Framework Adapter target "vue" does not support component "dialog".');
  });
});
