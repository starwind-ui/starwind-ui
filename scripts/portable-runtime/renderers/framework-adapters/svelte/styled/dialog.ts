import type {
  StyledOutputComponent,
  StyledOutputComponentGroup,
  StyledOutputRenderNode,
} from "../../../styled-output-model/index.js";
import { sveltePrimitiveImport } from "./imports.js";
import { supportsSvelteScope } from "./scope.js";
import type { SvelteStyledComponentProjection, SvelteStyledRenderOptions } from "./types.js";

const parts: Readonly<Record<string, string>> = {
  Dialog: "Root",
  DialogTrigger: "Trigger",
  DialogClose: "Close",
  DialogContent: "Popup",
  DialogTitle: "Title",
  DialogDescription: "Description",
};

export function specializeSvelteStyledDialog(
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
  const native = ["DialogHeader", "DialogFooter"].includes(component.exportName);
  if (!part && !native) return fail("missing Dialog part owner");
  for (const entry of component.imports.filter((entry) => supportsSvelteScope(entry.targetScopes)))
    if (!entry.svg) fail(`unsupported Dialog import "${entry.source}"`);
  component.imports = [];
  if (part === "Trigger" || part === "Close") {
    const [branch] = component.render;
    if (
      component.render.length !== 1 ||
      branch?.type !== "condition" ||
      branch.condition !== "asChild"
    )
      return fail("Dialog requires its child composition branch");
    // The selected Primitive owns the native button and typed child payload in both Svelte modes.
    component.render = branch.else;
  }
  let owners = 0;
  function wire(nodes: StyledOutputRenderNode[]): void {
    for (const node of nodes) {
      if (node.type === "primitive" && node.component === "dialog" && node.part === part) {
        owners++;
        if (part === "Root") {
          for (const name of ["onOpenChange", "onCloseComplete"]) {
            const attr = node.attrs.find(
              (entry) => entry.name === name && entry.targetScopes?.includes("react"),
            );
            if (!attr) fail(`Dialog is missing its ${name} forwarding contract`);
            attr!.targetScopes = ["svelte"];
          }
          node.children = [];
          node.attrs.push({ name: "children", value: { type: "variable", name: "children" } });
        }
      }
      if (native && node.type === "element" && node.tag === "div") {
        owners++;
        const spread = node.attrs.find((entry) => entry.name === "spread");
        if (!spread) fail("Dialog native part requires attribute forwarding");
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
  if (owners !== 1) fail("Dialog requires one semantic owner");
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
  const snippets = part === "Popup" ? ["backdrop", "icon"] : [];
  props.push({ name: "children" }, ...snippets.map((name) => ({ name })));
  const nativeType = native
    ? "HTMLAttributes<HTMLDivElement> & { ref?: (element: HTMLDivElement | null) => void; children?: Snippet }"
    : `ComponentProps<typeof Dialog${part}>`;
  return {
    imports: [
      { source: "svelte", names: ["ComponentProps", "Snippet"], typeOnly: true },
      ...(native
        ? [
            { source: "svelte", names: ["untrack"] },
            { source: "svelte/elements", names: ["HTMLAttributes"], typeOnly: true },
            { source: "svelte/attachments", names: ["Attachment"], typeOnly: true },
          ]
        : [{ source: sveltePrimitiveImport("dialog", options), names: [`Dialog${part}`] }]),
      { source: "tailwind-variants", names: ["cx"] },
      { source: "./variants.js", names: group.variants.map((variant) => variant.name) },
    ],
    publicTypes: `export type ${component.exportName}Props = ${nativeType}${snippets.length ? ` & { ${snippets.map((name) => `${name}?: Snippet;`).join(" ")} }` : ""};`,
    destructure: props,
    rest: component.destructure?.rest,
    setup: native ? [nativeOwnership] : [],
  };
}

const nativeOwnership = `let nativeProps = $derived({ ...rest });
const attachNative: Attachment<HTMLDivElement> = (element) => {
  $effect(() => { const callback = ref; untrack(() => callback?.(element)); return () => untrack(() => callback?.(null)); });
};`;
