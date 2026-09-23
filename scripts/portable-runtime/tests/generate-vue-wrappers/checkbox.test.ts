import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { checkboxRuntimeAdapterContract } from "../../contracts/primitive/components/checkbox.js";
import { createVueComponentHeader } from "../../renderers/framework-adapters/vue/primitive-package.js";
import { assertVueSfcCompiles } from "../../renderers/framework-adapters/vue/sfc-compiler.js";
import {
  buildGenericAdapterOutputModel,
  buildGenericAdapterPlan,
} from "../../renderers/generic-adapter-plan/index.js";
import { primitiveGeneratorRegistry } from "../../renderers/primitive-generator-registry.js";
import { createTsHeader } from "../../renderers/shared.js";
import { compactCode, normalizeVueSource } from "../source-comparison.js";

const GENERATED_BY = "scripts/portable-runtime/generate-vue-wrappers.ts";

describe("generated Vue Checkbox Primitive", () => {
  const temporaryRoots: string[] = [];

  afterEach(async () => {
    await Promise.all(
      temporaryRoots.splice(0).map((root) => rm(root, { force: true, recursive: true })),
    );
  });

  it("projects the Checkbox Generic Adapter Plan through the boolean form-control family", () => {
    const plan = buildGenericAdapterPlan(checkboxRuntimeAdapterContract);
    const outputModel = buildGenericAdapterOutputModel(plan);

    expect(plan.component).toBe("checkbox");
    expect(outputModel.files).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          component: expect.objectContaining({
            family: expect.objectContaining({ kind: "boolean-form-control", part: "root" }),
          }),
          kind: "component",
        }),
        expect.objectContaining({
          component: expect.objectContaining({
            family: expect.objectContaining({
              kind: "boolean-form-control",
              part: "state-indicator",
            }),
          }),
          kind: "component",
        }),
      ]),
    );
  });

  it("generates deterministic, compiler-valid Checkbox-owned output", async () => {
    const first = await generateCheckbox();
    const second = await generateCheckbox();

    expect(first).toEqual(second);
    expect(() => assertVueSfcCompiles(first.root, "CheckboxRoot.vue")).not.toThrow();
    expect(() => assertVueSfcCompiles(first.indicator, "CheckboxIndicator.vue")).not.toThrow();

    await expectCheckedInOutput(first, "CheckboxRoot.vue", "root");
    await expectCheckedInOutput(first, "CheckboxIndicator.vue", "indicator");
    expect(first.index).toContain('export { default as CheckboxRoot } from "./CheckboxRoot.vue";');
    expect(first.index).toContain(
      'export { default as CheckboxIndicator } from "./CheckboxIndicator.vue";',
    );
    const checkedInIndex = await readFile(
      path.join(process.cwd(), "packages/vue/src/checkbox/index.ts"),
      "utf8",
    );
    expect(checkedInIndex).toContain("export type { CheckboxCheckedChangeDetails }");
    expect(checkedInIndex).toContain("CheckboxRoot");
    expect(checkedInIndex).toContain("CheckboxIndicator");
  });

  it("prints cancellation-first model bridging, form inputs, presence, and exact ownership", async () => {
    const { indicator, root } = await generateCheckbox();

    expect(() => assertVueSfcCompiles(root, "Component.vue")).not.toThrow();

    expect(compactCode(root)).toContain(compactCode("data-sw-checkbox-input"));

    expect(compactCode(root)).not.toContain(compactCode("asChild"));
    expect(compactCode(root)).not.toContain(compactCode("container"));
    expect(compactCode(indicator)).toContain(compactCode("data-sw-checkbox-indicator"));
    expect(compactCode(indicator)).toContain(compactCode("data-unchecked"));
    expect(compactCode(indicator)).toContain(compactCode(':hidden="!props.keepMounted"'));
  });

  it("keeps Checkbox choices in semantic facts instead of target-local identity literals", async () => {
    const printer = await readFile(
      path.join(
        process.cwd(),
        "scripts/portable-runtime/renderers/framework-adapters/vue/boolean-form-control.ts",
      ),
      "utf8",
    );

    expect(printer).not.toContain('hasAttribute("data-sw-checkbox-unchecked-input")');
    expect(printer).not.toMatch(/displayName\s*=\s*["']Checkbox["']/);
    expect(printer).not.toContain("Vue Checkbox projection requires");
  });

  async function generateCheckbox(): Promise<{
    index: string;
    indicator: string;
    root: string;
  }> {
    const outputRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-checkbox-"));
    temporaryRoots.push(outputRoot);
    const entry = primitiveGeneratorRegistry.find(
      (candidate) => candidate.component === "checkbox",
    );
    if (!entry) throw new Error("Checkbox Primitive generator is missing.");

    await entry.generateTarget({
      componentHeader: createVueComponentHeader(GENERATED_BY),
      moduleHeader: createTsHeader(GENERATED_BY),
      outputRoot,
      target: "vue",
    });

    return {
      index: await readFile(path.join(outputRoot, "checkbox/index.ts"), "utf8"),
      indicator: await readFile(path.join(outputRoot, "checkbox/CheckboxIndicator.vue"), "utf8"),
      root: await readFile(path.join(outputRoot, "checkbox/CheckboxRoot.vue"), "utf8"),
    };
  }
});

async function expectCheckedInOutput(
  generated: { indicator: string; root: string },
  fileName: string,
  key: "indicator" | "root",
): Promise<void> {
  expect(normalizeVueSource(generated[key])).toBe(
    normalizeVueSource(
      await readFile(path.join(process.cwd(), "packages/vue/src/checkbox", fileName), "utf8"),
    ),
  );
}
