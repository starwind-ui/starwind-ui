import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { createVueComponentHeader } from "../../renderers/framework-adapters/vue/primitive-package.js";
import { assertVueSfcCompiles } from "../../renderers/framework-adapters/vue/sfc-compiler.js";
import { primitiveGeneratorRegistry } from "../../renderers/primitive-generator-registry.js";
import { createTsHeader } from "../../renderers/shared.js";
import { generateSelectedVueStyledGroups } from "./selected-styled-groups.js";

const GENERATED_BY = "scripts/portable-runtime/generate-vue-wrappers.ts";

describe("generated Vue Field", () => {
  const temporaryRoots: string[] = [];

  afterEach(async () => {
    await Promise.all(
      temporaryRoots.splice(0).map((root) => rm(root, { force: true, recursive: true })),
    );
  });

  it("generates deterministic field-composition Primitive output", async () => {
    const first = await generateField();
    const second = await generateField();

    expect(first).toEqual(second);
    for (const [name, source] of Object.entries(first)) {
      if (name === "index") continue;
      expect(() => assertVueSfcCompiles(source, `${name}.vue`)).not.toThrow();
    }
    expect(first.root).toContain("instance = createField(element");
    expect(first.root).toContain("instance?.setDirty(value)");
    expect(first.root).toContain("instance?.setDisabled(value)");
    expect(first.root).toContain("instance?.setInvalid(value)");
    expect(first.root).toContain("instance?.setName(value)");
    expect(first.root).toContain("instance?.setTouched(value)");
    expect(first.root).toContain("dirty: undefined");
    expect(first.root).toContain("invalid: undefined");
    expect(first.root).toContain("touched: undefined");
    expect(first.root).toContain(
      ':data-validation-timing="props.dataValidationTiming ?? props.validationTiming"',
    );
    expect(first.control).toContain('import InputRoot from "../input/InputRoot.vue"');
    expect(first.control).toContain(':model-value="props.modelValue"');
    expect(first.control).toContain('@update:model-value="handleModelValueUpdate"');
    expect(first.control).toContain("data-sw-field-control");
    expect(first.control).not.toContain("createInput(");
    expect(first.error).toContain("data-message-source");
    expect(first.error).toContain("serializeMatch");
    expect(first.validity).toContain("match: true");
    expect(first.index).toContain("const Field =");
    expect(first.index).toContain("InputValueChangeDetails");
  });

  it("generates Styled Field with canonical composition, slots, variants, models, and refs", async () => {
    const repoRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-styled-field-"));
    temporaryRoots.push(repoRoot);
    await generateSelectedVueStyledGroups({ groups: ["field"], outputDir: "styled", repoRoot });

    const root = await readFile(path.join(repoRoot, "styled/field/Field.vue"), "utf8");
    const control = await readFile(path.join(repoRoot, "styled/field/FieldControl.vue"), "utf8");
    const error = await readFile(path.join(repoRoot, "styled/field/FieldError.vue"), "utf8");
    const separator = await readFile(
      path.join(repoRoot, "styled/field/FieldSeparator.vue"),
      "utf8",
    );

    expect(() => assertVueSfcCompiles(root, "Field.vue")).not.toThrow();
    expect(() => assertVueSfcCompiles(control, "FieldControl.vue")).not.toThrow();
    expect(root).toContain('data-slot="field"');
    expect(root).toContain(':ref="setElement"');
    expect(control).toContain('data-slot="field-control"');
    expect(control).toContain(':model-value="modelValue"');
    expect(control).toContain('@update:model-value="emit(&quot;update:modelValue&quot;, $event)"');
    expect(control).toContain('@value-change="handleValueChange"');
    expect(error).toContain('data-slot="field-error"');
    expect(separator).toContain("const hasContent = Boolean(useSlots().default);");
    expect(separator).toContain('data-slot="field-separator"');
  });

  async function generateField(): Promise<Record<string, string>> {
    const outputRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-field-"));
    temporaryRoots.push(outputRoot);
    const entry = primitiveGeneratorRegistry.find((candidate) => candidate.component === "field");
    if (!entry) throw new Error("Field Primitive generator is missing.");

    await entry.generateTarget({
      componentHeader: createVueComponentHeader(GENERATED_BY),
      moduleHeader: createTsHeader(GENERATED_BY),
      outputRoot,
      target: "vue",
    });
    const directory = path.join(outputRoot, "field");
    return {
      control: await readFile(path.join(directory, "FieldControl.vue"), "utf8"),
      description: await readFile(path.join(directory, "FieldDescription.vue"), "utf8"),
      error: await readFile(path.join(directory, "FieldError.vue"), "utf8"),
      index: await readFile(path.join(directory, "index.ts"), "utf8"),
      item: await readFile(path.join(directory, "FieldItem.vue"), "utf8"),
      label: await readFile(path.join(directory, "FieldLabel.vue"), "utf8"),
      root: await readFile(path.join(directory, "FieldRoot.vue"), "utf8"),
      validity: await readFile(path.join(directory, "FieldValidity.vue"), "utf8"),
    };
  }
});
