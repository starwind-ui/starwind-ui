import type {
  AdapterColorPickerFacts,
  AdapterColorPickerPartName,
} from "../../primitive-output-model/index.js";

export type AstroColorPickerComponentProjection = {
  facts: AdapterColorPickerFacts;
  kind: "astro-color-picker";
  part: AdapterColorPickerPartName;
};

export type AstroColorPickerIndexProjection = {
  facts: AdapterColorPickerFacts;
  kind: "astro-color-picker";
};

export function printAstroColorPickerComponent(
  family: AstroColorPickerComponentProjection,
): string {
  const { facts, part } = family;

  if (part === "root") return printRoot(facts);
  if (part === "area") return printArea(facts);
  if (part === "areaInput") return printAreaInput(facts);
  if (part === "valueInput") return printValueInput(facts);
  if (part === "channelSlider") return printChannelSlider(facts);
  if (part === "channelSliderInput") return printChannelSliderInput(facts);
  if (part === "channelInput") return printChannelInput(facts);
  if (part === "formatSelect") return printFormatSelect(facts);
  if (part === "swatch") return printSwatch(facts);
  if (part === "eyeDropperTrigger" || part === "clear") return printButton(facts, part);
  if (part === "hiddenInput") return printHiddenInput(facts);

  return printSimplePart(facts, part);
}

export function printAstroColorPickerIndex(family: AstroColorPickerIndexProjection): string {
  const facts = family.facts;
  const members = Object.entries(facts.exports.parts);
  const imports = members
    .map(([, exportName]) => `import ${exportName} from "./${exportName}.astro";`)
    .join("\n");
  const namespace = members
    .map(
      ([part, exportName]) =>
        `  ${facts.parts[part as AdapterColorPickerPartName].namespaceKey}: ${exportName},`,
    )
    .join("\n");
  const namedExports = members.map(([, exportName]) => `  ${exportName},`).join("\n");
  const runtimeValues = facts.exports.runtimeFacades.values.join(", ");
  const runtimeTypes = facts.exports.runtimeFacades.types.map((name) => `  ${name},`).join("\n");

  return `${imports}\n\nconst ${facts.exports.namespace} = {\n${namespace}\n};\n\nexport {\n  ${facts.exports.namespace},\n${namedExports}\n};\n\nexport default ${facts.exports.namespace};\n\nexport type {\n  ColorPickerAreaProjection,\n  ColorPickerChannelSliderProjection,\n  ColorPickerInitialProps,\n  ColorPickerRenderProjection,\n} from "./ColorPickerRenderProjection";\nexport { ${runtimeValues} } from "${facts.exports.runtimeFacades.importSource}";\nexport type {\n${runtimeTypes}\n} from "${facts.exports.runtimeFacades.importSource}";\n`;
}

export function renderAstroColorPickerRenderProjectionFile(tsHeader: string): string {
  return `${tsHeader}import type { HTMLAttributes } from "astro/types";
import {
  projectColorPickerInitialPart,
  type ColorPickerInitialAxis,
  type ColorPickerInitialChannel,
  type ColorPickerInitialOrientation,
  type ColorPickerInitialPartName,
  type ColorPickerInitialPartProjection,
  type ColorPickerInitialState,
  type ColorPickerInitialValue,
} from "@starwind-ui/runtime/color-picker";

export type ColorPickerInitialProps = Readonly<{
  initial: ColorPickerInitialPartProjection;
}>;

export type ColorPickerAreaProjection = Readonly<{
  root: ColorPickerInitialProps;
  background: ColorPickerInitialProps;
  thumb: ColorPickerInitialProps;
  input(options: {
    axis: ColorPickerInitialAxis;
    ariaLabel?: string;
    ariaLabelledBy?: string;
    ariaRoleDescription?: string;
  }): ColorPickerInitialProps;
}>;

export type ColorPickerChannelSliderProjection = Readonly<{
  root: ColorPickerInitialProps;
  track: ColorPickerInitialProps;
  thumb: ColorPickerInitialProps;
  input(options?: { ariaLabel?: string }): ColorPickerInitialProps;
}>;

export type ColorPickerRenderProjection = Readonly<{
  root: ColorPickerInitialProps;
  label: ColorPickerInitialProps;
  control: ColorPickerInitialProps;
  valueInput: ColorPickerInitialProps;
  valueSwatch: ColorPickerInitialProps;
  valueText: ColorPickerInitialProps;
  area(options?: {
    xChannel?: ColorPickerInitialChannel;
    yChannel?: ColorPickerInitialChannel;
    xStep?: number;
    yStep?: number;
  }): ColorPickerAreaProjection;
  channelSlider(options: {
    channel: ColorPickerInitialChannel;
    orientation?: ColorPickerInitialOrientation;
    step?: number;
  }): ColorPickerChannelSliderProjection;
  channelInput(options: { channel: ColorPickerInitialChannel }): ColorPickerInitialProps;
  formatSelect: ColorPickerInitialProps;
  formatControl: ColorPickerInitialProps;
  transparencyGrid: ColorPickerInitialProps;
  swatchGroup: ColorPickerInitialProps;
  swatch(options: { value: ColorPickerInitialValue; disabled?: boolean }): ColorPickerInitialProps;
  eyeDropperTrigger: ColorPickerInitialProps;
  clear: ColorPickerInitialProps;
  hiddenInput: ColorPickerInitialProps;
}>;

export function createColorPickerRenderProjection(
  state: ColorPickerInitialState,
): ColorPickerRenderProjection {
  const part = (
    request: Parameters<typeof projectColorPickerInitialPart>[1],
  ): ColorPickerInitialProps =>
    Object.freeze({ initial: projectColorPickerInitialPart(state, request) });
  const simple = (name: ColorPickerInitialPartName) => part({ part: name } as never);

  return Object.freeze({
    root: simple("root"),
    label: simple("label"),
    control: simple("control"),
    valueInput: simple("valueInput"),
    valueSwatch: simple("valueSwatch"),
    valueText: simple("valueText"),
    area(options = {}) {
      const context = Object.freeze({ ...options });
      return Object.freeze({
        root: part({ part: "area", ...context }),
        background: part({ part: "areaBackground", ...context }),
        thumb: part({ part: "areaThumb", ...context }),
        input(inputOptions) {
          return part({ part: "areaInput", ...context, ...inputOptions });
        },
      });
    },
    channelSlider(options) {
      const context = Object.freeze({ ...options });
      return Object.freeze({
        root: part({ part: "channelSlider", ...context }),
        track: part({ part: "channelSliderTrack", ...context }),
        thumb: part({ part: "channelSliderThumb", ...context }),
        input(inputOptions = {}) {
          return part({ part: "channelSliderInput", ...context, ...inputOptions });
        },
      });
    },
    channelInput: (options) => part({ part: "channelInput", ...options }),
    formatSelect: simple("formatSelect"),
    formatControl: simple("formatControl"),
    transparencyGrid: simple("transparencyGrid"),
    swatchGroup: simple("swatchGroup"),
    swatch: (options) => part({ part: "swatch", ...options }),
    eyeDropperTrigger: simple("eyeDropperTrigger"),
    clear: simple("clear"),
    hiddenInput: simple("hiddenInput"),
  });
}

export function assertColorPickerInitialPart(
  expected: ColorPickerInitialPartName,
  initial: ColorPickerInitialPartProjection | undefined,
): ColorPickerInitialPartProjection | undefined {
  if (initial && initial.part !== expected) {
    throw new Error(
      \`Color Picker \${expected} received the initial projection for \${initial.part}.\`,
    );
  }
  return initial;
}

export function mergeColorPickerInitialStyles(
  style: HTMLAttributes<"div">["style"],
  initial: ColorPickerInitialPartProjection | undefined,
): HTMLAttributes<"div">["style"] {
  const projected = Object.fromEntries(
    Object.entries(initial?.styles ?? {}).filter((entry): entry is [string, string] => entry[1] !== undefined),
  );
  if (Object.keys(projected).length === 0) return style;
  if (typeof style === "string") {
    const suffix = Object.entries(projected).map(([name, value]) => \`\${name}: \${value}\`).join("; ");
    return style.length > 0 ? \`\${style}; \${suffix}\` : suffix;
  }
  return { ...(typeof style === "object" && style !== null ? style : {}), ...projected };
}
`;
}

function printRoot(facts: AdapterColorPickerFacts): string {
  const props = facts.props;
  const projection = facts.initialStateProjection;
  const root = facts.parts.root;
  const stateProps = projection.rootStateProps
    .map((name) => `  ${name}?: ${props[name]!.type};`)
    .join("\n");
  const destructure = projection.rootStateProps
    .map((name) => {
      const defaultValue = props[name]!.defaultValue;
      return `  ${name}${defaultValue === undefined ? "" : ` = ${defaultValue}`},`;
    })
    .join("\n");
  const options = projection.rootStateProps
    .map((name) =>
      name === "value" ? "  ...(value === undefined ? {} : { value })," : `  ${name},`,
    )
    .join("\n");

  return `---
import type { HTMLAttributes } from "astro/types";
import {
  ${projection.createFunction},
  ${projection.projectFunction},
} from "${projection.importSource}";
import type {
  ColorPickerDirection,
  ColorPickerFormat,
  ColorPickerOptions,
  ColorPickerValue,
} from "${projection.importSource}";
import {
  createColorPickerRenderProjection,
  mergeColorPickerInitialStyles,
  type ColorPickerRenderProjection,
} from "./ColorPickerRenderProjection";

interface Props extends Omit<HTMLAttributes<"${root.defaultElement}">, "defaultValue" | "dir"> {
${stateProps}
  children?: (initial: ColorPickerRenderProjection) => unknown;
}

const {
${destructure}
  style,
  ...rest
} = Astro.props;
const initialState = ${projection.createFunction}({
${options}
});
const rootInitial = ${projection.projectFunction}(initialState, { part: "root" });
const initial = createColorPickerRenderProjection(initialState);
const content = Astro.slots.has("default")
  ? await Astro.slots.render("default", [initial])
  : "";
const mergedStyle = mergeColorPickerInitialStyles(style, rootInitial);
---

<${root.defaultElement}
  {...rest}
  {...rootInitial.attributes}
  style={mergedStyle}
  ${root.discoveryAttribute}
>
  <Fragment set:html={content} />
</${root.defaultElement}>

<script>
  import { ${facts.runtime.factory} } from "${facts.runtime.importSource}";
  import {
    registerAstroControllerLifecycle,
    trackAstroController,
  } from "../internal/controller-lifecycle";

  const getInitCandidates = (event: Event | undefined, selector: string): HTMLElement[] => {
    const initRoot =
      event?.type === "starwind:init" && event instanceof CustomEvent
        ? event.detail?.root
        : undefined;
    const scopedRoot: Document | DocumentFragment | Element = isQueryableRoot(initRoot)
      ? initRoot
      : document;
    const candidates = Array.from(scopedRoot.querySelectorAll<HTMLElement>(selector));

    if (scopedRoot instanceof Element && scopedRoot.matches(selector)) {
      candidates.unshift(scopedRoot as HTMLElement);
    }

    return candidates;
  };

  const isQueryableRoot = (value: unknown): value is Document | DocumentFragment | Element =>
    value instanceof Document || value instanceof DocumentFragment || value instanceof Element;

  const setupColorPickers = (event?: Event) => {
    getInitCandidates(event, "[${root.discoveryAttribute}]").forEach((root) =>
      trackAstroController("ColorPickerRoot", root, ${facts.runtime.factory}(root)),
    );
  };

  registerAstroControllerLifecycle("ColorPickerRoot", setupColorPickers);
</script>
`;
}

function printSimplePart(
  facts: AdapterColorPickerFacts,
  partName: AdapterColorPickerPartName,
): string {
  const part = facts.parts[partName];
  const fallback = partName === "valueText" ? "<slot>{initial?.text}</slot>" : "<slot />";
  return (
    projectedFrontmatter(part.defaultElement, partName) +
    `
<${part.defaultElement}
  {...rest}
  {...initial?.attributes}
  style={mergedStyle}
  ${part.discoveryAttribute}
>
  ${fallback}
</${part.defaultElement}>
`
  );
}

function printArea(facts: AdapterColorPickerFacts): string {
  const part = facts.parts.area;
  return `---
import type { HTMLAttributes } from "astro/types";
import type { ColorPickerChannel, ColorPickerInitialPartProjection } from "@starwind-ui/runtime/color-picker";
import { assertColorPickerInitialPart, mergeColorPickerInitialStyles } from "./ColorPickerRenderProjection";

interface Props extends HTMLAttributes<"${part.defaultElement}"> {
  initial?: ColorPickerInitialPartProjection;
  xChannel?: ColorPickerChannel;
  yChannel?: ColorPickerChannel;
}
const { initial: suppliedInitial, xChannel = "saturation", yChannel = "brightness", style, ...rest } = Astro.props;
const initial = assertColorPickerInitialPart("area", suppliedInitial);
const mergedStyle = mergeColorPickerInitialStyles(style, initial);
---

<${part.defaultElement}
  {...rest}
  data-x-channel={initial ? undefined : xChannel}
  data-y-channel={initial ? undefined : yChannel}
  {...initial?.attributes}
  style={mergedStyle}
  ${part.discoveryAttribute}
>
  <slot />
</${part.defaultElement}>
`;
}

function printAreaInput(facts: AdapterColorPickerFacts): string {
  const part = facts.parts.areaInput;
  return projectedInput({
    defaultElement: part.defaultElement,
    discoveryAttribute: part.discoveryAttribute,
    extraProps: `  axis?: "x" | "y";\n  step?: number;`,
    destructure: `axis = "x", step`,
    fallbackAttributes: `  type={initial ? undefined : "range"}\n  data-axis={initial ? undefined : axis}\n  data-step={initial ? undefined : step}`,
    part: "areaInput",
  });
}

function printValueInput(facts: AdapterColorPickerFacts): string {
  const part = facts.parts.valueInput;
  return projectedInput({
    defaultElement: part.defaultElement,
    discoveryAttribute: part.discoveryAttribute,
    extraProps: "",
    destructure: "",
    fallbackAttributes: "",
    part: "valueInput",
  });
}

function printChannelSlider(facts: AdapterColorPickerFacts): string {
  const part = facts.parts.channelSlider;
  return `---
import type { HTMLAttributes } from "astro/types";
import type { ColorPickerChannel, ColorPickerInitialPartProjection } from "@starwind-ui/runtime/color-picker";
import { assertColorPickerInitialPart, mergeColorPickerInitialStyles } from "./ColorPickerRenderProjection";

interface Props extends HTMLAttributes<"${part.defaultElement}"> {
  initial?: ColorPickerInitialPartProjection;
  channel: ColorPickerChannel;
  orientation?: "horizontal" | "vertical";
}
const { initial: suppliedInitial, channel, orientation = "horizontal", style, hidden, ...rest } = Astro.props;
const initial = assertColorPickerInitialPart("channelSlider", suppliedInitial);
const mergedStyle = mergeColorPickerInitialStyles(style, initial);
---

<${part.defaultElement}
  {...rest}
  data-channel={initial ? undefined : channel}
  data-orientation={initial ? undefined : orientation}
  {...initial?.attributes}
  hidden={initial?.properties.hidden ?? hidden}
  style={mergedStyle}
  ${part.discoveryAttribute}
>
  <slot />
</${part.defaultElement}>
`;
}

function printChannelSliderInput(facts: AdapterColorPickerFacts): string {
  const part = facts.parts.channelSliderInput;
  return projectedInput({
    defaultElement: part.defaultElement,
    discoveryAttribute: part.discoveryAttribute,
    extraProps: "  step?: number;",
    destructure: "step",
    fallbackAttributes: `  type={initial ? undefined : "range"}\n  data-step={initial ? undefined : step}`,
    part: "channelSliderInput",
  });
}

function printChannelInput(facts: AdapterColorPickerFacts): string {
  const part = facts.parts.channelInput;
  return projectedInput({
    defaultElement: part.defaultElement,
    discoveryAttribute: part.discoveryAttribute,
    extraProps: "  channel: ColorPickerChannel;",
    destructure: "channel",
    fallbackAttributes: "  data-channel={initial ? undefined : channel}",
    part: "channelInput",
    typeImports: ", ColorPickerChannel",
  });
}

function printFormatSelect(facts: AdapterColorPickerFacts): string {
  const part = facts.parts.formatSelect;
  return `---
import type { HTMLAttributes } from "astro/types";
import type { ColorPickerInitialPartProjection } from "@starwind-ui/runtime/color-picker";
import { assertColorPickerInitialPart, mergeColorPickerInitialStyles } from "./ColorPickerRenderProjection";

interface Props extends HTMLAttributes<"${part.defaultElement}"> {
  initial?: ColorPickerInitialPartProjection;
}
const { initial: suppliedInitial, style, value, disabled, ...rest } = Astro.props;
const initial = assertColorPickerInitialPart("formatSelect", suppliedInitial);
const mergedStyle = mergeColorPickerInitialStyles(style, initial);
---

<${part.defaultElement}
  {...rest}
  {...initial?.attributes}
  value={initial?.properties.value ?? value}
  disabled={initial?.properties.disabled ?? disabled}
  style={mergedStyle}
  ${part.discoveryAttribute}
>
  <slot>
    <option value="hex" selected={(initial?.properties.value ?? value) === "hex"}>HEX</option>
    <option value="rgb" selected={(initial?.properties.value ?? value) === "rgb"}>RGB</option>
    <option value="hsl" selected={(initial?.properties.value ?? value) === "hsl"}>HSL</option>
    <option value="hsb" selected={(initial?.properties.value ?? value) === "hsb"}>HSB</option>
  </slot>
</${part.defaultElement}>
`;
}

function printSwatch(facts: AdapterColorPickerFacts): string {
  const part = facts.parts.swatch;
  return `---
import type { HTMLAttributes } from "astro/types";
import type { ColorPickerInitialPartProjection, ColorPickerValue } from "@starwind-ui/runtime/color-picker";
import { assertColorPickerInitialPart, mergeColorPickerInitialStyles } from "./ColorPickerRenderProjection";

interface Props extends HTMLAttributes<"${part.defaultElement}"> {
  initial?: ColorPickerInitialPartProjection;
  swatchValue: ColorPickerValue;
  swatchDisabled?: boolean;
}
const { initial: suppliedInitial, swatchValue, swatchDisabled = false, style, disabled, ...rest } = Astro.props;
const initial = assertColorPickerInitialPart("swatch", suppliedInitial);
const mergedStyle = mergeColorPickerInitialStyles(style, initial);
---

<${part.defaultElement}
  {...rest}
  type={initial ? undefined : "button"}
  data-value={initial ? undefined : swatchValue === null ? undefined : String(swatchValue)}
  data-disabled={initial ? undefined : swatchDisabled ? "" : undefined}
  {...initial?.attributes}
  disabled={initial?.properties.disabled ?? disabled ?? swatchDisabled}
  style={mergedStyle}
  ${part.discoveryAttribute}
>
  <slot />
</${part.defaultElement}>
`;
}

function printButton(
  facts: AdapterColorPickerFacts,
  partName: "clear" | "eyeDropperTrigger",
): string {
  const part = facts.parts[partName];
  return `---
import type { HTMLAttributes } from "astro/types";
import type { ColorPickerInitialPartProjection } from "@starwind-ui/runtime/color-picker";
import { assertColorPickerInitialPart, mergeColorPickerInitialStyles } from "./ColorPickerRenderProjection";

interface Props extends HTMLAttributes<"${part.defaultElement}"> {
  initial?: ColorPickerInitialPartProjection;
}
const { initial: suppliedInitial, style, disabled, hidden, ...rest } = Astro.props;
const initial = assertColorPickerInitialPart("${partName}", suppliedInitial);
const mergedStyle = mergeColorPickerInitialStyles(style, initial);
---

<${part.defaultElement}
  {...rest}
  type={initial ? undefined : "button"}
  {...initial?.attributes}
  disabled={initial?.properties.disabled ?? disabled}
  hidden={initial?.properties.hidden ?? hidden}
  style={mergedStyle}
  ${part.discoveryAttribute}
>
  <slot />
</${part.defaultElement}>
`;
}

function printHiddenInput(facts: AdapterColorPickerFacts): string {
  const part = facts.parts.hiddenInput;
  return projectedInput({
    defaultElement: part.defaultElement,
    discoveryAttribute: part.discoveryAttribute,
    extraProps: "",
    destructure: "",
    fallbackAttributes: `  type={initial ? undefined : "text"}`,
    part: "hiddenInput",
  });
}

function projectedFrontmatter(defaultElement: string, part: AdapterColorPickerPartName): string {
  return `---
import type { HTMLAttributes } from "astro/types";
import type { ColorPickerInitialPartProjection } from "@starwind-ui/runtime/color-picker";
import { assertColorPickerInitialPart, mergeColorPickerInitialStyles } from "./ColorPickerRenderProjection";

interface Props extends HTMLAttributes<"${defaultElement}"> {
  initial?: ColorPickerInitialPartProjection;
}
const { initial: suppliedInitial, style, ...rest } = Astro.props;
const initial = assertColorPickerInitialPart("${part}", suppliedInitial);
const mergedStyle = mergeColorPickerInitialStyles(style, initial);
---
`;
}

function projectedInput({
  defaultElement,
  discoveryAttribute,
  extraProps,
  destructure,
  fallbackAttributes,
  part,
  typeImports = "",
  defaultHidden = false,
}: {
  defaultElement: string;
  discoveryAttribute: string;
  extraProps: string;
  destructure: string;
  fallbackAttributes: string;
  part: AdapterColorPickerPartName;
  typeImports?: string;
  defaultHidden?: boolean;
}): string {
  const extraDestructure = destructure ? `${destructure}, ` : "";
  return `---
import type { HTMLAttributes } from "astro/types";
import type { ColorPickerInitialPartProjection${typeImports} } from "@starwind-ui/runtime/color-picker";
import { assertColorPickerInitialPart, mergeColorPickerInitialStyles } from "./ColorPickerRenderProjection";

interface Props extends HTMLAttributes<"${defaultElement}"> {
  initial?: ColorPickerInitialPartProjection;
${extraProps}
  readOnly?: boolean;
}
const { initial: suppliedInitial, ${extraDestructure}style, value, disabled, readOnly, hidden, ...rest } = Astro.props;
const initial = assertColorPickerInitialPart("${part}", suppliedInitial);
const mergedStyle = mergeColorPickerInitialStyles(style, initial);
---

<${defaultElement}
  {...rest}
${fallbackAttributes}
  {...initial?.attributes}
  value={initial?.properties.value ?? value}
  disabled={initial?.properties.disabled ?? disabled}
  readonly={initial?.properties.readOnly ?? readOnly}
  hidden={initial?.properties.hidden ?? hidden ?? ${defaultHidden}}
  style={mergedStyle}
  ${discoveryAttribute}
/>
`;
}
