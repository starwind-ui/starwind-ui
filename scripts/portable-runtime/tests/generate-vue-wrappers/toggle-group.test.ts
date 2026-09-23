import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { toggleGroupRuntimeAdapterContract } from "../../contracts/primitive/components/toggle-group.js";
import { createVueComponentHeader } from "../../renderers/framework-adapters/vue/primitive-package.js";
import { assertVueSfcCompiles } from "../../renderers/framework-adapters/vue/sfc-compiler.js";
import {
  buildGenericAdapterOutputModel,
  buildGenericAdapterPlan,
} from "../../renderers/generic-adapter-plan/index.js";
import { primitiveGeneratorRegistry } from "../../renderers/primitive-generator-registry.js";
import { createTsHeader } from "../../renderers/shared.js";
import { compactCode, normalizeVueSource } from "../source-comparison.js";
import { generateSelectedVueStyledGroups } from "./selected-styled-groups.js";

const GENERATED_BY = "scripts/portable-runtime/generate-vue-wrappers.ts";

describe("generated Vue Toggle Group Primitive", () => {
  const temporaryRoots: string[] = [];

  afterEach(async () => {
    await Promise.all(
      temporaryRoots.splice(0).map((root) => rm(root, { force: true, recursive: true })),
    );
  });

  it("projects array normalization, live options, and a typed provider", () => {
    const output = buildGenericAdapterOutputModel(
      buildGenericAdapterPlan(toggleGroupRuntimeAdapterContract),
    );
    expect(output.files).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          component: expect.objectContaining({
            family: expect.objectContaining({
              facts: expect.objectContaining({
                behavior: expect.objectContaining({
                  contextProvider: true,
                  multipleValueNormalization: true,
                  syncUncontrolledValueFromAttribute: true,
                }),
                context: expect.objectContaining({
                  values: expect.arrayContaining([
                    expect.objectContaining({ name: "disabled" }),
                    expect.objectContaining({ name: "loopFocus" }),
                    expect.objectContaining({ name: "multiple" }),
                    expect.objectContaining({ name: "orientation" }),
                    expect.objectContaining({ name: "value" }),
                  ]),
                }),
                setters: expect.objectContaining({
                  loopFocus: expect.objectContaining({ method: "setLoopFocus" }),
                  multiple: expect.objectContaining({ method: "setMultiple" }),
                  orientation: expect.objectContaining({ method: "setOrientation" }),
                }),
              }),
              kind: "grouped-value-control",
              part: "root",
            }),
          }),
        }),
        expect.objectContaining({
          family: expect.objectContaining({ kind: "grouped-value-control" }),
          kind: "helper",
          target: "vue",
        }),
      ]),
    );
  });

  it("generates deterministic, compiler-valid, default-model output", async () => {
    const first = await generateToggleGroup();
    const second = await generateToggleGroup();

    expect(first).toEqual(second);
    expect(() => assertVueSfcCompiles(first.root, "ToggleGroupRoot.vue")).not.toThrow();
    expect(compactCode(first.root)).toContain(compactCode("modelValue?: ToggleGroupValue"));
    expect(() => assertVueSfcCompiles(first.root, "Component.vue")).not.toThrow();

    expect(first.context).toContain("InjectionKey<ToggleGroupContextValue>");
    expect(first.context).toContain("function useToggleGroupContext()");
    expect(first.index).toContain("ToggleGroupContext");
    expect(first.index).toContain("ToggleGroupValue");

    for (const [fileName, contents] of Object.entries({
      "ToggleGroupContext.ts": first.context,
      "ToggleGroupRoot.vue": first.root,
      "index.ts": first.index,
    })) {
      expect(normalizeVueSource(contents)).toBe(
        normalizeVueSource(
          await readFile(
            path.join(process.cwd(), "packages/vue/src/toggle-group", fileName),
            "utf8",
          ),
        ),
      );
    }
  });

  it("generates Styled Root/Item models, events, refs, slots, and variants", async () => {
    const repoRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-styled-toggle-group-"));
    temporaryRoots.push(repoRoot);
    await generateSelectedVueStyledGroups({
      groups: ["toggle-group"],
      outputDir: "styled",
      repoRoot,
    });
    const root = await readFile(path.join(repoRoot, "styled/toggle-group/ToggleGroup.vue"), "utf8");
    const item = await readFile(
      path.join(repoRoot, "styled/toggle-group/ToggleGroupItem.vue"),
      "utf8",
    );

    expect(() => assertVueSfcCompiles(root, "ToggleGroup.vue")).not.toThrow();
    expect(() => assertVueSfcCompiles(item, "ToggleGroupItem.vue")).not.toThrow();
    expect(compactCode(root)).toContain(compactCode('"size"?: "sm" | "md" | "lg"'));
    expect(compactCode(root)).toContain(compactCode('"modelValue"?: import'));
    expect(compactCode(root)).toContain(
      compactCode('@update:model-value="emit(&quot;update:modelValue&quot;, $event)"'),
    );
    expect(compactCode(root)).toContain(compactCode('@value-change="handleValueChange"'));
    expect(compactCode(root)).toContain(compactCode('data-slot="toggle-group"'));
    expect(compactCode(root)).toContain(compactCode(':style="toggleGroupStyle"'));
    expect(compactCode(root)).toContain(compactCode("defineExpose({ element });"));
    expect(item).toContain('"variant"?: "default" | "outline"');
    expect(item).not.toContain('"pressed"?:');
    expect(item).toContain('@pressed-change="handlePressedChange"');
    expect(item).toContain('data-slot="toggle-group-item"');
    expect(item).toContain("defineExpose({ element });");
  });

  async function generateToggleGroup() {
    const outputRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-toggle-group-"));
    temporaryRoots.push(outputRoot);
    const entry = primitiveGeneratorRegistry.find(
      (candidate) => candidate.component === "toggle-group",
    );
    if (!entry) throw new Error("Toggle Group Primitive generator is missing.");

    await entry.generateTarget({
      componentHeader: createVueComponentHeader(GENERATED_BY),
      moduleHeader: createTsHeader(GENERATED_BY),
      outputRoot,
      target: "vue",
    });

    return {
      context: await readFile(path.join(outputRoot, "toggle-group/ToggleGroupContext.ts"), "utf8"),
      index: await readFile(path.join(outputRoot, "toggle-group/index.ts"), "utf8"),
      root: await readFile(path.join(outputRoot, "toggle-group/ToggleGroupRoot.vue"), "utf8"),
    };
  }
});
