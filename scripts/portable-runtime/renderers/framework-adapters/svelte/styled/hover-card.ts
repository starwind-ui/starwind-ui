import type {
  StyledOutputComponent,
  StyledOutputComponentGroup,
  StyledOutputRenderNode,
} from "../../../styled-output-model/index.js";
import { sveltePrimitiveImport } from "./imports.js";
import { supportsSvelteScope } from "./scope.js";
import type { SvelteStyledComponentProjection, SvelteStyledRenderOptions } from "./types.js";

export function specializeSvelteStyledHoverCard(
  group: StyledOutputComponentGroup,
  component: StyledOutputComponent,
  options: SvelteStyledRenderOptions,
): Pick<
  SvelteStyledComponentProjection,
  "imports" | "publicTypes" | "destructure" | "rest" | "setup" | "typeExports"
> {
  const fail = (detail: string): never => {
    throw new TypeError(
      `Svelte Styled ${group.component}/${component.exportName}.svelte: ${detail}.`,
    );
  };
  const part = (
    { HoverCard: "Root", HoverCardTrigger: "Trigger", HoverCardContent: "Popup" } as Record<
      string,
      string
    >
  )[component.exportName];
  if (!part) return fail("missing HoverCard part owner");
  for (const entry of component.imports.filter((entry) => supportsSvelteScope(entry.targetScopes)))
    if (!entry.svg) fail(`unsupported HoverCard import "${entry.source}"`);
  component.imports = [];
  let owners = 0;
  function wire(nodes: StyledOutputRenderNode[]): void {
    for (const node of nodes) {
      if (node.type === "primitive" && node.component === "preview-card") {
        if (node.part === part) owners++;
        if (node.part === "Trigger") {
          node.attrs = node.attrs.filter((attr) => attr.name !== "asChild");
          node.attrs.push({ name: "child", value: { type: "variable", name: "child" } });
        }
        if (node.part === "Root") {
          const callback = node.attrs.find(
            (attr) => attr.name === "onOpenChange" && attr.targetScopes?.includes("react"),
          );
          if (!callback) fail("HoverCard requires its proposal callback contract");
          callback!.targetScopes = ["svelte"];
          node.children = [];
          node.attrs.push({ name: "children", value: { type: "variable", name: "children" } });
        }
        if (node.part === "Positioner") {
          const classes = node.attrs.find(
            (attr) => attr.name === "class" && attr.targetScopes?.includes("vue"),
          );
          if (!classes) fail("HoverCard requires its positionerClass composition");
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
  if (owners !== 1) fail("HoverCard requires one semantic owner");
  const props = (component.destructure?.props ?? []).filter(
    (prop) => supportsSvelteScope(prop.targetScopes) && prop.name !== "asChild",
  );
  if (part === "Root")
    props.push({ name: "open", defaultValue: "$bindable()" }, { name: "onOpenChange" });
  if (part === "Trigger") {
    props.push({ name: "child" });
    const classes = component.variables.find((variable) => variable.name === "triggerClassName");
    if (!classes) fail("missing Trigger class composition");
    classes!.value = { type: "raw", code: "child ? className : triggerBaseClassName" };
  }
  if (part === "Popup") props.push({ name: "positionerClass" });
  props.push({ name: "children" });
  return {
    imports: [
      { source: "svelte", names: ["ComponentProps", "Snippet"], typeOnly: true },
      { source: sveltePrimitiveImport("preview-card", options), names: [`PreviewCard${part}`] },
      { source: "tailwind-variants", names: ["cx"] },
      { source: "./variants.js", names: group.variants.map((variant) => variant.name) },
    ],
    publicTypes: `${part === "Trigger" ? `export type { AnchorChildProps, AnchorChildPayload } from "${sveltePrimitiveImport("preview-card", options)}";\n` : ""}export type ${component.exportName}Props = ComponentProps<typeof PreviewCard${part}>${part === "Popup" ? " & { positionerClass?: string; portalContainer?: string; disablePortal?: boolean; }" : ""};`,
    typeExports: part === "Trigger" ? ["AnchorChildProps", "AnchorChildPayload"] : [],
    destructure: props,
    rest: component.destructure?.rest,
    setup: [],
  };
}
