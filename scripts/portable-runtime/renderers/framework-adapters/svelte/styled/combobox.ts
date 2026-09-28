import type {
  StyledOutputComponent,
  StyledOutputComponentGroup,
  StyledOutputRenderNode,
} from "../../../styled-output-model/index.js";
import { sveltePrimitiveImport } from "./imports.js";
import { supportsSvelteScope } from "./scope.js";
import type { SvelteStyledComponentProjection, SvelteStyledRenderOptions } from "./types.js";

const parts: Record<string, string> = {
  Combobox: "Root",
  ComboboxLabel: "Label",
  ComboboxInputGroup: "InputGroup",
  ComboboxInput: "Input",
  ComboboxTrigger: "Trigger",
  ComboboxClear: "Clear",
  ComboboxValue: "Value",
  ComboboxContent: "Popup",
  ComboboxEmpty: "Empty",
  ComboboxItem: "Item",
  ComboboxItemText: "ItemText",
  ComboboxItemIndicator: "ItemIndicator",
  ComboboxGroup: "Group",
  ComboboxGroupLabel: "GroupLabel",
  ComboboxSeparator: "Separator",
};

/** Keep the stock input-group layout while the Primitive owns editable selection. */
export function specializeSvelteStyledCombobox(
  group: StyledOutputComponentGroup,
  component: StyledOutputComponent,
  options: SvelteStyledRenderOptions,
): Pick<
  SvelteStyledComponentProjection,
  "imports" | "publicTypes" | "destructure" | "rest" | "setup"
> {
  const fail = (detail: string): never => {
    throw new TypeError(
      `Svelte Styled ${group.component}/${component.exportName}.svelte: ${detail}.`,
    );
  };
  const part = parts[component.exportName];
  if (!part || !component.destructure?.rest) return fail("missing Combobox part owner");
  for (const entry of component.imports.filter((entry) => supportsSvelteScope(entry.targetScopes)))
    if (!entry.svg) fail(`unsupported import "${entry.source}"`);
  component.imports = [];
  function wire(nodes: StyledOutputRenderNode[]): void {
    for (const node of nodes) {
      if (part === "Input" && "attrs" in node)
        for (const attr of node.attrs)
          if (
            attr.name === "disabled" &&
            attr.value?.type === "variable" &&
            attr.value.name === "disabled"
          )
            attr.value = { type: "raw", code: "!!disabled" };
      if (node.type === "condition") {
        if (node.condition === "asChild") node.condition = "child";
        if (node.condition === "!asChild && showIcon") node.condition = "!child && showIcon";
        wire(node.then);
        wire(node.else);
      }
      if (node.type === "primitive" && node.component === "combobox") {
        if (node.part === "Root") {
          node.attrs = node.attrs.filter(
            (attr) =>
              ![
                "inputValue",
                "open",
                "value",
                "onInputValueChange",
                "onOpenChange",
                "onValueChange",
              ].includes(attr.name),
          );
          for (const name of ["onInputValueChange", "onOpenChange", "onValueChange"])
            node.attrs.push({ name, value: { type: "variable", name } });
        }
        if (node.part === "Value") {
          node.children = [];
          node.attrs.push({ name: "children", value: { type: "variable", name: "children" } });
        }
        const child = node.attrs.find((attr) => attr.name === "asChild");
        if (child && child.value?.type === "variable") {
          child.name = "child";
          child.value = { type: "variable", name: "child" };
        }
      }
      if ("children" in node) wire(node.children);
      if (node.type === "slot") wire(node.fallback);
    }
  }
  wire(component.render);
  const variants = (component.props?.extends ?? []).filter(
    (entry) => entry.kind === "variant-props" && supportsSvelteScope(entry.targetScopes),
  );
  const modelProps = [
    "inputValue",
    "open",
    "value",
    "onInputValueChange",
    "onOpenChange",
    "onValueChange",
  ];
  const props = component.destructure.props.filter(
    (prop) =>
      supportsSvelteScope(prop.targetScopes) &&
      prop.name !== "asChild" &&
      !(part === "Root" && modelProps.includes(prop.name)),
  );
  if (part === "Root") {
    for (const name of ["inputValue", "open", "value"])
      props.push({ name, defaultValue: "$bindable()" });
    for (const name of ["onInputValueChange", "onOpenChange", "onValueChange"])
      props.push({ name });
  }
  if (part === "Trigger" || part === "Clear") props.push({ name: "child" });
  if (part === "InputGroup") props.push({ name: "ref", defaultValue: "$bindable()" });
  const snippets = part === "Trigger" ? ["icon"] : part === "Item" ? ["indicator"] : [];
  props.push({ name: "children" }, ...snippets.map((name) => ({ name })));
  const extras = (component.props?.fields ?? [])
    .filter(
      (field) =>
        supportsSvelteScope(field.targetScopes) &&
        ![
          "asChild",
          "children",
          "portalContainer",
          ...(part === "Root" ? modelProps : []),
        ].includes(field.name),
    )
    .map((field) => `${field.name}${field.optional ? "?" : ""}: ${field.type};`);
  if (part === "Popup")
    extras.push('portalContainer?: ComponentProps<typeof ComboboxPortal>["container"];');

  return {
    imports: [
      { source: "svelte", names: ["ComponentProps", "Snippet"], typeOnly: true },
      { source: "tailwind-variants", names: ["VariantProps"], typeOnly: true },
      { source: "tailwind-variants", names: ["cx"] },
      {
        source: sveltePrimitiveImport("combobox", options),
        names: [`Combobox${part}`, ...(part === "Popup" ? ["ComboboxPortal"] : [])],
      },
      { source: "./variants.js", names: group.variants.map((variant) => variant.name) },
    ],
    publicTypes: `export type ${component.exportName}Props = Omit<ComponentProps<typeof Combobox${part}>, ${part === "Input" ? '"children" | "size"' : part === "InputGroup" ? '"children" | "ref"' : '"children"'}>${variants.map((entry) => (entry.kind === "variant-props" ? ` & VariantProps<typeof ${entry.variant}>` : "")).join("")} & { children?: Snippet; ${part === "InputGroup" ? "ref?: HTMLDivElement;" : ""} ${snippets.map((name) => `${name}?: Snippet;`).join(" ")} ${extras.join(" ")} };`,
    destructure: props,
    rest: component.destructure.rest,
    setup: [],
  };
}
