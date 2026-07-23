import type {
  AttributeContract,
  RenderNode,
  StyledAdapterContract,
  StyledComponentContract,
} from "../types.js";

const variable = (name: string) => ({ name, type: "variable" as const });
const literal = (value: string | boolean | number) => ({ type: "literal" as const, value });
const slot = (name?: string): RenderNode => ({ type: "slot", ...(name ? { name } : {}) });
const dataSlot = (value: string): AttributeContract => ({
  name: "data-slot",
  value: literal(value),
});
const className = (value: string): AttributeContract => ({ name: "class", value: literal(value) });
const primitive = (
  part: string,
  attrs: AttributeContract[],
  children: RenderNode[] = [slot()],
): RenderNode => ({ type: "primitive", component: "color-picker", part, attrs, children });

const formatOptions = ["hex", "rgb", "hsl", "hsb"] as const;

const formatOptionNodes = (component: "native-select" | "select"): RenderNode[] =>
  formatOptions.map((format) => ({
    type: "component",
    component,
    exportName: component === "select" ? "SelectItem" : "NativeSelectOption",
    attrs: [
      { name: "value", value: literal(format) },
      ...(component === "native-select"
        ? [
            {
              name: "selected",
              value: {
                type: "raw" as const,
                code: `(initial?.properties.value ?? rest.value) === "${format}"`,
              },
              frameworks: ["astro" as const],
            },
          ]
        : []),
    ],
    children: [{ type: "text", value: format.toUpperCase() }],
  }));

function simplePart(
  exportName: string,
  part: string,
  element: string,
  variant: string,
  slotName: string,
  fields: StyledComponentContract["props"] extends infer _
    ? NonNullable<StyledComponentContract["props"]>["fields"]
    : never = [],
  extraAttrs: AttributeContract[] = [],
  omitHtmlAttributes: string[] = [],
  layoutVariant?: string,
): StyledComponentContract {
  return {
    exportName,
    primitiveAliases: { "color-picker": "ColorPickerPrimitive" },
    props: {
      extends: [
        ...(omitHtmlAttributes.length > 0
          ? [{ type: "omitHtmlAttributes" as const, element, keys: omitHtmlAttributes }]
          : [{ type: "htmlAttributes" as const, element }]),
        { type: "variantProps", variant },
      ],
      fields,
    },
    destructure: {
      props: [
        ...(fields ?? []).map((field) => ({ name: field.name })),
        { name: "class", alias: "className" },
        { name: "size", defaultValue: '"md"' },
      ],
      rest: "rest",
    },
    render: [
      primitive(
        part,
        [
          {
            name: "class",
            value: layoutVariant
              ? {
                  type: "classJoin",
                  items: [
                    { type: "classVariant", variant, args: { size: "size" } },
                    { type: "classVariant", variant: layoutVariant, args: { size: "size" } },
                    { type: "variable", name: "className" },
                  ],
                }
              : {
                  type: "classVariant",
                  variant,
                  args: { size: "size", class: "className" },
                },
          },
          ...extraAttrs,
          { name: "spread", value: variable("rest") },
          dataSlot(slotName),
        ],
        element === "input" ? [] : [slot()],
      ),
    ],
  };
}

export const colorPickerStyledContract: StyledAdapterContract = {
  component: "color-picker",
  frameworks: ["astro", "react"],
  annotations: {
    behaviorOwnership: [
      "Color Picker Primitive owns color value, editing, accessibility, and form behavior.",
      "Popover owns open state, placement, dismissal, presence, portal placement, and focus return.",
      "Inline, input-only, and swatch-only compositions use no floating behavior.",
    ],
    composition: [
      "ColorPicker composes Popover with Color Picker Primitive Root.",
      "ColorPickerRoot is the popup-free base for inline, input-only, and swatch-only compositions.",
      "ColorPickerContent provides the canonical area, grouped hue and optional alpha sliders with EyeDropper, value and format editing, optional Clear, separator, and consumer swatch slot.",
      "ColorPickerValueInput, ColorPickerNativeFormatSelect, and ColorPickerFormatSelect are standalone editors for custom layouts.",
      "No fixed swatch palette is contract-owned.",
    ],
    portalGuidance: [
      "ColorPickerContent inherits Popover Portal discovery of the nearest data-floating-root.",
      "Inside Dialog, render content beneath the Dialog-local floating root so dismissal and focus return remain in the nested overlay.",
    ],
  },
  dependencies: { styledComponents: ["popover", "select", "native-select", "input"] },
  publicExports: [
    "ColorPicker",
    "ColorPickerRoot",
    "ColorPickerLabel",
    "ColorPickerControl",
    "ColorPickerInput",
    "ColorPickerTrigger",
    "ColorPickerContent",
    "ColorPickerArea",
    "ColorPickerAreaThumb",
    "ColorPickerSliders",
    "ColorPickerChannelSlider",
    "ColorPickerChannelInput",
    "ColorPickerValueInput",
    "ColorPickerNativeFormatSelect",
    "ColorPickerFormatSelect",
    "ColorPickerValueSwatch",
    "ColorPickerSwatchGroup",
    "ColorPickerSwatch",
    "ColorPickerEyeDropper",
    "ColorPickerClear",
    "ColorPickerHiddenInput",
  ],
  defaultExport: {
    Root: "ColorPicker",
    InlineRoot: "ColorPickerRoot",
    Label: "ColorPickerLabel",
    Control: "ColorPickerControl",
    Input: "ColorPickerInput",
    Trigger: "ColorPickerTrigger",
    Content: "ColorPickerContent",
    Area: "ColorPickerArea",
    AreaThumb: "ColorPickerAreaThumb",
    Sliders: "ColorPickerSliders",
    ChannelSlider: "ColorPickerChannelSlider",
    ChannelInput: "ColorPickerChannelInput",
    ValueInput: "ColorPickerValueInput",
    NativeFormatSelect: "ColorPickerNativeFormatSelect",
    FormatSelect: "ColorPickerFormatSelect",
    ValueSwatch: "ColorPickerValueSwatch",
    SwatchGroup: "ColorPickerSwatchGroup",
    Swatch: "ColorPickerSwatch",
    EyeDropper: "ColorPickerEyeDropper",
    Clear: "ColorPickerClear",
    HiddenInput: "ColorPickerHiddenInput",
  },
  variantCollectionName: "ColorPickerVariants",
  variantAliases: {
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
    colorPickerNativeFormatSelectWrapper: {
      importName: "nativeSelectWrapper",
      localName: "nativeSelectWrapperRecipe",
      source: "../native-select/variants",
    },
    colorPickerNativeFormatSelect: {
      importName: "nativeSelect",
      localName: "nativeSelectRecipe",
      source: "../native-select/variants",
    },
    colorPickerNativeFormatSelectIcon: {
      importName: "nativeSelectIcon",
      localName: "nativeSelectIconRecipe",
      source: "../native-select/variants",
    },
  },
  styles: {
    fileName: "styles.css",
    importFrom: [
      "ColorPickerArea",
      "ColorPickerChannelSlider",
      "ColorPickerContent",
      "ColorPickerFormatSelect",
      "ColorPickerValueSwatch",
      "ColorPickerSwatch",
    ],
    content: [
      '[data-slot="color-picker-area-background"] { background: var(--sw-color-picker-area-background-overlay, linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent)), var(--sw-color-picker-area-background, hsl(var(--sw-color-picker-hue) 100% 50%)); }',
      '[data-slot="color-picker-channel-slider"] { --sw-color-picker-channel-gradient-direction: to right; --sw-color-picker-channel-gradient: linear-gradient(var(--sw-color-picker-channel-gradient-direction), transparent, var(--sw-color-picker-color, #000)); }',
      '[data-slot="color-picker-channel-slider"][data-orientation="vertical"] { --sw-color-picker-channel-gradient-direction: to top; }',
      '[data-slot="color-picker-channel-slider"][data-channel="hue"] { --sw-color-picker-channel-gradient: linear-gradient(var(--sw-color-picker-channel-gradient-direction), #f00 0%, #ff0 16.67%, #0f0 33.33%, #0ff 50%, #00f 66.67%, #f0f 83.33%, #f00 100%); }',
      '[data-slot="color-picker-channel-slider"][data-channel="alpha"] { --sw-color-picker-channel-gradient: linear-gradient(var(--sw-color-picker-channel-gradient-direction), rgb(from var(--sw-color-picker-color, #000) r g b / 0), rgb(from var(--sw-color-picker-color, #000) r g b / 1)); }',
      '[data-slot="color-picker-channel-slider"][data-channel="saturation"] { --sw-color-picker-channel-gradient: linear-gradient(var(--sw-color-picker-channel-gradient-direction), hsl(var(--sw-color-picker-hue, 0) 0% 50%), hsl(var(--sw-color-picker-hue, 0) 100% 50%)); }',
      '[data-slot="color-picker-channel-slider"][data-channel="brightness"] { --sw-color-picker-channel-gradient: linear-gradient(var(--sw-color-picker-channel-gradient-direction), #000, hsl(var(--sw-color-picker-hue, 0) 100% 50%)); }',
      '[data-slot="color-picker-channel-slider"][data-channel="lightness"] { --sw-color-picker-channel-gradient: linear-gradient(var(--sw-color-picker-channel-gradient-direction), #000, hsl(var(--sw-color-picker-hue, 0) 100% 50%), #fff); }',
      '[data-slot="color-picker-channel-slider"][data-channel="red"] { --sw-color-picker-channel-gradient: linear-gradient(var(--sw-color-picker-channel-gradient-direction), rgb(from var(--sw-color-picker-color, #000) 0 g b), rgb(from var(--sw-color-picker-color, #000) 255 g b)); }',
      '[data-slot="color-picker-channel-slider"][data-channel="green"] { --sw-color-picker-channel-gradient: linear-gradient(var(--sw-color-picker-channel-gradient-direction), rgb(from var(--sw-color-picker-color, #000) r 0 b), rgb(from var(--sw-color-picker-color, #000) r 255 b)); }',
      '[data-slot="color-picker-channel-slider"][data-channel="blue"] { --sw-color-picker-channel-gradient: linear-gradient(var(--sw-color-picker-channel-gradient-direction), rgb(from var(--sw-color-picker-color, #000) r g 0), rgb(from var(--sw-color-picker-color, #000) r g 255)); }',
      '[data-slot="color-picker-channel-slider-track"] { background: var(--sw-color-picker-channel-gradient); }',
      '[data-slot="color-picker-transparency-grid"] { background-color: #fff; background-image: linear-gradient(45deg, #d4d4d8 25%, transparent 25%), linear-gradient(-45deg, #d4d4d8 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #d4d4d8 75%), linear-gradient(-45deg, transparent 75%, #d4d4d8 75%); background-position: 0 0, 0 4px, 4px -4px, -4px 0; background-size: 8px 8px; }',
      '[data-slot="color-picker-value-swatch-color"], [data-slot="color-picker-swatch-color"] { background: var(--sw-color-picker-swatch-color); }',
      '[data-slot="color-picker-value-swatch"] { background-color: #fff; background-image: linear-gradient(var(--sw-color-picker-swatch-color, transparent), var(--sw-color-picker-swatch-color, transparent)), linear-gradient(45deg, #d4d4d8 25%, transparent 25%), linear-gradient(-45deg, #d4d4d8 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #d4d4d8 75%), linear-gradient(-45deg, transparent 75%, #d4d4d8 75%); background-position: 0 0, 0 0, 0 4px, 4px -4px, -4px 0; background-size: 100% 100%, 8px 8px, 8px 8px, 8px 8px, 8px 8px; }',
      '[data-slot="color-picker-value-swatch"] > [data-slot="color-picker-transparency-grid"], [data-slot="color-picker-value-swatch"] > [data-slot="color-picker-value-swatch-color"] { display: none; }',
      '[data-slot="color-picker-footer"][data-has-swatches="false"]:not(:has([data-slot="color-picker-clear"]:not([hidden]))) > [data-slot="color-picker-separator"] { display: none; }',
      '[data-sw-color-picker][data-floating-root] > [data-slot="select-positioner"]:has(> [data-sw-color-picker-format-options]) { z-index: 60; }',
    ],
  },
  variants: {
    colorPicker: {
      base: "relative flex flex-col gap-3",
      variants: { size: { sm: "text-sm", md: "text-base", lg: "text-lg" } },
      defaultVariants: { size: "md" },
    },
    colorPickerLabel: {
      base: "font-medium leading-none data-disabled:cursor-not-allowed data-disabled:opacity-50",
      variants: { size: { sm: "text-xs", md: "text-sm", lg: "text-base" } },
      defaultVariants: { size: "md" },
    },
    colorPickerControl: {
      base: "flex items-center gap-2",
      variants: { size: { sm: "gap-1.5", md: "gap-2", lg: "gap-2.5" } },
      defaultVariants: { size: "md" },
    },
    colorPickerTrigger: {
      base: "border-input bg-background focus-visible:ring-outline/50 inline-flex items-center rounded-md border shadow-xs outline-none focus-visible:ring-3 disabled:pointer-events-none disabled:opacity-50",
      variants: {
        size: {
          sm: "h-9 gap-2 px-2 text-sm",
          md: "h-11 gap-2.5 px-3",
          lg: "h-12 gap-3 px-4 text-lg",
        },
      },
      defaultVariants: { size: "md" },
    },
    colorPickerContent: {
      base: "flex max-h-[var(--sw-floating-available-height)] w-72 flex-col gap-3 p-3",
      variants: { size: { sm: "w-64 gap-2 p-2", md: "w-72 gap-3 p-3", lg: "w-80 gap-4 p-4" } },
      defaultVariants: { size: "md" },
    },
    colorPickerInput: {
      base: "flex items-center gap-2",
      variants: { size: { sm: "gap-1.5", md: "gap-2", lg: "gap-2.5" } },
      defaultVariants: { size: "md" },
    },
    colorPickerValueInputLayout: {
      base: "min-w-0 flex-1 data-invalid:border-error data-invalid:focus-visible:ring-error/40",
      variants: { size: { sm: "", md: "", lg: "" } },
      defaultVariants: { size: "md" },
    },
    colorPickerArea: {
      base: "group/color-picker-area border-outline relative min-h-32 w-full shrink-0 touch-none rounded-md border [&>[data-slot=color-picker-area-background]]:inset-0 [&>[data-slot=color-picker-area-background]]:size-full [&>[data-slot=color-picker-area-background]]:rounded-[7px]",
      variants: { size: { sm: "h-[150px]", md: "h-[175px]", lg: "h-[200px]" } },
      defaultVariants: { size: "md" },
    },
    colorPickerAreaThumb: {
      base: "group-has-[[data-slot=color-picker-area-input-x]:focus-visible]/color-picker-area:ring-outline/60 pointer-events-none absolute top-[clamp(1px,var(--sw-color-picker-area-y),calc(100%_-_1px))] left-[clamp(1px,var(--sw-color-picker-area-x),calc(100%_-_1px))] z-10 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[var(--sw-color-picker-area-thumb-color)] shadow-md ring-1 ring-black/30 outline-none group-has-[[data-slot=color-picker-area-input-x]:focus-visible]/color-picker-area:ring-3 focus-visible:ring-3 data-disabled:opacity-50 data-dragging:scale-110",
      variants: { size: { sm: "size-3.5", md: "size-4", lg: "size-5" } },
      defaultVariants: { size: "md" },
    },
    colorPickerSliders: {
      base: "flex flex-col gap-3 px-2",
      variants: { size: { sm: "gap-2", md: "gap-3", lg: "gap-4" } },
      defaultVariants: { size: "md" },
    },
    colorPickerSliderActionRow: {
      base: "flex items-center gap-2",
      variants: { size: { sm: "gap-1.5", md: "gap-2", lg: "gap-2.5" } },
      defaultVariants: { size: "md" },
    },
    colorPickerValueFormatRow: {
      base: "flex items-center gap-2",
      variants: { size: { sm: "gap-1.5", md: "gap-2", lg: "gap-2.5" } },
      defaultVariants: { size: "md" },
    },
    colorPickerSeparator: {
      base: "bg-border h-px w-full",
      variants: { size: { sm: "my-0.5", md: "my-1", lg: "my-1.5" } },
      defaultVariants: { size: "md" },
    },
    colorPickerChannelSlider: {
      base: "group/color-picker-channel-slider bg-border relative touch-none rounded-full [&>[data-slot=color-picker-channel-slider-track]]:inset-px [&>[data-slot=color-picker-channel-slider-track]]:size-auto [&>[data-slot=color-picker-transparency-grid]]:inset-px [&>[data-slot=color-picker-transparency-grid]]:size-auto",
      variants: {
        size: {
          sm: "h-2.5 data-[orientation=vertical]:h-40 data-[orientation=vertical]:w-2.5",
          md: "h-3 data-[orientation=vertical]:h-48 data-[orientation=vertical]:w-3",
          lg: "h-4 data-[orientation=vertical]:h-56 data-[orientation=vertical]:w-4",
        },
      },
      defaultVariants: { size: "md" },
    },
    colorPickerChannelSliderThumb: {
      base: "group-has-[[data-slot=color-picker-channel-slider-input]:focus-visible]/color-picker-channel-slider:ring-outline/60 pointer-events-none absolute top-1/2 left-[var(--sw-color-picker-channel-position)] z-10 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full border-2 border-white shadow-md ring-1 ring-black/30 outline-none group-has-[[data-slot=color-picker-channel-slider-input]:focus-visible]/color-picker-channel-slider:ring-3 group-data-[orientation=vertical]/color-picker-channel-slider:top-[calc(100%-var(--sw-color-picker-channel-position))] group-data-[orientation=vertical]/color-picker-channel-slider:left-1/2 data-disabled:opacity-50 data-dragging:scale-110",
      variants: { size: { sm: "size-3", md: "size-4", lg: "size-5" } },
      defaultVariants: { size: "md" },
    },
    colorPickerChannelInputLayout: {
      base: "text-center data-invalid:border-error data-invalid:focus-visible:ring-error/40",
      variants: { size: { sm: "h-9 w-16 text-sm", md: "h-11 w-20", lg: "h-12 w-24 text-lg" } },
      defaultVariants: { size: "md" },
    },
    colorPickerSwatch: {
      base: "relative overflow-hidden rounded-md border shadow-xs outline-none focus-visible:ring-3 data-selected:ring-2 data-disabled:opacity-50",
      variants: { size: { sm: "size-6", md: "size-7", lg: "size-8" } },
      defaultVariants: { size: "md" },
    },
    colorPickerSwatchGroup: {
      base: "flex flex-wrap gap-2",
      variants: { size: { sm: "gap-1.5", md: "gap-2", lg: "gap-2.5" } },
      defaultVariants: { size: "md" },
    },
    colorPickerValueSwatch: {
      base: "border-input relative shrink-0 overflow-hidden border",
      variants: {
        size: {
          sm: "size-4 rounded-[4.5px]",
          md: "size-5 rounded-[5.5px]",
          lg: "size-6 rounded-[6.5px]",
        },
      },
      defaultVariants: { size: "md" },
    },
    colorPickerFormatSelectTrigger: {
      base: "uppercase",
      variants: { size: { sm: "min-w-20", md: "min-w-24", lg: "min-w-24" } },
      defaultVariants: { size: "md" },
    },
    colorPickerAction: {
      base: "border-input bg-background inline-flex items-center justify-center rounded-md border outline-none focus-visible:ring-3 disabled:opacity-50",
      variants: { size: { sm: "h-9 px-2 text-sm", md: "h-11 px-3", lg: "h-12 px-4 text-lg" } },
      defaultVariants: { size: "md" },
    },
    colorPickerHiddenInput: {
      base: "sr-only",
      variants: { size: { sm: "", md: "", lg: "" } },
      defaultVariants: { size: "md" },
    },
  },
  components: [
    {
      exportName: "ColorPickerRoot",
      forwardRef: { targetType: "HTMLDivElement" },
      primitiveAliases: { "color-picker": "ColorPickerPrimitive" },
      props: {
        extends: [
          {
            type: "omitHtmlAttributes",
            element: "div",
            keys: ["value", "defaultValue", "onChange", "dir"],
          },
          { type: "variantProps", variant: "colorPicker" },
        ],
        fields: [
          {
            name: "value",
            optional: true,
            type: 'import("@starwind-ui/runtime/color-picker").ColorPickerValue',
            frameworks: ["react"],
          },
          {
            name: "defaultValue",
            optional: true,
            type: 'import("@starwind-ui/runtime/color-picker").ColorPickerValue',
          },
          {
            name: "format",
            optional: true,
            type: 'import("@starwind-ui/runtime/color-picker").ColorPickerFormat',
          },
          { name: "alpha", optional: true, type: "boolean" },
          { name: "allowEmpty", optional: true, type: "boolean" },
          { name: "disabled", optional: true, type: "boolean" },
          { name: "readOnly", optional: true, type: "boolean" },
          { name: "name", optional: true, type: "string" },
          { name: "form", optional: true, type: "string" },
          { name: "required", optional: true, type: "boolean" },
          { name: "locale", optional: true, type: "string" },
          {
            name: "dir",
            optional: true,
            type: 'import("@starwind-ui/runtime/color-picker").ColorPickerDirection',
          },
          {
            name: "onValueChange",
            optional: true,
            type: '(value: import("@starwind-ui/runtime/color-picker").ColorPickerColor | null, details: import("@starwind-ui/runtime/color-picker").ColorPickerValueChangeDetails) => void',
            frameworks: ["react"],
          },
          {
            name: "onValueCommitted",
            optional: true,
            type: '(value: import("@starwind-ui/runtime/color-picker").ColorPickerColor | null, details: import("@starwind-ui/runtime/color-picker").ColorPickerValueCommitDetails) => void',
            frameworks: ["react"],
          },
          {
            name: "onFormatChange",
            optional: true,
            type: '(format: import("@starwind-ui/runtime/color-picker").ColorPickerFormat, details: import("@starwind-ui/runtime/color-picker").ColorPickerFormatChangeDetails) => void',
            frameworks: ["react"],
          },
          {
            name: "ref",
            optional: true,
            type: "React.Ref<HTMLDivElement>",
            frameworks: ["react"],
          },
        ],
      },
      destructure: {
        props: [
          { name: "value", frameworks: ["react"] },
          { name: "defaultValue", defaultValue: '"#000000"' },
          { name: "format", defaultValue: '"hex"', frameworks: ["astro"] },
          { name: "format", frameworks: ["react"] },
          { name: "alpha", defaultValue: "true" },
          { name: "allowEmpty", defaultValue: "false" },
          { name: "disabled", defaultValue: "false" },
          { name: "readOnly", defaultValue: "false" },
          { name: "name" },
          { name: "form" },
          { name: "required", defaultValue: "false" },
          { name: "locale" },
          { name: "dir" },
          { name: "onValueChange", frameworks: ["react"] },
          { name: "onValueCommitted", frameworks: ["react"] },
          { name: "onFormatChange", frameworks: ["react"] },
          { name: "ref", frameworks: ["react"] },
          { name: "class", alias: "className" },
          { name: "size", defaultValue: '"md"' },
        ],
        rest: "rest",
      },
      render: [
        primitive("Root", [
          {
            name: "class",
            value: {
              type: "classVariant",
              variant: "colorPicker",
              args: { size: "size", class: "className" },
            },
          },
          { name: "value", value: variable("value"), frameworks: ["react"] },
          { name: "defaultValue", value: variable("defaultValue") },
          { name: "format", value: variable("format") },
          { name: "alpha", value: variable("alpha") },
          { name: "allowEmpty", value: variable("allowEmpty") },
          { name: "disabled", value: variable("disabled") },
          { name: "readOnly", value: variable("readOnly") },
          { name: "name", value: variable("name") },
          { name: "form", value: variable("form") },
          { name: "required", value: variable("required") },
          { name: "locale", value: variable("locale") },
          { name: "dir", value: variable("dir") },
          { name: "onValueChange", value: variable("onValueChange"), frameworks: ["react"] },
          {
            name: "onValueCommitted",
            value: variable("onValueCommitted"),
            frameworks: ["react"],
          },
          {
            name: "onFormatChange",
            value: variable("onFormatChange"),
            frameworks: ["react"],
          },
          { name: "spread", value: variable("rest") },
          { name: "ref", value: variable("ref"), frameworks: ["react"] },
          dataSlot("color-picker"),
        ]),
      ],
    },
    {
      exportName: "ColorPicker",
      forwardRef: { targetType: "HTMLDivElement" },
      props: {
        extends: [
          { type: "componentProps", component: "color-picker", exportName: "ColorPickerRoot" },
        ],
        fields: [
          { name: "defaultOpen", optional: true, type: "boolean" },
          { name: "open", optional: true, type: "boolean", frameworks: ["react"] },
          { name: "closeOnEscape", optional: true, type: "boolean" },
          { name: "closeOnOutsideInteract", optional: true, type: "boolean" },
          { name: "modal", optional: true, type: "boolean" },
          { name: "openOnHover", optional: true, type: "boolean" },
          { name: "closeDelay", optional: true, type: "number" },
          {
            name: "onOpenChange",
            optional: true,
            type: 'React.ComponentProps<typeof Popover>["onOpenChange"]',
            frameworks: ["react"],
          },
          {
            name: "onCloseComplete",
            optional: true,
            type: 'React.ComponentProps<typeof Popover>["onCloseComplete"]',
            frameworks: ["react"],
          },
        ],
      },
      destructure: {
        props: [
          { name: "defaultOpen", defaultValue: "false" },
          { name: "open", frameworks: ["react"] },
          { name: "closeOnEscape", defaultValue: "true" },
          { name: "closeOnOutsideInteract", defaultValue: "true" },
          { name: "modal", defaultValue: "false" },
          { name: "openOnHover", defaultValue: "false" },
          { name: "closeDelay", defaultValue: "200" },
          { name: "onOpenChange", frameworks: ["react"] },
          { name: "onCloseComplete", frameworks: ["react"] },
          { name: "value", frameworks: ["react"] },
          { name: "defaultValue", defaultValue: '"#000000"' },
          { name: "format", defaultValue: '"hex"', frameworks: ["astro"] },
          { name: "format", frameworks: ["react"] },
          { name: "alpha", defaultValue: "true" },
          { name: "allowEmpty", defaultValue: "false" },
          { name: "disabled", defaultValue: "false" },
          { name: "readOnly", defaultValue: "false" },
          { name: "name" },
          { name: "form" },
          { name: "required", defaultValue: "false" },
          { name: "locale" },
          { name: "dir" },
          { name: "onValueChange", frameworks: ["react"] },
          { name: "onValueCommitted", frameworks: ["react"] },
          { name: "onFormatChange", frameworks: ["react"] },
          { name: "ref", frameworks: ["react"] },
          { name: "class", alias: "className" },
          { name: "size", defaultValue: '"md"' },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "component",
          component: "popover",
          exportName: "Popover",
          attrs: [
            { name: "defaultOpen", value: variable("defaultOpen") },
            { name: "open", value: variable("open"), frameworks: ["react"] },
            { name: "closeOnEscape", value: variable("closeOnEscape") },
            {
              name: "closeOnOutsideInteract",
              value: variable("closeOnOutsideInteract"),
            },
            { name: "modal", value: variable("modal") },
            { name: "openOnHover", value: variable("openOnHover") },
            { name: "closeDelay", value: variable("closeDelay") },
            {
              name: "onOpenChange",
              value: variable("onOpenChange"),
              frameworks: ["react"],
            },
            {
              name: "onCloseComplete",
              value: variable("onCloseComplete"),
              frameworks: ["react"],
            },
          ],
          children: [
            {
              type: "component",
              component: "color-picker",
              exportName: "ColorPickerRoot",
              attrs: [
                { name: "value", value: variable("value"), frameworks: ["react"] },
                { name: "defaultValue", value: variable("defaultValue") },
                { name: "format", value: variable("format") },
                { name: "alpha", value: variable("alpha") },
                { name: "allowEmpty", value: variable("allowEmpty") },
                { name: "disabled", value: variable("disabled") },
                { name: "readOnly", value: variable("readOnly") },
                { name: "name", value: variable("name") },
                { name: "form", value: variable("form") },
                { name: "required", value: variable("required") },
                { name: "locale", value: variable("locale") },
                { name: "dir", value: variable("dir") },
                { name: "spread", value: variable("rest") },
                { name: "data-floating-root", value: literal(true) },
                { name: "onValueChange", value: variable("onValueChange"), frameworks: ["react"] },
                {
                  name: "onValueCommitted",
                  value: variable("onValueCommitted"),
                  frameworks: ["react"],
                },
                {
                  name: "onFormatChange",
                  value: variable("onFormatChange"),
                  frameworks: ["react"],
                },
                { name: "ref", value: variable("ref"), frameworks: ["react"] },
                { name: "class", value: variable("className") },
                { name: "size", value: variable("size") },
              ],
              children: [slot()],
            },
          ],
        },
      ],
    },
    simplePart("ColorPickerLabel", "Label", "label", "colorPickerLabel", "color-picker-label"),
    simplePart(
      "ColorPickerControl",
      "Control",
      "div",
      "colorPickerControl",
      "color-picker-control",
    ),
    {
      exportName: "ColorPickerInput",
      props: {
        extends: [
          { type: "htmlAttributes", element: "div" },
          { type: "variantProps", variant: "colorPickerInput" },
        ],
        fields: [{ name: "formatControl", optional: true, type: '"select" | "native"' }],
      },
      destructure: {
        props: [
          { name: "formatControl", defaultValue: '"select"' },
          { name: "class", alias: "className" },
          { name: "size", defaultValue: '"md"' },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "element",
          tag: "div",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "colorPickerInput",
                args: { size: "size", class: "className" },
              },
            },
            { name: "spread", value: variable("rest") },
            dataSlot("color-picker-input"),
          ],
          children: [
            {
              type: "component",
              component: "color-picker",
              exportName: "ColorPickerValueInput",
              attrs: [{ name: "size", value: variable("size") }],
            },
            {
              type: "conditional",
              condition: 'formatControl === "native"',
              then: [
                {
                  type: "component",
                  component: "color-picker",
                  exportName: "ColorPickerNativeFormatSelect",
                  attrs: [{ name: "size", value: variable("size") }],
                },
              ],
              else: [
                {
                  type: "component",
                  component: "color-picker",
                  exportName: "ColorPickerFormatSelect",
                  attrs: [{ name: "size", value: variable("size") }],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      exportName: "ColorPickerTrigger",
      props: {
        extends: [
          { type: "componentProps", component: "popover", exportName: "PopoverTrigger" },
          { type: "variantProps", variant: "colorPickerTrigger" },
        ],
        fields: [{ name: "showValueText", optional: true, type: "boolean" }],
      },
      destructure: {
        props: [
          { name: "class", alias: "className" },
          { name: "size", defaultValue: '"md"' },
          { name: "showValueText", defaultValue: "true" },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "component",
          component: "popover",
          exportName: "PopoverTrigger",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "colorPickerTrigger",
                args: { size: "size", class: "className" },
              },
            },
            { name: "spread", value: variable("rest") },
            dataSlot("color-picker-trigger"),
          ],
          children: [
            slot(undefined),
            primitive(
              "ValueSwatch",
              [
                {
                  name: "class",
                  value: {
                    type: "classVariant",
                    variant: "colorPickerValueSwatch",
                    args: { size: "size" },
                  },
                },
                dataSlot("color-picker-value-swatch"),
              ],
              [
                primitive(
                  "TransparencyGrid",
                  [
                    className("pointer-events-none absolute inset-0 size-full"),
                    dataSlot("color-picker-transparency-grid"),
                  ],
                  [],
                ),
                {
                  type: "element",
                  tag: "span",
                  selfClosing: true,
                  attrs: [
                    className("pointer-events-none absolute inset-0 size-full"),
                    dataSlot("color-picker-value-swatch-color"),
                  ],
                },
              ],
            ),
            {
              type: "conditional",
              condition: "showValueText",
              then: [primitive("ValueText", [dataSlot("color-picker-value-text")], [])],
              else: [],
            },
          ],
        },
      ],
    },
    {
      exportName: "ColorPickerContent",
      imports: [
        {
          importName: "ColorPicker",
          source: "@tabler/icons/outline/color-picker.svg",
          type: "default",
        },
      ],
      props: {
        extends: [
          { type: "componentProps", component: "popover", exportName: "PopoverContent" },
          { type: "variantProps", variant: "colorPickerContent" },
        ],
        fields: [
          { name: "alpha", optional: true, type: "boolean" },
          { name: "showEyeDropper", optional: true, type: "boolean" },
          { name: "showClear", optional: true, type: "boolean" },
        ],
      },
      destructure: {
        props: [
          { name: "class", alias: "className" },
          { name: "size", defaultValue: '"md"' },
          { name: "alpha", defaultValue: "true" },
          { name: "showEyeDropper", defaultValue: "true" },
          { name: "showClear", defaultValue: "false" },
          { name: "side", defaultValue: '"bottom"' },
          { name: "align", defaultValue: '"start"' },
          { name: "exitMotion", defaultValue: '"fade"' },
        ],
        rest: "rest",
      },
      variables: [
        {
          name: "inputSize",
          value: { type: "raw", code: 'size === "lg" ? "md" : "sm"' },
        },
        {
          name: "hasSwatches",
          frameworks: ["astro"],
          value: { type: "raw", code: 'Astro.slots.has("swatches")' },
        },
        {
          name: "hasSwatches",
          frameworks: ["react"],
          value: { type: "raw", code: "swatches != null" },
        },
        {
          name: "hasSwatchesAttribute",
          value: { type: "raw", code: 'hasSwatches ? "true" : "false"' },
        },
      ],
      render: [
        {
          type: "component",
          component: "popover",
          exportName: "PopoverContent",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "colorPickerContent",
                args: { size: "size", class: "className" },
              },
            },
            { name: "side", value: variable("side") },
            { name: "align", value: variable("align") },
            { name: "collisionStrategy", value: literal("best-fit") },
            { name: "exitMotion", value: variable("exitMotion") },
            { name: "spread", value: variable("rest") },
            dataSlot("color-picker-content"),
          ],
          children: [
            {
              type: "slot",
              fallback: [
                {
                  type: "component",
                  component: "color-picker",
                  exportName: "ColorPickerArea",
                  attrs: [{ name: "size", value: variable("size") }],
                },
                {
                  type: "element",
                  tag: "div",
                  attrs: [
                    {
                      name: "class",
                      value: {
                        type: "classVariant",
                        variant: "colorPickerSliderActionRow",
                        args: { size: "size" },
                      },
                    },
                    dataSlot("color-picker-slider-action-row"),
                  ],
                  children: [
                    {
                      type: "component",
                      component: "color-picker",
                      exportName: "ColorPickerSliders",
                      attrs: [
                        { name: "alpha", value: variable("alpha") },
                        { name: "size", value: variable("size") },
                        { name: "class", value: literal("min-w-0 flex-1") },
                      ],
                    },
                    {
                      type: "conditional",
                      condition: "showEyeDropper",
                      then: [
                        {
                          type: "component",
                          component: "color-picker",
                          exportName: "ColorPickerEyeDropper",
                          attrs: [
                            { name: "size", value: variable("size") },
                            { name: "aria-label", value: literal("Pick a color from the screen") },
                          ],
                          children: [
                            {
                              type: "icon",
                              importName: "ColorPicker",
                              attrs: [
                                { name: "class", value: literal("size-4") },
                                { name: "aria-hidden", value: literal("true") },
                              ],
                            },
                          ],
                        },
                      ],
                      else: [],
                    },
                  ],
                },
                {
                  type: "element",
                  tag: "div",
                  attrs: [
                    {
                      name: "class",
                      value: {
                        type: "classVariant",
                        variant: "colorPickerValueFormatRow",
                        args: { size: "size" },
                      },
                    },
                    dataSlot("color-picker-value-format-row"),
                  ],
                  children: [
                    {
                      type: "component",
                      component: "color-picker",
                      exportName: "ColorPickerInput",
                      attrs: [
                        { name: "size", value: variable("inputSize") },
                        { name: "class", value: literal("min-w-0 flex-1") },
                      ],
                    },
                  ],
                },
                {
                  type: "element",
                  tag: "div",
                  attrs: [
                    { name: "class", value: literal("contents") },
                    { name: "data-has-swatches", value: variable("hasSwatchesAttribute") },
                    dataSlot("color-picker-footer"),
                  ],
                  children: [
                    {
                      type: "conditional",
                      condition: "(hasSwatches || showClear)",
                      then: [
                        {
                          type: "element",
                          tag: "div",
                          selfClosing: true,
                          attrs: [
                            {
                              name: "class",
                              value: {
                                type: "classVariant",
                                variant: "colorPickerSeparator",
                                args: { size: "size" },
                              },
                            },
                            { name: "role", value: literal("separator") },
                            { name: "aria-hidden", value: literal("true") },
                            dataSlot("color-picker-separator"),
                          ],
                        },
                      ],
                      else: [],
                    },
                    slot("swatches"),
                    {
                      type: "conditional",
                      condition: "showClear",
                      then: [
                        {
                          type: "component",
                          component: "color-picker",
                          exportName: "ColorPickerClear",
                          attrs: [
                            { name: "size", value: variable("inputSize") },
                            { name: "aria-label", value: literal("Clear color") },
                          ],
                          children: [{ type: "text", value: "Clear" }],
                        },
                      ],
                      else: [],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      exportName: "ColorPickerArea",
      primitiveAliases: { "color-picker": "ColorPickerPrimitive" },
      props: {
        extends: [
          { type: "htmlAttributes", element: "div" },
          { type: "variantProps", variant: "colorPickerArea" },
        ],
      },
      destructure: {
        props: [
          { name: "class", alias: "className" },
          { name: "size", defaultValue: '"md"' },
        ],
        rest: "rest",
      },
      render: [
        primitive(
          "Area",
          [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "colorPickerArea",
                args: { size: "size", class: "className" },
              },
            },
            { name: "spread", value: variable("rest") },
            dataSlot("color-picker-area"),
          ],
          [
            primitive(
              "AreaBackground",
              [
                className("pointer-events-none absolute inset-0 size-full"),
                dataSlot("color-picker-area-background"),
              ],
              [],
            ),
            {
              type: "component",
              component: "color-picker",
              exportName: "ColorPickerAreaThumb",
              attrs: [{ name: "size", value: variable("size") }],
            },
            primitive(
              "AreaInput",
              [
                { name: "axis", value: literal("x") },
                className("absolute inset-0 size-full cursor-crosshair opacity-0"),
                dataSlot("color-picker-area-input-x"),
              ],
              [],
            ),
            primitive(
              "AreaInput",
              [
                { name: "axis", value: literal("y") },
                className("absolute inset-0 size-full cursor-crosshair opacity-0"),
                dataSlot("color-picker-area-input-y"),
              ],
              [],
            ),
          ],
        ),
      ],
    },
    simplePart(
      "ColorPickerAreaThumb",
      "AreaThumb",
      "span",
      "colorPickerAreaThumb",
      "color-picker-area-thumb",
    ),
    {
      exportName: "ColorPickerSliders",
      props: {
        extends: [
          { type: "htmlAttributes", element: "div" },
          { type: "variantProps", variant: "colorPickerSliders" },
        ],
        fields: [{ name: "alpha", optional: true, type: "boolean" }],
      },
      destructure: {
        props: [
          { name: "alpha", defaultValue: "true" },
          { name: "class", alias: "className" },
          { name: "size", defaultValue: '"md"' },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "element",
          tag: "div",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "colorPickerSliders",
                args: { size: "size", class: "className" },
              },
            },
            { name: "spread", value: variable("rest") },
            dataSlot("color-picker-sliders"),
          ],
          children: [
            {
              type: "component",
              component: "color-picker",
              exportName: "ColorPickerChannelSlider",
              attrs: [
                { name: "channel", value: literal("hue") },
                { name: "size", value: variable("size") },
              ],
            },
            {
              type: "conditional",
              condition: "alpha",
              then: [
                {
                  type: "component",
                  component: "color-picker",
                  exportName: "ColorPickerChannelSlider",
                  attrs: [
                    { name: "channel", value: literal("alpha") },
                    { name: "size", value: variable("size") },
                  ],
                },
              ],
              else: [],
            },
          ],
        },
      ],
    },
    {
      exportName: "ColorPickerChannelSlider",
      primitiveAliases: { "color-picker": "ColorPickerPrimitive" },
      props: {
        extends: [
          { type: "htmlAttributes", element: "div" },
          { type: "variantProps", variant: "colorPickerChannelSlider" },
        ],
        fields: [
          {
            name: "channel",
            type: 'import("@starwind-ui/runtime/color-picker").ColorPickerChannel',
          },
          { name: "orientation", optional: true, type: '"horizontal" | "vertical"' },
        ],
      },
      destructure: {
        props: [
          { name: "channel" },
          { name: "orientation", defaultValue: '"horizontal"' },
          { name: "class", alias: "className" },
          { name: "size", defaultValue: '"md"' },
        ],
        rest: "rest",
      },
      render: [
        primitive(
          "ChannelSlider",
          [
            { name: "channel", value: variable("channel") },
            { name: "orientation", value: variable("orientation") },
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "colorPickerChannelSlider",
                args: { size: "size", class: "className" },
              },
            },
            { name: "spread", value: variable("rest") },
            dataSlot("color-picker-channel-slider"),
          ],
          [
            primitive(
              "TransparencyGrid",
              [
                className("pointer-events-none absolute inset-0 size-full rounded-[inherit]"),
                dataSlot("color-picker-transparency-grid"),
              ],
              [],
            ),
            primitive(
              "ChannelSliderTrack",
              [
                className("pointer-events-none absolute inset-0 size-full rounded-[inherit]"),
                dataSlot("color-picker-channel-slider-track"),
              ],
              [],
            ),
            primitive(
              "ChannelSliderThumb",
              [
                {
                  name: "class",
                  value: {
                    type: "classVariant",
                    variant: "colorPickerChannelSliderThumb",
                    args: { size: "size" },
                  },
                },
                dataSlot("color-picker-channel-slider-thumb"),
              ],
              [
                {
                  type: "element",
                  tag: "span",
                  selfClosing: true,
                  attrs: [
                    className("pointer-events-none absolute inset-0 size-full"),
                    dataSlot("color-picker-transparency-grid"),
                  ],
                },
                {
                  type: "element",
                  tag: "span",
                  selfClosing: true,
                  attrs: [
                    className(
                      "pointer-events-none absolute inset-0 size-full bg-[var(--sw-color-picker-channel-thumb-color)]",
                    ),
                    dataSlot("color-picker-channel-thumb-color-layer"),
                  ],
                },
              ],
            ),
            primitive(
              "ChannelSliderInput",
              [
                className("absolute inset-0 size-full cursor-pointer opacity-0"),
                dataSlot("color-picker-channel-slider-input"),
              ],
              [],
            ),
          ],
        ),
      ],
    },
    simplePart(
      "ColorPickerChannelInput",
      "ChannelInput",
      "input",
      "colorPickerChannelInput",
      "color-picker-channel-input",
      [{ name: "channel", type: 'import("@starwind-ui/runtime/color-picker").ColorPickerChannel' }],
      [{ name: "channel", value: variable("channel") }],
      [],
      "colorPickerChannelInputLayout",
    ),
    simplePart(
      "ColorPickerValueInput",
      "ValueInput",
      "input",
      "colorPickerValueInput",
      "color-picker-value-input",
      [],
      [],
      ["size"],
      "colorPickerValueInputLayout",
    ),
    {
      exportName: "ColorPickerNativeFormatSelect",
      primitiveAliases: { "color-picker": "ColorPickerPrimitive" },
      imports: [
        {
          importName: "ChevronDown",
          source: "@tabler/icons/outline/chevron-down.svg",
          type: "default",
        },
      ],
      props: {
        extends: [
          { type: "omitHtmlAttributes", element: "select", keys: ["size"] },
          { type: "variantProps", variant: "colorPickerNativeFormatSelect" },
        ],
      },
      destructure: {
        props: [
          { name: "class", alias: "className" },
          { name: "size", defaultValue: '"md"' },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "element",
          tag: "div",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "colorPickerNativeFormatSelectWrapper",
              },
            },
            dataSlot("color-picker-native-format-select-wrapper"),
          ],
          children: [
            primitive(
              "FormatSelect",
              [
                {
                  name: "class",
                  value: {
                    type: "classVariant",
                    variant: "colorPickerNativeFormatSelect",
                    args: { size: "size", class: "className" },
                  },
                },
                { name: "aria-label", value: literal("Color format") },
                { name: "spread", value: variable("rest") },
                dataSlot("color-picker-native-format-select"),
              ],
              formatOptionNodes("native-select"),
            ),
            {
              type: "icon",
              importName: "ChevronDown",
              attrs: [
                {
                  name: "class",
                  value: {
                    type: "classVariant",
                    variant: "colorPickerNativeFormatSelectIcon",
                    args: { size: "size" },
                  },
                },
                { name: "aria-hidden", value: literal("true") },
                dataSlot("color-picker-native-format-select-icon"),
              ],
            },
          ],
        },
      ],
    },
    {
      exportName: "ColorPickerFormatSelect",
      primitiveAliases: { "color-picker": "ColorPickerPrimitive" },
      props: {
        extends: [{ type: "htmlAttributes", element: "div" }],
        fields: [{ name: "size", optional: true, type: '"sm" | "md" | "lg"' }],
      },
      destructure: {
        props: [
          { name: "class", alias: "className" },
          { name: "size", defaultValue: '"md"' },
        ],
        rest: "rest",
      },
      render: [
        primitive(
          "FormatControl",
          [
            {
              name: "class",
              value: {
                type: "classJoin",
                items: [
                  { type: "literal", value: "shrink-0" },
                  { type: "variable", name: "className" },
                ],
              },
            },
            { name: "spread", value: variable("rest") },
            dataSlot("color-picker-format-control"),
          ],
          [
            {
              type: "component",
              component: "select",
              exportName: "Select",
              children: [
                {
                  type: "component",
                  component: "select",
                  exportName: "SelectTrigger",
                  attrs: [
                    { name: "size", value: variable("size") },
                    { name: "aria-label", value: literal("Color format") },
                    {
                      name: "class",
                      value: {
                        type: "classVariant",
                        variant: "colorPickerFormatSelectTrigger",
                        args: { size: "size" },
                      },
                    },
                  ],
                },
                {
                  type: "component",
                  component: "select",
                  exportName: "SelectContent",
                  attrs: [
                    { name: "size", value: variable("size") },
                    { name: "data-sw-color-picker-format-options", value: literal("") },
                  ],
                  children: formatOptionNodes("select"),
                },
              ],
            },
          ],
        ),
      ],
    },
    {
      exportName: "ColorPickerValueSwatch",
      primitiveAliases: { "color-picker": "ColorPickerPrimitive" },
      props: {
        extends: [
          { type: "htmlAttributes", element: "span" },
          { type: "variantProps", variant: "colorPickerValueSwatch" },
        ],
      },
      destructure: {
        props: [
          { name: "class", alias: "className" },
          { name: "size", defaultValue: '"md"' },
        ],
        rest: "rest",
      },
      render: [
        primitive(
          "ValueSwatch",
          [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "colorPickerValueSwatch",
                args: { size: "size", class: "className" },
              },
            },
            { name: "spread", value: variable("rest") },
            dataSlot("color-picker-value-swatch"),
          ],
          [
            primitive(
              "TransparencyGrid",
              [
                className("pointer-events-none absolute inset-0 size-full"),
                dataSlot("color-picker-transparency-grid"),
              ],
              [],
            ),
            {
              type: "element",
              tag: "span",
              selfClosing: true,
              attrs: [
                className("pointer-events-none absolute inset-0 size-full"),
                dataSlot("color-picker-value-swatch-color"),
              ],
            },
          ],
        ),
      ],
    },
    simplePart(
      "ColorPickerSwatchGroup",
      "SwatchGroup",
      "div",
      "colorPickerSwatchGroup",
      "color-picker-swatch-group",
    ),
    {
      exportName: "ColorPickerSwatch",
      primitiveAliases: { "color-picker": "ColorPickerPrimitive" },
      props: {
        extends: [
          { type: "htmlAttributes", element: "button" },
          { type: "variantProps", variant: "colorPickerSwatch" },
        ],
        fields: [
          { name: "value", type: 'import("@starwind-ui/runtime/color-picker").ColorPickerValue' },
          { name: "disabled", optional: true, type: "boolean" },
        ],
      },
      destructure: {
        props: [
          { name: "value" },
          { name: "disabled", defaultValue: "false" },
          { name: "class", alias: "className" },
          { name: "size", defaultValue: '"md"' },
        ],
        rest: "rest",
      },
      render: [
        primitive(
          "Swatch",
          [
            { name: "swatchValue", value: variable("value") },
            { name: "swatchDisabled", value: variable("disabled") },
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "colorPickerSwatch",
                args: { size: "size", class: "className" },
              },
            },
            { name: "spread", value: variable("rest") },
            dataSlot("color-picker-swatch"),
          ],
          [
            primitive(
              "TransparencyGrid",
              [
                className("pointer-events-none absolute inset-0 size-full"),
                dataSlot("color-picker-transparency-grid"),
              ],
              [],
            ),
            {
              type: "element",
              tag: "span",
              selfClosing: true,
              attrs: [
                className("pointer-events-none absolute inset-0 size-full"),
                dataSlot("color-picker-swatch-color"),
              ],
            },
            slot(),
          ],
        ),
      ],
    },
    simplePart(
      "ColorPickerEyeDropper",
      "EyeDropperTrigger",
      "button",
      "colorPickerAction",
      "color-picker-eye-dropper",
    ),
    simplePart("ColorPickerClear", "Clear", "button", "colorPickerAction", "color-picker-clear"),
    simplePart(
      "ColorPickerHiddenInput",
      "HiddenInput",
      "input",
      "colorPickerHiddenInput",
      "color-picker-hidden-input",
    ),
  ],
};
