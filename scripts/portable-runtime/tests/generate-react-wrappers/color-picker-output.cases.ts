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
} from "./shared.js";

export function defineReactColorPickerOutputTests(getTempRoot: GetTempRoot): void {
  it("generates the canonical styled Color Picker composition deterministically", async () => {
    const tempRoot = getTempRoot();
    const outputDir = "generated/styled/react";
    const primitiveOutputDir = "generated/primitives/react";
    await generateStarwindReactWrappers({ outputDir, primitiveOutputDir, repoRoot: tempRoot });

    const tree = await readGeneratedTree(path.join(tempRoot, outputDir, "color-picker"));
    const content = tree["ColorPickerContent.tsx"];
    expect(content).toContain(
      'import { IconColorPicker as ColorPicker } from "@tabler/icons-react";',
    );
    expect(content).toContain('const inputSize = size === "lg" ? "md" : "sm";');
    expect(content).toContain("const hasSwatches = swatches != null;");
    expect(content).toMatch(/<ColorPicker\s+className="size-4"\s+aria-hidden="true"/);
    expect(content).not.toContain(">Pick<");
    expect(content).toContain("size={inputSize}");
    expect(content).toContain('collisionStrategy="best-fit"');
    expect(content).toContain("(hasSwatches || showClear) &&");
    expect(content.indexOf("{swatches}")).toBeLessThan(content.indexOf("<ColorPickerClear"));
    expect(tree["styles.css"]).toContain('data-has-swatches="false"');
    expect(tree["variants.ts"]).toContain('sm: "size-6"');
    expect(tree["variants.ts"]).toContain('sm: "h-2.5');
    expect(tree["variants.ts"]).toContain("min-h-32 w-full shrink-0");
    expect(tree["variants.ts"]).toContain("max-h-[var(--sw-floating-available-height)]");

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
    expect(root).toContain("if (!details.isCanceled && !isValueControlledRef.current)");
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
