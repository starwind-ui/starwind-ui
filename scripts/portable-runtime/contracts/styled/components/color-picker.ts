import type {
  AttributeContract,
  RenderNode,
  StyledAdapterContract,
  StyledComponentContract,
} from "../types.js";

const variable = (name: string) => ({ name, type: "variable" as const });
const literal = (value: string | boolean | number) => ({ type: "literal" as const, value });
const slot = (name?: string, fallback?: RenderNode[]): RenderNode => ({
  type: "slot",
  ...(name ? { name } : {}),
  ...(fallback ? { fallback } : {}),
});
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

const formatOptionNodes = (component: "native-select" | "select"): RenderNode[] => [
  {
    type: "repeat",
    each: "normalizedFormats",
    item: "formatOption",
    index: "formatIndex",
    children: [
      {
        type: "component",
        component,
        exportName: component === "select" ? "SelectItem" : "NativeSelectOption",
        attrs: [
          { name: "value", value: { type: "raw", code: "formatOption" } },
          {
            name: "key",
            value: { type: "raw", code: "`${formatOption}-${formatIndex}`" },
            frameworks: ["react"],
          },
          ...(component === "native-select"
            ? [
                {
                  name: "selected",
                  value: {
                    type: "raw" as const,
                    code: "initial?.formatSelect.initial.properties.value === formatOption",
                  },
                  frameworks: ["astro" as const],
                },
              ]
            : []),
        ],
        children: [{ type: "text", value: "{formatOption.toUpperCase()}" }],
      },
    ],
  },
];

const formatFields = [
  {
    name: "formatControl",
    optional: true,
    type: '"select" | "native" | "none"',
  },
  {
    name: "formats",
    optional: true,
    type: 'readonly import("@starwind-ui/runtime/color-picker").ColorPickerFormat[]',
  },
] as const;

const swatchesField = {
  name: "swatches",
  optional: true,
  type: 'readonly (import("@starwind-ui/runtime/color-picker").ColorPickerValue | { value: import("@starwind-ui/runtime/color-picker").ColorPickerValue; label: string; disabled?: boolean })[]',
} as const;

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
      ],
      fields,
    },
    destructure: {
      props: [
        ...(fields ?? []).map((field) => ({ name: field.name })),
        { name: "class", alias: "className" },
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
                    { type: "classVariant", variant, args: {} },
                    { type: "classVariant", variant: layoutVariant, args: {} },
                    { type: "variable", name: "className" },
                  ],
                }
              : {
                  type: "classVariant",
                  variant,
                  args: { class: "className" },
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

function defaultAnatomyNodes(inline: boolean): RenderNode[] {
  const labelNode: RenderNode = {
    type: "conditional",
    condition: "label != null",
    then: [
      primitive(
        "Label",
        [
          {
            name: "class",
            value: { type: "classVariant", variant: "colorPickerLabel", args: {} },
          },
          dataSlot("color-picker-label"),
        ],
        [{ type: "text", value: "{label}" }],
      ),
    ],
    else: [],
  };

  const editor: RenderNode = {
    type: "component",
    component: "color-picker",
    exportName: "ColorPickerDefaultEditor",
    attrs: [
      { name: "size", value: variable("size") },
      { name: "formatControl", value: variable("formatControl") },
      { name: "formats", value: variable("normalizedFormats") },
      { name: "showEyeDropper", value: variable("showEyeDropper") },
      { name: "swatches", value: variable("swatches") },
      { name: "portalContainer", value: variable("portalContainer") },
      { name: "disablePortal", value: variable("disablePortal") },
    ],
  };

  if (inline) return [labelNode, editor];

  return [
    labelNode,
    {
      type: "fragment",
      children: [
        primitive(
          "Control",
          [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "colorPickerControl",
                args: {},
              },
            },
            dataSlot("color-picker-control"),
          ],
          [
            {
              type: "component",
              component: "color-picker",
              exportName: "ColorPickerTrigger",
              attrs: [
                { name: "showValueText", value: variable("showValueText") },
                {
                  name: "aria-label",
                  value: {
                    type: "raw",
                    code: 'label ? `Open ${label.toLowerCase()} picker` : "Open color picker"',
                  },
                },
              ],
            },
          ],
        ),
        {
          type: "component",
          component: "color-picker",
          exportName: "ColorPickerContent",
          attrs: [
            { name: "size", value: variable("size") },
            { name: "formatControl", value: variable("formatControl") },
            { name: "formats", value: variable("normalizedFormats") },
            { name: "showEyeDropper", value: variable("showEyeDropper") },
            { name: "swatches", value: variable("swatches") },
            { name: "side", value: variable("side") },
            { name: "align", value: variable("align") },
            { name: "sideOffset", value: variable("sideOffset") },
            { name: "avoidCollisions", value: variable("avoidCollisions") },
            { name: "portalContainer", value: variable("portalContainer") },
            { name: "disablePortal", value: variable("disablePortal") },
            {
              name: "aria-label",
              value: {
                type: "raw",
                code: 'label ? `${label} editor` : "Color editor"',
              },
            },
          ],
        },
      ],
    },
  ];
}

function colorPickerRootNode(floating: boolean, inline: boolean): RenderNode {
  return primitive(
    "Root",
    [
      {
        name: "class",
        value: {
          type: "classVariant",
          variant: "colorPicker",
          args: { size: "size", class: "className" },
        },
      },
      { name: "value", value: variable("value"), frameworks: ["react", "vue"] },
      { name: "defaultValue", value: variable("defaultValue") },
      { name: "format", value: variable("resolvedFormat") },
      { name: "alpha", value: variable("alpha") },
      { name: "allowEmpty", value: variable("clearable") },
      { name: "disabled", value: variable("disabled") },
      { name: "readOnly", value: variable("readOnly") },
      { name: "name", value: variable("name") },
      { name: "form", value: variable("form") },
      { name: "required", value: variable("required") },
      { name: "locale", value: variable("locale") },
      { name: "dir", value: variable("dir") },
      { name: "onValueChange", value: variable("onValueChange"), frameworks: ["react", "vue"] },
      {
        name: "onValueCommitted",
        value: variable("onValueCommitted"),
        frameworks: ["react", "vue"],
      },
      {
        name: "onFormatChange",
        value: variable("handleFormatChange"),
        frameworks: ["react", "vue"],
      },
      { name: "spread", value: variable("rest") },
      { name: "data-size", value: variable("size") },
      ...(floating ? [{ name: "data-floating-root", value: literal(true) }] : []),
      { name: "ref", value: variable("ref"), frameworks: ["react"] },
      dataSlot("color-picker"),
    ],
    [
      slot(undefined, defaultAnatomyNodes(inline)),
      primitive(
        "HiddenInput",
        [
          {
            name: "class",
            value: { type: "classVariant", variant: "colorPickerHiddenInput" },
          },
          dataSlot("color-picker-hidden-input"),
        ],
        [],
      ),
    ],
  );
}

function defaultEditorNodes(): RenderNode[] {
  return [
    {
      type: "component",
      component: "color-picker",
      exportName: "ColorPickerArea",
      attrs: [],
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
            args: {},
          },
        },
        dataSlot("color-picker-slider-action-row"),
      ],
      children: [
        {
          type: "element",
          tag: "div",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "colorPickerSliders",
                args: { class: '"min-w-0 flex-1"' },
              },
            },
            dataSlot("color-picker-sliders"),
          ],
          children: [
            {
              type: "component",
              component: "color-picker",
              exportName: "ColorPickerChannelSlider",
              attrs: [{ name: "channel", value: literal("hue") }],
            },
            {
              type: "component",
              component: "color-picker",
              exportName: "ColorPickerChannelSlider",
              attrs: [{ name: "channel", value: literal("alpha") }],
            },
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
              attrs: [{ name: "aria-label", value: literal("Pick a color from the screen") }],
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
            args: {},
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
            { name: "formatContentSize", value: variable("size") },
            { name: "formatControl", value: variable("formatControl") },
            { name: "formats", value: variable("formats") },
            { name: "portalContainer", value: variable("portalContainer") },
            { name: "disablePortal", value: variable("disablePortal") },
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
          type: "element",
          tag: "div",
          selfClosing: true,
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "colorPickerSeparator",
                args: {},
              },
            },
            { name: "role", value: literal("separator") },
            { name: "aria-hidden", value: literal("true") },
            dataSlot("color-picker-separator"),
          ],
        },
        {
          type: "conditional",
          condition: "normalizedSwatches.length > 0",
          then: [
            {
              type: "component",
              component: "color-picker",
              exportName: "ColorPickerSwatchGroup",
              attrs: [{ name: "aria-label", value: literal("Suggested colors") }],
              children: [
                {
                  type: "repeat",
                  each: "normalizedSwatches",
                  item: "swatch",
                  index: "swatchIndex",
                  children: [
                    {
                      type: "component",
                      component: "color-picker",
                      exportName: "ColorPickerSwatch",
                      attrs: [
                        { name: "value", value: { type: "raw", code: "swatch.value" } },
                        { name: "disabled", value: { type: "raw", code: "swatch.disabled" } },
                        { name: "aria-label", value: { type: "raw", code: "swatch.label" } },
                        {
                          name: "key",
                          value: { type: "raw", code: "`${String(swatch.value)}-${swatchIndex}`" },
                          frameworks: ["react"],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
          else: [],
        },
        {
          type: "component",
          component: "color-picker",
          exportName: "ColorPickerClear",
          attrs: [{ name: "aria-label", value: literal("Clear color") }],
          children: [{ type: "text", value: "Clear" }],
        },
      ],
    },
  ];
}

function colorPickerInputNodes(): RenderNode[] {
  return [
    {
      type: "element",
      tag: "div",
      attrs: [
        {
          name: "class",
          value: {
            type: "classVariant",
            variant: "colorPickerInput",
            args: { class: "className" },
          },
        },
        { name: "spread", value: variable("rest") },
        dataSlot("color-picker-input"),
      ],
      children: [
        primitive(
          "ValueInput",
          [
            {
              name: "class",
              value: {
                type: "classJoin",
                items: [
                  {
                    type: "classVariant",
                    variant: "colorPickerValueInput",
                    args: {},
                  },
                  {
                    type: "classVariant",
                    variant: "colorPickerValueInputLayout",
                    args: {},
                  },
                ],
              },
            },
            dataSlot("color-picker-value-input"),
          ],
          [],
        ),
        {
          type: "conditional",
          condition: 'formatControl === "native"',
          then: [
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
                        args: {},
                      },
                    },
                    { name: "aria-label", value: literal("Color format") },
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
                        args: {},
                      },
                    },
                    { name: "aria-hidden", value: literal("true") },
                    dataSlot("color-picker-native-format-select-icon"),
                  ],
                },
              ],
            },
          ],
          else: [],
        },
        {
          type: "conditional",
          condition: 'formatControl === "select"',
          then: [
            primitive(
              "FormatControl",
              [
                { name: "class", value: literal("shrink-0") },
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
                        { name: "aria-label", value: literal("Color format") },
                        {
                          name: "class",
                          value: {
                            type: "classVariant",
                            variant: "colorPickerFormatSelectTrigger",
                            args: {},
                          },
                        },
                      ],
                    },
                    {
                      type: "component",
                      component: "select",
                      exportName: "SelectContent",
                      attrs: [
                        { name: "size", value: variable("formatContentSize") },
                        { name: "portalContainer", value: variable("portalContainer") },
                        { name: "disablePortal", value: variable("disablePortal") },
                        { name: "data-sw-color-picker-format-options", value: literal("") },
                      ],
                      children: formatOptionNodes("select"),
                    },
                  ],
                },
              ],
            ),
          ],
          else: [],
        },
      ],
    },
  ];
}

export const colorPickerStyledContract: StyledAdapterContract = {
  component: "color-picker",
  frameworks: ["astro", "react", "vue"],
  annotations: {
    behaviorOwnership: [
      "Color Picker Primitive owns color value, editing, accessibility, and form behavior.",
      "Popover owns open state, placement, dismissal, presence, portal placement, and focus return.",
      "Inline, input-only, and swatch-only compositions use no floating behavior.",
    ],
    composition: [
      "ColorPicker provides a complete popup editor by default and switches to the popup-free editor when inline is true.",
      "Supplying children replaces the default visible anatomy while ColorPicker retains the Primitive root and hidden form input.",
      "ColorPickerContent and ColorPickerInput provide focused escape hatches for custom popup layouts and native, styled, or omitted format controls.",
      "Preset swatches are consumer-owned data rendered by the default editor or explicit Swatch parts.",
    ],
    portalGuidance: [
      "ColorPickerContent inherits Popover Portal discovery of the nearest data-floating-root.",
      "Inside Dialog, render content beneath the Dialog-local floating root so dismissal and focus return remain in the nested overlay.",
    ],
  },
  dependencies: { styledComponents: ["popover", "select", "native-select", "input"] },
  publicExports: [
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
  ],
  defaultExport: {
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
      "ColorPickerInput",
      "ColorPickerValueSwatch",
      "ColorPickerSwatch",
    ],
    content: [
      '[data-slot="color-picker"][data-size="sm"], [data-sw-color-picker-content][data-size="sm"] { --sw-color-picker-font-size: 0.875rem; --sw-color-picker-label-font-size: 0.75rem; --sw-color-picker-gap: 0.75rem; --sw-color-picker-compact-gap: 0.375rem; --sw-color-picker-control-height: 2.25rem; --sw-color-picker-control-padding: 0.5rem; --sw-color-picker-content-width: 16rem; --sw-color-picker-content-gap: 0.5rem; --sw-color-picker-content-padding: 0.5rem; --sw-color-picker-area-height: 150px; --sw-color-picker-area-thumb-size: 0.875rem; --sw-color-picker-slider-gap: 0.5rem; --sw-color-picker-slider-size: 0.625rem; --sw-color-picker-slider-vertical-size: 10rem; --sw-color-picker-slider-thumb-size: 0.75rem; --sw-color-picker-input-width: 4rem; --sw-color-picker-swatch-size: 1.5rem; --sw-color-picker-value-swatch-size: 1rem; --sw-color-picker-value-swatch-radius: 4.5px; --sw-color-picker-format-width: 5rem; }',
      '[data-slot="color-picker"][data-size="md"], [data-sw-color-picker-content][data-size="md"] { --sw-color-picker-font-size: 1rem; --sw-color-picker-label-font-size: 0.875rem; --sw-color-picker-gap: 0.75rem; --sw-color-picker-compact-gap: 0.5rem; --sw-color-picker-control-height: 2.75rem; --sw-color-picker-control-padding: 0.75rem; --sw-color-picker-content-width: 18rem; --sw-color-picker-content-gap: 0.75rem; --sw-color-picker-content-padding: 0.75rem; --sw-color-picker-area-height: 175px; --sw-color-picker-area-thumb-size: 1rem; --sw-color-picker-slider-gap: 0.75rem; --sw-color-picker-slider-size: 0.75rem; --sw-color-picker-slider-vertical-size: 12rem; --sw-color-picker-slider-thumb-size: 1rem; --sw-color-picker-input-width: 5rem; --sw-color-picker-swatch-size: 1.75rem; --sw-color-picker-value-swatch-size: 1.25rem; --sw-color-picker-value-swatch-radius: 5.5px; --sw-color-picker-format-width: 6rem; }',
      '[data-slot="color-picker"][data-size="lg"], [data-sw-color-picker-content][data-size="lg"] { --sw-color-picker-font-size: 1.125rem; --sw-color-picker-label-font-size: 1rem; --sw-color-picker-gap: 0.75rem; --sw-color-picker-compact-gap: 0.625rem; --sw-color-picker-control-height: 3rem; --sw-color-picker-control-padding: 1rem; --sw-color-picker-content-width: 20rem; --sw-color-picker-content-gap: 1rem; --sw-color-picker-content-padding: 1rem; --sw-color-picker-area-height: 200px; --sw-color-picker-area-thumb-size: 1.25rem; --sw-color-picker-slider-gap: 1rem; --sw-color-picker-slider-size: 1rem; --sw-color-picker-slider-vertical-size: 14rem; --sw-color-picker-slider-thumb-size: 1.25rem; --sw-color-picker-input-width: 6rem; --sw-color-picker-swatch-size: 2rem; --sw-color-picker-value-swatch-size: 1.5rem; --sw-color-picker-value-swatch-radius: 6.5px; --sw-color-picker-format-width: 6rem; }',
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
      '[data-sw-color-picker][data-floating-root] > [data-slot="select-portal"] { display: contents; }',
      '[data-sw-color-picker][data-floating-root] > [data-slot="select-portal"] > [data-slot="select-positioner"]:has(> [data-sw-color-picker-format-options]) { position: fixed; z-index: 60; }',
    ],
  },
  variants: {
    colorPicker: {
      base: "relative flex flex-col gap-(--sw-color-picker-gap) text-(length:--sw-color-picker-font-size)",
      variants: { size: { sm: "", md: "", lg: "" } },
      defaultVariants: { size: "md" },
    },
    colorPickerLabel: {
      base: "text-(length:--sw-color-picker-label-font-size) font-medium leading-none data-disabled:cursor-not-allowed data-disabled:opacity-50",
    },
    colorPickerControl: {
      base: "flex items-center gap-(--sw-color-picker-compact-gap)",
    },
    colorPickerTrigger: {
      base: "border-input bg-background focus-visible:ring-outline/50 inline-flex h-(--sw-color-picker-control-height) items-center gap-(--sw-color-picker-compact-gap) rounded-md border px-(--sw-color-picker-control-padding) text-(length:--sw-color-picker-font-size) shadow-xs outline-none focus-visible:ring-3 disabled:pointer-events-none disabled:opacity-50",
    },
    colorPickerContent: {
      base: "flex max-h-(--sw-floating-available-height) w-(--sw-color-picker-content-width) flex-col gap-(--sw-color-picker-content-gap) p-(--sw-color-picker-content-padding) text-(length:--sw-color-picker-font-size)",
      variants: { size: { sm: "", md: "", lg: "" } },
      defaultVariants: { size: "md" },
    },
    colorPickerInput: {
      base: "flex items-center gap-(--sw-color-picker-compact-gap)",
    },
    colorPickerValueInputLayout: {
      base: "!h-(--sw-color-picker-control-height) min-w-0 flex-1 !px-(--sw-color-picker-control-padding) !text-(length:--sw-color-picker-font-size) data-invalid:border-error data-invalid:focus-visible:ring-error/40",
    },
    colorPickerArea: {
      base: "group/color-picker-area border-outline relative h-(--sw-color-picker-area-height) min-h-32 w-full shrink-0 cursor-crosshair touch-none rounded-md border [&>[data-slot=color-picker-area-background]]:inset-0 [&>[data-slot=color-picker-area-background]]:size-full [&>[data-slot=color-picker-area-background]]:rounded-[7px]",
    },
    colorPickerAreaThumb: {
      base: "group-has-[[data-slot=color-picker-area-input-x]:focus-visible]/color-picker-area:ring-outline/60 pointer-events-none absolute top-[clamp(1px,var(--sw-color-picker-area-y),calc(100%_-_1px))] left-[clamp(1px,var(--sw-color-picker-area-x),calc(100%_-_1px))] z-10 size-(--sw-color-picker-area-thumb-size) -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-(--sw-color-picker-area-thumb-color) shadow-md ring-1 ring-black/30 outline-none group-has-[[data-slot=color-picker-area-input-x]:focus-visible]/color-picker-area:ring-3 focus-visible:ring-3 data-disabled:opacity-50 data-dragging:scale-110",
    },
    colorPickerSliders: {
      base: "flex flex-col gap-(--sw-color-picker-slider-gap) px-2",
    },
    colorPickerSliderActionRow: {
      base: "flex items-center gap-(--sw-color-picker-compact-gap)",
    },
    colorPickerValueFormatRow: {
      base: "flex items-center gap-(--sw-color-picker-compact-gap)",
    },
    colorPickerSeparator: {
      base: "bg-border my-[calc(var(--sw-color-picker-compact-gap)/2)] h-px w-full",
    },
    colorPickerChannelSlider: {
      base: "group/color-picker-channel-slider bg-border relative h-(--sw-color-picker-slider-size) touch-none rounded-full data-[orientation=vertical]:h-(--sw-color-picker-slider-vertical-size) data-[orientation=vertical]:w-(--sw-color-picker-slider-size) [&>[data-slot=color-picker-channel-slider-track]]:inset-px [&>[data-slot=color-picker-channel-slider-track]]:size-auto [&>[data-slot=color-picker-transparency-grid]]:inset-px [&>[data-slot=color-picker-transparency-grid]]:size-auto",
    },
    colorPickerChannelSliderThumb: {
      base: "group-has-[[data-slot=color-picker-channel-slider-input]:focus-visible]/color-picker-channel-slider:ring-outline/60 pointer-events-none absolute top-1/2 left-(--sw-color-picker-channel-position) z-10 size-(--sw-color-picker-slider-thumb-size) -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full border-2 border-white shadow-md ring-1 ring-black/30 outline-none group-has-[[data-slot=color-picker-channel-slider-input]:focus-visible]/color-picker-channel-slider:ring-3 group-data-[orientation=vertical]/color-picker-channel-slider:top-[calc(100%-var(--sw-color-picker-channel-position))] group-data-[orientation=vertical]/color-picker-channel-slider:left-1/2 data-disabled:opacity-50 data-dragging:scale-110",
    },
    colorPickerChannelInputLayout: {
      base: "h-(--sw-color-picker-control-height) w-(--sw-color-picker-input-width) px-(--sw-color-picker-control-padding) text-center text-(length:--sw-color-picker-font-size) data-invalid:border-error data-invalid:focus-visible:ring-error/40",
    },
    colorPickerSwatch: {
      base: "relative size-(--sw-color-picker-swatch-size) overflow-hidden rounded-md border shadow-xs outline-none focus-visible:ring-3 data-selected:ring-2 data-disabled:opacity-50",
    },
    colorPickerSwatchGroup: {
      base: "flex flex-wrap gap-(--sw-color-picker-compact-gap)",
    },
    colorPickerValueSwatch: {
      base: "border-input relative size-(--sw-color-picker-value-swatch-size) shrink-0 overflow-hidden rounded-(--sw-color-picker-value-swatch-radius) border",
    },
    colorPickerFormatSelectTrigger: {
      base: "h-(--sw-color-picker-control-height) min-w-(--sw-color-picker-format-width) px-(--sw-color-picker-control-padding) text-(length:--sw-color-picker-font-size) uppercase",
    },
    colorPickerAction: {
      base: "border-input bg-background inline-flex h-(--sw-color-picker-control-height) items-center justify-center rounded-md border px-(--sw-color-picker-control-padding) text-(length:--sw-color-picker-font-size) outline-none focus-visible:ring-3 disabled:opacity-50",
    },
    colorPickerHiddenInput: {
      base: "sr-only",
    },
  },
  components: [
    {
      exportName: "ColorPicker",
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
            frameworks: ["react", "vue"],
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
          { name: "clearable", optional: true, type: "boolean" },
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
          { name: "inline", optional: true, type: "boolean" },
          { name: "label", optional: true, type: "string" },
          { name: "showEyeDropper", optional: true, type: "boolean" },
          { name: "showValueText", optional: true, type: "boolean" },
          ...formatFields,
          swatchesField,
          { name: "defaultOpen", optional: true, type: "boolean" },
          { name: "open", optional: true, type: "boolean", frameworks: ["react", "vue"] },
          { name: "closeOnEscape", optional: true, type: "boolean" },
          { name: "closeOnOutsideInteract", optional: true, type: "boolean" },
          { name: "modal", optional: true, type: "boolean" },
          { name: "openOnHover", optional: true, type: "boolean" },
          { name: "closeDelay", optional: true, type: "number" },
          { name: "side", optional: true, type: '"top" | "right" | "bottom" | "left"' },
          { name: "align", optional: true, type: '"start" | "center" | "end"' },
          { name: "sideOffset", optional: true, type: "number" },
          { name: "avoidCollisions", optional: true, type: "boolean" },
          { name: "portalContainer", optional: true, type: "string" },
          { name: "disablePortal", optional: true, type: "boolean" },
          {
            name: "onValueChange",
            optional: true,
            type: '(value: import("@starwind-ui/runtime/color-picker").ColorPickerColor | null, details: import("@starwind-ui/runtime/color-picker").ColorPickerValueChangeDetails) => void',
            frameworks: ["react", "vue"],
          },
          {
            name: "onValueCommitted",
            optional: true,
            type: '(value: import("@starwind-ui/runtime/color-picker").ColorPickerColor | null, details: import("@starwind-ui/runtime/color-picker").ColorPickerValueCommitDetails) => void',
            frameworks: ["react", "vue"],
          },
          {
            name: "onFormatChange",
            optional: true,
            type: '(format: import("@starwind-ui/runtime/color-picker").ColorPickerFormat, details: import("@starwind-ui/runtime/color-picker").ColorPickerFormatChangeDetails) => void',
            frameworks: ["react", "vue"],
          },
          {
            name: "onOpenChange",
            optional: true,
            type: 'React.ComponentProps<typeof Popover>["onOpenChange"]',
            frameworks: ["react", "vue"],
          },
          {
            name: "onCloseComplete",
            optional: true,
            type: 'React.ComponentProps<typeof Popover>["onCloseComplete"]',
            frameworks: ["react", "vue"],
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
          { name: "value", frameworks: ["react", "vue"] },
          { name: "defaultValue", defaultValue: '"#000000"' },
          { name: "format" },
          { name: "alpha", defaultValue: "true" },
          { name: "clearable", defaultValue: "false" },
          { name: "disabled", defaultValue: "false" },
          { name: "readOnly", defaultValue: "false" },
          { name: "name" },
          { name: "form" },
          { name: "required", defaultValue: "false" },
          { name: "locale" },
          { name: "dir" },
          { name: "inline", defaultValue: "false" },
          { name: "label" },
          { name: "showEyeDropper", defaultValue: "true" },
          { name: "showValueText", defaultValue: "true" },
          { name: "formatControl", defaultValue: '"select"' },
          { name: "formats", defaultValue: JSON.stringify(formatOptions) },
          { name: "swatches", defaultValue: "[]" },
          { name: "defaultOpen", defaultValue: "false" },
          { name: "open", frameworks: ["react", "vue"] },
          { name: "closeOnEscape", defaultValue: "true" },
          { name: "closeOnOutsideInteract", defaultValue: "true" },
          { name: "modal", defaultValue: "false" },
          { name: "openOnHover", defaultValue: "false" },
          { name: "closeDelay", defaultValue: "200" },
          { name: "side", defaultValue: '"bottom"' },
          { name: "align", defaultValue: '"start"' },
          { name: "sideOffset", defaultValue: "4" },
          { name: "avoidCollisions", defaultValue: "true" },
          { name: "portalContainer" },
          { name: "disablePortal", defaultValue: "false" },
          { name: "onValueChange", frameworks: ["react", "vue"] },
          { name: "onValueCommitted", frameworks: ["react", "vue"] },
          { name: "onFormatChange", frameworks: ["react", "vue"] },
          { name: "onOpenChange", frameworks: ["react", "vue"] },
          { name: "onCloseComplete", frameworks: ["react", "vue"] },
          { name: "ref", frameworks: ["react"] },
          { name: "class", alias: "className" },
          { name: "size", defaultValue: '"md"' },
        ],
        rest: "rest",
      },
      variables: [
        {
          name: "initialFormat",
          frameworks: ["react"],
          value: { type: "raw", code: 'format ?? formats[0] ?? "hex"' },
        },
        {
          name: "uncontrolledFormatState",
          frameworks: ["react"],
          value: { type: "raw", code: "React.useState(initialFormat)" },
        },
        {
          name: "uncontrolledFormat",
          frameworks: ["react"],
          value: { type: "raw", code: "uncontrolledFormatState[0]" },
        },
        {
          name: "setUncontrolledFormat",
          frameworks: ["react"],
          value: { type: "raw", code: "uncontrolledFormatState[1]" },
        },
        {
          name: "resolvedFormat",
          frameworks: ["react"],
          value: { type: "raw", code: "format ?? uncontrolledFormat" },
        },
        {
          name: "resolvedFormat",
          frameworks: ["astro"],
          value: { type: "raw", code: 'format ?? formats[0] ?? "hex"' },
        },
        {
          name: "resolvedFormat",
          frameworks: ["vue"],
          value: { type: "raw", code: 'format ?? formats[0] ?? "hex"' },
        },
        {
          name: "requestedFormats",
          value: { type: "raw", code: "Array.from(new Set(formats))" },
        },
        {
          name: "normalizedFormats",
          value: {
            type: "raw",
            code: "requestedFormats.includes(resolvedFormat) ? requestedFormats : [resolvedFormat, ...requestedFormats]",
          },
        },
        {
          name: "handleFormatChange",
          frameworks: ["react"],
          value: {
            type: "raw",
            code: "(...args: Parameters<NonNullable<typeof onFormatChange>>) => { const [nextFormat, details] = args; if (format === undefined) setUncontrolledFormat(nextFormat); onFormatChange?.(nextFormat, details); }",
          },
        },
      ],
      render: [
        {
          type: "conditional",
          condition: "inline",
          then: [colorPickerRootNode(false, true)],
          else: [
            {
              type: "component",
              component: "popover",
              exportName: "Popover",
              attrs: [
                { name: "defaultOpen", value: variable("defaultOpen") },
                { name: "open", value: variable("open"), frameworks: ["react", "vue"] },
                { name: "closeOnEscape", value: variable("closeOnEscape") },
                { name: "closeOnOutsideInteract", value: variable("closeOnOutsideInteract") },
                { name: "modal", value: variable("modal") },
                { name: "openOnHover", value: variable("openOnHover") },
                { name: "closeDelay", value: variable("closeDelay") },
                {
                  name: "onOpenChange",
                  value: variable("onOpenChange"),
                  frameworks: ["react", "vue"],
                },
                {
                  name: "onCloseComplete",
                  value: variable("onCloseComplete"),
                  frameworks: ["react", "vue"],
                },
              ],
              children: [colorPickerRootNode(true, false)],
            },
          ],
        },
      ],
    },
    {
      exportName: "ColorPickerDefaultEditor",
      imports: [
        {
          importName: "ColorPicker",
          source: "@tabler/icons/outline/color-picker.svg",
          type: "default",
        },
      ],
      props: {
        fields: [
          { name: "size", optional: true, type: '"sm" | "md" | "lg"' },
          { name: "showEyeDropper", optional: true, type: "boolean" },
          { name: "portalContainer", optional: true, type: "string" },
          { name: "disablePortal", optional: true, type: "boolean" },
          ...formatFields,
          swatchesField,
        ],
      },
      destructure: {
        props: [
          { name: "size", defaultValue: '"md"' },
          { name: "showEyeDropper", defaultValue: "true" },
          { name: "portalContainer" },
          { name: "disablePortal", defaultValue: "false" },
          { name: "formatControl", defaultValue: '"select"' },
          { name: "formats", defaultValue: JSON.stringify(formatOptions) },
          { name: "swatches", defaultValue: "[]" },
        ],
      },
      variables: [
        {
          name: "isSwatchDescriptor",
          value: {
            type: "raw",
            code: '(swatch: (typeof swatches)[number]): swatch is Extract<(typeof swatches)[number], { value: unknown }> => typeof swatch === "object" && swatch !== null && "value" in swatch && "label" in swatch',
          },
        },
        {
          name: "normalizedSwatches",
          value: {
            type: "raw",
            code: "swatches.map((swatch) => isSwatchDescriptor(swatch) ? swatch : { value: swatch, label: String(swatch), disabled: undefined })",
          },
        },
        {
          name: "hasSwatchesAttribute",
          value: { type: "raw", code: 'normalizedSwatches.length > 0 ? "true" : "false"' },
        },
      ],
      render: defaultEditorNodes(),
    },
    {
      exportName: "ColorPickerInput",
      primitiveAliases: { "color-picker": "ColorPickerPrimitive" },
      imports: [
        {
          importName: "ChevronDown",
          source: "@tabler/icons/outline/chevron-down.svg",
          type: "default",
        },
      ],
      props: {
        extends: [{ type: "htmlAttributes", element: "div" }],
        fields: [
          ...formatFields,
          { name: "formatContentSize", optional: true, type: '"sm" | "md" | "lg"' },
          { name: "portalContainer", optional: true, type: "string" },
          { name: "disablePortal", optional: true, type: "boolean" },
        ],
      },
      destructure: {
        props: [
          { name: "formatControl", defaultValue: '"select"' },
          { name: "formats", defaultValue: JSON.stringify(formatOptions) },
          { name: "formatContentSize", defaultValue: '"md"' },
          { name: "portalContainer" },
          { name: "disablePortal", defaultValue: "false" },
          { name: "class", alias: "className" },
        ],
        rest: "rest",
      },
      variables: [
        { name: "normalizedFormats", value: { type: "raw", code: "Array.from(new Set(formats))" } },
      ],
      render: colorPickerInputNodes(),
    },
    {
      exportName: "ColorPickerTrigger",
      props: {
        extends: [{ type: "componentProps", component: "popover", exportName: "PopoverTrigger" }],
        fields: [{ name: "showValueText", optional: true, type: "boolean" }],
      },
      destructure: {
        props: [
          { name: "class", alias: "className" },
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
                args: { class: "className" },
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
                    args: {},
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
      props: {
        extends: [
          { type: "componentProps", component: "popover", exportName: "PopoverContent" },
          { type: "variantProps", variant: "colorPickerContent" },
        ],
        fields: [
          { name: "showEyeDropper", optional: true, type: "boolean" },
          ...formatFields,
          swatchesField,
        ],
      },
      destructure: {
        props: [
          { name: "class", alias: "className" },
          { name: "size", defaultValue: '"md"' },
          { name: "showEyeDropper", defaultValue: "true" },
          { name: "formatControl", defaultValue: '"select"' },
          { name: "formats", defaultValue: JSON.stringify(formatOptions) },
          { name: "swatches", defaultValue: "[]" },
          { name: "side", defaultValue: '"bottom"' },
          { name: "align", defaultValue: '"start"' },
          { name: "exitMotion", defaultValue: '"fade"' },
          { name: "portalContainer" },
          { name: "disablePortal", defaultValue: "false" },
        ],
        rest: "rest",
      },
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
            { name: "portalContainer", value: variable("portalContainer") },
            { name: "disablePortal", value: variable("disablePortal") },
            { name: "spread", value: variable("rest") },
            { name: "data-sw-color-picker-content", value: literal("") },
            { name: "data-size", value: variable("size") },
            dataSlot("color-picker-content"),
          ],
          children: [
            slot(undefined, [
              {
                type: "component",
                component: "color-picker",
                exportName: "ColorPickerDefaultEditor",
                attrs: [
                  { name: "size", value: variable("size") },
                  { name: "showEyeDropper", value: variable("showEyeDropper") },
                  { name: "portalContainer", value: variable("portalContainer") },
                  { name: "disablePortal", value: variable("disablePortal") },
                  { name: "formatControl", value: variable("formatControl") },
                  { name: "formats", value: variable("formats") },
                  { name: "swatches", value: variable("swatches") },
                ],
              },
            ]),
          ],
        },
      ],
    },
    {
      exportName: "ColorPickerArea",
      primitiveAliases: { "color-picker": "ColorPickerPrimitive" },
      props: {
        extends: [{ type: "htmlAttributes", element: "div" }],
      },
      destructure: {
        props: [{ name: "class", alias: "className" }],
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
                args: { class: "className" },
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
            primitive(
              "AreaThumb",
              [
                {
                  name: "class",
                  value: {
                    type: "classVariant",
                    variant: "colorPickerAreaThumb",
                    args: {},
                  },
                },
                dataSlot("color-picker-area-thumb"),
              ],
              [],
            ),
            primitive(
              "AreaInput",
              [
                { name: "axis", value: literal("x") },
                className("pointer-events-none absolute inset-0 size-full opacity-0"),
                dataSlot("color-picker-area-input-x"),
              ],
              [],
            ),
            primitive(
              "AreaInput",
              [
                { name: "axis", value: literal("y") },
                className("pointer-events-none absolute inset-0 size-full opacity-0"),
                dataSlot("color-picker-area-input-y"),
              ],
              [],
            ),
          ],
        ),
      ],
    },
    {
      exportName: "ColorPickerChannelSlider",
      primitiveAliases: { "color-picker": "ColorPickerPrimitive" },
      props: {
        extends: [{ type: "htmlAttributes", element: "div" }],
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
                args: { class: "className" },
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
                    args: {},
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
                      "pointer-events-none absolute inset-0 size-full bg-(--sw-color-picker-channel-thumb-color)",
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
    {
      exportName: "ColorPickerValueSwatch",
      primitiveAliases: { "color-picker": "ColorPickerPrimitive" },
      props: {
        extends: [{ type: "htmlAttributes", element: "span" }],
      },
      destructure: {
        props: [{ name: "class", alias: "className" }],
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
                args: { class: "className" },
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
        extends: [{ type: "omitHtmlAttributes", element: "button", keys: ["value"] }],
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
                args: { class: "className" },
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
  ],
};
