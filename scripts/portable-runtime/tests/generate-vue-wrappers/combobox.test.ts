import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { format, resolveConfig } from "prettier";
import { afterEach, describe, expect, it } from "vitest";

import { comboboxRuntimeAdapterContract } from "../../contracts/primitive/components/combobox.js";
import { createVueComponentHeader } from "../../renderers/framework-adapters/vue/primitive-package.js";
import { assertVueSfcCompiles } from "../../renderers/framework-adapters/vue/sfc-compiler.js";
import { primitiveGeneratorRegistry } from "../../renderers/primitive-generator-registry.js";
import {
  buildComboboxAdapterOutputModel,
  buildComboboxSpecializedAdapterSpec,
} from "../../renderers/specialized-adapter-spec/combobox-specialized-adapter-spec.js";
import { createTsHeader } from "../../renderers/shared.js";

const GENERATED_BY = "scripts/portable-runtime/generate-vue-wrappers.ts";

describe("generated Vue Combobox Primitive", () => {
  const temporaryRoots: string[] = [];

  afterEach(async () => {
    await Promise.all(
      temporaryRoots.splice(0).map((root) => rm(root, { force: true, recursive: true })),
    );
  });

  it("projects every public Combobox part through the editable collection family", () => {
    const spec = buildComboboxSpecializedAdapterSpec(comboboxRuntimeAdapterContract);
    const output = buildComboboxAdapterOutputModel(spec);
    const componentParts = output.files.flatMap((file) =>
      file.kind === "component" && file.component.family?.kind === "editable-collection-overlay"
        ? [file.component.family.part]
        : [],
    );

    expect(componentParts).toEqual([
      "clear",
      "empty",
      "group",
      "groupLabel",
      "icon",
      "input",
      "inputGroup",
      "item",
      "itemIndicator",
      "itemText",
      "label",
      "list",
      "popup",
      "portal",
      "positioner",
      "root",
      "separator",
      "trigger",
      "value",
    ]);
  });

  it("generates deterministic, compiler-valid checked-in Combobox output", async () => {
    const first = await generateCombobox();
    const second = await generateCombobox();
    expect(first).toEqual(second);

    for (const [name, source] of first) {
      if (name.endsWith(".vue")) {
        expect(() => assertVueSfcCompiles(source, name)).not.toThrow();
      }
      const checkedIn = await readFile(
        path.join(process.cwd(), "packages/vue/src/combobox", name),
        "utf8",
      );
      expect(source).toBe(checkedIn);
    }
  });

  it("prints three Vue models, typed contexts, Runtime acceptance, form and Teleport seams", async () => {
    const output = new Map(await generateCombobox());
    const root = output.get("ComboboxRoot.vue")!;
    const input = output.get("ComboboxInput.vue")!;
    const portal = output.get("ComboboxPortal.vue")!;
    const value = output.get("ComboboxValue.vue")!;
    const index = output.get("index.ts")!;

    expect(root).toContain("modelValue?: string | null");
    expect(root).toContain("inputValue?: string");
    expect(root).toContain("open?: boolean");
    expect(root).toContain('emit("inputValueChange", inputValue, detail);');
    expect(root).toContain('emit("openChange", open, detail);');
    expect(root).toContain('emit("valueChange", value, detail);');
    expect(root).toMatch(/emit\("valueChange"[\s\S]*detail\.isCanceled/);
    expect(root).toContain('created.subscribe("valueChange", acceptValue)');
    expect(root).toContain('created.subscribe("inputValueChange", acceptInputValue)');
    expect(root).toContain('created.subscribe("openChange", acceptOpen)');
    expect(root).toMatch(/function acceptValue[\s\S]*emit\("update:modelValue"/);
    expect(root).toMatch(/function acceptInputValue[\s\S]*emit\("update:inputValue"/);
    expect(root).toMatch(/function acceptOpen[\s\S]*emit\("update:open"/);
    expect(root).toMatch(
      /instance\.setValue\(value, \{ emit: false \}\);\s+if \(props\.inputValue === undefined\) uncontrolledInputValue\.value = instance\.getInputValue\(\);/,
    );
    expect(root).toContain("export const ComboboxContext: InjectionKey<ComboboxContextValue>");
    expect(root).toContain(
      "export const ComboboxItemContext: InjectionKey<ComboboxItemContextValue>",
    );
    expect(root).toContain("instance?.setFormOptions");
    expect(root).toContain("ownedInstance?.destroy();");
    expect(root).not.toContain("querySelector");
    expect(root).not.toContain("textContent");
    expect(root).not.toContain("findText");
    expect(root).not.toContain("selectedText");
    expect(root).not.toContain("created.setInputValue(preservedInputValue");
    expect(input).toContain('role="combobox"');
    expect(input).toContain('autocomplete="off"');
    expect(portal).toContain("container?: string | HTMLElement");
    expect(portal).toContain(':disabled="props.disabled || !combobox.mounted.value"');
    expect(portal).toContain("combobox.refreshPortalTarget");
    expect(value).toContain("const initialPlaceholder = props.placeholder;");
    expect(value).toContain("const slots = defineSlots");
    expect(value).toContain(":data-sw-combobox-value=\"slots.default ? undefined : ''\"");
    expect(value).toContain("<slot>{{ initialPlaceholder }}</slot>");
    expect(value).not.toContain("selectedText");
    expect(output.get("ComboboxTrigger.vue")).toContain("createVueAsChild");
    expect(output.get("ComboboxClear.vue")).toContain("createVueAsChild");
    expect(index).toContain("const Combobox = {");
    expect(index).toContain("useComboboxContext");
    expect(index).toContain("ComboboxInputValueChangeDetails");
  });

  async function generateCombobox(): Promise<Array<[string, string]>> {
    const outputRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-combobox-"));
    temporaryRoots.push(outputRoot);
    const entry = primitiveGeneratorRegistry.find(
      (candidate) => candidate.component === "combobox",
    );
    if (!entry) throw new Error("Combobox Primitive generator is missing.");

    await entry.generateTarget({
      componentHeader: createVueComponentHeader(GENERATED_BY),
      moduleHeader: createTsHeader(GENERATED_BY),
      outputRoot,
      target: "vue",
    });

    const directory = path.join(outputRoot, "combobox");
    const names = (await readdir(directory)).sort();
    const prettierConfig =
      (await resolveConfig(path.join(process.cwd(), "prettier.config.mjs"))) ?? {};
    return Promise.all(
      names.map(async (name): Promise<[string, string]> => {
        const file = path.join(directory, name);
        return [
          name,
          await format(await readFile(file, "utf8"), { ...prettierConfig, filepath: file }),
        ];
      }),
    );
  }
});
