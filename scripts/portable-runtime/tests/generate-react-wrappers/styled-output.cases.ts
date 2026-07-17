import {
  assertNoStarwindClassHooksInStyledContracts,
  assertNoStarwindClassHooksInTree,
} from "../../starwind-class-guard.js";
import type { StyledAdapterContract } from "../../contracts/styled/types.js";
import type { GetTempRoot } from "./shared.js";
import {
  expect,
  formatGeneratedOutput,
  generateStarwindReactWrappers,
  it,
  path,
  readGeneratedFile,
  readGeneratedTree,
} from "./shared.js";
import { assertReactStyledFormOutput } from "./styled-output/form.cases.js";
import {
  assertReactBadgeToneAppearanceFoundationOutput,
  assertReactStyledFoundationOutput,
} from "./styled-output/foundation.cases.js";
import { assertReactStyledMediaOutput } from "./styled-output/media.cases.js";
import { assertReactStyledOverlayOutput } from "./styled-output/overlay.cases.js";
import { assertReactStyledStateOutput } from "./styled-output/state.cases.js";

export function defineReactStyledOutputTests(getTempRoot: GetTempRoot): void {
  it("renders declared forward refs generically without changing plain components", async () => {
    const tempRoot = getTempRoot();
    const outputDir = "generated/starwind-runtime";
    const contracts: StyledAdapterContract[] = [
      {
        component: "forward-ref-probe",
        components: [
          {
            exportName: "DeclaredTarget",
            forwardRef: { targetType: "HTMLButtonElement" },
            props: {
              extends: [{ type: "htmlAttributes", element: "button" }],
              fields: [
                {
                  name: "ref",
                  optional: true,
                  type: "React.Ref<HTMLButtonElement>",
                  frameworks: ["react"],
                },
              ],
            },
            destructure: { props: [{ name: "ref", frameworks: ["react"] }], rest: "rest" },
            render: [
              {
                type: "element",
                tag: "button",
                selfClosing: true,
                attrs: [
                  { name: "spread", value: { type: "variable", name: "rest" } },
                  {
                    name: "ref",
                    value: { type: "variable", name: "ref" },
                    frameworks: ["react"],
                  },
                ],
              },
            ],
          },
          {
            exportName: "PlainSibling",
            props: { extends: [{ type: "htmlAttributes", element: "div" }] },
            destructure: { props: [], rest: "rest" },
            render: [
              {
                type: "element",
                tag: "div",
                selfClosing: true,
                attrs: [{ name: "spread", value: { type: "variable", name: "rest" } }],
              },
            ],
          },
        ],
        defaultExport: { DeclaredTarget: "DeclaredTarget", PlainSibling: "PlainSibling" },
        publicExports: ["DeclaredTarget", "PlainSibling"],
      },
    ];

    await generateStarwindReactWrappers({
      contracts,
      outputDir,
      primitiveOutputDir: "generated/primitives/react",
      repoRoot: tempRoot,
    });

    const outputRoot = path.join(tempRoot, outputDir, "forward-ref-probe");
    const forwarded = await readGeneratedFile(outputRoot, "DeclaredTarget.tsx");
    const plain = await readGeneratedFile(outputRoot, "PlainSibling.tsx");

    expect(forwarded).toContain('import * as React from "react";');
    expect(forwarded).toContain("React.forwardRef<HTMLButtonElement, DeclaredTargetProps>");
    expect(forwarded).toContain("function DeclaredTarget(props, forwardedRef)");
    expect(forwarded).toContain("ref={forwardedRef}");
    expect(forwarded).not.toMatch(/\bref,\s*\n/);
    expect(plain).toContain('import type * as React from "react";');
    expect(plain).toContain("function PlainSibling(props: PlainSiblingProps)");
    expect(plain).not.toContain("forwardRef");
  });

  it("generates Badge tone and appearance styled React output", async () => {
    const tempRoot = getTempRoot();
    await generateStarwindReactWrappers({
      outputDir: "generated/starwind-runtime",
      primitiveOutputDir: "generated/starwind-runtime/primitives/react",
      repoRoot: tempRoot,
    });

    await assertReactBadgeToneAppearanceFoundationOutput(
      path.join(tempRoot, "generated/starwind-runtime"),
    );
  });

  it("generates styled Starwind React wrappers that compose primitive wrappers", async () => {
    const tempRoot = getTempRoot();
    await generateStarwindReactWrappers({
      outputDir: "generated/starwind-runtime",
      primitiveOutputDir: "generated/starwind-runtime/primitives/react",
      repoRoot: tempRoot,
    });

    const outputRoot = path.join(tempRoot, "generated/starwind-runtime");
    await assertReactStyledFoundationOutput(outputRoot);
    await assertReactStyledMediaOutput(outputRoot);
    await assertReactStyledFormOutput(outputRoot);
    await assertReactStyledStateOutput(outputRoot);
    await assertReactStyledOverlayOutput(outputRoot);
    await assertNoStarwindClassHooksInTree(outputRoot);
    await assertNoStarwindClassHooksInStyledContracts();
  });

  it("uses React primitive package imports for default styled output", async () => {
    const tempRoot = getTempRoot();
    await generateStarwindReactWrappers({
      repoRoot: tempRoot,
    });

    const outputRoot = path.join(tempRoot, "apps/react-demo/src/components/starwind-runtime");
    const button = await readGeneratedFile(outputRoot, "button/Button.tsx");
    const carousel = await readGeneratedFile(outputRoot, "carousel/Carousel.tsx");
    const carouselNext = await readGeneratedFile(outputRoot, "carousel/CarouselNext.tsx");
    const carouselPrevious = await readGeneratedFile(outputRoot, "carousel/CarouselPrevious.tsx");
    const carouselVariants = await readGeneratedFile(outputRoot, "carousel/variants.ts");
    const form = await readGeneratedFile(outputRoot, "form/Form.tsx");
    const field = await readGeneratedFile(outputRoot, "field/Field.tsx");
    const navigationMenu = await readGeneratedFile(
      outputRoot,
      "navigation-menu/NavigationMenu.tsx",
    );
    const select = await readGeneratedFile(outputRoot, "select/Select.tsx");
    const themeToggle = await readGeneratedFile(outputRoot, "theme-toggle/ThemeToggle.tsx");
    const toaster = await readGeneratedFile(outputRoot, "toast/Toaster.tsx");

    expect(button).toContain('import ButtonPrimitive from "@starwind-ui/react/button";');
    expect(button).not.toContain("primitives/react");
    expect(carousel).toContain('import CarouselPrimitive from "@starwind-ui/react/carousel";');
    expect(carousel).toContain('opts?: import("@starwind-ui/react/carousel").CarouselOptions');
    expect(carouselVariants).toContain(
      'import { button as buttonVariants } from "../button/variants";',
    );
    expect(carouselVariants).toContain("export const carouselControl = tv({");
    expect(carouselVariants).toContain("extend: buttonVariants");
    expect(carouselVariants).toContain("defaultVariants: {");
    expect(carouselVariants).toContain('variant: "outline"');
    expect(carouselVariants).toContain('size: "icon"');
    expect(carouselVariants).toContain('"absolute size-8 rounded-full"');
    expect(carouselNext).toContain("const controlClassName = carouselNext({ class: className });");
    expect(carouselNext).toContain(
      "className={carouselControl({ variant, size, class: controlClassName })}",
    );
    expect(carouselPrevious).toContain(
      "const controlClassName = carouselPrevious({ class: className });",
    );
    expect(carouselPrevious).toContain(
      "className={carouselControl({ variant, size, class: controlClassName })}",
    );
    expect(form).toContain('validationTiming?: import("@starwind-ui/react/form")');
    expect(field).toContain('validationTiming?: import("@starwind-ui/react/form")');
    expect(navigationMenu).toContain(
      'import NavigationMenuPrimitive from "@starwind-ui/react/navigation-menu";',
    );
    expect(navigationMenu).toContain('import("@starwind-ui/react/navigation-menu")');
    expect(navigationMenu).not.toContain('import("@starwind-ui/runtime")');
    expect(select).toContain('import SelectPrimitive from "@starwind-ui/react/select";');
    expect(select).toContain('import("@starwind-ui/react/select").SelectOpenChangeDetails');
    expect(select).toContain('import("@starwind-ui/react/select").SelectValueChangeDetails');
    expect(select).not.toContain('import("@starwind-ui/runtime")');
    expect(themeToggle).toContain(
      'import { initThemeController } from "@starwind-ui/react/theme";',
    );
    expect(toaster).toContain('import ToastPrimitive from "@starwind-ui/react/toast";');

    const outputTree = await readGeneratedTree(outputRoot);
    const directRuntimeRefs = Object.entries(outputTree)
      .filter(([fileName]) => /\.(ts|tsx)$/.test(fileName))
      .filter(([, contents]) => contents.includes("@starwind-ui/runtime"));

    expect(directRuntimeRefs).toEqual([]);
  });

  it("generates the complete controlled React Color Picker composition deterministically", async () => {
    const tempRoot = getTempRoot();
    const outputDir = "generated/starwind-runtime";
    const primitiveOutputDir = "generated/starwind-runtime/primitives/react";
    const generate = () =>
      generateStarwindReactWrappers({ outputDir, primitiveOutputDir, repoRoot: tempRoot });

    await generate();

    const outputRoot = path.join(tempRoot, outputDir);
    const firstTree = await readGeneratedTree(path.join(outputRoot, "color-picker"));
    const root = firstTree["ColorPicker.tsx"];
    const inlineRoot = firstTree["ColorPickerRoot.tsx"];
    const content = firstTree["ColorPickerContent.tsx"];
    const area = firstTree["ColorPickerArea.tsx"];
    const channelSlider = firstTree["ColorPickerChannelSlider.tsx"];
    const input = firstTree["ColorPickerInput.tsx"];
    const formatSelect = firstTree["ColorPickerFormatSelect.tsx"];
    const nativeFormatSelect = firstTree["ColorPickerNativeFormatSelect.tsx"];
    const valueInput = firstTree["ColorPickerValueInput.tsx"];
    const trigger = firstTree["ColorPickerTrigger.tsx"];
    const index = firstTree["index.ts"];
    const styles = firstTree["styles.css"];
    const variants = firstTree["variants.ts"];
    const popoverOpen = root.match(/<Popover[\s\S]*?>/)?.[0];

    expect(Object.keys(firstTree).sort()).toEqual([
      "ColorPicker.tsx",
      "ColorPickerArea.tsx",
      "ColorPickerAreaThumb.tsx",
      "ColorPickerChannelInput.tsx",
      "ColorPickerChannelSlider.tsx",
      "ColorPickerClear.tsx",
      "ColorPickerContent.tsx",
      "ColorPickerControl.tsx",
      "ColorPickerEyeDropper.tsx",
      "ColorPickerFormatSelect.tsx",
      "ColorPickerHiddenInput.tsx",
      "ColorPickerInput.tsx",
      "ColorPickerLabel.tsx",
      "ColorPickerNativeFormatSelect.tsx",
      "ColorPickerRoot.tsx",
      "ColorPickerSliders.tsx",
      "ColorPickerSwatch.tsx",
      "ColorPickerSwatchGroup.tsx",
      "ColorPickerTrigger.tsx",
      "ColorPickerValueInput.tsx",
      "ColorPickerValueSwatch.tsx",
      "index.ts",
      "styles.css",
      "variants.ts",
    ]);
    expect(root).toContain('import { Popover } from "../popover";');
    expect(root).toContain('import ColorPickerRoot from "./ColorPickerRoot";');
    expect(root).toContain('import * as React from "react";');
    expect(root).toContain("React.forwardRef<HTMLDivElement, ColorPickerProps>");
    expect(root).toContain("function ColorPicker(props, forwardedRef)");
    expect(root).not.toMatch(/&\s*React\.ComponentProps<typeof Popover>/);
    expect(root).toContain("value={value}");
    expect(root).toContain("format={format}");
    expect(root).not.toContain('format = "hex"');
    expect(root).toContain("onValueChange={onValueChange}");
    expect(root).toContain("onValueCommitted={onValueCommitted}");
    expect(root).toContain("onFormatChange={onFormatChange}");
    expect(root).toContain("onFormatChange,");
    expect(root).toContain("defaultOpen={defaultOpen}");
    expect(root).toContain("onOpenChange={onOpenChange}");
    expect(popoverOpen).not.toContain("{...rest}");
    expect(root).toMatch(/<ColorPickerRoot[\s\S]*?\{\.\.\.rest\}[\s\S]*?data-floating-root/);
    expect(root).not.toContain("useState");
    expect(root).not.toContain("setValue");
    expect(root).not.toContain("setFormat");
    expect(root).not.toContain("open={value}");
    expect(root).toContain("data-floating-root={true}");
    expect(inlineRoot).toContain(
      'import ColorPickerPrimitive from "../primitives/react/color-picker";',
    );
    expect(inlineRoot).toContain("<ColorPickerPrimitive.Root");
    expect(inlineRoot).toContain('import * as React from "react";');
    expect(inlineRoot).toContain("React.forwardRef<HTMLDivElement, ColorPickerRootProps>");
    expect(inlineRoot).toContain("function ColorPickerRoot(props, forwardedRef)");
    expect(inlineRoot).toContain("ref={forwardedRef}");
    expect(inlineRoot).not.toMatch(/\bref,\s*\n/);
    expect(inlineRoot).toContain(
      'defaultValue?: import("@starwind-ui/runtime/color-picker").ColorPickerValue',
    );
    expect(inlineRoot).toContain("onValueChange={onValueChange}");
    expect(inlineRoot).not.toContain("Popover");
    expect(inlineRoot).not.toContain("data-floating-root");
    expect(content).toMatch(/<ColorPickerArea\s+size=\{size\}\s*\/>/);
    expect(content).toContain('data-slot="color-picker-slider-action-row"');
    expect(content).toMatch(
      /<ColorPickerSliders\s+alpha=\{alpha\}\s+size=\{size\}\s+className="min-w-0 flex-1"\s*\/>/,
    );
    expect(content).toContain("{showEyeDropper && (");
    expect(content).toContain('data-slot="color-picker-value-format-row"');
    expect(content).toContain('const inputSize = size === "lg" ? "md" : "sm";');
    expect(content).toMatch(
      /<ColorPickerInput\s+size=\{inputSize\}\s+className="min-w-0 flex-1"\s*\/>/,
    );
    expect(content).toContain("{showClear && (");
    expect(content).toContain('data-slot="color-picker-separator"');
    expect(content).toContain("{swatches}");
    expect(content).toContain("<PopoverContent");
    expect(area).not.toContain("Popover");
    expect(input).not.toContain("Popover");
    expect(input).toContain('formatControl?: "select" | "native";');
    expect(input).toContain('formatControl = "select"');
    expect(input).toMatch(/<ColorPickerValueInput\s+size=\{size\}\s*\/>/);
    expect(input).toContain('formatControl === "native"');
    expect(input).toMatch(/<ColorPickerNativeFormatSelect\s+size=\{size\}\s*\/>/);
    expect(input).toMatch(/<ColorPickerFormatSelect\s+size=\{size\}\s*\/>/);
    expect(formatSelect).toContain(
      'import { Select, SelectContent, SelectItem, SelectTrigger } from "../select";',
    );
    expect(formatSelect).toContain("<ColorPickerPrimitive.FormatControl");
    expect(formatSelect).toContain('data-sw-color-picker-format-options=""');
    expect(formatSelect.match(/value="(?:hex|rgb|hsl|hsb)"/g)).toHaveLength(4);
    expect(nativeFormatSelect).toContain('import { NativeSelectOption } from "../native-select";');
    expect(nativeFormatSelect).toContain("<ColorPickerPrimitive.FormatSelect");
    expect(nativeFormatSelect).toContain('data-slot="color-picker-native-format-select"');
    expect(valueInput).toContain("<ColorPickerPrimitive.ValueInput");
    expect(valueInput).toContain('data-slot="color-picker-value-input"');
    expect(valueInput).toContain('Omit<React.ComponentPropsWithoutRef<"input">, "size">');
    expect(trigger).toContain("<PopoverTrigger");
    expect(index).toContain("const ColorPickerVariants = {");
    expect(index).toContain("Root: ColorPicker");
    expect(index).toContain("InlineRoot: ColorPickerRoot");
    expect(index).toContain("ValueInput: ColorPickerValueInput");
    expect(index).toContain("NativeFormatSelect: ColorPickerNativeFormatSelect");
    expect(index).toContain("FormatSelect: ColorPickerFormatSelect");
    expect(index).toContain("HiddenInput: ColorPickerHiddenInput");
    expect(styles).toContain('[data-slot="color-picker-transparency-grid"]');
    expect(styles).toContain('[data-slot="color-picker-channel-slider"][data-channel="hue"]');
    expect(styles).toContain(
      '[data-sw-color-picker][data-floating-root] > [data-slot="select-positioner"]:has(> [data-sw-color-picker-format-options])',
    );
    expect(variants).toContain("--sw-color-picker-area-thumb-color");
    expect(channelSlider).toContain("--sw-color-picker-channel-thumb-color");

    const colorPickerOutputRoot = path.join(outputRoot, "color-picker");
    await formatGeneratedOutput([colorPickerOutputRoot]);
    const firstFormattedTree = await readGeneratedTree(colorPickerOutputRoot);

    expect(firstFormattedTree["variants.ts"]).toContain(`import {
  nativeSelectIcon as nativeSelectIconRecipe,
  nativeSelect as nativeSelectRecipe,
  nativeSelectWrapper as nativeSelectWrapperRecipe,
} from "../native-select/variants";`);

    await generate();
    await formatGeneratedOutput([colorPickerOutputRoot]);
    expect(await readGeneratedTree(colorPickerOutputRoot)).toEqual(firstFormattedTree);
  });
}
