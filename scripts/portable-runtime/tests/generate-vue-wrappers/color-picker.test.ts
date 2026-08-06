import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { format, resolveConfig } from "prettier";
import { afterEach, describe, expect, it } from "vitest";

import { createVueComponentHeader } from "../../renderers/framework-adapters/vue/primitive-package.js";
import { assertVueSfcCompiles } from "../../renderers/framework-adapters/vue/sfc-compiler.js";
import { primitiveGeneratorRegistry } from "../../renderers/primitive-generator-registry.js";
import { createTsHeader } from "../../renderers/shared.js";

const GENERATED_BY = "scripts/portable-runtime/generate-vue-wrappers.ts";
const PARTS = [
  "Area",
  "AreaBackground",
  "AreaInput",
  "AreaThumb",
  "ChannelInput",
  "ChannelSlider",
  "ChannelSliderInput",
  "ChannelSliderThumb",
  "ChannelSliderTrack",
  "Clear",
  "Control",
  "EyeDropperTrigger",
  "FormatControl",
  "FormatSelect",
  "HiddenInput",
  "Label",
  "Root",
  "Swatch",
  "SwatchGroup",
  "TransparencyGrid",
  "ValueInput",
  "ValueSwatch",
  "ValueText",
] as const;

describe("generated Vue Color Picker Primitive", () => {
  const temporaryRoots: string[] = [];

  afterEach(async () => {
    await Promise.all(
      temporaryRoots.splice(0).map((root) => rm(root, { force: true, recursive: true })),
    );
  });

  it("generates the complete deterministic compiler-valid family", async () => {
    const first = await generateColorPicker();
    expect(await generateColorPicker()).toEqual(first);
    expect([...first.keys()].sort()).toEqual(
      [
        ...PARTS.map((part) => `ColorPicker${part}.vue`),
        "ColorPickerContext.ts",
        "index.ts",
      ].sort(),
    );
    for (const [name, source] of first) {
      if (name.endsWith(".vue")) expect(() => assertVueSfcCompiles(source, name)).not.toThrow();
    }
  });

  it("projects models, cancelable details, context, lifecycle, and immutable facades", async () => {
    const output = await generateColorPicker();
    const root = output.get("ColorPickerRoot.vue")!;
    const context = output.get("ColorPickerContext.ts")!;
    const index = output.get("index.ts")!;
    const all = [...output.values()].join("\n");

    expect(root).toContain("createColorPicker");
    expect(root).toContain('"update:modelValue"');
    expect(root).toContain('"update:format"');
    expect(root).toContain("details.isCanceled");
    expect(root).toContain("MutationObserver");
    expect(root).toContain("owned?.destroy()");
    expect(context).toContain("InjectionKey<ColorPickerRootContextValue>");
    expect(context).toContain("projectColorPickerInitialPart");
    expect(index).toContain("parseColor");
    expect(index).toContain("createColorPickerInitialState");
    expect(all).not.toMatch(/rgbTo|hslTo|hsbTo|pointermove\s*=>|componentName[^\n]*color-picker/i);
    const adapter = await readFile(
      path.join(
        process.cwd(),
        "scripts/portable-runtime/renderers/framework-adapters/vue/adapter.ts",
      ),
      "utf8",
    );
    expect(adapter).not.toMatch(/componentName[^\n]*color-picker|color-picker[^\n]*componentName/i);
  });

  async function generateColorPicker(): Promise<Map<string, string>> {
    const outputRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-color-picker-"));
    temporaryRoots.push(outputRoot);
    const entry = primitiveGeneratorRegistry.find(
      (candidate) => candidate.component === "color-picker",
    );
    if (!entry) throw new Error("Color Picker Primitive generator is missing.");
    await entry.generateTarget({
      componentHeader: createVueComponentHeader(GENERATED_BY),
      moduleHeader: createTsHeader(GENERATED_BY),
      outputRoot,
      target: "vue",
    });
    const directory = path.join(outputRoot, "color-picker");
    const prettierConfig =
      (await resolveConfig(path.join(process.cwd(), "prettier.config.mjs"))) ?? {};
    return new Map(
      await Promise.all(
        (await readdir(directory)).sort().map(async (name): Promise<[string, string]> => {
          const file = path.join(directory, name);
          return [
            name,
            await format(await readFile(file, "utf8"), { ...prettierConfig, filepath: file }),
          ];
        }),
      ),
    );
  }
});
