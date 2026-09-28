import { alertDialogStyledContract } from "../../contracts/styled/components/alert-dialog.js";
import { dialogStyledContract } from "../../contracts/styled/components/dialog.js";
import { sheetStyledContract } from "../../contracts/styled/components/sheet.js";
import { toastStyledContract } from "../../contracts/styled/components/toast.js";
import type { StyledAdapterContract } from "../../contracts/styled/types.js";
import {
  assertNoStarwindClassHooksInStyledContracts,
  assertNoStarwindClassHooksInTree,
} from "../../starwind-class-guard.js";
import { compactCode } from "../source-comparison.js";
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
  it("keeps Styled overlay mechanics in Primitive-owned controls", async () => {
    const tempRoot = getTempRoot();
    for (const primitiveImportBase of ["@starwind-ui/react", undefined]) {
      const outputDir = primitiveImportBase ? "package" : "local";
      await generateStarwindReactWrappers({
        contracts: [dialogStyledContract, alertDialogStyledContract, sheetStyledContract],
        outputDir,
        primitiveImportBase,
        primitiveOutputDir: "primitives",
        repoRoot: tempRoot,
      });
      const tree = await readGeneratedTree(path.join(tempRoot, outputDir));
      for (const [group, family, controls] of [
        [
          "dialog",
          "Dialog",
          [
            ["DialogTrigger", "Trigger", 1],
            ["DialogClose", "Close", 1],
          ],
        ],
        [
          "sheet",
          "Sheet",
          [
            ["SheetTrigger", "Trigger", 1],
            ["SheetClose", "Close", 1],
          ],
        ],
        [
          "alert-dialog",
          "AlertDialog",
          [
            ["AlertDialogTrigger", "Trigger", 1],
            ["AlertDialogAction", "Close", 0],
            ["AlertDialogCancel", "Close", 0],
          ],
        ],
      ] as const)
        for (const [name, part, branchCount] of controls) {
          const source = tree[`${group}/${name}.tsx`]!;
          expect(compactCode(source)).toContain(compactCode('"use client";'));
          expect(
            source.match(new RegExp(`<${family}Primitive\\.${part}\\b`, "g")) ?? [],
          ).toHaveLength(branchCount);
          expect(source).not.toContain(`${family}ControlContext`);
          expect(compactCode(source)).not.toContain(compactCode("observedControls"));
          expect(compactCode(source)).not.toContain(compactCode("querySelectorAll"));
          expect(compactCode(source)).not.toContain(compactCode("MutationObserver"));
          if (name === "AlertDialogAction" || name === "AlertDialogCancel") {
            expect(compactCode(source)).toContain(compactCode("__useAlertDialogControl"));
            expect(compactCode(source)).toContain(compactCode("setControlElement"));
            expect(compactCode(source)).toContain(compactCode("data-as-child"));
            expect(compactCode(source)).toContain(
              compactCode(
                "const asChildRest = rest as unknown as React.HTMLAttributes<HTMLDivElement>;",
              ),
            );
            expect(compactCode(source)).toContain(compactCode("{...asChildRest}"));
            expect(compactCode(source)).toContain(compactCode("<Button"));
            expect(compactCode(source)).toContain(compactCode("{...rest}"));
          } else {
            expect(compactCode(source)).not.toContain(compactCode("setControlElement"));
            expect(compactCode(source)).not.toContain(compactCode("data-as-child"));
          }
        }
    }
  });

  it("exposes the styled Toast facade through package and local React Primitive sources", async () => {
    const tempRoot = getTempRoot();
    const packageOutputDir = "generated/package-backed";
    const localOutputDir = "generated/local-backed";
    const primitiveOutputDir = "generated/primitives/react";

    await generateStarwindReactWrappers({
      contracts: [toastStyledContract],
      outputDir: packageOutputDir,
      primitiveImportBase: "@starwind-ui/react",
      repoRoot: tempRoot,
    });
    await generateStarwindReactWrappers({
      contracts: [toastStyledContract],
      outputDir: localOutputDir,
      primitiveOutputDir,
      repoRoot: tempRoot,
    });

    const packageIndex = await readGeneratedFile(
      path.join(tempRoot, packageOutputDir),
      "toast/index.ts",
    );
    const localIndex = await readGeneratedFile(
      path.join(tempRoot, localOutputDir),
      "toast/index.ts",
    );
    const primitiveIndex = await readGeneratedFile(
      path.join(process.cwd(), "packages/react/src"),
      "toast/index.ts",
    );

    assertReactToastFacade(packageIndex, "@starwind-ui/react/toast");
    assertReactToastFacade(localIndex, "../../primitives/react/toast");
    expect(compactCode(primitiveIndex)).toContain(
      compactCode(
        'export type { ToastApi, ToastOptions, ToastPromiseOptions } from "@starwind-ui/runtime";',
      ),
    );
    expect(compactCode(primitiveIndex)).toContain(
      compactCode('export { toast } from "@starwind-ui/runtime/toast";'),
    );
  });

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

    expect(compactCode(forwarded)).toContain(compactCode('import * as React from "react";'));
    expect(compactCode(forwarded)).toContain(
      compactCode("React.forwardRef<HTMLButtonElement, DeclaredTargetProps>"),
    );
    expect(compactCode(forwarded)).toContain(
      compactCode("function DeclaredTarget(props, forwardedRef)"),
    );
    expect(compactCode(forwarded)).toContain(compactCode("ref={forwardedRef}"));
    expect(forwarded).not.toMatch(/\bref,\s*\n/);
    expect(compactCode(plain)).toContain(compactCode('import type * as React from "react";'));
    expect(compactCode(plain)).toContain(
      compactCode("function PlainSibling(props: PlainSiblingProps)"),
    );
    expect(compactCode(plain)).not.toContain(compactCode("forwardRef"));
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
    const alert = await readGeneratedFile(outputRoot, "alert/Alert.tsx");
    const alertIndex = await readGeneratedFile(outputRoot, "alert/index.ts");
    const badgeIndex = await readGeneratedFile(outputRoot, "badge/index.ts");
    const button = await readGeneratedFile(outputRoot, "button/Button.tsx");
    const buttonIndex = await readGeneratedFile(outputRoot, "button/index.ts");
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

    expect(button).toMatch(/^"use client";/);
    expect(buttonIndex).toMatch(/^"use client";/);
    expect(alert).not.toMatch(/^"use client";/);
    expect(alertIndex).not.toMatch(/^"use client";/);
    expect(compactCode(button)).toContain(
      compactCode('import ButtonPrimitive from "@starwind-ui/react/button";'),
    );
    expect(compactCode(button)).not.toContain(compactCode("primitives/react"));
    expect(compactCode(buttonIndex)).toContain(compactCode("const ButtonParts = {"));
    expect(compactCode(buttonIndex)).toContain(compactCode("export default ButtonParts;"));
    expect(buttonIndex).not.toMatch(/export default\s*{/);
    expect(buttonIndex).not.toMatch(/export\s*{[^}]*\bButtonParts\b/);
    expect(compactCode(badgeIndex)).toContain(compactCode("export default Badge;"));
    expect(compactCode(carousel)).toContain(
      compactCode('import CarouselPrimitive from "@starwind-ui/react/carousel";'),
    );
    expect(compactCode(carousel)).toContain(
      compactCode('opts?: import("@starwind-ui/react/carousel").CarouselOptions'),
    );
    expect(compactCode(carouselVariants)).toContain(
      compactCode('import { button as buttonVariants } from "../button/variants";'),
    );
    expect(compactCode(carouselVariants)).toContain(
      compactCode("export const carouselControl = tv({"),
    );
    expect(compactCode(carouselVariants)).toContain(compactCode("extend: buttonVariants"));
    expect(compactCode(carouselVariants)).toContain(compactCode("defaultVariants: {"));
    expect(compactCode(carouselVariants)).toContain(compactCode('variant: "outline"'));
    expect(compactCode(carouselVariants)).toContain(compactCode('size: "icon"'));
    expect(compactCode(carouselVariants)).toContain(compactCode('"absolute size-8 rounded-full"'));
    expect(compactCode(carouselNext)).toContain(
      compactCode("const controlClassName = carouselNext({ class: className });"),
    );
    expect(compactCode(carouselNext)).toContain(
      compactCode("className={carouselControl({ variant, size, class: controlClassName })}"),
    );
    expect(compactCode(carouselPrevious)).toContain(
      compactCode("const controlClassName = carouselPrevious({ class: className });"),
    );
    expect(compactCode(carouselPrevious)).toContain(
      compactCode("className={carouselControl({ variant, size, class: controlClassName })}"),
    );
    expect(compactCode(form)).toContain(
      compactCode('validationTiming?: import("@starwind-ui/react/form")'),
    );
    expect(compactCode(field)).toContain(
      compactCode('validationTiming?: import("@starwind-ui/react/form")'),
    );
    expect(compactCode(navigationMenu)).toContain(
      compactCode('import NavigationMenuPrimitive from "@starwind-ui/react/navigation-menu";'),
    );
    expect(compactCode(navigationMenu)).toContain(
      compactCode('import("@starwind-ui/react/navigation-menu")'),
    );
    expect(compactCode(navigationMenu)).not.toContain(
      compactCode('import("@starwind-ui/runtime")'),
    );
    expect(compactCode(select)).toContain(
      compactCode('import SelectPrimitive from "@starwind-ui/react/select";'),
    );
    expect(compactCode(select)).toContain(
      compactCode('import("@starwind-ui/react/select").SelectOpenChangeDetails'),
    );
    expect(compactCode(select)).toContain(
      compactCode('import("@starwind-ui/react/select").SelectValueChangeDetails'),
    );
    expect(compactCode(select)).not.toContain(compactCode('import("@starwind-ui/runtime")'));
    expect(compactCode(themeToggle)).toContain(
      compactCode('import { initThemeController } from "@starwind-ui/react/theme";'),
    );
    expect(compactCode(toaster)).toContain(
      compactCode('import ToastPrimitive from "@starwind-ui/react/toast";'),
    );

    const outputTree = await readGeneratedTree(outputRoot);
    const directRuntimeRefs = Object.entries(outputTree)
      .filter(([fileName]) => /\.(ts|tsx)$/.test(fileName))
      .filter(([, contents]) => contents.includes("@starwind-ui/runtime"));

    expect(directRuntimeRefs).toEqual([]);
  });

  it("generates the simplified controlled React Color Picker composition deterministically", async () => {
    const tempRoot = getTempRoot();
    const outputDir = "generated/starwind-runtime";
    const primitiveOutputDir = "generated/starwind-runtime/primitives/react";
    const generate = () =>
      generateStarwindReactWrappers({ outputDir, primitiveOutputDir, repoRoot: tempRoot });

    await generate();

    const outputRoot = path.join(tempRoot, outputDir);
    const firstTree = await readGeneratedTree(path.join(outputRoot, "color-picker"));
    const root = firstTree["ColorPicker.tsx"];
    const content = firstTree["ColorPickerContent.tsx"];
    const editor = firstTree["ColorPickerDefaultEditor.tsx"];
    const area = firstTree["ColorPickerArea.tsx"];
    const channelSlider = firstTree["ColorPickerChannelSlider.tsx"];
    const input = firstTree["ColorPickerInput.tsx"];
    const trigger = firstTree["ColorPickerTrigger.tsx"];
    const index = firstTree["index.ts"];
    const styles = firstTree["styles.css"];
    const variants = firstTree["variants.ts"];

    expect(Object.keys(firstTree).sort()).toEqual([
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
    ]);
    expect(compactCode(root)).toContain(compactCode('import { Popover } from "../popover";'));
    expect(compactCode(root)).toContain(
      compactCode('import ColorPickerPrimitive from "../primitives/react/color-picker";'),
    );
    expect(compactCode(root)).toContain(compactCode('import * as React from "react";'));
    expect(compactCode(root)).toContain(
      compactCode("React.forwardRef<HTMLDivElement, ColorPickerProps>"),
    );
    expect(compactCode(root)).toContain(compactCode("function ColorPicker(props, forwardedRef)"));
    expect(root).not.toMatch(/&\s*React\.ComponentProps<typeof Popover>/);
    expect(compactCode(root)).toContain(compactCode("value={value}"));
    expect(compactCode(root)).toContain(compactCode("format={resolvedFormat}"));
    expect(compactCode(root)).toContain(compactCode("alpha = true"));
    expect(compactCode(root)).toContain(compactCode("inline = false"));
    expect(compactCode(root)).toContain(compactCode("allowEmpty={clearable}"));
    expect(compactCode(root)).toContain(compactCode("onValueChange={onValueChange}"));
    expect(compactCode(root)).toContain(compactCode("onValueCommitted={onValueCommitted}"));
    expect(compactCode(root)).toContain(compactCode("onFormatChange={handleFormatChange}"));
    expect(compactCode(root)).toContain(compactCode("defaultOpen={defaultOpen}"));
    expect(compactCode(root)).toContain(compactCode("onOpenChange={onOpenChange}"));
    expect(root).toMatch(
      /<ColorPickerPrimitive\.Root[\s\S]*?\{\.\.\.rest\}[\s\S]*?data-floating-root/,
    );
    expect(compactCode(root)).toContain(compactCode("React.useState(initialFormat)"));
    expect(compactCode(root)).toContain(compactCode("requestedFormats.includes(resolvedFormat)"));
    expect(compactCode(root)).not.toContain(compactCode("open={value}"));
    expect(compactCode(root)).toContain(compactCode("data-floating-root={true}"));
    expect(compactCode(root)).toContain(compactCode('size = "md"'));
    expect(root).toMatch(/\{\.\.\.rest\}[\s\S]*data-size=\{size\}/);
    expect(root.match(/<ColorPickerPrimitive\.Root/g)).toHaveLength(2);
    expect(root.match(/<ColorPickerPrimitive\.HiddenInput/g)).toHaveLength(2);
    expect(compactCode(root)).toContain(
      compactCode("Parameters<NonNullable<typeof onFormatChange>>"),
    );
    expect(compactCode(content)).toContain(compactCode("<ColorPickerDefaultEditor"));
    expect(compactCode(content)).toContain(compactCode("<PopoverContent"));
    expect(content).toMatch(/\{\.\.\.rest\}[\s\S]*data-size=\{size\}/);
    expect(compactCode(editor)).toContain(compactCode("<ColorPickerArea"));
    expect(editor.match(/<ColorPickerChannelSlider/g)).toHaveLength(2);
    expect(compactCode(editor)).toContain(compactCode("normalizedSwatches.map"));
    expect(compactCode(editor)).toContain(compactCode("<ColorPickerClear"));
    expect(compactCode(area)).not.toContain(compactCode("Popover"));
    expect(compactCode(input)).not.toContain(compactCode("Popover"));
    expect(compactCode(input)).toContain(
      compactCode('formatControl?: "select" | "native" | "none";'),
    );
    expect(compactCode(input)).toContain(compactCode('formatControl = "select"'));
    expect(compactCode(input)).toContain(compactCode('formatContentSize = "md"'));
    expect(input).toMatch(/<SelectContent\s+size=\{formatContentSize\}/);
    expect(compactCode(input)).not.toContain(compactCode("size?:"));
    expect(compactCode(input)).toContain(compactCode("<ColorPickerPrimitive.ValueInput"));
    expect(compactCode(input)).toContain(compactCode('formatControl === "native"'));
    expect(compactCode(input)).toContain(compactCode("<ColorPickerPrimitive.FormatSelect"));
    expect(compactCode(input)).toContain(compactCode("<ColorPickerPrimitive.FormatControl"));
    expect(compactCode(input)).toContain(compactCode("normalizedFormats.map"));
    expect(compactCode(trigger)).toContain(compactCode("<PopoverTrigger"));
    expect(compactCode(trigger)).not.toContain(compactCode("size?:"));
    expect(compactCode(index)).toContain(compactCode("const ColorPickerVariants = {"));
    expect(compactCode(index)).toContain(compactCode("Root: ColorPicker"));
    expect(compactCode(index)).not.toContain(compactCode("InlineRoot"));
    expect(compactCode(index)).not.toContain(compactCode("ColorPickerDefaultEditor"));
    expect(compactCode(styles)).toContain(
      compactCode('[data-slot="color-picker-transparency-grid"]'),
    );
    expect(compactCode(styles)).toContain(
      compactCode('[data-slot="color-picker-channel-slider"][data-channel="hue"]'),
    );
    expect(compactCode(styles)).toContain(
      compactCode(
        '[data-sw-color-picker][data-floating-root] > [data-slot="select-portal"] > [data-slot="select-positioner"]:has(> [data-sw-color-picker-format-options])',
      ),
    );
    expect(compactCode(styles)).toContain(compactCode("{ position: fixed; z-index: 60; }"));
    expect(compactCode(styles)).toContain(
      compactCode(
        '[data-sw-color-picker][data-floating-root] > [data-slot="select-portal"] { display: contents; }',
      ),
    );
    expect(compactCode(variants)).toContain(compactCode("--sw-color-picker-area-thumb-color"));
    expect(compactCode(channelSlider)).toContain(
      compactCode("--sw-color-picker-channel-thumb-color"),
    );

    const colorPickerOutputRoot = path.join(outputRoot, "color-picker");
    await formatGeneratedOutput([colorPickerOutputRoot]);
    const firstFormattedTree = await readGeneratedTree(colorPickerOutputRoot);

    expect(compactCode(firstFormattedTree["variants.ts"])).toContain(
      compactCode(`import {
  nativeSelectIcon as nativeSelectIconRecipe,
  nativeSelect as nativeSelectRecipe,
  nativeSelectWrapper as nativeSelectWrapperRecipe,
} from "../native-select/variants";`),
    );

    await generate();
    await formatGeneratedOutput([colorPickerOutputRoot]);
    expect(await readGeneratedTree(colorPickerOutputRoot)).toEqual(firstFormattedTree);
  });
}

function assertReactToastFacade(source: string, primitiveSource: string): void {
  expect(source).toContain(`export { toast } from "${primitiveSource}";`);
  expect(source).toContain(
    `export type { ToastApi, ToastOptions, ToastPromiseOptions } from "${primitiveSource}";`,
  );
  expect(compactCode(source)).toContain(
    compactCode(`const ToastParts = {
  Viewport: Toaster,
  Template: ToastTemplate,
  Item: ToastItem,
  Content: ToastContent,
  Title: ToastTitle,
  Description: ToastDescription,
  Action: ToastAction,
  Close: ToastClose,
};`),
  );
  expect(source).not.toMatch(/const ToastParts = \{[^}]*\b(?:Manager|toast)\b/);
}
