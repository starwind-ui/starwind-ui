import type {
  AdapterColorPickerFacts,
  AdapterColorPickerPartName,
} from "../../../primitive-output-model/index.js";
import {
  type ColorPickerPartAccess,
  colorPickerPartAttributes,
  colorPickerPartProps,
  colorPickerPartRequest,
} from "../../../shared-recipes/color-picker/parts.js";
import { printSvelteRefAttachment } from "../attachments.js";

const contextSetup: Partial<Record<AdapterColorPickerPartName, string>> = {
  area: "setArea({ owner: context, get xChannel() { return xChannel; }, get yChannel() { return yChannel; }, get xStep() { return xStep; }, get yStep() { return yStep; } });",
  areaInput: "const area = getArea(context);",
  areaBackground: "const area = getArea(context);",
  areaThumb: "const area = getArea(context);",
  channelSlider:
    "setChannel({ owner: context, get channel() { return channel; }, get orientation() { return orientation; }, get step() { return step; } });",
  channelSliderInput: "const slider = getChannel(context);",
  channelSliderTrack: "const slider = getChannel(context);",
  channelSliderThumb: "const slider = getChannel(context);",
};
const partAccess: ColorPickerPartAccess = {
  prop: (name) => name,
  area: (name) => `area.${name}`,
  slider: (name) => `slider.${name}`,
  aria: (name) => `rest[${JSON.stringify(name)}] ?? undefined`,
};

export function printColorPickerPart(
  f: AdapterColorPickerFacts,
  name: Exclude<AdapterColorPickerPartName, "root">,
): string {
  const part = f.parts[name],
    inputs = colorPickerPartProps[name] ?? [],
    setup = {
      props: inputs
        .map(
          (prop) =>
            `${prop.name}${prop.required ? "" : "?"}: ${prop.type.replace("ColorPickerInitialChannel", "ColorPickerChannel")};`,
        )
        .join(" "),
      names: inputs
        .map((prop) => `${prop.name}${prop.default === undefined ? "" : ` = ${prop.default}`},`)
        .join(" "),
      setup: contextSetup[name],
      request: colorPickerPartRequest(name, partAccess),
      attrs: colorPickerPartAttributes(name, partAccess)
        .map((value) => value + ",")
        .join(" "),
    };
  const tag = part.defaultElement;
  const element = (
    {
      input: "HTMLInputElement",
      button: "HTMLButtonElement",
      select: "HTMLSelectElement",
      span: "HTMLSpanElement",
      div: "HTMLDivElement",
    } as const
  )[tag as "div"];
  const native =
    tag === "input"
      ? "HTMLInputAttributes"
      : tag === "button"
        ? "HTMLButtonAttributes"
        : tag === "select"
          ? "HTMLSelectAttributes"
          : `HTMLAttributes<${element}>`;
  const constants = part.initialAttributes
    .filter((attr) => attr.source === "constant")
    .map(
      (attr) =>
        `${JSON.stringify(attr.name === "tabIndex" ? "tabindex" : attr.name)}: ${JSON.stringify(attr.value)},`,
    )
    .join(" ");
  const projectInitial = "projectColorPickerInitialPart(context.initialState, request())";
  const initialProjection =
    name === "swatch"
      ? `untrack(() => {
    const initial = ${projectInitial};
    // Root and swatchDisabled project this property. Native disabled retains authored ownership in mergeProjection.
    return { ...initial, ownership: { ...initial.ownership, properties: [...new Set([...initial.ownership.properties, "disabled"])] } };
  })`
      : `untrack(() => ${projectInitial})`;
  return `<script lang="ts">
  import { projectColorPickerInitialPart, type ColorPickerInitialPartRequest, type ColorPickerChannel, type ColorPickerValue } from "${f.runtime.importSource}";
  import { untrack, type Snippet } from "svelte";
  import type { Attachment } from "svelte/attachments";
  import type { ${native.startsWith("HTMLAttributes") ? "HTMLAttributes" : native} } from "svelte/elements";
  import { getRoot, getArea, setArea, getChannel, setChannel, mergeProjection, refreshPart } from "./context.js";
  type Props = Omit<${native}, "children"${setup.props?.includes("step?") ? ' | "step"' : ""}> & { children?: Snippet; ${setup.props ?? ""} ref?: (element: ${element} | null) => void };
  let { children, ${setup.names ?? ""} ref, ...rest }: Props = $props();
  const context = getRoot();
${setup.setup ? `  ${setup.setup}\n` : ""}  const request = (): ColorPickerInitialPartRequest => (${setup.request ?? `{ part: "${name}" }`});
  const projection = ${initialProjection};
  let elementProps = $derived(mergeProjection(projection, rest, { "${part.discoveryAttribute}": "", "data-sw-part": "${name}", ${constants} ${setup.attrs ?? ""} }));
  const attachPart: Attachment<${element}> = (element) => {
    const release = untrack(() => context.register(element));
    $effect(() => refreshPart(context, request, rest));
    return release;
  };
${printSvelteRefAttachment(element)}
</script>

<${tag} {...elementProps} {@attach attachPart} {@attach attachRef}${tag === "input" ? " />" : `>{#if children}{@render children()}{:else}${name === "valueText" ? '{projection.text ?? ""}' : ""}{/if}</${tag}>`}
`;
}
