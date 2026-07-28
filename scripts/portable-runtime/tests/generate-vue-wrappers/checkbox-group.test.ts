import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { checkboxGroupRuntimeAdapterContract } from "../../contracts/primitive/components/checkbox-group.js";
import { createVueComponentHeader } from "../../renderers/framework-adapters/vue/primitive-package.js";
import { assertVueSfcCompiles } from "../../renderers/framework-adapters/vue/sfc-compiler.js";
import {
  buildGenericAdapterOutputModel,
  buildGenericAdapterPlan,
} from "../../renderers/generic-adapter-plan/index.js";
import { primitiveGeneratorRegistry } from "../../renderers/primitive-generator-registry.js";
import { createTsHeader } from "../../renderers/shared.js";

const GENERATED_BY = "scripts/portable-runtime/generate-vue-wrappers.ts";

describe("generated Vue Checkbox Group Primitive", () => {
  const temporaryRoots: string[] = [];

  afterEach(async () => {
    await Promise.all(
      temporaryRoots.splice(0).map((root) => rm(root, { force: true, recursive: true })),
    );
  });

  it("projects the grouped-value family and typed Vue context helper", () => {
    const output = buildGenericAdapterOutputModel(
      buildGenericAdapterPlan(checkboxGroupRuntimeAdapterContract),
    );
    expect(output.files).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          component: expect.objectContaining({
            family: expect.objectContaining({ kind: "grouped-value-control", part: "root" }),
          }),
          kind: "component",
        }),
        expect.objectContaining({
          family: expect.objectContaining({ kind: "grouped-value-control" }),
          kind: "helper",
          target: "vue",
        }),
      ]),
    );
  });

  it("generates deterministic, compiler-valid, cancellation-first output", async () => {
    const first = await generateCheckboxGroup();
    const second = await generateCheckboxGroup();
    expect(first).toEqual(second);
    expect(() => assertVueSfcCompiles(first.root, "CheckboxGroupRoot.vue")).not.toThrow();
    expect(first.root).toMatch(
      /emit\("valueChange", detail\.value, detail\);[\s\S]*if \(detail\.isCanceled\) return;[\s\S]*emit\("update:modelValue", detail\.value\);/,
    );
    expect(first.root).toContain("modelValue?: CheckboxGroupValue");
    expect(first.root).toContain("props.modelValue");
    expect(first.root).not.toContain("update:value");
    expect(first.root).not.toContain("props.value");
    expect(first.root).toContain("provide(CheckboxGroupContext");
    expect(first.root).toContain("new MutationObserver");
    expect(first.root).toContain("ownedInstance.destroy()");
    expect(first.context).toContain("InjectionKey<CheckboxGroupContextValue>");
    expect(first.context).toContain("function useCheckboxGroupContext()");
    expect(first.context).toContain("| undefined");
    expect(first.index).toContain("CheckboxGroupContext");
    expect(first.index).toContain("useCheckboxGroupContext");

    for (const [fileName, contents] of Object.entries({
      "CheckboxGroupContext.ts": first.context,
      "CheckboxGroupRoot.vue": first.root,
      "index.ts": first.index,
    })) {
      expect(contents).toBe(
        await readFile(
          path.join(process.cwd(), "packages/vue/src/checkbox-group", fileName),
          "utf8",
        ),
      );
    }
  });

  async function generateCheckboxGroup() {
    const outputRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-checkbox-group-"));
    temporaryRoots.push(outputRoot);
    const entry = primitiveGeneratorRegistry.find(
      (candidate) => candidate.component === "checkbox-group",
    );
    if (!entry) throw new Error("Checkbox Group Primitive generator is missing.");

    await entry.generateTarget({
      componentHeader: createVueComponentHeader(GENERATED_BY),
      moduleHeader: createTsHeader(GENERATED_BY),
      outputRoot,
      target: "vue",
    });

    return {
      context: await readFile(
        path.join(outputRoot, "checkbox-group/CheckboxGroupContext.ts"),
        "utf8",
      ),
      index: await readFile(path.join(outputRoot, "checkbox-group/index.ts"), "utf8"),
      root: await readFile(path.join(outputRoot, "checkbox-group/CheckboxGroupRoot.vue"), "utf8"),
    };
  }
});
