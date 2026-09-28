import * as ts from "typescript";
import { colorPickerRuntimeAdapterContract } from "../../contracts/primitive/color-picker.js";
import { reactFrameworkAdapterTarget } from "../../renderers/framework-adapters/react/index.js";
import {
  assertColorPickerFamilyProjected,
  COLOR_PICKER_PART_NAMES,
} from "../../renderers/primitive-output-model/index.js";
import {
  buildColorPickerAdapterOutputModel,
  buildColorPickerSpecializedAdapterSpec,
} from "../../renderers/specialized-adapter-spec/index.js";
import { assertTypeScriptModule, compactCode } from "../source-comparison.js";
import type { GetTempRoot } from "./shared.js";
import {
  expect,
  formatGeneratedOutput,
  generateReactPrimitiveWrappers,
  generateStarwindReactWrappers,
  it,
  path,
  readFormattedGeneratedTree,
  readGeneratedFile,
  readGeneratedTree,
  writeFile,
} from "./shared.js";

export function defineReactColorPickerOutputTests(getTempRoot: GetTempRoot): void {
  it("typechecks normalized styled swatches in the public React consumer environment", async () => {
    const tempRoot = getTempRoot();
    const outputDir = "generated/styled/react";
    await generateStarwindReactWrappers({
      outputDir,
      primitiveOutputDir: "generated/primitives/react",
      repoRoot: tempRoot,
    });
    const editor = await readGeneratedFile(
      path.join(tempRoot, outputDir, "color-picker"),
      "ColorPickerDefaultEditor.tsx",
    );
    const normalization = editor.slice(
      editor.indexOf("const isSwatchDescriptor"),
      editor.indexOf("const hasSwatchesAttribute"),
    );
    const compileNormalization = async (source: string) => {
      const entry = path.join(tempRoot, "color-picker-public-consumer.ts");
      await writeFile(
        entry,
        `import type { ColorPickerValue } from "@starwind-ui/react/color-picker";
type Props = { swatches?: readonly (ColorPickerValue | { value: ColorPickerValue; label: string; disabled?: boolean })[] };
declare const props: Props;
const { swatches = [] } = props;
${source}
normalizedSwatches.forEach((swatch) => {
  const value: ColorPickerValue = swatch.value;
  const disabled: boolean | undefined = swatch.disabled;
  void value;
  void disabled;
});
`,
      );
      const program = ts.createProgram([entry], {
        baseUrl: process.cwd(),
        jsx: ts.JsxEmit.ReactJSX,
        module: ts.ModuleKind.ESNext,
        moduleResolution: ts.ModuleResolutionKind.Bundler,
        noEmit: true,
        paths: {
          "@starwind-ui/react/*": ["packages/react/src/*/index.ts"],
          "@starwind-ui/runtime/*": ["packages/runtime/src/components/*/index.ts"],
        },
        skipLibCheck: true,
        strict: false,
        target: ts.ScriptTarget.ES2022,
      });
      return ts
        .getPreEmitDiagnostics(program)
        .filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error)
        .map((diagnostic) => diagnostic.code);
    };

    expect(
      await compileNormalization(
        'const normalizedSwatches = swatches.map((swatch) => typeof swatch === "object" && swatch !== null && "value" in swatch ? swatch : { value: swatch, label: String(swatch) });',
      ),
    ).toEqual(expect.arrayContaining([2322, 2339]));
    expect(await compileNormalization(normalization)).toEqual([]);
  });

  it("generates the simplified styled Color Picker composition deterministically", async () => {
    const tempRoot = getTempRoot();
    const outputDir = "generated/styled/react";
    const primitiveOutputDir = "generated/primitives/react";
    await generateStarwindReactWrappers({ outputDir, primitiveOutputDir, repoRoot: tempRoot });

    const tree = await readGeneratedTree(path.join(tempRoot, outputDir, "color-picker"));
    expect(Object.keys(tree).sort()).toEqual(
      [
        "ColorPicker.tsx",
        "ColorPickerArea.tsx",
        "ColorPickerChannelInput.tsx",
        "ColorPickerChannelSlider.tsx",
        "ColorPickerClear.tsx",
        "ColorPickerContent.tsx",
        "ColorPickerDefaultEditor.tsx",
        "ColorPickerEyeDropper.tsx",
        "ColorPickerInput.tsx",
        "ColorPickerSwatch.tsx",
        "ColorPickerSwatchGroup.tsx",
        "ColorPickerTrigger.tsx",
        "ColorPickerValueSwatch.tsx",
        "index.ts",
        "styles.css",
        "variants.ts",
      ].sort(),
    );
    const root = tree["ColorPicker.tsx"];
    const content = tree["ColorPickerContent.tsx"];
    const editor = tree["ColorPickerDefaultEditor.tsx"];
    expect(compactCode(editor)).toContain(
      compactCode('import { IconColorPicker as ColorPicker } from "@tabler/icons-react";'),
    );
    expect(compactCode(editor)).not.toContain(compactCode('from "react";'));
    expect(compactCode(editor)).not.toContain(compactCode("...rest"));
    expect(compactCode(editor)).toContain(compactCode("formatContentSize={size}"));
    expect(compactCode(editor)).toContain(compactCode("const isSwatchDescriptor = ("));
    expect(compactCode(editor)).toContain(
      compactCode("swatch is Extract<(typeof swatches)[number], { value: unknown }>"),
    );
    expect(compactCode(editor)).toContain(compactCode("isSwatchDescriptor(swatch)"));
    expect(compactCode(editor)).toContain(compactCode("disabled: undefined"));
    expect(compactCode(editor)).not.toContain(compactCode("inputSize"));
    expect(compactCode(editor)).toContain(compactCode("portalContainer={portalContainer}"));
    expect(compactCode(editor)).toContain(compactCode("disablePortal={disablePortal}"));
    expect(compactCode(editor)).toContain(compactCode("normalizedSwatches.length > 0"));
    expect(editor).toMatch(/<ColorPicker\s+className="size-4"\s+aria-hidden="true"/);
    expect(compactCode(editor)).not.toContain(compactCode(">Pick<"));
    expect(compactCode(editor)).toContain(compactCode("normalizedSwatches.map"));
    expect(compactCode(editor)).toContain(compactCode("<ColorPickerClear"));
    expect(compactCode(content)).toContain(compactCode('collisionStrategy="best-fit"'));
    expect(compactCode(content)).toContain(compactCode("<ColorPickerDefaultEditor"));
    expect(compactCode(content)).toContain(compactCode("portalContainer={portalContainer}"));
    expect(compactCode(content)).toContain(compactCode("disablePortal={disablePortal}"));
    expect(compactCode(content)).toContain(compactCode('size = "md"'));
    expect(content).toMatch(/\{\.\.\.rest\}[\s\S]*data-size=\{size\}/);
    expect(compactCode(root)).toContain(compactCode("inline = false"));
    expect(compactCode(root)).toContain(compactCode("portalContainer?: string;"));
    expect(compactCode(root)).toContain(compactCode("disablePortal?: boolean;"));
    expect(compactCode(root)).toContain(compactCode("portalContainer={portalContainer}"));
    expect(compactCode(root)).toContain(compactCode("disablePortal={disablePortal}"));
    expect(compactCode(root)).toContain(compactCode("alpha = true"));
    expect(compactCode(root)).toContain(compactCode("allowEmpty={clearable}"));
    expect(compactCode(root)).toContain(compactCode('format ?? formats[0] ?? "hex"'));
    expect(compactCode(root)).toContain(compactCode('size = "md"'));
    expect(root).toMatch(/\{\.\.\.rest\}[\s\S]*data-size=\{size\}/);
    expect(compactCode(root)).toContain(compactCode("requestedFormats.includes(resolvedFormat)"));
    expect(root.match(/<ColorPickerPrimitive\.HiddenInput/g)).toHaveLength(2);
    expect(compactCode(root)).toContain(
      compactCode("Parameters<NonNullable<typeof onFormatChange>>"),
    );
    expect(compactCode(tree["ColorPickerInput.tsx"])).toContain(
      compactCode('formatControl?: "select" | "native" | "none"'),
    );
    expect(compactCode(tree["ColorPickerInput.tsx"])).toContain(
      compactCode('formatContentSize?: "sm" | "md" | "lg"'),
    );
    expect(compactCode(tree["ColorPickerInput.tsx"])).toContain(
      compactCode('formatContentSize = "md"'),
    );
    expect(tree["ColorPickerInput.tsx"]).toMatch(/<SelectContent\s+size=\{formatContentSize\}/);
    expect(compactCode(tree["ColorPickerInput.tsx"])).toContain(
      compactCode("portalContainer={portalContainer}"),
    );
    expect(compactCode(tree["ColorPickerInput.tsx"])).toContain(
      compactCode("disablePortal={disablePortal}"),
    );
    expect(compactCode(tree["ColorPickerInput.tsx"])).toContain(
      compactCode("normalizedFormats.map"),
    );
    expect(compactCode(tree["ColorPickerArea.tsx"])).toContain(
      compactCode("<ColorPickerPrimitive.AreaThumb"),
    );
    expect(compactCode(tree["index.ts"])).not.toContain(compactCode("ColorPickerDefaultEditor"));
    expect(compactCode(tree["index.ts"])).not.toContain(compactCode("InlineRoot"));
    expect(compactCode(tree["styles.css"])).toContain(compactCode('data-has-swatches="false"'));
    expect(compactCode(tree["styles.css"])).toContain(
      compactCode(
        '[data-slot="color-picker"][data-size="sm"], [data-sw-color-picker-content][data-size="sm"]',
      ),
    );
    expect(compactCode(tree["variants.ts"])).toContain(
      compactCode("size-(--sw-color-picker-swatch-size)"),
    );
    expect(compactCode(tree["variants.ts"])).toContain(
      compactCode("h-(--sw-color-picker-slider-size)"),
    );
    for (const part of [
      "ColorPickerArea.tsx",
      "ColorPickerChannelInput.tsx",
      "ColorPickerChannelSlider.tsx",
      "ColorPickerClear.tsx",
      "ColorPickerEyeDropper.tsx",
      "ColorPickerInput.tsx",
      "ColorPickerSwatch.tsx",
      "ColorPickerSwatchGroup.tsx",
      "ColorPickerTrigger.tsx",
      "ColorPickerValueSwatch.tsx",
    ]) {
      expect(compactCode(tree[part])).not.toContain(compactCode("size?:"));
    }
    expect(compactCode(tree["variants.ts"])).toContain(compactCode("min-h-32 w-full shrink-0"));
    expect(compactCode(tree["variants.ts"])).toContain(
      compactCode("max-h-(--sw-floating-available-height)"),
    );

    const first = tree;
    await generateStarwindReactWrappers({ outputDir, primitiveOutputDir, repoRoot: tempRoot });
    expect(await readGeneratedTree(path.join(tempRoot, outputDir, "color-picker"))).toEqual(first);
  });

  it("projects the generic Color Picker family through the React target boundary", () => {
    const generic = buildColorPickerAdapterOutputModel(
      buildColorPickerSpecializedAdapterSpec(colorPickerRuntimeAdapterContract),
    );
    const projected = reactFrameworkAdapterTarget.primitive.outputModel.projectSpecialized(generic);

    expect(projected.files.every((file) => file.target === "react")).toBe(true);
    expect(
      projected.files.every(
        (file) =>
          (file.kind === "component" &&
            (file.component.family as { kind?: string } | undefined)?.kind ===
              "react-color-picker") ||
          (file.kind === "index" &&
            (file.family as { kind?: string } | undefined)?.kind === "react-color-picker"),
      ),
    ).toBe(true);
    expect(() => assertColorPickerFamilyProjected(projected, "react")).not.toThrow();
  });

  it("generates the complete React Color Picker family and public namespace", async () => {
    const outputRoot = path.join(getTempRoot(), "generated/primitives/react");
    await generateReactPrimitiveWrappers({
      outputDir: "generated/primitives/react",
      repoRoot: getTempRoot(),
    });

    const tree = await readFormattedGeneratedTree(path.join(outputRoot, "color-picker"));
    const index = tree["index.ts"];
    expect(Object.keys(tree)).toHaveLength(COLOR_PICKER_PART_NAMES.length + 1);
    expect(compactCode(index)).toContain(compactCode("const ColorPicker = {"));
    expect(compactCode(index)).toContain(compactCode("createColorPickerInitialState"));
    expect(compactCode(index)).toContain(compactCode("projectColorPickerInitialPart"));
    expect(compactCode(index)).toContain(compactCode('from "@starwind-ui/runtime/color-picker";'));
    expect(compactCode(index)).toContain(compactCode("FormatSelect: ColorPickerFormatSelect"));
    expect(compactCode(index)).toContain(compactCode("FormatControl: ColorPickerFormatControl"));

    for (const part of COLOR_PICKER_PART_NAMES) {
      const namespaceKey = `${part[0]!.toUpperCase()}${part.slice(1)}`;
      const exportName = `ColorPicker${namespaceKey}`;
      expect(compactCode(tree[`${exportName}.tsx`])).toContain(compactCode(`React.forwardRef`));
      expect(index).toContain(`${namespaceKey}: ${exportName}`);
      expect(index).toContain(exportName);
    }

    const formatControl = tree["ColorPickerFormatControl.tsx"];
    expect(compactCode(formatControl)).toContain(compactCode('{ part: "formatControl" }'));
    expect(compactCode(formatControl)).toContain(
      compactCode('"data-sw-color-picker-format-control": ""'),
    );
    expect(compactCode(formatControl)).toContain(
      compactCode('ColorPickerFormatControl.displayName = "ColorPicker.FormatControl"'),
    );
  }, 30_000);

  it("prints fixed controlledness, cancel-safe callbacks, latest refs, and non-emitting prop sync", async () => {
    const outputRoot = path.join(getTempRoot(), "generated/primitives/react");
    await generateReactPrimitiveWrappers({
      outputDir: "generated/primitives/react",
      repoRoot: getTempRoot(),
    });

    const root = await readGeneratedFile(outputRoot, "color-picker/ColorPickerRoot.tsx");
    assertTypeScriptModule(root); // Ordinary behavior is covered by the component browser suite.

    const area = await readGeneratedFile(outputRoot, "color-picker/ColorPickerArea.tsx");
    const areaInput = await readGeneratedFile(outputRoot, "color-picker/ColorPickerAreaInput.tsx");
    const slider = await readGeneratedFile(outputRoot, "color-picker/ColorPickerChannelSlider.tsx");
    const sliderInput = await readGeneratedFile(
      outputRoot,
      "color-picker/ColorPickerChannelSliderInput.tsx",
    );
    const formatControl = await readGeneratedFile(
      outputRoot,
      "color-picker/ColorPickerFormatControl.tsx",
    );
    expect(compactCode(area)).toContain(compactCode("ColorPickerAreaContext.Provider"));
    expect(compactCode(areaInput)).toContain(compactCode("useColorPickerAreaContext()"));
    expect(compactCode(areaInput)).toContain(compactCode("aria-roledescription"));
    expect(compactCode(areaInput)).toContain(compactCode('props["aria-label"]'));
    expect(compactCode(slider)).toContain(compactCode("ColorPickerChannelSliderContext.Provider"));
    expect(compactCode(sliderInput)).toContain(compactCode("useColorPickerChannelSliderContext()"));
    expect(compactCode(sliderInput)).toContain(compactCode('props["aria-label"]'));
    expect(compactCode(formatControl)).toContain(compactCode("useColorPickerPartProjection("));
    expect(formatControl).not.toMatch(/createColorPicker|starwind:format-change|setFormat/);
  }, 30_000);

  it("keeps generated Color Picker source deterministic with the checked-in React package", async () => {
    const outputRoot = path.join(getTempRoot(), "generated/primitives/react");
    await generateReactPrimitiveWrappers({
      outputDir: "generated/primitives/react",
      repoRoot: getTempRoot(),
    });
    await formatGeneratedOutput([path.join(outputRoot, "color-picker")]);

    expect(await readFormattedGeneratedTree(path.join(outputRoot, "color-picker"))).toEqual(
      await readFormattedGeneratedTree(path.join(process.cwd(), "packages/react/src/color-picker")),
    );
  }, 30_000);
}
