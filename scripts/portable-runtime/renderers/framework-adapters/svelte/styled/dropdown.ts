import type {
  StyledOutputComponent,
  StyledOutputComponentGroup,
  StyledOutputRenderNode,
} from "../../../styled-output-model/index.js";
import { sveltePrimitiveImport } from "./imports.js";
import { supportsSvelteScope } from "./scope.js";
import type { SvelteStyledComponentProjection, SvelteStyledRenderOptions } from "./types.js";

const parts: Readonly<Record<string, string>> = {
  Dropdown: "Root",
  DropdownTrigger: "Trigger",
  DropdownContent: "Popup",
  DropdownCheckboxItem: "CheckboxItem",
  DropdownCheckboxItemIndicator: "CheckboxItemIndicator",
  DropdownRadioGroup: "RadioGroup",
  DropdownRadioItem: "RadioItem",
  DropdownRadioItemIndicator: "RadioItemIndicator",
  DropdownItem: "Item",
  DropdownLinkItem: "LinkItem",
  DropdownGroup: "Group",
  DropdownLabel: "Label",
  DropdownSeparator: "Separator",
  DropdownShortcut: "Shortcut",
  DropdownSub: "SubmenuRoot",
  DropdownSubTrigger: "SubmenuTrigger",
  DropdownSubContent: "Popup",
};

/** Project the stock composition while Menu owns accepted transactions and DOM behavior. */
export function specializeSvelteStyledDropdown(
  group: StyledOutputComponentGroup,
  component: StyledOutputComponent,
  options: SvelteStyledRenderOptions,
) {
  return specializeSvelteStyledMenu(group, component, options, {
    primitive: "menu",
    primitiveName: "Menu",
    styledName: "Dropdown",
    buttonChild: true,
  });
}

export function specializeSvelteStyledMenu(
  group: StyledOutputComponentGroup,
  component: StyledOutputComponent,
  options: SvelteStyledRenderOptions,
  owner: {
    primitive: "menu" | "context-menu";
    primitiveName: "Menu" | "ContextMenu";
    styledName: "Dropdown" | "ContextMenu";
    buttonChild: boolean;
  },
): Pick<
  SvelteStyledComponentProjection,
  "imports" | "publicTypes" | "destructure" | "rest" | "setup"
> {
  const fail = (detail: string): never => {
    throw new TypeError(
      `Svelte Styled ${group.component}/${component.exportName}.svelte: ${detail}.`,
    );
  };
  const part = parts[component.exportName.replace(owner.styledName, "Dropdown")];
  if (!part || (owner.primitive === "context-menu" && part === "LinkItem"))
    return fail(`missing ${owner.styledName} part owner`);
  for (const entry of component.imports.filter((entry) => supportsSvelteScope(entry.targetScopes)))
    if (!entry.svg) fail(`unsupported ${owner.styledName} import "${entry.source}"`);
  component.imports = [];
  const model =
    part === "Root"
      ? "open"
      : part === "CheckboxItem"
        ? "checked"
        : part === "RadioGroup"
          ? "value"
          : undefined;
  const callbacks =
    part === "Root"
      ? ["onOpenChange", "onCloseComplete"]
      : part === "CheckboxItem"
        ? ["onCheckedChange"]
        : part === "RadioGroup"
          ? ["onValueChange"]
          : [];
  let owners = 0;
  function wire(nodes: StyledOutputRenderNode[]): void {
    for (const node of nodes) {
      if (node.type === "element" && node.tag === "span") node.selfClosing = false;
      if (node.type === "primitive" && node.component === owner.primitive && node.part === part) {
        owners++;
        node.attrs = node.attrs.filter(
          (attr) => attr.name !== model && !callbacks.includes(attr.name),
        );
        for (const name of callbacks) node.attrs.push({ name, value: { type: "variable", name } });
        if (part === "Root") {
          node.children = [];
          node.attrs.push({ name: "children", value: { type: "variable", name: "children" } });
        }
        if (part === "Trigger" && owner.buttonChild) {
          const attr = node.attrs.find((entry) => entry.name === "asChild");
          if (!attr) fail("Dropdown Trigger requires its child composition contract");
          attr!.name = "child";
          attr!.value = { type: "variable", name: "child" };
        }
      }
      if ("children" in node) wire(node.children);
      if (node.type === "condition") {
        wire(node.then);
        wire(node.else);
      }
      if (node.type === "slot") wire(node.fallback);
    }
  }
  wire(component.render);
  if (owners !== 1) fail(`${owner.styledName} requires one ${part} owner`);
  const props = (component.destructure?.props ?? []).filter(
    (prop) =>
      supportsSvelteScope(prop.targetScopes) &&
      prop.name !== "asChild" &&
      prop.name !== model &&
      !callbacks.includes(prop.name),
  );
  if (model) props.push({ name: model, defaultValue: "$bindable()" });
  props.push(...callbacks.map((name) => ({ name })));
  if (part === "Root") {
    const initial = props.find((prop) => prop.name === "defaultOpen");
    if (initial) delete initial.defaultValue;
  }
  if (part === "Trigger" && owner.buttonChild) {
    props.push({ name: "child" });
    const expression = component.variables.find((variable) => variable.name === "triggerClassName");
    if (!expression || expression.value.type !== "raw")
      fail("missing Dropdown Trigger class composition");
    expression!.value = { type: "raw", code: "child ? className : triggerBaseClassName" };
  }
  const snippets = ["CheckboxItem", "RadioItem"].includes(part)
    ? ["indicator"]
    : part === "SubmenuTrigger"
      ? ["icon"]
      : [];
  props.push({ name: "children" }, ...snippets.map((name) => ({ name })));
  const extras = (component.props?.fields ?? [])
    .filter(
      (field) =>
        supportsSvelteScope(field.targetScopes) &&
        ![
          "asChild",
          "ref",
          "portalContainer",
          "open",
          "checked",
          "value",
          "defaultOpen",
          "defaultChecked",
          "defaultValue",
          ...callbacks,
        ].includes(field.name),
    )
    .map((field) => `${field.name}${field.optional ? "?" : ""}: ${field.type};`);
  if (part === "Popup")
    extras.push(
      `portalContainer?: ComponentProps<typeof ${owner.primitiveName}Portal>["container"];`,
    );
  return {
    imports: [
      { source: "svelte", names: ["ComponentProps", "Snippet"], typeOnly: true },
      {
        source: sveltePrimitiveImport(owner.primitive, options),
        names: [
          `${owner.primitiveName}${part}`,
          ...(part === "Popup" ? [`${owner.primitiveName}Portal`] : []),
        ],
      },
      { source: "tailwind-variants", names: ["cx"] },
      { source: "./variants.js", names: group.variants.map((variant) => variant.name) },
    ],
    publicTypes: `export type ${component.exportName}Props = ComponentProps<typeof ${owner.primitiveName}${part}> & { ${extras.join(" ")} ${snippets.map((name) => `${name}?: Snippet;`).join(" ")} };`,
    destructure: props,
    rest: component.destructure?.rest,
    setup: [],
  };
}
