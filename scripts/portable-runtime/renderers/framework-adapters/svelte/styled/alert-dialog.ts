import type {
  StyledOutputComponent,
  StyledOutputComponentGroup,
  StyledOutputRenderNode,
} from "../../../styled-output-model/index.js";
import { sveltePrimitiveImport } from "./imports.js";
import { supportsSvelteScope } from "./scope.js";
import type { SvelteStyledComponentProjection, SvelteStyledRenderOptions } from "./types.js";

const parts: Readonly<Record<string, string>> = {
  AlertDialog: "Root",
  AlertDialogTrigger: "Trigger",
  AlertDialogClose: "Close",
  AlertDialogContent: "Popup",
  AlertDialogTitle: "Title",
  AlertDialogDescription: "Description",
};

export function specializeSvelteStyledAlertDialog(
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
  const button = ["AlertDialogAction", "AlertDialogCancel"].includes(component.exportName);
  const native = ["AlertDialogHeader", "AlertDialogFooter"].includes(component.exportName);
  if (!part && !native && !button) return fail("missing AlertDialog part owner");
  for (const entry of component.imports.filter((entry) => supportsSvelteScope(entry.targetScopes)))
    if (!entry.svg) fail(`unsupported AlertDialog import "${entry.source}"`);
  component.imports = [];
  if (part === "Trigger" || button) {
    const [branch] = component.render;
    if (
      component.render.length !== 1 ||
      branch?.type !== "condition" ||
      branch.condition !== "asChild"
    )
      return fail("AlertDialog requires its child composition branch");
    // The selected Primitive owns the native button and typed child payload in both Svelte modes.
    component.render = branch.else;
  }
  let owners = 0;
  function wire(nodes: StyledOutputRenderNode[]): void {
    for (const node of nodes) {
      if (node.type === "primitive" && node.component === "alert-dialog" && node.part === part) {
        owners++;
        if (part === "Root") {
          for (const name of ["onOpenChange", "onCloseComplete"]) {
            const attr = node.attrs.find(
              (entry) => entry.name === name && entry.targetScopes?.includes("react"),
            );
            if (!attr) fail(`AlertDialog is missing its ${name} forwarding contract`);
            attr!.targetScopes = ["svelte"];
          }
          node.children = [];
          node.attrs.push({ name: "children", value: { type: "variable", name: "children" } });
        }
      }
      if (button && node.type === "component" && node.component === "button") {
        owners++;
        node.attrs.push({ name: "spread", value: { type: "variable", name: "controlAttachment" } });
      }
      if (native && node.type === "element" && node.tag === "div") {
        owners++;
        const spread = node.attrs.find((entry) => entry.name === "spread");
        if (!spread) fail("AlertDialog native part requires attribute forwarding");
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
  if (owners !== 1) fail("AlertDialog requires one semantic owner");
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
  const snippets = part === "Popup" ? ["backdrop"] : [];
  props.push({ name: "children" }, ...snippets.map((name) => ({ name })));
  const nativeType = native
    ? "HTMLAttributes<HTMLDivElement> & { ref?: (element: HTMLDivElement | null) => void; children?: Snippet }"
    : button
      ? "ComponentProps<typeof Button>"
      : `ComponentProps<typeof AlertDialog${part}>`;
  return {
    imports: [
      { source: "svelte", names: ["ComponentProps", "Snippet"], typeOnly: true },
      ...(native
        ? [
            { source: "svelte", names: ["untrack"] },
            { source: "svelte/elements", names: ["HTMLAttributes"], typeOnly: true },
            { source: "svelte/attachments", names: ["Attachment"], typeOnly: true },
          ]
        : button
          ? [
              { source: "svelte/attachments", names: ["createAttachmentKey"] },
              {
                source: sveltePrimitiveImport("alert-dialog", options),
                names: ["getAlertDialogControlRefresh"],
              },
            ]
          : [
              {
                source: sveltePrimitiveImport("alert-dialog", options),
                names: [`AlertDialog${part}`],
              },
            ]),
      { source: "tailwind-variants", names: ["cx"] },
      { source: "./variants.js", names: group.variants.map((variant) => variant.name) },
    ],
    publicTypes: `export type ${component.exportName}Props = ${nativeType}${snippets.length ? ` & { ${snippets.map((name) => `${name}?: Snippet;`).join(" ")} }` : ""};`,
    destructure: props,
    rest: component.destructure?.rest,
    setup: native
      ? [nativeOwnership]
      : button
        ? [
            `const requestRefresh = getAlertDialogControlRefresh();
const controlAttachment = { [createAttachmentKey()]: () => {
  requestRefresh?.();
  return () => requestRefresh?.();
} };`,
          ]
        : [],
  };
}

const nativeOwnership = `let nativeProps = $derived({ ...rest });
const attachNative: Attachment<HTMLDivElement> = (element) => {
  $effect(() => { const callback = ref; untrack(() => callback?.(element)); return () => untrack(() => callback?.(null)); });
};`;
