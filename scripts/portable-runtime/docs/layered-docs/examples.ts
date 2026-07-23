import { runtimeAdapterContracts } from "../../contracts/primitive/representatives.js";
import type { RuntimeAdapterContract } from "../../contracts/primitive/types.js";
import type {
  PrimitiveDocsAuthoredExampleMetadata,
  PrimitiveDocsExampleCoveragePolicy,
  PrimitiveDocsExampleRegistry,
  PrimitiveDocsExampleRegistryEntry,
  PrimitiveDocsFrameworkTarget,
} from "./types.js";

const EXAMPLES_SOURCE_PATH = "scripts/portable-runtime/docs/layered-docs/examples.ts";

const requiredExampleTargets = [
  "raw-html",
  "astro",
  "react",
] as const satisfies readonly PrimitiveDocsFrameworkTarget[];

export const primitiveDocsExampleCoveragePolicy = {
  requiredTargets: requiredExampleTargets,
} as const satisfies PrimitiveDocsExampleCoveragePolicy;

type PrimitivePart = RuntimeAdapterContract["parts"][number];

type ExampleNode = {
  readonly part: string;
  readonly children?: readonly ExampleNode[];
  readonly props?: Readonly<Record<string, ExamplePropValue>>;
  readonly text?: string;
};

type ExamplePropValue =
  | { readonly kind: "boolean"; readonly value: boolean }
  | { readonly kind: "number"; readonly value: number }
  | { readonly kind: "string"; readonly value: string };

const stringProp = (value: string): ExamplePropValue => ({ kind: "string", value });
const numberProp = (value: number): ExamplePropValue => ({ kind: "number", value });

export const colorPickerPrimitiveDocsAuthoredExamples = [
  {
    id: "composite-format-control",
    title: "Composite Format Control",
    summary:
      "Compose FormatControl around one Runtime-backed Select. Color Picker owns the accepted format and synchronizes Select without creating another form value.",
    frameworks: [
      {
        framework: "astro",
        language: "astro",
        source: `${EXAMPLES_SOURCE_PATH}#color-picker-composite-format-control-astro`,
        code: `---
import { ColorPicker } from "@starwind-ui/astro/color-picker";
import { Select } from "@starwind-ui/astro/select";
---

<ColorPicker.Root defaultValue="#3b82f6" format="hex" name="accent">
  <ColorPicker.ValueInput />
  <ColorPicker.FormatControl>
    <Select.Root defaultValue="hex">
      <Select.Trigger aria-label="Color format">
        <Select.Value>HEX</Select.Value>
      </Select.Trigger>
      <Select.Positioner>
        <Select.Popup>
          <Select.List>
            <Select.Item value="hex"><Select.ItemText>HEX</Select.ItemText></Select.Item>
            <Select.Item value="rgb"><Select.ItemText>RGB</Select.ItemText></Select.Item>
            <Select.Item value="hsl"><Select.ItemText>HSL</Select.ItemText></Select.Item>
            <Select.Item value="hsb"><Select.ItemText>HSB</Select.ItemText></Select.Item>
          </Select.List>
        </Select.Popup>
      </Select.Positioner>
    </Select.Root>
  </ColorPicker.FormatControl>
  <ColorPicker.HiddenInput />
</ColorPicker.Root>`,
      },
      {
        framework: "react",
        language: "tsx",
        source: `${EXAMPLES_SOURCE_PATH}#color-picker-composite-format-control-react`,
        code: `import { ColorPicker } from "@starwind-ui/react/color-picker";
import { Select } from "@starwind-ui/react/select";

export function CompositeFormatControl() {
  return (
    <ColorPicker.Root defaultValue="#3b82f6" format="hex" name="accent">
      <ColorPicker.ValueInput />
      <ColorPicker.FormatControl>
        <Select.Root defaultValue="hex">
          <Select.Trigger aria-label="Color format">
            <Select.Value>HEX</Select.Value>
          </Select.Trigger>
          <Select.Positioner>
            <Select.Popup>
              <Select.List>
                <Select.Item value="hex"><Select.ItemText>HEX</Select.ItemText></Select.Item>
                <Select.Item value="rgb"><Select.ItemText>RGB</Select.ItemText></Select.Item>
                <Select.Item value="hsl"><Select.ItemText>HSL</Select.ItemText></Select.Item>
                <Select.Item value="hsb"><Select.ItemText>HSB</Select.ItemText></Select.Item>
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Root>
      </ColorPicker.FormatControl>
      <ColorPicker.HiddenInput />
    </ColorPicker.Root>
  );
}`,
      },
      {
        framework: "raw-html",
        language: "html",
        source: `${EXAMPLES_SOURCE_PATH}#color-picker-composite-format-control-html`,
        code: `<div data-sw-color-picker role="group">
  <input data-sw-color-picker-value-input value="#3b82f6" />
  <div data-sw-color-picker-format-control>
    <div data-sw-select data-default-value="hex">
      <button data-sw-select-trigger type="button" aria-label="Color format">
        <span data-sw-select-value>HEX</span>
      </button>
      <div data-sw-select-positioner>
        <div data-sw-select-popup hidden>
          <div data-sw-select-list>
            <div data-sw-select-item data-value="hex"><span data-sw-select-item-text>HEX</span></div>
            <div data-sw-select-item data-value="rgb"><span data-sw-select-item-text>RGB</span></div>
            <div data-sw-select-item data-value="hsl"><span data-sw-select-item-text>HSL</span></div>
            <div data-sw-select-item data-value="hsb"><span data-sw-select-item-text>HSB</span></div>
          </div>
        </div>
      </div>
      <input data-sw-select-input type="hidden" />
    </div>
  </div>
  <input data-sw-color-picker-hidden-input type="text" name="accent" aria-hidden="true" tabindex="-1" />
</div>

<script type="module">
  import { createColorPicker } from "@starwind-ui/runtime/color-picker";
  import { createSelect } from "@starwind-ui/runtime/select";

  const root = document.querySelector("[data-sw-color-picker]");
  const selectRoot = root?.querySelector("[data-sw-select]");
  if (root && selectRoot) {
    createSelect(selectRoot);
    createColorPicker(root, {
      defaultValue: "#3b82f6",
      format: "hex",
      name: "accent",
    });
  }
</script>`,
      },
    ],
  },
  {
    id: "native-format-select",
    title: "Native Format Select",
    summary:
      "Use FormatSelect for a progressively enhanced native select with the same hex, rgb, hsl, and hsb format state.",
    frameworks: [
      {
        framework: "astro",
        language: "astro",
        source: `${EXAMPLES_SOURCE_PATH}#color-picker-native-format-select-astro`,
        code: `---
import { ColorPicker } from "@starwind-ui/astro/color-picker";
---

<ColorPicker.Root defaultValue="#3b82f6" format="hex" name="accent">
  <ColorPicker.ValueInput />
  <ColorPicker.FormatSelect aria-label="Color format">
    <option value="hex">HEX</option>
    <option value="rgb">RGB</option>
    <option value="hsl">HSL</option>
    <option value="hsb">HSB</option>
  </ColorPicker.FormatSelect>
  <ColorPicker.HiddenInput />
</ColorPicker.Root>`,
      },
      {
        framework: "react",
        language: "tsx",
        source: `${EXAMPLES_SOURCE_PATH}#color-picker-native-format-select-react`,
        code: `import { ColorPicker } from "@starwind-ui/react/color-picker";

export function NativeFormatSelect() {
  return (
    <ColorPicker.Root defaultValue="#3b82f6" format="hex" name="accent">
      <ColorPicker.ValueInput />
      <ColorPicker.FormatSelect aria-label="Color format">
        <option value="hex">HEX</option>
        <option value="rgb">RGB</option>
        <option value="hsl">HSL</option>
        <option value="hsb">HSB</option>
      </ColorPicker.FormatSelect>
      <ColorPicker.HiddenInput />
    </ColorPicker.Root>
  );
}`,
      },
      {
        framework: "raw-html",
        language: "html",
        source: `${EXAMPLES_SOURCE_PATH}#color-picker-native-format-select-html`,
        code: `<div data-sw-color-picker role="group">
  <input data-sw-color-picker-value-input value="#3b82f6" />
  <select data-sw-color-picker-format-select aria-label="Color format">
    <option value="hex">HEX</option>
    <option value="rgb">RGB</option>
    <option value="hsl">HSL</option>
    <option value="hsb">HSB</option>
  </select>
  <input data-sw-color-picker-hidden-input type="text" name="accent" aria-hidden="true" tabindex="-1" />
</div>

<script type="module">
  import { createColorPicker } from "@starwind-ui/runtime/color-picker";

  const root = document.querySelector("[data-sw-color-picker]");
  if (root) {
    createColorPicker(root, {
      defaultValue: "#3b82f6",
      format: "hex",
      name: "accent",
    });
  }
</script>`,
      },
    ],
  },
] as const satisfies readonly PrimitiveDocsAuthoredExampleMetadata[];

const primitiveExampleLayouts: Partial<Record<string, readonly ExampleNode[]>> = {
  accordion: [
    {
      part: "item",
      props: { value: stringProp("details") },
      children: [
        { part: "header", children: [{ part: "trigger", text: "Toggle details" }] },
        { part: "panel", text: "Accordion panel content" },
      ],
    },
  ],
  "alert-dialog": [
    { part: "trigger", text: "Delete item" },
    { part: "backdrop" },
    {
      part: "viewport",
      children: [
        {
          part: "popup",
          children: [
            { part: "title", text: "Delete item?" },
            { part: "description", text: "This action cannot be undone." },
            { part: "close", text: "Cancel" },
          ],
        },
      ],
    },
  ],
  avatar: [
    { part: "image", props: { alt: stringProp("Starwind UI") } },
    { part: "fallback", text: "SW" },
  ],
  carousel: [
    {
      part: "viewport",
      children: [{ part: "container", children: [{ part: "item", text: "Slide 1" }] }],
    },
    { part: "previous", text: "Previous" },
    { part: "next", text: "Next" },
  ],
  checkbox: [{ part: "indicator" }, { part: "input" }],
  "color-picker": [
    { part: "label", text: "Color" },
    {
      part: "control",
      children: [{ part: "valueSwatch" }, { part: "valueInput" }, { part: "valueText" }],
    },
    {
      part: "area",
      props: { xChannel: stringProp("saturation"), yChannel: stringProp("brightness") },
      children: [
        { part: "areaBackground" },
        { part: "areaThumb" },
        { part: "areaInput", props: { axis: stringProp("x") } },
        { part: "areaInput", props: { axis: stringProp("y") } },
      ],
    },
    {
      part: "channelSlider",
      props: { channel: stringProp("hue") },
      children: [
        { part: "channelSliderTrack" },
        { part: "channelSliderThumb" },
        { part: "channelSliderInput" },
      ],
    },
    { part: "channelInput", props: { channel: stringProp("hue") } },
    { part: "formatSelect" },
    { part: "formatControl" },
    { part: "transparencyGrid" },
    {
      part: "swatchGroup",
      children: [{ part: "swatch", props: { swatchValue: stringProp("#3b82f6") } }],
    },
    { part: "eyeDropperTrigger", text: "Pick from screen" },
    { part: "clear", text: "Clear" },
    { part: "hiddenInput" },
  ],
  collapsible: [
    { part: "trigger", text: "Toggle details" },
    { part: "panel", text: "Collapsible content" },
  ],
  combobox: [
    { part: "label", text: "Choose a framework" },
    {
      part: "inputGroup",
      children: [
        { part: "input", props: { placeholder: stringProp("Search frameworks") } },
        { part: "trigger", text: "Open" },
        { part: "clear", text: "Clear" },
      ],
    },
    {
      part: "positioner",
      children: [
        {
          part: "popup",
          children: [
            { part: "empty", text: "No results" },
            {
              part: "list",
              children: [
                {
                  part: "item",
                  props: { value: stringProp("astro") },
                  children: [{ part: "itemText", text: "Astro" }, { part: "itemIndicator" }],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  "context-menu": [
    { part: "trigger", text: "Right click" },
    {
      part: "positioner",
      children: [{ part: "popup", children: [{ part: "item", text: "Copy" }] }],
    },
  ],
  "navigation-menu": [
    {
      part: "list",
      children: [
        {
          part: "item",
          props: { value: stringProp("products") },
          children: [
            {
              part: "trigger",
              children: [{ part: "icon", text: "v" }],
              text: "Products",
            },
            {
              part: "content",
              children: [{ part: "link", props: { href: stringProp("/docs") }, text: "Docs" }],
            },
          ],
        },
      ],
    },
    {
      part: "portal",
      children: [
        {
          part: "positioner",
          children: [
            {
              part: "popup",
              children: [{ part: "viewport" }, { part: "arrow" }],
            },
          ],
        },
      ],
    },
  ],
  dialog: [
    { part: "trigger", text: "Open dialog" },
    { part: "backdrop" },
    {
      part: "popup",
      children: [
        { part: "title", text: "Dialog title" },
        { part: "description", text: "Dialog description" },
        { part: "close", text: "Close" },
      ],
    },
  ],
  drawer: [
    { part: "trigger", text: "Open drawer" },
    { part: "backdrop" },
    {
      part: "viewport",
      children: [
        {
          part: "popup",
          children: [
            { part: "title", text: "Drawer title" },
            { part: "description", text: "Drawer description" },
            { part: "close", text: "Close" },
          ],
        },
      ],
    },
  ],
  dropzone: [
    { part: "input" },
    { part: "uploadIndicator", text: "Drop files here" },
    { part: "loadingIndicator", text: "Uploading..." },
    { part: "filesList" },
  ],
  field: [
    { part: "label", text: "Email" },
    { part: "control" },
    { part: "description", text: "Use your work email." },
    { part: "error", text: "Enter a valid email." },
  ],
  fieldset: [{ part: "legend", text: "Preferences" }],
  form: [{ part: "error-summary", text: "Please fix the highlighted fields." }],
  "input-otp": [
    { part: "input" },
    {
      part: "group",
      children: [
        {
          part: "slot",
          props: { index: numberProp(0) },
          children: [{ part: "slotChar" }, { part: "slotCaret" }],
        },
        { part: "separator" },
        {
          part: "slot",
          props: { index: numberProp(1) },
          children: [{ part: "slotChar" }, { part: "slotCaret" }],
        },
      ],
    },
  ],
  menu: [
    { part: "trigger", text: "Open menu" },
    {
      part: "positioner",
      children: [{ part: "popup", children: [{ part: "item", text: "Edit" }] }],
    },
  ],
  popover: [
    { part: "trigger", text: "Open popover" },
    { part: "backdrop" },
    {
      part: "positioner",
      children: [
        {
          part: "popup",
          children: [
            { part: "title", text: "Popover title" },
            { part: "description", text: "Popover description" },
            { part: "close", text: "Close" },
            { part: "arrow" },
          ],
        },
      ],
    },
  ],
  "preview-card": [
    { part: "trigger", text: "Preview profile" },
    {
      part: "positioner",
      children: [{ part: "popup", children: [{ part: "arrow" }] }],
    },
  ],
  progress: [
    { part: "label", text: "Upload progress" },
    { part: "track", children: [{ part: "indicator" }] },
    { part: "value" },
  ],
  radio: [{ part: "indicator" }, { part: "input" }],
  "scroll-area": [
    { part: "viewport", children: [{ part: "content", text: "Scrollable content" }] },
    { part: "scrollbar", children: [{ part: "thumb" }] },
    { part: "corner" },
  ],
  select: [
    { part: "label", text: "Choose a framework" },
    {
      part: "trigger",
      children: [
        { part: "value", text: "Astro" },
        { part: "icon", text: "v" },
      ],
    },
    {
      part: "positioner",
      children: [
        {
          part: "popup",
          children: [
            {
              part: "list",
              children: [
                {
                  part: "item",
                  props: { value: stringProp("astro") },
                  children: [{ part: "itemText", text: "Astro" }, { part: "itemIndicator" }],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  sidebar: [
    {
      part: "sidebar",
      children: [{ part: "menuButton", text: "Dashboard" }],
    },
    { part: "trigger", text: "Toggle sidebar" },
    { part: "rail" },
  ],
  slider: [
    { part: "label", text: "Volume" },
    {
      part: "control",
      children: [{ part: "track", children: [{ part: "indicator" }, { part: "thumb" }] }],
    },
  ],
  switch: [{ part: "thumb" }, { part: "input" }],
  tabs: [
    {
      part: "list",
      children: [{ part: "tab", props: { value: stringProp("account") }, text: "Account" }],
    },
    { part: "panel", props: { value: stringProp("account") }, text: "Account settings" },
  ],
  toast: [
    {
      part: "root",
      children: [
        {
          part: "content",
          children: [
            { part: "title", text: "Saved" },
            { part: "description", text: "Your changes were saved." },
          ],
        },
        { part: "close", text: "Dismiss" },
      ],
    },
  ],
  tooltip: [
    { part: "trigger", text: "Hover me" },
    {
      part: "positioner",
      children: [{ part: "popup", children: [{ part: "arrow" }] }],
    },
  ],
} as const satisfies Readonly<Record<string, readonly ExampleNode[]>>;

export const primitiveDocsExamples = buildPrimitiveDocsExampleRegistry(
  runtimeAdapterContracts,
) satisfies PrimitiveDocsExampleRegistry;

function buildPrimitiveDocsExampleRegistry(
  contracts: readonly RuntimeAdapterContract[],
): PrimitiveDocsExampleRegistry {
  return Object.fromEntries(
    contracts.map((contract) => [
      contract.component,
      {
        basic: {
          "raw-html": buildExampleEntry(contract, "raw-html"),
          astro: buildExampleEntry(contract, "astro"),
          react: buildExampleEntry(contract, "react"),
        },
      },
    ]),
  ) as PrimitiveDocsExampleRegistry;
}

function buildExampleEntry(
  contract: RuntimeAdapterContract,
  framework: (typeof requiredExampleTargets)[number],
): PrimitiveDocsExampleRegistryEntry {
  const entryByFramework = {
    "raw-html": {
      title: "Raw HTML",
      summary: `Render the ${contract.displayName} data-sw-* contract yourself, then initialize ${contract.runtime.factory}.`,
      language: "html",
      code: renderRawHtmlExample(contract),
    },
    astro: {
      title: "Astro",
      summary: `Use the Astro primitive adapter to render ${contract.displayName} anatomy with the Runtime wiring included.`,
      language: "astro",
      code: renderAstroExample(contract),
    },
    react: {
      title: "React",
      summary: `Use the React primitive adapter when ${contract.displayName} state participates in React rendering.`,
      language: "tsx",
      code: renderReactExample(contract),
    },
  } satisfies Record<(typeof requiredExampleTargets)[number], PrimitiveDocsExampleRegistryEntry>;

  return {
    ...entryByFramework[framework],
    source: `${EXAMPLES_SOURCE_PATH}#${contract.component}-basic-${framework}`,
  };
}

function renderRawHtmlExample(contract: RuntimeAdapterContract) {
  const rootPart = getRootPart(contract);
  const children = isVoidHtmlElement(rootPart.defaultElement) ? [] : getExampleLayout(contract);
  const markup = renderHtmlNode(contract, { part: rootPart.name, children }, 0);

  const setup =
    contract.component === "button"
      ? `  const root = document.querySelector("[${rootPart.discoveryAttribute}]");
  if (root instanceof HTMLButtonElement) {
    const instance = ${contract.runtime.factory}(root);
    root.addEventListener("click", () => instance.setDisabled(true), { once: true });
  }`
      : `  const root = document.querySelector("[${rootPart.discoveryAttribute}]");
  if (root) {
    ${contract.runtime.factory}(root);
  }`;

  return `${markup}

<script type="module">
  import { ${contract.runtime.factory} } from "${contract.runtime.importSource}";

${setup}
</script>`;
}

function renderAstroExample(contract: RuntimeAdapterContract) {
  const namespace = toPascalCase(contract.component);
  const rootPart = getRootPart(contract);
  const children = getExampleLayout(contract);
  const markup = renderAdapterNode(contract, { part: rootPart.name, children }, 0, "astro");

  return `---
import { ${namespace} } from "@starwind-ui/astro/${contract.component}";
---

${markup}`;
}

function renderReactExample(contract: RuntimeAdapterContract) {
  const namespace = toPascalCase(contract.component);
  const rootPart = getRootPart(contract);
  const children = getExampleLayout(contract);
  const markup = renderAdapterNode(contract, { part: rootPart.name, children }, 4, "react");

  return `import { ${namespace} } from "@starwind-ui/react/${contract.component}";

export function Example() {
  return (
${markup}
  );
}`;
}

function getExampleLayout(contract: RuntimeAdapterContract): readonly ExampleNode[] {
  return (
    primitiveExampleLayouts[contract.component] ??
    contract.parts
      .filter((part) => part.name !== contract.runtime.rootPart && part.forwardsRef)
      .slice(0, 3)
      .map((part) => ({ part: part.name }))
  );
}

function renderHtmlNode(
  contract: RuntimeAdapterContract,
  node: ExampleNode,
  depth: number,
): string {
  const part = getPart(contract, node.part);
  const indent = "  ".repeat(depth);
  const attributes = renderHtmlAttributes(contract, part, node.props);
  const openingTag = attributes
    ? `<${part.defaultElement} ${attributes}>`
    : `<${part.defaultElement}>`;
  const children = (node.children ?? []).filter((child) => hasPart(contract, child.part));
  const text = node.text ?? getPartExampleText(contract, part);

  if (isVoidHtmlElement(part.defaultElement)) {
    return `${indent}<${part.defaultElement}${attributes ? ` ${attributes}` : ""} />`;
  }

  if (children.length === 0) {
    return text
      ? `${indent}${openingTag}${escapeHtml(text)}</${part.defaultElement}>`
      : `${indent}${openingTag}</${part.defaultElement}>`;
  }

  return [
    `${indent}${openingTag}`,
    ...children.map((child) => renderHtmlNode(contract, child, depth + 1)),
    `${indent}</${part.defaultElement}>`,
  ].join("\n");
}

function renderAdapterNode(
  contract: RuntimeAdapterContract,
  node: ExampleNode,
  depth: number,
  framework: "astro" | "react",
): string {
  const part = getPart(contract, node.part);
  const publicParts = getPublicAdapterParts(contract);

  if (!publicParts.some((candidate) => candidate.name === part.name)) {
    return "";
  }

  const indent = " ".repeat(depth);
  const memberName = `${toPascalCase(contract.component)}.${toPascalCase(part.name)}`;
  const attributes = renderAdapterAttributes(contract, part, node.props, framework);
  const children = (node.children ?? [])
    .map((child) => renderAdapterNode(contract, child, depth + 2, framework))
    .filter(Boolean);
  const text = node.text ?? getPartExampleText(contract, part);
  const openTag = attributes ? `<${memberName} ${attributes}>` : `<${memberName}>`;

  if (children.length === 0) {
    return text
      ? `${indent}${openTag}${escapeJsxText(text)}</${memberName}>`
      : `${indent}<${memberName}${attributes ? ` ${attributes}` : ""} />`;
  }

  return [`${indent}${openTag}`, ...children, `${indent}</${memberName}>`].join("\n");
}

function renderHtmlAttributes(
  contract: RuntimeAdapterContract,
  part: PrimitivePart,
  nodeProps: Readonly<Record<string, ExamplePropValue>> | undefined,
) {
  const attributes = new Map<string, string | true>();

  attributes.set(part.discoveryAttribute, true);

  if (part.role) {
    attributes.set("role", part.role);
  }

  for (const attribute of part.initialAttributes ?? []) {
    if (attribute.source === "constant") {
      attributes.set(toHtmlAttributeName(attribute.name), attribute.value ?? true);
    }

    if (attribute.name === "hidden") {
      attributes.set("hidden", true);
    }
  }

  const initialVisibility = contract.presence?.initialVisibility?.find(
    (visibility) =>
      visibility.part === part.name &&
      visibility.delivery === "markup" &&
      visibility.hidden &&
      visibility.mechanism === "css-visibility",
  );
  if (initialVisibility) {
    attributes.set("style", "visibility: hidden");
  }

  for (const prop of getExamplePropsForPart(contract, part, nodeProps)) {
    const attributeName = getHtmlAttributeForProp(part, prop.name);

    if (attributeName) {
      attributes.set(attributeName, toHtmlAttributeValue(prop.value));
    }
  }

  return [...attributes.entries()]
    .map(([name, value]) => (value === true ? name : `${name}="${escapeHtml(value)}"`))
    .join(" ");
}

function renderAdapterAttributes(
  contract: RuntimeAdapterContract,
  part: PrimitivePart,
  nodeProps: Readonly<Record<string, ExamplePropValue>> | undefined,
  framework: "astro" | "react",
) {
  return getExamplePropsForPart(contract, part, nodeProps)
    .map((prop) => `${prop.name}=${formatAdapterPropValue(prop.value, framework)}`)
    .join(" ");
}

function getExamplePropsForPart(
  contract: RuntimeAdapterContract,
  part: PrimitivePart,
  nodeProps: Readonly<Record<string, ExamplePropValue>> | undefined,
) {
  const props = new Map<string, ExamplePropValue>();

  for (const prop of contract.props) {
    const targetsPart = prop.targets
      ? prop.targets.includes(part.name)
      : part.name === contract.runtime.rootPart;

    if (prop.required && targetsPart) {
      props.set(prop.name, getExampleValueForProp(contract, part, prop.name, prop.type));
    }
  }

  if (part.name === "image") {
    props.set("src", stringProp("/avatar.png"));
  }

  if (part.name === "root" && contract.component === "tabs") {
    props.set("defaultValue", stringProp("account"));
  }

  if (part.name === "root" && contract.component === "radio") {
    props.set("value", stringProp("option-one"));
  }

  if (part.name === "root" && contract.component === "input") {
    props.set("placeholder", stringProp("Email"));
  }

  if (part.name === "root" && contract.component === "button") {
    props.set("type", stringProp("button"));
    props.set("focusableWhenDisabled", { kind: "boolean", value: true });
  }

  if (nodeProps) {
    for (const [name, value] of Object.entries(nodeProps)) {
      props.set(name, value);
    }
  }

  return [...props.entries()].map(([name, value]) => ({ name, value }));
}

function getExampleValueForProp(
  contract: RuntimeAdapterContract,
  part: PrimitivePart,
  propName: string,
  propType: string,
): ExamplePropValue {
  if (propName === "alt") {
    return stringProp("Starwind UI");
  }

  if (propName === "value") {
    return stringProp(`${contract.component}-${part.name}`);
  }

  if (propType === "number") {
    return numberProp(0);
  }

  if (propType === "boolean") {
    return { kind: "boolean", value: true };
  }

  return stringProp("example");
}

function getHtmlAttributeForProp(part: PrimitivePart, propName: string) {
  const semanticPropAliases: Readonly<Record<string, string>> = {
    swatchDisabled: "data-disabled",
    swatchValue: "data-value",
  };

  if (semanticPropAliases[propName]) {
    return semanticPropAliases[propName];
  }

  const directAttribute = part.initialAttributes?.find(
    (attribute) =>
      attribute.source === "prop" && toPropNameFromAttribute(attribute.name) === propName,
  );

  if (directAttribute) {
    return toHtmlAttributeName(directAttribute.name);
  }

  if (part.defaultElement === "img" && propName === "src") {
    return "src";
  }

  if (["alt", "href", "placeholder", "value"].includes(propName)) {
    return propName;
  }

  return `data-${toKebabCase(propName)}`;
}

function formatAdapterPropValue(value: ExamplePropValue, framework: "astro" | "react") {
  if (value.kind === "string") {
    return `"${escapeAttribute(value.value)}"`;
  }

  if (value.kind === "number") {
    return `{${value.value}}`;
  }

  return framework === "astro" ? `{${value.value ? "true" : "false"}}` : `{${String(value.value)}}`;
}

function toHtmlAttributeValue(value: ExamplePropValue) {
  if (value.kind === "boolean") {
    return value.value ? "" : "false";
  }

  return String(value.value);
}

function getRootPart(contract: RuntimeAdapterContract) {
  const rootPart = contract.parts.find((part) => part.name === contract.runtime.rootPart);

  if (!rootPart) {
    throw new Error(
      `${contract.component} primitive contract is missing root part ${contract.runtime.rootPart}.`,
    );
  }

  return rootPart;
}

function getPart(contract: RuntimeAdapterContract, partName: string) {
  const part = contract.parts.find((candidate) => candidate.name === partName);

  if (!part) {
    throw new Error(`${contract.component} primitive example references unknown part ${partName}.`);
  }

  return part;
}

function hasPart(contract: RuntimeAdapterContract, partName: string) {
  return contract.parts.some((part) => part.name === partName);
}

function getPublicAdapterParts(contract: RuntimeAdapterContract) {
  return contract.parts.filter(
    (part) => part.name === contract.runtime.rootPart || part.forwardsRef,
  );
}

function getPartExampleText(contract: RuntimeAdapterContract, part: PrimitivePart) {
  const textByPartName: Readonly<Record<string, string>> = {
    action: "Undo",
    clear: "Clear",
    close: "Close",
    description: `${contract.displayName} description`,
    error: "Error message",
    "error-summary": "Please fix the highlighted fields.",
    fallback: "SW",
    groupLabel: "Group",
    item: "Option",
    label: `${contract.displayName} label`,
    linkItem: "View details",
    menuButton: "Dashboard",
    next: "Next",
    panel: `${contract.displayName} panel`,
    previous: "Previous",
    radioItem: "Radio option",
    shortcut: "⌘K",
    tab: "Tab",
    title: `${contract.displayName} title`,
    titleText: `${contract.displayName} title`,
    trigger: `Open ${contract.displayName}`,
    uploadIndicator: "Drop files here",
    value: "Selected value",
  };

  if (textByPartName[part.name]) {
    return textByPartName[part.name];
  }

  if (
    part.name === contract.runtime.rootPart &&
    ["button", "toggle"].includes(contract.component)
  ) {
    return contract.displayName;
  }

  return "";
}

function toPascalCase(value: string) {
  return value
    .split("-")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join("");
}

function toKebabCase(value: string) {
  return value.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

function toPropNameFromAttribute(attributeName: string) {
  const withoutData = attributeName.startsWith("data-")
    ? attributeName.slice("data-".length)
    : attributeName;

  return withoutData.replace(/-([a-z])/g, (_, char: string) => char.toUpperCase());
}

function toHtmlAttributeName(attributeName: string) {
  const htmlAttributeAliases: Readonly<Record<string, string>> = {
    autoComplete: "autocomplete",
    className: "class",
    inputMode: "inputmode",
    maxLength: "maxlength",
    readOnly: "readonly",
    tabIndex: "tabindex",
  };

  return htmlAttributeAliases[attributeName] ?? attributeName;
}

function isVoidHtmlElement(element: string) {
  return [
    "area",
    "base",
    "br",
    "col",
    "embed",
    "hr",
    "img",
    "input",
    "link",
    "meta",
    "source",
    "track",
    "wbr",
  ].includes(element);
}

function escapeAttribute(value: string) {
  return value.replace(/"/g, "&quot;");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeJsxText(value: string) {
  return value.replace(/[{}<>]/g, (character) => `{"${character}"}`);
}
