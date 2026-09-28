import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { format, resolveConfig } from "prettier";
import { afterEach, describe, expect, it } from "vitest";
import { comboboxRuntimeAdapterContract } from "../../contracts/primitive/components/combobox.js";
import { createVueComponentHeader } from "../../renderers/framework-adapters/vue/primitive-package.js";
import { assertVueSfcCompiles } from "../../renderers/framework-adapters/vue/sfc-compiler.js";
import { primitiveGeneratorRegistry } from "../../renderers/primitive-generator-registry.js";
import { createTsHeader } from "../../renderers/shared.js";
import {
  buildComboboxAdapterOutputModel,
  buildComboboxSpecializedAdapterSpec,
} from "../../renderers/specialized-adapter-spec/combobox-specialized-adapter-spec.js";
import { compactCode, normalizeVueSource } from "../source-comparison.js";

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
      expect(normalizeVueSource(source)).toBe(normalizeVueSource(checkedIn));
    }
  });

  it("prints three Vue models, typed contexts, Runtime acceptance, form and Teleport seams", async () => {
    const output = new Map(await generateCombobox());
    const root = output.get("ComboboxRoot.vue")!;
    const input = output.get("ComboboxInput.vue")!;
    const portal = output.get("ComboboxPortal.vue")!;
    const value = output.get("ComboboxValue.vue")!;
    const index = output.get("index.ts")!;

    expect(compactCode(root)).toContain(compactCode("modelValue?: string | null"));
    expect(compactCode(root)).toContain(compactCode("inputValue?: string"));
    expect(compactCode(root)).toContain(compactCode("open?: boolean"));
    expect(() => assertVueSfcCompiles(root, "Component.vue")).not.toThrow();

    expect(input).toContain('role="combobox"');
    expect(input).toContain('autocomplete="off"');
    expect(portal).toContain("container?: string | HTMLElement");
    expect(portal).toContain("defineOptions({ inheritAttrs: false });");
    expect(portal).toContain(':disabled="placement.disabled.value"');
    expect(portal).toContain(
      `<div
      ref="portalRef"
      v-bind="$attrs"
      data-sw-combobox-portal`,
    );
    expect(portal).toContain("useVuePortalPlacement");

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
