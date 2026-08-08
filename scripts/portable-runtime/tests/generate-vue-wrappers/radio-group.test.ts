import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { radioGroupRuntimeAdapterContract } from "../../contracts/primitive/components/radio-group.js";
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

describe("generated Vue Radio Group Primitive", () => {
  const temporaryRoots: string[] = [];

  afterEach(async () => {
    await Promise.all(
      temporaryRoots.splice(0).map((root) => rm(root, { force: true, recursive: true })),
    );
  });

  it("projects scalar provider, form, orientation, acceptance, and state-sync facts", () => {
    const output = buildGenericAdapterOutputModel(
      buildGenericAdapterPlan(radioGroupRuntimeAdapterContract),
    );
    expect(output.files).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          component: expect.objectContaining({
            family: expect.objectContaining({
              facts: expect.objectContaining({
                behavior: expect.objectContaining({
                  acceptedChangeNotification: "detail-on-accepted",
                  contextProvider: true,
                  multipleValueNormalization: false,
                }),
                context: expect.objectContaining({ componentName: "RadioGroupContext" }),
                props: expect.objectContaining({
                  form: expect.any(Object),
                  orientation: expect.any(Object),
                }),
                state: expect.objectContaining({ syncEvent: "stateSync" }),
              }),
              kind: "grouped-value-control",
            }),
          }),
        }),
      ]),
    );
  });

  it("generates deterministic compiler-valid scalar group and typed context output", async () => {
    const first = await generateRadioGroup();
    const second = await generateRadioGroup();

    expect(first).toEqual(second);
    expect(() => assertVueSfcCompiles(first.root, "RadioGroupRoot.vue")).not.toThrow();
    expect(first.root).toContain("provide(RadioGroupContext");
    expect(first.root).toContain("onValueChange: handleValueChange");
    expect(first.root).not.toContain('createdInstance.subscribe("valueChange"');
    expect(first.root).toContain('createdInstance.subscribe("stateSync", handleStateSync)');
    expect(first.root).toMatch(
      /function handleValueChange\(_value: string, detail: RadioGroupValueChangeDetails\)[\s\S]*emit\("valueChange", detail\.value, detail\);[\s\S]*detail\.onAccepted\(\(\) => \{[\s\S]*emit\("update:modelValue", detail\.value\);/,
    );
    expect(first.root).toContain("instance?.setFormOptions");
    expect(first.root).toContain("instance?.setOrientation");
    expect(first.root).toContain("instance?.setReadOnly");
    expect(first.root).toContain("defaultValue: renderedValue.value");
    expect(first.root).toContain("const controllednessChanged =");
    expect(first.root).toContain("uncontrolledValue.value = instance.getValue()");
    expect(first.root).toContain("function setupRuntime()");
    expect(first.context).toContain("InjectionKey<RadioGroupContextValue>");
    expect(first.context).toContain("form: Readonly<Ref<string | undefined>>");
    expect(first.context).toContain("name: Readonly<Ref<string | undefined>>");
    expect(first.index).toContain("useRadioGroupContext");

    for (const [fileName, contents] of Object.entries({
      "RadioGroupContext.ts": first.context,
      "RadioGroupRoot.vue": first.root,
      "index.ts": first.index,
    })) {
      expect(contents).toBe(
        await readFile(path.join(process.cwd(), "packages/vue/src/radio-group", fileName), "utf8"),
      );
    }
  });

  it("generates Styled Radio Group without inventing standalone Styled Radio", async () => {
    const repoRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-styled-radio-group-"));
    temporaryRoots.push(repoRoot);
    await generateSelectedVueStyledGroups({
      groups: ["radio-group"],
      outputDir: "styled",
      repoRoot,
    });
    const group = await readFile(path.join(repoRoot, "styled/radio-group/RadioGroup.vue"), "utf8");
    const item = await readFile(
      path.join(repoRoot, "styled/radio-group/RadioGroupItem.vue"),
      "utf8",
    );

    expect(() => assertVueSfcCompiles(group, "RadioGroup.vue")).not.toThrow();
    expect(() => assertVueSfcCompiles(item, "RadioGroupItem.vue")).not.toThrow();
    expect(group).toContain(
      `v-bind="{ ...(legend === undefined ? {} : { 'aria-label': legend }), ...attrs }"`,
    );
    expect(group).not.toContain(`v-bind="{ ...attrs, 'aria-label': legend }"`);
    expect(group).toContain('data-slot="radio-group"');
    expect(group).toContain(':model-value="modelValue"');
    expect(group).toContain('@update:model-value="emit(&quot;update:modelValue&quot;, $event)"');
    expect(item).toContain('data-slot="radio-group-item"');
    expect(item).not.toContain(':checked="checked"');
    expect(item).not.toContain(':default-checked="defaultChecked"');
    expect(item).not.toContain("update:checked");
    expect(item).not.toContain("checked?: boolean");
    expect(item).toContain('fill="currentColor"');
    expect(item).toContain('<path d="M12 2a10 10 0 1 0 0 20a10 10 0 0 0 0-20z" stroke="none" />');
    expect(item).not.toContain('<path d="M5 12l5 5l10 -10" />');
    await expect(readFile(path.join(repoRoot, "styled/radio/Radio.vue"), "utf8")).rejects.toThrow();
  });

  async function generateRadioGroup(): Promise<{ context: string; index: string; root: string }> {
    const outputRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-radio-group-"));
    temporaryRoots.push(outputRoot);
    const entry = primitiveGeneratorRegistry.find(
      (candidate) => candidate.component === "radio-group",
    );
    if (!entry) throw new Error("Radio Group Primitive generator is missing.");

    await entry.generateTarget({
      componentHeader: createVueComponentHeader(GENERATED_BY),
      moduleHeader: createTsHeader(GENERATED_BY),
      outputRoot,
      target: "vue",
    });
    return {
      context: await readFile(path.join(outputRoot, "radio-group/RadioGroupContext.ts"), "utf8"),
      index: await readFile(path.join(outputRoot, "radio-group/index.ts"), "utf8"),
      root: await readFile(path.join(outputRoot, "radio-group/RadioGroupRoot.vue"), "utf8"),
    };
  }
});
