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
import type { GetTempRoot } from "./shared.js";
import {
  expect,
  formatGeneratedOutput,
  generateReactPrimitiveWrappers,
  generateStarwindReactWrappers,
  it,
  path,
  readGeneratedFile,
  readFormattedGeneratedTree,
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
    expect(editor).toContain(
      'import { IconColorPicker as ColorPicker } from "@tabler/icons-react";',
    );
    expect(editor).not.toContain('from "react";');
    expect(editor).not.toContain("...rest");
    expect(editor).toContain("formatContentSize={size}");
    expect(editor).toContain("const isSwatchDescriptor = (");
    expect(editor).toContain("swatch is Extract<(typeof swatches)[number], { value: unknown }>");
    expect(editor).toContain("isSwatchDescriptor(swatch)");
    expect(editor).toContain("disabled: undefined");
    expect(editor).not.toContain("inputSize");
    expect(editor).toContain("portalContainer={portalContainer}");
    expect(editor).toContain("disablePortal={disablePortal}");
    expect(editor).toContain("normalizedSwatches.length > 0");
    expect(editor).toMatch(/<ColorPicker\s+className="size-4"\s+aria-hidden="true"/);
    expect(editor).not.toContain(">Pick<");
    expect(editor).toContain("normalizedSwatches.map");
    expect(editor).toContain("<ColorPickerClear");
    expect(content).toContain('collisionStrategy="best-fit"');
    expect(content).toContain("<ColorPickerDefaultEditor");
    expect(content).toContain("portalContainer={portalContainer}");
    expect(content).toContain("disablePortal={disablePortal}");
    expect(content).toContain('size = "md"');
    expect(content).toMatch(/\{\.\.\.rest\}[\s\S]*data-size=\{size\}/);
    expect(root).toContain("inline = false");
    expect(root).toContain("portalContainer?: string;");
    expect(root).toContain("disablePortal?: boolean;");
    expect(root).toContain("portalContainer={portalContainer}");
    expect(root).toContain("disablePortal={disablePortal}");
    expect(root).toContain("alpha = true");
    expect(root).toContain("allowEmpty={clearable}");
    expect(root).toContain('format ?? formats[0] ?? "hex"');
    expect(root).toContain('size = "md"');
    expect(root).toMatch(/\{\.\.\.rest\}[\s\S]*data-size=\{size\}/);
    expect(root).toContain("requestedFormats.includes(resolvedFormat)");
    expect(root.match(/<ColorPickerPrimitive\.HiddenInput/g)).toHaveLength(2);
    expect(root).toContain("Parameters<NonNullable<typeof onFormatChange>>");
    expect(tree["ColorPickerInput.tsx"]).toContain('formatControl?: "select" | "native" | "none"');
    expect(tree["ColorPickerInput.tsx"]).toContain('formatContentSize?: "sm" | "md" | "lg"');
    expect(tree["ColorPickerInput.tsx"]).toContain('formatContentSize = "md"');
    expect(tree["ColorPickerInput.tsx"]).toMatch(/<SelectContent\s+size=\{formatContentSize\}/);
    expect(tree["ColorPickerInput.tsx"]).toContain("portalContainer={portalContainer}");
    expect(tree["ColorPickerInput.tsx"]).toContain("disablePortal={disablePortal}");
    expect(tree["ColorPickerInput.tsx"]).toContain("normalizedFormats.map");
    expect(tree["ColorPickerArea.tsx"]).toContain("<ColorPickerPrimitive.AreaThumb");
    expect(tree["index.ts"]).not.toContain("ColorPickerDefaultEditor");
    expect(tree["index.ts"]).not.toContain("InlineRoot");
    expect(tree["styles.css"]).toContain('data-has-swatches="false"');
    expect(tree["styles.css"]).toContain(
      '[data-slot="color-picker"][data-size="sm"], [data-sw-color-picker-content][data-size="sm"]',
    );
    expect(tree["variants.ts"]).toContain("size-(--sw-color-picker-swatch-size)");
    expect(tree["variants.ts"]).toContain("h-(--sw-color-picker-slider-size)");
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
      expect(tree[part]).not.toContain("size?:");
    }
    expect(tree["variants.ts"]).toContain("min-h-32 w-full shrink-0");
    expect(tree["variants.ts"]).toContain("max-h-(--sw-floating-available-height)");

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
    expect(index).toContain("const ColorPicker = {");
    expect(index).toContain("createColorPickerInitialState");
    expect(index).toContain("projectColorPickerInitialPart");
    expect(index).toContain('from "@starwind-ui/runtime/color-picker";');
    expect(index).toContain("FormatSelect: ColorPickerFormatSelect");
    expect(index).toContain("FormatControl: ColorPickerFormatControl");

    for (const part of COLOR_PICKER_PART_NAMES) {
      const namespaceKey = `${part[0]!.toUpperCase()}${part.slice(1)}`;
      const exportName = `ColorPicker${namespaceKey}`;
      expect(tree[`${exportName}.tsx`]).toContain(`React.forwardRef`);
      expect(index).toContain(`${namespaceKey}: ${exportName}`);
      expect(index).toContain(exportName);
    }

    const formatControl = tree["ColorPickerFormatControl.tsx"];
    expect(formatControl).toContain('{ part: "formatControl" }');
    expect(formatControl).toContain('"data-sw-color-picker-format-control": ""');
    expect(formatControl).toContain(
      'ColorPickerFormatControl.displayName = "ColorPicker.FormatControl"',
    );
  }, 30_000);

  it("prints fixed controlledness, cancel-safe callbacks, latest refs, and non-emitting prop sync", async () => {
    const outputRoot = path.join(getTempRoot(), "generated/primitives/react");
    await generateReactPrimitiveWrappers({
      outputDir: "generated/primitives/react",
      repoRoot: getTempRoot(),
    });

    const root = await readGeneratedFile(outputRoot, "color-picker/ColorPickerRoot.tsx");
    expect(root).toContain("const isValueControlledRef = React.useRef(value !== undefined);");
    expect(root).toContain('"value" | "defaultValue" | "dir"');
    expect(root).toContain("const isFormatControlledRef = React.useRef(format !== undefined);");
    expect(root).toContain("const rootOwnershipPendingRef = React.useRef(true);");
    expect(root).toContain("createColorPickerInitialState({");
    expect(root).toContain('projectColorPickerInitialPart(initialState, { part: "root" })');
    expect(root).toContain("rootOwnershipPendingRef.current = false;");
    expect(root).toContain("const initialProjectionRef = React.useRef<");
    expect(root).toContain("ownershipPendingRef.current = false;");
    expect(root).toContain(
      "if (isValueControlledRef.current && value !== undefined) valueRef.current = value;",
    );
    expect(root).toContain(
      "if (isFormatControlledRef.current && format !== undefined) formatRef.current = format;",
    );
    expect(root).toContain("onValueChangeRef.current = onValueChange;");
    expect(root).toContain("onFormatChangeRef.current = onFormatChange;");
    expect(root).toContain("onValueChange: (nextValue, details) => {");
    expect(root).toContain('instance.subscribe("valueChange", (details) => {');
    expect(root).toContain("if (!isValueControlledRef.current) {");
    expect(root).toContain("instanceRef.current?.setValue(value, { emit: false });");
    expect(root).toContain("instanceRef.current?.setFormat(format, { emit: false });");
    expect(root).toContain("instanceRef.current?.refresh({ preserveState: true });");
    expect(root).toContain("new MutationObserver");
    expect(root).toContain("colorPickerStructuralFingerprint(");
    expect(root).toContain("captureColorPickerOwnership(");
    expect(root).toContain("replayColorPickerOwnership(");
    expect(root).toContain("const authoredAriaHistoryRef = React.useRef(new Set<string>());");
    expect(root).toContain("delete dynamicAuthoredProps[name];");
    expect(root).not.toContain("}, [children]);");
    expect(root).toContain("instance.setName(name ?? null);");
    expect(root).toContain("locale: locale ?? null");
    expect(root).toContain("instance.destroy();");
    expect(root).toContain("ColorPickerRootContext.Provider");
    expect(root).toContain("ColorPickerAreaContext");
    expect(root).toContain("ColorPickerChannelSliderContext");
    expect(root).toContain('projected[name === "value" ? "defaultValue" : name] = value;');
    expect(root).toContain('name === "data-sw-color-picker-initial-owned"');
    expect(root).not.toContain("parseColor(");
    expect(root).not.toMatch(/(?:rgb|hsl|hsb)\s*(?:to|=>)|pointermove|Math\.(?:round|floor)/i);

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
    expect(area).toContain("ColorPickerAreaContext.Provider");
    expect(areaInput).toContain("useColorPickerAreaContext()");
    expect(areaInput).not.toContain("ariaRoleDescription");
    expect(areaInput).not.toContain('props["aria-label"]');
    expect(slider).toContain("ColorPickerChannelSliderContext.Provider");
    expect(sliderInput).toContain("useColorPickerChannelSliderContext()");
    expect(sliderInput).not.toContain('props["aria-label"]');
    expect(formatControl).toContain("useColorPickerPartProjection(");
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
