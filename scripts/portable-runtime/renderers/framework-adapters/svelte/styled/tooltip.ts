import type {
  StyledOutputComponent,
  StyledOutputComponentGroup,
  StyledOutputRenderNode,
} from "../../../styled-output-model/index.js";
import { sveltePrimitiveImport } from "./imports.js";
import { supportsSvelteScope } from "./scope.js";
import type { SvelteStyledComponentProjection, SvelteStyledRenderOptions } from "./types.js";

export function specializeSvelteStyledTooltip(
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
  const part = (
    { Tooltip: "Root", TooltipTrigger: "Trigger", TooltipContent: "Popup" } as Record<
      string,
      string
    >
  )[component.exportName];
  if (!part) return fail("missing Tooltip part owner");
  for (const entry of component.imports.filter((entry) => supportsSvelteScope(entry.targetScopes)))
    if (!entry.svg) fail(`unsupported Tooltip import "${entry.source}"`);
  component.imports = [];
  let owners = 0;
  function wire(nodes: StyledOutputRenderNode[]): void {
    for (const node of nodes) {
      if (node.type === "primitive" && node.component === "tooltip") {
        if (node.part === part) owners++;
        if (node.part === "Trigger") {
          node.attrs = node.attrs.filter((attr) => attr.name !== "asChild");
          node.attrs.push({ name: "child", value: { type: "variable", name: "child" } });
        }
        if (node.part === "Root") {
          const callback = node.attrs.find(
            (attr) => attr.name === "onOpenChange" && attr.targetScopes?.includes("react"),
          );
          if (!callback) fail("Tooltip requires its proposal callback contract");
          callback!.targetScopes = ["svelte"];
          node.children = [];
          node.attrs.push({ name: "children", value: { type: "variable", name: "children" } });
        }
        if (node.part === "Positioner") {
          const classes = node.attrs.find(
            (attr) => attr.name === "class" && attr.targetScopes?.includes("vue"),
          );
          if (!classes) fail("Tooltip requires its positionerClass composition");
          classes!.targetScopes = ["svelte"];
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
  if (owners !== 1) fail("Tooltip requires one semantic owner");
  const props = (component.destructure?.props ?? []).filter(
    (prop) => supportsSvelteScope(prop.targetScopes) && prop.name !== "asChild",
  );
  if (part === "Root")
    props.push({ name: "open", defaultValue: "$bindable()" }, { name: "onOpenChange" });
  if (part === "Trigger") {
    props.push({ name: "child" });
    const classes = component.variables.find((variable) => variable.name === "triggerClassName");
    if (!classes) fail("missing Trigger class composition");
    classes!.value = { type: "raw", code: 'cx(child ? undefined : "inline-flex", className)' };
  }
  if (part === "Popup") props.push({ name: "positionerClass" }, { name: "icon" });
  props.push({ name: "children" });
  return {
    imports: [
      { source: "svelte", names: ["ComponentProps", "Snippet"], typeOnly: true },
      { source: sveltePrimitiveImport("tooltip", options), names: [`Tooltip${part}`] },
      { source: "tailwind-variants", names: ["cx"] },
      { source: "./variants.js", names: group.variants.map((variant) => variant.name) },
    ],
    publicTypes: `export type ${component.exportName}Props = ComponentProps<typeof Tooltip${part}>${part === "Popup" ? " & { positionerClass?: string; portalContainer?: string; disablePortal?: boolean; icon?: Snippet; }" : ""};`,
    destructure: props,
    rest: component.destructure?.rest,
    setup: [],
  };
}
