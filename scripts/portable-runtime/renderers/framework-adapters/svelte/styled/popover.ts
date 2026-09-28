import type {
  StyledOutputComponent,
  StyledOutputComponentGroup,
  StyledOutputRenderNode,
} from "../../../styled-output-model/index.js";
import { sveltePrimitiveImport } from "./imports.js";
import { supportsSvelteScope } from "./scope.js";
import type { SvelteStyledComponentProjection, SvelteStyledRenderOptions } from "./types.js";

const parts: Readonly<Record<string, string>> = {
  Popover: "Root",
  PopoverTrigger: "Trigger",
  PopoverContent: "Popup",
  PopoverTitle: "Title",
  PopoverDescription: "Description",
};

export function specializeSvelteStyledPopover(
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
  const native = component.exportName === "PopoverHeader";
  if (!part && !native) return fail("missing Popover part owner");
  for (const entry of component.imports.filter((entry) => supportsSvelteScope(entry.targetScopes)))
    if (!entry.svg) fail(`unsupported Popover import "${entry.source}"`);
  component.imports = [];
  let owners = 0;
  function wire(nodes: StyledOutputRenderNode[]): void {
    for (const node of nodes) {
      if (node.type === "element" && node.tag === "div") node.selfClosing = false;
      if (node.type === "primitive" && node.component === "popover" && node.part === part) {
        owners++;
        if (part === "Trigger") {
          node.attrs = node.attrs.filter((attr) => attr.name !== "asChild");
          node.attrs.push({ name: "child", value: { type: "variable", name: "child" } });
        }
        if (part === "Root") {
          for (const name of ["onOpenChange", "onCloseComplete"]) {
            const attr = node.attrs.find(
              (entry) => entry.name === name && entry.targetScopes?.includes("react"),
            );
            if (!attr) fail(`Popover is missing its ${name} forwarding contract`);
            attr!.targetScopes = ["svelte"];
          }
          node.children = [];
          node.attrs.push({ name: "children", value: { type: "variable", name: "children" } });
        }
      }
      if (native && node.type === "element" && node.tag === "div") {
        owners++;
        const spread = node.attrs.find((entry) => entry.name === "spread");
        if (!spread) fail("Popover native part requires attribute forwarding");
        spread!.value = { type: "variable", name: "nativeProps" };
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
  if (owners !== 1) fail("Popover requires one semantic owner");
  const props = (component.destructure?.props ?? []).filter(
    (prop) => supportsSvelteScope(prop.targetScopes) && prop.name !== "asChild",
  );
  if (part === "Root")
    props.push(
      { name: "open", defaultValue: "$bindable()" },
      { name: "onOpenChange" },
      { name: "onCloseComplete" },
    );
  if (native) props.push({ name: "ref" });
  if (part === "Trigger") {
    props.push({ name: "child" });
    const expression = component.variables.find((variable) => variable.name === "triggerClassName");
    if (!expression || expression.value.type !== "raw") fail("missing Trigger class composition");
    expression!.value = { type: "raw", code: "child ? className : triggerBaseClassName" };
  }
  props.push({ name: "children" });
  const nativeType = native
    ? "HTMLAttributes<HTMLDivElement> & { ref?: (element: HTMLDivElement | null) => void; children?: Snippet }"
    : `ComponentProps<typeof Popover${part}>`;
  return {
    imports: [
      { source: "svelte", names: ["ComponentProps", "Snippet"], typeOnly: true },
      ...(native
        ? [
            { source: "svelte", names: ["untrack"] },
            { source: "svelte/elements", names: ["HTMLAttributes"], typeOnly: true },
            { source: "svelte/attachments", names: ["Attachment"], typeOnly: true },
          ]
        : [{ source: sveltePrimitiveImport("popover", options), names: [`Popover${part}`] }]),
      { source: "tailwind-variants", names: ["cx"] },
      ...(part === "Popup"
        ? [{ source: "tailwind-variants", names: ["VariantProps"], typeOnly: true }]
        : []),
      { source: "./variants.js", names: group.variants.map((variant) => variant.name) },
    ],
    publicTypes: `export type ${component.exportName}Props = ${nativeType}${part === "Popup" ? " & VariantProps<typeof popoverContent> & { portalContainer?: string; disablePortal?: boolean; }" : ""};`,
    destructure: props,
    rest: component.destructure?.rest,
    setup: native ? [nativeOwnership] : [],
  };
}

const nativeOwnership = `let nativeProps = $derived({ ...rest });
const attachNative: Attachment<HTMLDivElement> = (element) => {
  $effect(() => { const callback = ref; untrack(() => callback?.(element)); return () => untrack(() => callback?.(null)); });
};`;
