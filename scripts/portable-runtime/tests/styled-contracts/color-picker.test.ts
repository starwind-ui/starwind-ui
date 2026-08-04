import { describe, expect, it } from "vitest";

import { colorPickerStyledContract } from "../../contracts/styled/components/color-picker.js";
import { inputStyledContract } from "../../contracts/styled/components/input.js";
import { nativeSelectStyledContract } from "../../contracts/styled/components/native-select.js";
import { popoverStyledContract } from "../../contracts/styled/components/popover.js";
import { selectStyledContract } from "../../contracts/styled/components/select.js";
import { validateStyledAdapterContracts } from "../../contracts/styled/validation.js";
import type { RenderNode } from "../../contracts/styled/types.js";

const PUBLIC_EXPORTS = [
  "ColorPicker",
  "ColorPickerInput",
  "ColorPickerTrigger",
  "ColorPickerContent",
  "ColorPickerArea",
  "ColorPickerChannelSlider",
  "ColorPickerChannelInput",
  "ColorPickerValueSwatch",
  "ColorPickerSwatchGroup",
  "ColorPickerSwatch",
  "ColorPickerEyeDropper",
  "ColorPickerClear",
];

describe("styled Color Picker contract", () => {
  it("publishes the simplified Astro and React family with one private editor", () => {
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
    expect(colorPickerStyledContract.publicExports).toEqual(PUBLIC_EXPORTS);
    expect(colorPickerStyledContract.defaultExport).toEqual({
      Root: "ColorPicker",
      Input: "ColorPickerInput",
      Trigger: "ColorPickerTrigger",
      Content: "ColorPickerContent",
      Area: "ColorPickerArea",
      ChannelSlider: "ColorPickerChannelSlider",
      ChannelInput: "ColorPickerChannelInput",
      ValueSwatch: "ColorPickerValueSwatch",
      SwatchGroup: "ColorPickerSwatchGroup",
      Swatch: "ColorPickerSwatch",
      EyeDropper: "ColorPickerEyeDropper",
      Clear: "ColorPickerClear",
    });
    expect(colorPickerStyledContract.components.map(({ exportName }) => exportName)).toEqual([
      ...PUBLIC_EXPORTS.slice(0, 1),
      "ColorPickerDefaultEditor",
      ...PUBLIC_EXPORTS.slice(1),
    ]);
    expect(colorPickerStyledContract.components).toHaveLength(13);
  });

  it("owns popup and inline shells with a zero-child fallback and hidden form input", () => {
    const root = component("ColorPicker");
    const fields = root.props?.fields ?? [];
    for (const field of [
      "alpha",
      "inline",
      "format",
      "formatControl",
      "formats",
      "showEyeDropper",
      "showValueText",
      "clearable",
      "swatches",
      "label",
    ]) {
      expect(
        fields.some(({ name }) => name === field),
        field,
      ).toBe(true);
    }
    expect(root.destructure?.props).toEqual(
      expect.arrayContaining([
        { name: "alpha", defaultValue: "true" },
        { name: "inline", defaultValue: "false" },
        { name: "formatControl", defaultValue: '"select"' },
        { name: "showEyeDropper", defaultValue: "true" },
        { name: "showValueText", defaultValue: "true" },
        { name: "clearable", defaultValue: "false" },
        { name: "swatches", defaultValue: "[]" },
      ]),
    );
    const render = JSON.stringify(root.render);
    expect(render).toContain('"condition":"inline"');
    expect(render).toContain('"component":"popover"');
    expect(render.match(/"part":"Root"/g)).toHaveLength(2);
    expect(render.match(/"part":"HiddenInput"/g)).toHaveLength(2);
    expect(render.match(/"exportName":"ColorPickerDefaultEditor"/g)).toHaveLength(1);
    expect(render).toContain('"exportName":"ColorPickerContent"');
    expect(render).toContain('"name":"allowEmpty","value":{"name":"clearable"');
    expect(render).toContain('"value":"color-picker-label"');
    expect(render).toContain('"value":"color-picker-control"');
    expect(render).toContain('"value":"color-picker-hidden-input"');
    expect(render).toContain('"name":"data-floating-root"');
  });

  it("normalizes formats and keeps uncontrolled React format changes local", () => {
    const root = component("ColorPicker");
    expect(root.variables).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "requestedFormats" }),
        expect.objectContaining({ name: "initialFormat" }),
        expect.objectContaining({ name: "normalizedFormats" }),
        expect.objectContaining({ name: "uncontrolledFormat", frameworks: ["react"] }),
        expect.objectContaining({ name: "resolvedFormat" }),
        expect.objectContaining({ name: "handleFormatChange", frameworks: ["react"] }),
      ]),
    );
    const variables = JSON.stringify(root.variables);
    expect(variables).toContain("Array.from(new Set(formats))");
    expect(variables).toContain("requestedFormats.includes(resolvedFormat)");
    expect(variables).toContain("NonNullable<typeof onFormatChange>");
    expect(variables).not.toContain("@starwind-ui/runtime/color-picker");
  });

  it("folds value input and styled, native, or absent format controls into ColorPickerInput", () => {
    const input = component("ColorPickerInput");
    expect(input.props?.fields).toEqual([
      { name: "formatControl", optional: true, type: '"select" | "native" | "none"' },
      expect.objectContaining({ name: "formats", optional: true }),
      { name: "formatContentSize", optional: true, type: '"sm" | "md" | "lg"' },
    ]);
    const render = JSON.stringify(input.render);
    expect(render).toContain('"part":"ValueInput"');
    expect(render).toContain('"condition":"formatControl === \\"native\\""');
    expect(render).toContain('"condition":"formatControl === \\"select\\""');
    expect(render).toContain('"part":"FormatSelect"');
    expect(render).toContain('"exportName":"NativeSelectOption"');
    expect(render).toContain('"exportName":"Select"');
    expect(render).toContain(
      '"name":"size","value":{"name":"formatContentSize","type":"variable"}',
    );
    expect(render).toContain('"type":"repeat"');
    expect(render).toContain('"each":"normalizedFormats"');
    expect(render).not.toContain("ColorPickerValueInput");
    expect(render).not.toContain("ColorPickerFormatSelect");
  });

  it("folds the area thumb into ColorPickerArea", () => {
    const render = JSON.stringify(component("ColorPickerArea").render);
    expect(render).toContain('"part":"Area"');
    expect(render).toContain('"part":"AreaThumb"');
    expect(render).toContain('"part":"AreaInput"');
    expect(render).toContain('"value":"color-picker-area-thumb"');
    expect(colorPickerStyledContract.publicExports).not.toContain("ColorPickerAreaThumb");
  });

  it("uses one private default editor for popup content and inline fallback", () => {
    const editor = component("ColorPickerDefaultEditor");
    const render = JSON.stringify(editor.render);
    expect(render).toContain('"exportName":"ColorPickerArea"');
    expect(render.match(/"exportName":"ColorPickerChannelSlider"/g)).toHaveLength(2);
    expect(render).toContain('"value":"hue"');
    expect(render).toContain('"value":"alpha"');
    expect(render).toContain('"exportName":"ColorPickerEyeDropper"');
    expect(render).toContain('"exportName":"ColorPickerInput"');
    expect(render).toContain('"exportName":"ColorPickerSwatchGroup"');
    expect(render).toContain('"exportName":"ColorPickerSwatch"');
    expect(render).toContain('"exportName":"ColorPickerClear"');
    expect(render).toContain('"value":"color-picker-separator"');
    expect(render).toContain('"type":"repeat"');
    const content = JSON.stringify(component("ColorPickerContent").render);
    expect(content).toContain('"exportName":"ColorPickerDefaultEditor"');
    expect(content).toContain('"value":"best-fit"');
  });

  it("preserves the contract-owned visual slots and geometry", () => {
    const classBySlot = collectLiteralClassesBySlot(
      colorPickerStyledContract.components.flatMap((candidate) => candidate.render),
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
    const areaThumb = String(colorPickerStyledContract.variants?.colorPickerAreaThumb?.base);
    expect(areaThumb).toContain("bg-(--sw-color-picker-area-thumb-color)");
    expect(areaThumb).toContain("left-[clamp(1px");
    expect(areaThumb).toContain("z-10");
    const channelThumb = String(
      colorPickerStyledContract.variants?.colorPickerChannelSliderThumb?.base,
    );
    expect(channelThumb).toContain("left-(--sw-color-picker-channel-position)");
    expect(channelThumb).toContain("z-10");
    expect(String(colorPickerStyledContract.variants?.colorPickerSwatch?.base)).toContain(
      "size-(--sw-color-picker-swatch-size)",
    );
    expect(colorPickerStyledContract.styles?.content.join(" ")).toContain(
      '[data-sw-color-picker-content][data-size="md"]',
    );
  });

  it("keeps placement on Content and popup state on ColorPicker", () => {
    const root = component("ColorPicker");
    expect(root.props?.fields?.map(({ name }) => name)).toEqual(
      expect.arrayContaining([
        "defaultOpen",
        "open",
        "closeOnEscape",
        "closeOnOutsideInteract",
        "modal",
        "onOpenChange",
        "onCloseComplete",
      ]),
    );
    const content = component("ColorPickerContent");
    expect(content.destructure?.props).toEqual(
      expect.arrayContaining([
        { name: "side", defaultValue: '"bottom"' },
        { name: "align", defaultValue: '"start"' },
        { name: "exitMotion", defaultValue: '"fade"' },
      ]),
    );
    expect(colorPickerStyledContract.annotations?.portalGuidance?.join(" ")).toContain(
      "data-floating-root",
    );
  });

  it("keeps native channel inputs void and styles shared inputs through class joins", () => {
    const channel = component("ColorPickerChannelInput");
    expect(channel.render).toHaveLength(1);
    expect(channel.render[0]).toMatchObject({ type: "primitive", children: [] });
    expect(JSON.stringify(channel.render)).toContain('"type":"classJoin"');
    expect(JSON.stringify(component("ColorPickerInput").render)).toContain('"type":"classJoin"');
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
    if (node.type === "repeat") node.children.forEach(visit);
  };
  nodes.forEach(visit);
  return classes;
}

function component(exportName: string) {
  const found = colorPickerStyledContract.components.find(
    (candidate) => candidate.exportName === exportName,
  );
  if (!found) throw new Error(`Missing ${exportName}`);
  return found;
}
