import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { inputRuntimeAdapterContract } from "../../contracts/primitive/components/input.js";
import { createVueComponentHeader } from "../../renderers/framework-adapters/vue/primitive-package.js";
import { assertVueSfcCompiles } from "../../renderers/framework-adapters/vue/sfc-compiler.js";
import {
  buildGenericAdapterOutputModel,
  buildGenericAdapterPlan,
} from "../../renderers/generic-adapter-plan/index.js";
import { primitiveGeneratorRegistry } from "../../renderers/primitive-generator-registry.js";
import { createTsHeader } from "../../renderers/shared.js";
import { generateSelectedVueStyledGroups } from "./selected-styled-groups.js";

const GENERATED_BY = "scripts/portable-runtime/generate-vue-wrappers.ts";

describe("generated Vue Input Primitive", () => {
  const temporaryRoots: string[] = [];

  afterEach(async () => {
    await Promise.all(
      temporaryRoots.splice(0).map((root) => rm(root, { force: true, recursive: true })),
    );
  });

  it("projects Input through the native-input-value family", () => {
    const output = buildGenericAdapterOutputModel(
      buildGenericAdapterPlan(inputRuntimeAdapterContract),
    );
    expect(output.files).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          component: expect.objectContaining({
            family: expect.objectContaining({ kind: "native-input-value", part: "root" }),
          }),
        }),
      ]),
    );
  });

  it("generates deterministic compiler-valid source with an idiomatic model bridge", async () => {
    const first = await generateInput();
    const second = await generateInput();

    expect(first).toEqual(second);
    expect(() => assertVueSfcCompiles(first.root, "InputRoot.vue")).not.toThrow();
    expect(first.root).toContain("const modelValue = defineModel<InputValue>();");
    expect(first.root).toContain("const initialDefaultValue = props.defaultValue;");
    expect(first.root).toContain("modelValue.value = nextValue;");
    expect(first.root).toContain("ownedInstance.getValue() === normalizedValue");
    expect(first.root).toContain("rootRef.value?.value === normalizedValue");
    expect(first.root).toContain("ownedInstance.setValue(nextValue, { emit: false });");
    expect(first.root).toContain("handleControlledFormReset");
    expect(first.root).toContain("clearResetReconciliationTimer");
    expect(first.root).toContain("bindControlledFormReset();");
    expect(first.root).toContain('v-bind="attrs"');
    expect(first.root).toContain("data-sw-input");
    expect(first.root).toContain("onBeforeUnmount(destroyOwnedInstance);");
    await expect(first.root).toBe(
      await readFile(path.join(process.cwd(), "packages/vue/src/input/InputRoot.vue"), "utf8"),
    );
    const checkedInIndex = await readFile(
      path.join(process.cwd(), "packages/vue/src/input/index.ts"),
      "utf8",
    );
    expect(checkedInIndex).toContain("export type { InputValue, InputValueChangeDetails }");
  });

  it("generates a compiler-safe Styled Input surface from the canonical contract", async () => {
    const repoRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-styled-input-"));
    temporaryRoots.push(repoRoot);
    const outputRoot = path.join(repoRoot, "styled");
    await generateSelectedVueStyledGroups({
      format: true,
      groups: ["input"],
      outputDir: "styled",
      repoRoot,
    });
    const styled = await readFile(path.join(outputRoot, "input/Input.vue"), "utf8");

    expect(() => assertVueSfcCompiles(styled, "Input.vue")).not.toThrow();
    expect(styled).toContain('"data-slot"?: string;');
    expect(styled).toContain('size?: "sm" | "md" | "lg";');
    expect(styled).not.toContain('InputProps["data-slot"]');
    expect(styled).not.toContain('InputProps["size"]');
    expect(styled).not.toContain("& /* @vue-ignore */ InputProps");
    expect(styled).toContain(
      '"update:modelValue": [value: import("@starwind-ui/vue/input").InputValue | undefined];',
    );
    expect(styled).toBe(
      await readFile(
        path.join(process.cwd(), "apps/vue-demo/src/components/starwind-runtime/input/Input.vue"),
        "utf8",
      ),
    );
  });

  async function generateInput(): Promise<{ index: string; root: string }> {
    const outputRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-input-"));
    temporaryRoots.push(outputRoot);
    const entry = primitiveGeneratorRegistry.find((candidate) => candidate.component === "input");
    if (!entry) throw new Error("Input Primitive generator is missing.");

    await entry.generateTarget({
      componentHeader: createVueComponentHeader(GENERATED_BY),
      moduleHeader: createTsHeader(GENERATED_BY),
      outputRoot,
      target: "vue",
    });
    return {
      index: await readFile(path.join(outputRoot, "input/index.ts"), "utf8"),
      root: await readFile(path.join(outputRoot, "input/InputRoot.vue"), "utf8"),
    };
  }
});
