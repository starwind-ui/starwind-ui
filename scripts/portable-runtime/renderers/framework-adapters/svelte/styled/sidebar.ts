import { assertStyledSidebarConnection } from "../../../primitive-output-model/sidebar-connection.js";
import type {
  StyledOutputComponent,
  StyledOutputComponentGroup,
  StyledOutputRenderNode,
} from "../../../styled-output-model/index.js";
import { sveltePrimitiveImport } from "./imports.js";
import { svelteNativeSetup } from "./native.js";
import { renderSvelteStyledValue } from "./render.js";
import { supportsSvelteScope } from "./scope.js";
import type { SvelteStyledComponentProjection, SvelteStyledRenderOptions } from "./types.js";

const nativeOwners: Record<string, [string, string]> = {
  SidebarInset: ["main", "HTMLElement"],
  SidebarContent: ["div", "HTMLDivElement"],
  SidebarFooter: ["div", "HTMLDivElement"],
  SidebarGroup: ["div", "HTMLDivElement"],
  SidebarGroupContent: ["div", "HTMLDivElement"],
  SidebarGroupLabel: ["div", "HTMLDivElement"],
  SidebarHeader: ["div", "HTMLDivElement"],
  SidebarMenu: ["ul", "HTMLUListElement"],
  SidebarMenuItem: ["li", "HTMLLIElement"],
  SidebarMenuBadge: ["div", "HTMLDivElement"],
  SidebarMenuSkeleton: ["div", "HTMLDivElement"],
  SidebarMenuSub: ["ul", "HTMLUListElement"],
  SidebarMenuSubButton: ["a", "HTMLAnchorElement"],
  SidebarMenuSubItem: ["li", "HTMLLIElement"],
};
const dependencies: Record<string, [string, string]> = {
  SidebarInput: ["input", "Input"],
  SidebarSeparator: ["separator", "Separator"],
  SidebarGroupAction: ["button", "Button"],
  SidebarMenuAction: ["button", "Button"],
};
const parts: Record<string, string> = {
  SidebarProvider: "Provider",
  Sidebar: "Component",
  SidebarTrigger: "Trigger",
  SidebarRail: "Rail",
  SidebarMenuButton: "MenuButton",
};

export function specializeSvelteStyledSidebar(
  group: StyledOutputComponentGroup,
  component: StyledOutputComponent,
  options: SvelteStyledRenderOptions,
): Pick<
  SvelteStyledComponentProjection,
  "imports" | "publicTypes" | "destructure" | "rest" | "setup" | "semanticNativeTag"
> {
  assertStyledSidebarConnection(group);
  const name = component.exportName,
    part = parts[name],
    native = nativeOwners[name],
    dependency = dependencies[name];
  const provider = part === "Provider",
    sidebar = name === "Sidebar",
    trigger = part === "Trigger",
    menu = part === "MenuButton";
  const fail = (message: string): never => {
    throw new TypeError(`Svelte Styled sidebar/${name}: ${message}.`);
  };
  if (!part && !native && !dependency) fail("missing part owner");
  for (const entry of component.imports.filter((entry) => supportsSvelteScope(entry.targetScopes)))
    if (!entry.svg) fail("unsupported import");
  component.imports = [];
  const props = (component.destructure?.props ?? []).filter(
    (prop) => supportsSvelteScope(prop.targetScopes) && !["ref", "asChild"].includes(prop.name),
  );
  component.variables = component.variables.filter(
    (variable) => !["Tag", "providerStyle", "mobileStyle", "skeletonStyle"].includes(variable.name),
  );
  const variable = (name: string, code: string) =>
    component.variables.push({ name, value: { type: "raw", code } });
  if (provider) {
    props.push(
      { name: "open", defaultValue: "$bindable()" },
      { name: "mobileOpen", defaultValue: "$bindable()" },
      { name: "onOpenChange" },
      { name: "onMobileOpenChange" },
    );
    variable(
      "providerStyle",
      '"--sidebar-width: 18rem; --sidebar-width-icon: 3.5rem; " + (style ?? "")',
    );
  }
  if (sidebar) variable("mobileStyle", '"--sidebar-width: 18rem"');
  if (name === "SidebarMenuSkeleton")
    variable("skeletonStyle", "`--skeleton-width: ${skeletonWidth}`");
  if (name === "SidebarInput") props.push({ name: "value", defaultValue: "$bindable()" });
  if (native || sidebar) props.push({ name: "ref", defaultValue: "$bindable()" });
  if (trigger) props.push({ name: "icon" });
  props.push({ name: "children" });
  if (trigger) {
    const root = component.render[0];
    if (root?.type !== "primitive" || root.part !== "Trigger") fail("missing Trigger composition");
    const owner = root as Extract<StyledOutputRenderNode, { type: "primitive" }>;
    const button = owner.children[0];
    if (button?.type !== "component" || button.exportName !== "Button")
      fail("missing Button recipe owner");
    const buttonNode = button as Extract<StyledOutputRenderNode, { type: "component" }>;
    owner.attrs = buttonNode.attrs.filter((attr) => !["variant", "size"].includes(attr.name));
    const classes = owner.attrs.find((attr) => attr.name === "class");
    if (!classes?.value) fail("missing Trigger classes");
    classes!.value = {
      type: "class-join",
      items: [{ type: "raw", code: "button({variant,size})" }, classes!.value!],
    };
    owner.children = buttonNode.children;
  }
  if (menu) {
    let menuPropsAdded = false;
    function replace(nodes: StyledOutputRenderNode[]): StyledOutputRenderNode[] {
      return nodes.map((node) => {
        if (node.type === "component" && node.exportName === "TooltipTrigger")
          return replace(node.children)[0]!;
        if (node.type === "primitive" && node.part === "MenuButton") {
          const child = node.children[0];
          if (child?.type !== "element" || child.tag !== "Tag")
            fail("missing native MenuButton owner");
          const element = child as Extract<StyledOutputRenderNode, { type: "element" }>;
          node.attrs = element.attrs.filter(
            (attr) => !["type", "data-as-child"].includes(attr.name),
          );
          node.attrs.push({
            name: "data-sw-tooltip-trigger",
            value: { type: "raw", code: 'tooltip ? "" : undefined' },
          });
          if (!menuPropsAdded) {
            variable(
              "menuProps",
              `({ ${node.attrs.map((attr) => (attr.name === "spread" ? `...${renderSvelteStyledValue(attr.value!)}` : `${JSON.stringify(attr.name)}: ${attr.value ? renderSvelteStyledValue(attr.value) : "true"}`)).join(", ")} }) as ComponentProps<typeof SidebarMenuButton>`,
            );
            menuPropsAdded = true;
          }
          node.attrs = [{ name: "spread", value: { type: "variable", name: "menuProps" } }];
          node.children = element.children;
        }
        if ("children" in node) node.children = replace(node.children);
        if (node.type === "condition") {
          node.then = replace(node.then);
          node.else = replace(node.else);
        }
        return node;
      });
    }
    component.render = replace(component.render);
  }
  function wire(nodes: StyledOutputRenderNode[]): void {
    for (const node of nodes) {
      if (node.type === "element") {
        if (!["input", "img", "br", "hr"].includes(node.tag)) node.selfClosing = false;
        if (
          (native && node === component.render[0]) ||
          (sidebar && node.attrs.some((attr) => attr.name === "spread"))
        ) {
          for (const attr of node.attrs) {
            if (attr.name === "spread") {
              attr.targetScopes = ["svelte"];
              attr.value = { type: "variable", name: "rest" };
            }
          }
          node.attrs = node.attrs.filter((attr) => attr.name !== "data-as-child");
        }
      }
      if (provider && node.type === "primitive" && node.part === "Provider") {
        node.attrs = node.attrs.filter((attr) => !["open", "mobileOpen"].includes(attr.name));
        for (const attr of node.attrs)
          if (["onOpenChange", "onMobileOpenChange"].includes(attr.name))
            attr.targetScopes = ["svelte"];
      }
      if (sidebar && node.type === "primitive" && node.part === "Sidebar")
        node.attrs = node.attrs.filter(
          (attr) => !["data-state", "data-collapsible"].includes(attr.name),
        );
      if ("children" in node) wire(node.children);
      if (node.type === "condition") {
        wire(node.then);
        wire(node.else);
      }
      if (node.type === "slot") wire(node.fallback);
    }
  }
  wire(component.render);
  const source = sveltePrimitiveImport("sidebar", options);
  const inherited = provider
    ? "ComponentProps<typeof SidebarProvider>"
    : sidebar
      ? 'Omit<ComponentProps<typeof SidebarComponent>, "collapsible" | "ref">'
      : part
        ? `ComponentProps<typeof Sidebar${part}>`
        : dependency
          ? `ComponentProps<typeof ${dependency[1]}>`
          : `SvelteHTMLElements[${JSON.stringify(native![0])}]`;
  const fields = (component.props?.fields ?? [])
    .filter(
      (field) =>
        supportsSvelteScope(field.targetScopes) &&
        !["ref", "asChild", "persistenceStorage"].includes(field.name) &&
        !provider,
    )
    .map((field) => `${JSON.stringify(field.name)}${field.optional ? "?" : ""}:${field.type};`)
    .join(" ");
  const variants = (component.props?.extends ?? [])
    .filter((base) => base.kind === "variant-props")
    .map((base) => (base.kind === "variant-props" ? ` & VariantProps<typeof ${base.variant}>` : ""))
    .join("");
  return {
    semanticNativeTag: native?.[0],
    imports: [
      { source: "svelte", names: ["ComponentProps", "Snippet"], typeOnly: true },
      { source: "tailwind-variants", names: ["VariantProps"], typeOnly: true },
      { source: "tailwind-variants", names: ["cx"] },
      { source: "./variants.js", names: group.variants.map((v) => v.name) },
      ...(part ? [{ source, names: [`Sidebar${part}`] }] : []),
      ...(dependency ? [{ source: `../${dependency[0]}/index.js`, names: [dependency[1]] }] : []),
      ...(trigger ? [{ source: "../button/variants.js", names: ["button"] }] : []),
      ...(native || sidebar
        ? [{ source: "svelte/elements", names: ["SvelteHTMLElements"], typeOnly: true }]
        : []),
    ],
    publicTypes: `export type ${name}Props = ${inherited}${variants}${trigger ? " & VariantProps<typeof button>" : ""} & {children?:Snippet; ${fields} ${trigger ? "icon?:Snippet;" : ""} ${native || sidebar ? `ref?:${native?.[1] ?? "HTMLDivElement"};` : ""}};`,
    destructure: props,
    rest: component.destructure?.rest,
    setup: [
      ...(native || sidebar ? svelteNativeSetup("rest", native?.[1] ?? "HTMLDivElement") : []),
    ],
  };
}
