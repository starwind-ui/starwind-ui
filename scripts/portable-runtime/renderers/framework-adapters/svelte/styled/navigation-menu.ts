import type {
  StyledOutputComponent,
  StyledOutputComponentGroup,
  StyledOutputRenderNode,
} from "../../../styled-output-model/index.js";
import { sveltePrimitiveImport } from "./imports.js";
import { supportsSvelteScope } from "./scope.js";
import type { SvelteStyledComponentProjection, SvelteStyledRenderOptions } from "./types.js";

const parts: Record<string, string> = {
  NavigationMenu: "Root",
  NavigationMenuList: "List",
  NavigationMenuItem: "Item",
  NavigationMenuTrigger: "Trigger",
  NavigationMenuIndicator: "Icon",
  NavigationMenuContent: "Content",
  NavigationMenuLink: "Link",
  NavigationMenuPositioner: "Positioner",
};

/** Preserve the stock shared viewport composition and project the approved Svelte models. */
export function specializeSvelteStyledNavigationMenu(
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
  if (!part || !component.destructure?.rest) return fail("missing Navigation Menu part owner");
  for (const entry of component.imports.filter((entry) => supportsSvelteScope(entry.targetScopes)))
    if (!entry.svg) fail(`unsupported import "${entry.source}"`);
  component.imports = [];
  let owners = 0;
  function wire(nodes: StyledOutputRenderNode[]): void {
    for (const node of nodes) {
      if (node.type === "condition" && node.condition === "asChild") node.condition = "child";
      if (node.type === "primitive" && node.component === "navigation-menu" && node.part === part) {
        owners++;
        if (part === "Root") {
          node.attrs = node.attrs.filter((attr) => !["value", "onValueChange"].includes(attr.name));
          node.attrs.push({
            name: "onValueChange",
            value: { type: "variable", name: "onValueChange" },
          });
        }
        if (part === "Trigger") {
          const child = node.attrs.find((attr) => attr.name === "asChild");
          if (!child) fail("missing Trigger child seam");
          child!.name = "child";
          child!.value = { type: "variable", name: "child" };
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
  if (owners !== (part === "Trigger" ? 2 : 1)) fail("unexpected Navigation Menu semantic owners");
  const props = component.destructure.props.filter(
    (prop) =>
      supportsSvelteScope(prop.targetScopes) &&
      prop.name !== "asChild" &&
      (part !== "Root" || !["value", "onValueChange"].includes(prop.name)),
  );
  if (part === "Root")
    props.push({ name: "value", defaultValue: "$bindable()" }, { name: "onValueChange" });
  if (part === "Trigger") {
    props.push({ name: "child" }, { name: "icon" });
    const classes = component.variables.find((entry) => entry.name === "triggerClassName");
    if (classes?.value.type !== "raw") fail("missing Trigger class expression");
    classes!.value = { type: "raw", code: "child ? className : triggerBaseClassName" };
  }
  props.push(
    part === "Root" ? { name: "children", alias: "consumerChildren" } : { name: "children" },
  );
  const extras = (component.props?.fields ?? [])
    .filter(
      (field) =>
        supportsSvelteScope(field.targetScopes) &&
        !["asChild", "ref", "value", "onValueChange", "portalContainer"].includes(field.name),
    )
    .map((field) => `${field.name}${field.optional ? "?" : ""}: ${field.type};`);
  if (["Root", "Positioner"].includes(part))
    extras.push('portalContainer?: ComponentProps<typeof NavigationMenuPortal>["container"];');
  if (part === "Trigger") extras.push("icon?: Snippet;");
  return {
    imports: [
      { source: "svelte", names: ["ComponentProps", "Snippet"], typeOnly: true },
      {
        source: sveltePrimitiveImport("navigation-menu", options),
        names: [
          `NavigationMenu${part}`,
          ...(["Root", "Positioner"].includes(part) ? ["NavigationMenuPortal"] : []),
        ],
      },
      { source: "tailwind-variants", names: ["cx"] },
      { source: "./variants.js", names: group.variants.map((variant) => variant.name) },
    ],
    publicTypes: `export type ${component.exportName}Props = ComponentProps<typeof NavigationMenu${part}> & { ${extras.join(" ")} };`,
    destructure: props,
    rest: component.destructure.rest,
    setup: [],
  };
}
