import type {
  StyledOutputComponent,
  StyledOutputComponentGroup,
  StyledOutputRenderNode,
} from "../../../styled-output-model/index.js";
import { sveltePrimitiveImport } from "./imports.js";
import { supportsSvelteScope } from "./scope.js";
import type { SvelteStyledComponentProjection, SvelteStyledRenderOptions } from "./types.js";

const parts: Record<string, string> = {
  ColorPicker: "Root",
  ColorPickerArea: "Area",
  ColorPickerChannelSlider: "ChannelSlider",
  ColorPickerChannelInput: "ChannelInput",
  ColorPickerValueSwatch: "ValueSwatch",
  ColorPickerSwatchGroup: "SwatchGroup",
  ColorPickerSwatch: "Swatch",
  ColorPickerEyeDropper: "EyeDropperTrigger",
  ColorPickerClear: "Clear",
};

/** Keep model acceptance in Color Picker and overlay lifetime in the existing Popover parts. */
export function specializeSvelteStyledColorPicker(
  group: StyledOutputComponentGroup,
  component: StyledOutputComponent,
  options: SvelteStyledRenderOptions,
): Pick<
  SvelteStyledComponentProjection,
  "imports" | "publicTypes" | "destructure" | "rest" | "setup"
> {
  const name = component.exportName,
    part = parts[name],
    root = name === "ColorPicker",
    input = name === "ColorPickerInput",
    editor = name === "ColorPickerDefaultEditor",
    trigger = name === "ColorPickerTrigger",
    content = name === "ColorPickerContent";
  const fail = (message: string): never => {
    throw new TypeError(`Svelte Styled color-picker/${name}: ${message}.`);
  };
  if (!part && !input && !editor && !trigger && !content) fail("missing Color Picker part owner");
  for (const entry of component.imports.filter((entry) => supportsSvelteScope(entry.targetScopes)))
    if (!entry.svg) fail("unsupported Color Picker import");
  component.imports = [];
  // Svelte refs are native callback props carried by the Primitive owner.
  component.forwardRef = undefined;
  function wire(nodes: StyledOutputRenderNode[]): void {
    for (const node of nodes) {
      if (node.type === "element" && !["input", "br", "hr", "img"].includes(node.tag))
        node.selfClosing = false;
      if (root && node.type === "primitive" && node.part === "Root") {
        node.attrs = node.attrs.filter((attr) => !["value", "format"].includes(attr.name));
        const callback = node.attrs.find((attr) => attr.name === "onFormatChange");
        if (!callback) fail("missing format callback");
        callback!.value = { type: "variable", name: "onFormatChange" };
      }
      if (root && node.type === "component" && node.exportName === "Popover")
        node.attrs = node.attrs.filter((attr) => attr.name !== "open");
      if ("children" in node) wire(node.children);
      if (node.type === "condition") {
        wire(node.then);
        wire(node.else);
      }
      if (node.type === "slot") wire(node.fallback);
    }
  }
  wire(component.render);
  if (root) {
    component.variables = component.variables.filter(
      (variable) => !["resolvedFormat", "handleFormatChange"].includes(variable.name),
    );
    component.variables.unshift({
      name: "resolvedFormat",
      value: { type: "raw", code: 'format ?? "hex"' },
    });
  }
  if (root) {
    const layout = component.render[0];
    if (layout?.type !== "condition" || layout.condition !== "inline")
      fail("missing layout branches");
    const branches = layout as Extract<StyledOutputRenderNode, { type: "condition" }>;
    const inlineRoot = branches.then[0];
    const popover = branches.else[0];
    if (
      inlineRoot?.type !== "primitive" ||
      inlineRoot.part !== "Root" ||
      popover?.type !== "component" ||
      popover.exportName !== "Popover"
    )
      fail("missing layout owners");
    const inlineOwner = inlineRoot as Extract<StyledOutputRenderNode, { type: "primitive" }>;
    const overlayOwner = popover as Extract<StyledOutputRenderNode, { type: "component" }>;
    const popupRoot = overlayOwner.children[0];
    if (popupRoot?.type !== "primitive" || popupRoot.part !== "Root") fail("missing popup Root");
    const colorOwner = popupRoot as Extract<StyledOutputRenderNode, { type: "primitive" }>;
    const hidden = colorOwner.children.at(-1);
    const inlineHidden = inlineOwner.children.at(-1);
    if (
      hidden?.type !== "primitive" ||
      hidden.part !== "HiddenInput" ||
      inlineHidden?.type !== "primitive" ||
      inlineHidden.part !== "HiddenInput"
    )
      fail("missing stable form proxy");
    const floating = colorOwner.attrs.find((attr) => attr.name === "data-floating-root");
    if (!floating) fail("missing floating owner");
    floating!.value = { type: "raw", code: "inline ? undefined : true" };
    // Keep accepted models and reset seeds with their existing owners across layout changes.
    // Inline has no Popup, while Popover retains its accepted open model for a later popup.
    colorOwner.children = [
      {
        type: "condition",
        condition: "inline",
        then: inlineOwner.children.slice(0, -1),
        else: colorOwner.children.slice(0, -1),
      },
      hidden!,
    ];
    component.render = [overlayOwner];
  }
  const source = sveltePrimitiveImport("color-picker", options);
  const extra = (component.props?.fields ?? [])
    .filter(
      (field) =>
        supportsSvelteScope(field.targetScopes) &&
        !["ref", "onOpenChange", "onCloseComplete"].includes(field.name),
    )
    .map(
      (field) =>
        `${field.name}${field.optional ? "?" : ""}: ${field.type.replaceAll("@starwind-ui/runtime/color-picker", source)};`,
    )
    .join(" ");
  const nativeName = part
    ? `ColorPicker${part}`
    : trigger
      ? "PopoverTrigger"
      : content
        ? "PopoverContent"
        : undefined;
  const inherited = root
    ? 'Omit<ComponentProps<typeof ColorPickerRoot>, "children" | "allowEmpty"> & Pick<ComponentProps<typeof Popover>, "open" | "defaultOpen" | "onOpenChange" | "onCloseComplete" | "closeOnEscape" | "closeOnOutsideInteract" | "modal" | "openOnHover" | "closeDelay">'
    : name === "ColorPickerSwatch"
      ? 'Omit<ComponentProps<typeof ColorPickerSwatch>, "value" | "swatchValue" | "swatchDisabled" | "disabled">'
      : nativeName
        ? `ComponentProps<typeof ${nativeName}>`
        : input
          ? "HTMLAttributes<HTMLDivElement> & {ref?:(node:HTMLDivElement|null)=>void}"
          : "{}";
  const variants = (component.props?.extends ?? [])
    .filter((base) => base.kind === "variant-props")
    .map((base) => (base.kind === "variant-props" ? ` & VariantProps<typeof ${base.variant}>` : ""))
    .join("");
  const props = (component.destructure?.props ?? []).filter(
    (prop) => supportsSvelteScope(prop.targetScopes) && prop.name !== "ref",
  );
  for (const prop of props)
    if (root && ["value", "format", "open"].includes(prop.name)) prop.defaultValue = "$bindable()";
  if (input) props.push({ name: "ref" });
  props.push({ name: "children" });
  return {
    imports: [
      { source: "svelte", names: ["ComponentProps", "Snippet"], typeOnly: true },
      { source: "tailwind-variants", names: ["VariantProps"], typeOnly: true },
      { source: "tailwind-variants", names: ["cx"] },
      {
        source: "./variants.js",
        names: [
          ...group.variants.map((v) => v.name),
          ...(group.variantAliases ?? []).map((v) => v.name),
        ],
      },
      ...(part ? [{ source, names: [nativeName!] }] : []),
      ...(root ? [{ source: "../popover/index.js", names: ["Popover"] }] : []),
      ...(trigger || content ? [{ source: "../popover/index.js", names: [nativeName!] }] : []),
      ...(input
        ? [
            { source: "svelte", names: ["untrack"] },
            { source: "svelte/attachments", names: ["Attachment"], typeOnly: true },
            { source: "svelte/elements", names: ["HTMLAttributes"], typeOnly: true },
          ]
        : []),
    ],
    publicTypes: `export type ${name}Props = ${inherited}${variants} & {children?:Snippet; ${extra}};`,
    destructure: props,
    rest: component.destructure?.rest,
    setup: input
      ? [
          `const attachRef: Attachment<HTMLDivElement> = (node) => { $effect(() => { const callback=ref; untrack(()=>callback?.(node)); return()=>untrack(()=>callback?.(null)); }); };`,
        ]
      : [],
  };
}
