import { describe, expect, it } from "vitest";

import { colorPickerStyledContract } from "../../contracts/styled/components/color-picker.js";
import { inputStyledContract } from "../../contracts/styled/components/input.js";
import { nativeSelectStyledContract } from "../../contracts/styled/components/native-select.js";
import { popoverStyledContract } from "../../contracts/styled/components/popover.js";
import { selectStyledContract } from "../../contracts/styled/components/select.js";
import { validateStyledAdapterContracts } from "../../contracts/styled/validation.js";
import type { RenderNode } from "../../contracts/styled/types.js";

describe("styled Color Picker contract", () => {
  it("publishes the complete Astro and React family with valid references", () => {
    expect(colorPickerStyledContract.frameworks).toEqual(["astro", "react"]);
    expect(
      validateStyledAdapterContracts([
        nativeSelectStyledContract,
        inputStyledContract,
        popoverStyledContract,
        selectStyledContract,
        colorPickerStyledContract,
      ]),
    ).toEqual([]);
    expect(colorPickerStyledContract.dependencies?.styledComponents).toEqual([
      "popover",
      "select",
      "native-select",
      "input",
    ]);
    expect(colorPickerStyledContract.publicExports).toHaveLength(21);
    expect(Object.values(colorPickerStyledContract.defaultExport)).toEqual(
      colorPickerStyledContract.publicExports,
    );
  });

  it("publishes standalone native and composite format editors", () => {
    expect(colorPickerStyledContract.publicExports).toEqual(
      expect.arrayContaining([
        "ColorPickerValueInput",
        "ColorPickerNativeFormatSelect",
        "ColorPickerFormatSelect",
      ]),
    );
    expect(colorPickerStyledContract.defaultExport).toMatchObject({
      ValueInput: "ColorPickerValueInput",
      NativeFormatSelect: "ColorPickerNativeFormatSelect",
      FormatSelect: "ColorPickerFormatSelect",
    });
    expect(colorPickerStyledContract.variantAliases).toMatchObject({
      colorPickerChannelInput: {
        importName: "input",
        localName: "channelInputRecipe",
        source: "../input/variants",
      },
      colorPickerValueInput: {
        importName: "input",
        localName: "valueInputRecipe",
        source: "../input/variants",
      },
      colorPickerNativeFormatSelect: {
        importName: "nativeSelect",
        localName: "nativeSelectRecipe",
        source: "../native-select/variants",
      },
    });

    const native = component("ColorPickerNativeFormatSelect");
    const composite = component("ColorPickerFormatSelect");
    const valueInput = component("ColorPickerValueInput");
    expect(valueInput.props?.extends).toContainEqual({
      type: "omitHtmlAttributes",
      element: "input",
      keys: ["size"],
    });
    expect(JSON.stringify(native.render)).toContain('"part":"FormatSelect"');
    expect(JSON.stringify(native.render)).toContain('"variant":"colorPickerNativeFormatSelect"');
    expect(JSON.stringify(native.render)).toContain('"exportName":"NativeSelectOption"');
    expect(JSON.stringify(composite.render)).toContain('"part":"FormatControl"');
    for (const exportName of ["Select", "SelectTrigger", "SelectContent", "SelectItem"]) {
      expect(JSON.stringify(composite.render)).toContain(`"exportName":"${exportName}"`);
    }
    expect(findComponentNodes(composite.render, "SelectContent")[0]?.attrs).toContainEqual({
      name: "data-sw-color-picker-format-options",
      value: { type: "literal", value: "" },
    });
    expect(colorPickerStyledContract.styles?.importFrom).toContain("ColorPickerFormatSelect");
    expect(colorPickerStyledContract.styles?.content).toContain(
      '[data-sw-color-picker][data-floating-root] > [data-slot="select-positioner"]:has(> [data-sw-color-picker-format-options]) { z-index: 60; }',
    );
    for (const format of ["hex", "rgb", "hsl", "hsb"]) {
      expect(JSON.stringify(native.render)).toContain(`"value":"${format}"`);
      expect(JSON.stringify(composite.render)).toContain(`"value":"${format}"`);
    }
    const nativeOptions = findComponentNodes(native.render, "NativeSelectOption");
    expect(nativeOptions).toHaveLength(4);
    for (const [index, format] of ["hex", "rgb", "hsl", "hsb"].entries()) {
      expect(nativeOptions[index]?.attrs).toContainEqual({
        name: "selected",
        value: {
          type: "raw",
          code: `(initial?.properties.value ?? rest.value) === "${format}"`,
        },
        frameworks: ["astro"],
      });
    }
    expect(JSON.stringify(native.render)).not.toContain('"name":"name"');
    expect(JSON.stringify(composite.render)).not.toContain('"name":"name"');
  });

  it("defaults ColorPickerInput to the composite editor with a typed native branch", () => {
    const input = component("ColorPickerInput");
    expect(input.props?.fields).toContainEqual({
      name: "formatControl",
      optional: true,
      type: '"select" | "native"',
    });
    expect(input.destructure?.props).toContainEqual({
      name: "formatControl",
      defaultValue: '"select"',
    });
    expect(JSON.stringify(input.render)).toContain('"exportName":"ColorPickerValueInput"');
    expect(JSON.stringify(input.render)).toContain('"condition":"formatControl === \\"native\\""');
    expect(JSON.stringify(input.render)).toContain('"exportName":"ColorPickerNativeFormatSelect"');
    expect(JSON.stringify(input.render)).toContain('"exportName":"ColorPickerFormatSelect"');
  });

  it("defines the canonical default layout and painted thumb recipes", () => {
    const content = component("ColorPickerContent");
    const fallback = JSON.stringify(content.render);
    expect(fallback).toContain(
      '"data-slot","value":{"type":"literal","value":"color-picker-slider-action-row"',
    );
    expect(fallback).toContain('"exportName":"ColorPickerSliders"');
    expect(fallback).toContain('"exportName":"ColorPickerEyeDropper"');
    expect(fallback).toContain(
      '"data-slot","value":{"type":"literal","value":"color-picker-value-format-row"',
    );
    expect(fallback).toContain('"exportName":"ColorPickerInput"');
    expect(fallback).toContain('"exportName":"ColorPickerClear"');
    expect(fallback).toContain('"importName":"ColorPicker"');
    expect(fallback).not.toContain('"value":"Pick"');
    expect(fallback).toContain('"value":"Pick a color from the screen"');
    expect(fallback).toContain('"value":"Clear color"');
    expect(fallback).toContain('"value":"color-picker-separator"');
    expect(fallback).toContain('"name":"swatches"');
    expect(content.variables).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "inputSize" }),
        expect.objectContaining({ name: "hasSwatches", frameworks: ["astro"] }),
        expect.objectContaining({ name: "hasSwatches", frameworks: ["react"] }),
      ]),
    );
    expect(fallback).toContain('"name":"size","value":{"name":"inputSize"');
    expect(fallback).toContain('"condition":"(hasSwatches || showClear)"');
    expect(fallback.indexOf('"name":"swatches"')).toBeLessThan(
      fallback.indexOf('"exportName":"ColorPickerClear"'),
    );

    const areaThumb = String(colorPickerStyledContract.variants?.colorPickerAreaThumb?.base);
    expect(areaThumb).toContain("bg-[var(--sw-color-picker-area-thumb-color)]");
    expect(areaThumb).toContain("focus-visible:ring-3");
    const channelThumb = JSON.stringify(component("ColorPickerChannelSlider").render);
    expect(channelThumb).toContain("var(--sw-color-picker-channel-thumb-color)");
    expect(channelThumb).toContain("color-picker-channel-thumb-color-layer");
    expect(channelThumb).toContain("color-picker-transparency-grid");
    expect(colorPickerStyledContract.variants?.colorPickerChannelSliderThumb).toMatchObject({
      variants: {
        size: {
          sm: "size-3",
          md: "size-4",
          lg: "size-5",
        },
      },
      defaultVariants: { size: "md" },
    });
    expect(JSON.stringify(colorPickerStyledContract.variants)).not.toContain("starwind-");
  });

  it("keeps the popup convenience while exposing a popup-free root", () => {
    const popupRoot = colorPickerStyledContract.components.find(
      ({ exportName }) => exportName === "ColorPicker",
    )!;
    const inlineRoot = colorPickerStyledContract.components.find(
      ({ exportName }) => exportName === "ColorPickerRoot",
    )!;
    const content = colorPickerStyledContract.components.find(
      ({ exportName }) => exportName === "ColorPickerContent",
    )!;
    expect(colorPickerStyledContract.defaultExport).toMatchObject({
      Root: "ColorPicker",
      InlineRoot: "ColorPickerRoot",
    });
    expect(JSON.stringify(popupRoot.render)).toContain('"component":"popover"');
    expect(JSON.stringify(popupRoot.render)).toContain('"exportName":"ColorPickerRoot"');
    expect(JSON.stringify(popupRoot.render)).toContain('"name":"data-floating-root"');
    expect(JSON.stringify(inlineRoot.render)).not.toContain('"component":"popover"');
    expect(JSON.stringify(inlineRoot.render)).not.toContain('"name":"data-floating-root"');
    expect(JSON.stringify(inlineRoot.render)).toContain('"part":"Root"');
    expect(JSON.stringify(content.render)).toContain('"exportName":"PopoverContent"');
    expect(content.destructure?.props).toEqual(
      expect.arrayContaining([
        { name: "side", defaultValue: '"bottom"' },
        { name: "align", defaultValue: '"start"' },
        { name: "exitMotion", defaultValue: '"fade"' },
      ]),
    );
    expect(JSON.stringify(content.render)).toContain('"name":"exitMotion"');
    expect(content.destructure?.props).not.toContainEqual({
      name: "avoidCollisions",
      defaultValue: "false",
    });
    expect(popoverStyledContract.variants?.popoverContent).toMatchObject({
      variants: {
        exitMotion: {
          popover: expect.arrayContaining(["zoom-out-95"]),
          fade: "",
        },
      },
      defaultVariants: { exitMotion: "popover" },
    });
    const popoverRoot = popoverStyledContract.components.find(
      ({ exportName }) => exportName === "Popover",
    );
    const popoverContent = popoverStyledContract.components.find(
      ({ exportName }) => exportName === "PopoverContent",
    );
    expect(popoverRoot?.props?.extends).not.toContainEqual({
      type: "variantProps",
      variant: "popoverContent",
    });
    expect(popoverContent?.props?.extends).toContainEqual({
      type: "variantProps",
      variant: "popoverContent",
    });
    const trigger = component("ColorPickerTrigger");
    expect(JSON.stringify(trigger.render)).toContain('"variant":"colorPickerValueSwatch"');
    expect(JSON.stringify(trigger.render)).toContain(
      "pointer-events-none absolute inset-0 size-full",
    );
    expect(JSON.stringify(colorPickerStyledContract.variants)).not.toContain("starwind-");
    expect(colorPickerStyledContract.annotations?.behaviorOwnership).toContain(
      "Popover owns open state, placement, dismissal, presence, portal placement, and focus return.",
    );
    expect(colorPickerStyledContract.annotations?.portalGuidance?.join(" ")).toContain(
      "data-floating-root",
    );
  });

  it("partitions Popover behavior props from Color Picker root DOM props", () => {
    const popupRoot = colorPickerStyledContract.components.find(
      ({ exportName }) => exportName === "ColorPicker",
    )!;
    const inlineRoot = colorPickerStyledContract.components.find(
      ({ exportName }) => exportName === "ColorPickerRoot",
    )!;
    expect(popupRoot.props?.extends).toEqual([
      { type: "componentProps", component: "color-picker", exportName: "ColorPickerRoot" },
    ]);
    expect(popupRoot.props?.fields?.map(({ name }) => name)).toEqual([
      "defaultOpen",
      "open",
      "closeOnEscape",
      "closeOnOutsideInteract",
      "modal",
      "openOnHover",
      "closeDelay",
      "onOpenChange",
      "onCloseComplete",
    ]);
    const popover = popupRoot.render[0];
    expect(popover).toMatchObject({ type: "component", component: "popover" });
    if (popover.type !== "component") throw new Error("Expected Popover component node");
    expect(popover.attrs?.some(({ name }) => name === "spread")).toBe(false);
    const root = popover.children?.[0];
    expect(root).toMatchObject({
      type: "component",
      component: "color-picker",
      exportName: "ColorPickerRoot",
    });
    if (root?.type !== "component") throw new Error("Expected ColorPickerRoot component node");
    expect(root.attrs?.map(({ name }) => name)).toContain("spread");
    expect(root.attrs?.findIndex(({ name }) => name === "spread")).toBeLessThan(
      root.attrs?.findIndex(({ name }) => name === "data-floating-root") ?? -1,
    );
    expect(inlineRoot.props?.fields).toContainEqual(
      expect.objectContaining({
        name: "defaultValue",
        type: 'import("@starwind-ui/runtime/color-picker").ColorPickerValue',
      }),
    );
  });

  it("leaves React format uncontrolled while forwarding format changes", () => {
    const root = colorPickerStyledContract.components.find(
      ({ exportName }) => exportName === "ColorPickerRoot",
    )!;
    expect(root.destructure?.props).toContainEqual({
      name: "format",
      frameworks: ["react"],
    });
    expect(root.destructure?.props).toContainEqual({
      name: "format",
      defaultValue: '"hex"',
      frameworks: ["astro"],
    });
    expect(root.props?.fields).toContainEqual(
      expect.objectContaining({ name: "onFormatChange", frameworks: ["react"] }),
    );
    expect(root.props?.fields).toContainEqual(
      expect.objectContaining({ name: "ref", frameworks: ["react"] }),
    );
    expect(JSON.stringify(root.render)).toContain('"name":"onFormatChange"');
  });

  it("defines complete convenience subtrees and contract-owned visual CSS", () => {
    for (const exportName of [
      "ColorPickerArea",
      "ColorPickerChannelSlider",
      "ColorPickerInput",
      "ColorPickerSliders",
    ]) {
      expect(
        colorPickerStyledContract.components.some(
          (component) => component.exportName === exportName,
        ),
      ).toBe(true);
    }
    const css = colorPickerStyledContract.styles?.content.join(" ") ?? "";
    expect(css).not.toContain("--sw-color-picker-area-gradient");
    expect(css).toContain("var(--sw-color-picker-area-background-overlay");
    expect(css).toContain("var(--sw-color-picker-area-background");
    expect(css).toContain("--sw-color-picker-channel-gradient");
    expect(css).toContain(
      '[data-slot="color-picker-channel-slider"][data-channel="hue"] { --sw-color-picker-channel-gradient:',
    );
    expect(css).toContain(
      '[data-slot="color-picker-channel-slider"][data-channel="alpha"] { --sw-color-picker-channel-gradient:',
    );
    for (const channel of ["saturation", "brightness", "lightness", "red", "green", "blue"]) {
      expect(css).toContain(`[data-channel="${channel}"] { --sw-color-picker-channel-gradient:`);
    }
    expect(css).toContain(
      '[data-slot="color-picker-channel-slider-track"] { background: var(--sw-color-picker-channel-gradient); }',
    );
    expect(css.match(/--sw-color-picker-channel-gradient:/g)?.length).toBe(9);
    expect(css).toContain("background-size: 8px 8px");
    expect(css).toContain('[data-slot="color-picker-value-swatch"] { background-color: #fff;');
    expect(css).toContain('data-has-swatches="false"');
    expect(colorPickerStyledContract.variants?.colorPickerContent?.base).toContain(
      "max-h-[max(10rem,var(--sw-floating-available-height))]",
    );
    expect(colorPickerStyledContract.annotations?.composition?.join(" ")).toContain(
      "No fixed swatch palette",
    );
  });

  it("renders native input primitives as void nodes", () => {
    for (const exportName of ["ColorPickerChannelInput", "ColorPickerHiddenInput"]) {
      const component = colorPickerStyledContract.components.find(
        (candidate) => candidate.exportName === exportName,
      );
      expect(component?.render).toHaveLength(1);
      expect(component?.render[0]).toMatchObject({ type: "primitive", children: [] });
    }
  });

  it("owns usable fill and positioning geometry for each complete visual subtree", () => {
    const classBySlot = collectLiteralClassesBySlot(
      colorPickerStyledContract.components.flatMap((component) => component.render),
    );

    for (const slotName of [
      "color-picker-area-background",
      "color-picker-area-input-x",
      "color-picker-area-input-y",
      "color-picker-channel-slider-track",
      "color-picker-channel-slider-input",
      "color-picker-transparency-grid",
      "color-picker-value-swatch-color",
      "color-picker-swatch-color",
    ]) {
      expect(classBySlot.get(slotName)).toContain("absolute inset-0 size-full");
    }
    const channelThumb = String(
      colorPickerStyledContract.variants?.colorPickerChannelSliderThumb?.base,
    );
    expect(channelThumb).toContain("absolute top-1/2");
    expect(channelThumb).toContain("-translate-y-1/2");
    expect(channelThumb).toContain("left-[var(--sw-color-picker-channel-position)]");
    expect(channelThumb).toContain(
      "group-data-[orientation=vertical]/color-picker-channel-slider:top-[calc(100%-var(--sw-color-picker-channel-position))]",
    );

    const areaThumb = colorPickerStyledContract.variants?.colorPickerAreaThumb?.base;
    expect(areaThumb).toContain("left-[clamp(1px,var(--sw-color-picker-area-x),calc(100%_-_1px))]");
    expect(areaThumb).toContain("top-[clamp(1px,var(--sw-color-picker-area-y),calc(100%_-_1px))]");
    expect(areaThumb).toContain("z-10");
    expect(colorPickerStyledContract.variants?.colorPickerArea?.base).toContain("border-outline");
    expect(colorPickerStyledContract.variants?.colorPickerArea?.base).not.toContain(
      "overflow-hidden",
    );
    expect(colorPickerStyledContract.variants?.colorPickerChannelSlider?.base).toContain(
      "group/color-picker-channel-slider",
    );
    expect(colorPickerStyledContract.variants?.colorPickerChannelSlider?.base).toContain(
      "bg-border",
    );
    expect(colorPickerStyledContract.variants?.colorPickerChannelSliderThumb?.base).toContain(
      "z-10",
    );
    expect(
      colorPickerStyledContract.variants?.colorPickerChannelSlider?.variants?.size?.sm,
    ).toContain("h-2.5");
    expect(
      colorPickerStyledContract.variants?.colorPickerChannelSlider?.variants?.size?.md,
    ).toContain("h-3 data-[orientation=vertical]:h-48 data-[orientation=vertical]:w-3");
    for (const exportName of ["ColorPickerChannelInput", "ColorPickerValueInput"]) {
      expect(JSON.stringify(component(exportName).render)).toContain('"type":"classJoin"');
    }
    expect(colorPickerStyledContract.variants?.colorPickerSliders?.base).toContain("px-2");
    expect(colorPickerStyledContract.variants?.colorPickerSwatch?.variants?.size).toEqual({
      sm: "size-6",
      md: "size-7",
      lg: "size-8",
    });
    expect(
      colorPickerStyledContract.variants?.colorPickerFormatSelectTrigger?.variants?.size,
    ).toEqual({ sm: "min-w-20", md: "min-w-24", lg: "min-w-24" });
  });
});

function collectLiteralClassesBySlot(nodes: RenderNode[]): Map<string, string> {
  const classes = new Map<string, string>();

  const visit = (node: RenderNode): void => {
    if ("attrs" in node) {
      const slot = node.attrs?.find((attribute) => attribute.name === "data-slot")?.value;
      const classValue = node.attrs?.find((attribute) => attribute.name === "class")?.value;
      if (
        slot?.type === "literal" &&
        typeof slot.value === "string" &&
        classValue?.type === "literal"
      ) {
        classes.set(slot.value, String(classValue.value));
      }
    }
    if ("children" in node) node.children?.forEach(visit);
    if (node.type === "conditional") {
      node.then.forEach(visit);
      node.else.forEach(visit);
    }
    if (node.type === "slot") node.fallback?.forEach(visit);
  };

  nodes.forEach(visit);
  return classes;
}

function findComponentNodes(
  nodes: RenderNode[],
  exportName: string,
): Extract<RenderNode, { type: "component" }>[] {
  const matches: Extract<RenderNode, { type: "component" }>[] = [];

  const visit = (node: RenderNode): void => {
    if (node.type === "component" && node.exportName === exportName) matches.push(node);
    if ("children" in node) node.children?.forEach(visit);
    if (node.type === "conditional") {
      node.then.forEach(visit);
      node.else.forEach(visit);
    }
    if (node.type === "slot") node.fallback?.forEach(visit);
  };

  nodes.forEach(visit);
  return matches;
}

function component(exportName: string) {
  const found = colorPickerStyledContract.components.find(
    (candidate) => candidate.exportName === exportName,
  );
  if (!found) throw new Error(`Missing ${exportName}`);
  return found;
}
