import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { fieldsetRuntimeAdapterContract } from "../../contracts/primitive/components/fieldset.js";
import { createVueComponentHeader } from "../../renderers/framework-adapters/vue/primitive-package.js";
import { assertVueSfcCompiles } from "../../renderers/framework-adapters/vue/sfc-compiler.js";
import {
  buildGenericAdapterOutputModel,
  buildGenericAdapterPlan,
} from "../../renderers/generic-adapter-plan/index.js";
import { primitiveGeneratorRegistry } from "../../renderers/primitive-generator-registry.js";
import { createTsHeader } from "../../renderers/shared.js";

const GENERATED_BY = "scripts/portable-runtime/generate-vue-wrappers.ts";

describe("generated Vue Fieldset Primitive", () => {
  const temporaryRoots: string[] = [];

  afterEach(async () => {
    await Promise.all(
      temporaryRoots.splice(0).map((root) => rm(root, { force: true, recursive: true })),
    );
  });

  it("projects Fieldset through native-disabled facts", () => {
    const output = buildGenericAdapterOutputModel(
      buildGenericAdapterPlan(fieldsetRuntimeAdapterContract),
    );
    expect(output.files).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          component: expect.objectContaining({
            family: expect.objectContaining({ kind: "native-disabled", part: "root" }),
          }),
        }),
        expect.objectContaining({
          component: expect.objectContaining({
            family: expect.objectContaining({ kind: "native-disabled", part: "legend" }),
          }),
        }),
      ]),
    );
  });

  it("generates deterministic compiler-valid checked-in Fieldset output", async () => {
    const first = await generateFieldset();
    const second = await generateFieldset();

    expect(first).toEqual(second);
    expect(() => assertVueSfcCompiles(first.root, "FieldsetRoot.vue")).not.toThrow();
    expect(() => assertVueSfcCompiles(first.legend, "FieldsetLegend.vue")).not.toThrow();
    expect(first.root).toContain("instance = createFieldset(element, {");
    expect(first.root).toContain("instance?.setDisabled(nextDisabled);");
    expect(first.root).toContain('v-bind="$attrs"');
    expect(first.root).toContain(':disabled="props.disabled"');
    expect(first.root).toContain("onBeforeUnmount(destroyOwnedInstance);");
    expect(first.legend).toContain("data-sw-fieldset-legend");
    await expect(first.root).toBe(
      await readFile(
        path.join(process.cwd(), "packages/vue/src/fieldset/FieldsetRoot.vue"),
        "utf8",
      ),
    );
  });

  async function generateFieldset(): Promise<{
    index: string;
    legend: string;
    root: string;
  }> {
    const outputRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-fieldset-"));
    temporaryRoots.push(outputRoot);
    const entry = primitiveGeneratorRegistry.find(
      (candidate) => candidate.component === "fieldset",
    );
    if (!entry) throw new Error("Fieldset Primitive generator is missing.");

    await entry.generateTarget({
      componentHeader: createVueComponentHeader(GENERATED_BY),
      moduleHeader: createTsHeader(GENERATED_BY),
      outputRoot,
      target: "vue",
    });
    return {
      index: await readFile(path.join(outputRoot, "fieldset/index.ts"), "utf8"),
      legend: await readFile(path.join(outputRoot, "fieldset/FieldsetLegend.vue"), "utf8"),
      root: await readFile(path.join(outputRoot, "fieldset/FieldsetRoot.vue"), "utf8"),
    };
  }
});
