import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { format, resolveConfig } from "prettier";
import { afterEach, describe, expect, it } from "vitest";

import { selectRuntimeAdapterContract } from "../../contracts/primitive/components/select.js";
import { createVueComponentHeader } from "../../renderers/framework-adapters/vue/primitive-package.js";
import { assertVueSfcCompiles } from "../../renderers/framework-adapters/vue/sfc-compiler.js";
import { primitiveGeneratorRegistry } from "../../renderers/primitive-generator-registry.js";
import {
  buildSelectAdapterOutputModel,
  buildSelectSpecializedAdapterSpec,
} from "../../renderers/specialized-adapter-spec/select-specialized-adapter-spec.js";
import { createTsHeader } from "../../renderers/shared.js";

const GENERATED_BY = "scripts/portable-runtime/generate-vue-wrappers.ts";

describe("generated Vue Select Primitive", () => {
  const temporaryRoots: string[] = [];

  afterEach(async () => {
    await Promise.all(
      temporaryRoots.splice(0).map((root) => rm(root, { force: true, recursive: true })),
    );
  });

  it("projects every public Select part through the specialized family", () => {
    const spec = buildSelectSpecializedAdapterSpec(selectRuntimeAdapterContract);
    const output = buildSelectAdapterOutputModel(spec);
    const componentParts = output.files.flatMap((file) =>
      file.kind === "component" && file.component.family?.kind === "option-collection-overlay"
        ? [file.component.family.part]
        : [],
    );

    expect(componentParts).toEqual([
      "root",
      "label",
      "trigger",
      "value",
      "icon",
      "portal",
      "positioner",
      "popup",
      "list",
      "group",
      "groupLabel",
      "item",
      "itemText",
      "itemIndicator",
      "separator",
      "scrollUpArrow",
      "scrollDownArrow",
    ]);
  });

  it("generates deterministic, compiler-valid checked-in Select output", async () => {
    const first = await generateSelect();
    const second = await generateSelect();
    expect(first).toEqual(second);

    for (const [name, source] of first) {
      if (name.endsWith(".vue")) {
        expect(() => assertVueSfcCompiles(source, name)).not.toThrow();
      }
      const checkedIn = await readFile(
        path.join(process.cwd(), "packages/vue/src/select", name),
        "utf8",
      );
      expect(source).toBe(checkedIn);
    }
  });

  it("prints the approved dual-model, context, form and Teleport contract", async () => {
    const output = new Map(await generateSelect());
    const root = output.get("SelectRoot.vue")!;
    const portal = output.get("SelectPortal.vue")!;
    const trigger = output.get("SelectTrigger.vue")!;
    const index = output.get("index.ts")!;

    expect(root).toContain("modelValue?: string | null");
    expect(root).toContain('"update:modelValue"');
    expect(root).toContain('"update:open"');
    expect(root).toContain('emit("openChange", open, detail);');
    expect(root).toContain('emit("valueChange", value, detail);');
    expect(root).toMatch(
      /emit\("valueChange"[\s\S]*detail\.isCanceled[\s\S]*emit\("update:modelValue"/,
    );
    expect(root).toContain("export const SelectContext: InjectionKey<SelectContextValue>");
    expect(root).toContain("export const SelectItemContext: InjectionKey<SelectItemContextValue>");
    expect(root).toContain("requires an owning Select.Root");
    expect(root).toContain("requires an owning Select.Item");
    expect(root).toContain("onMounted(() =>");
    expect(root).toContain("ownedInstance?.destroy();");
    expect(root).toContain("instance?.setFormOptions");
    expect(root).toContain("props.disabled ? false : (props.open ?? uncontrolledOpen.value)");
    expect(root).toContain("instance.setDisabled(value);");
    expect(root).toContain("instance.setOpen(nextOpen, { emit: false });");
    expect(root).toContain("data-sw-select-input");
    expect(root).not.toContain(':value="initialDefaultValue');
    expect(root).toContain("portalReference");
    expect(root).not.toContain("asChild");

    expect(portal).toContain("container?: string | HTMLElement");
    expect(portal).toContain(':disabled="props.disabled || !select.mounted.value"');
    expect(portal).toContain("select.registerPortal(owner, portalRef.value)");
    expect(portal).toContain("select.registerPortal(owner, null)");
    expect(trigger).not.toContain("asChild");
    expect(index).toContain("const Select = {");
    expect(index).toContain("useSelectContext");
    expect(index).toContain("SelectOpenChangeDetails");
  });

  async function generateSelect(): Promise<Array<[string, string]>> {
    const outputRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-select-"));
    temporaryRoots.push(outputRoot);
    const entry = primitiveGeneratorRegistry.find((candidate) => candidate.component === "select");
    if (!entry) throw new Error("Select Primitive generator is missing.");

    await entry.generateTarget({
      componentHeader: createVueComponentHeader(GENERATED_BY),
      moduleHeader: createTsHeader(GENERATED_BY),
      outputRoot,
      target: "vue",
    });

    const directory = path.join(outputRoot, "select");
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
