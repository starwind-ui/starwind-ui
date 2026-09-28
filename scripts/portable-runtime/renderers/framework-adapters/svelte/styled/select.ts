import type {
  StyledOutputComponent,
  StyledOutputComponentGroup,
  StyledOutputRenderNode,
} from "../../../styled-output-model/index.js";
import { printSvelteNativePopupPresentation } from "./native-popup.js";
import { sveltePrimitiveImport } from "./imports.js";
import { supportsSvelteScope } from "./scope.js";
import type { SvelteStyledComponentProjection, SvelteStyledRenderOptions } from "./types.js";

const nativeParts: Readonly<Record<string, string>> = {
  Select: "Root",
  SelectTrigger: "Trigger",
  SelectValue: "Value",
  SelectContent: "Popup",
  SelectItem: "Item",
  SelectItemText: "ItemText",
  SelectItemIndicator: "ItemIndicator",
  SelectGroup: "Group",
  SelectLabel: "GroupLabel",
  SelectSeparator: "Separator",
  SelectScrollUpButton: "ScrollUpArrow",
  SelectScrollDownButton: "ScrollDownArrow",
};

/** Keep public model transactions and semantic/portal ownership in the existing Primitive parts. */
export function specializeSvelteStyledSelect(
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
  const part = nativeParts[component.exportName];
  if (!part) return fail("missing Select part owner");
  for (const entry of component.imports.filter((entry) => supportsSvelteScope(entry.targetScopes)))
    if (!entry.svg) fail(`unsupported Select import "${entry.source}"`);
  component.imports = [];
  let owners = 0;
  function wire(nodes: StyledOutputRenderNode[]): void {
    for (const node of nodes) {
      if (
        part === "Popup" &&
        node.type === "primitive" &&
        node.component === "select" &&
        node.part === "Positioner"
      ) {
        // Runtime fixes this outer element, which creates the popup's stacking context.
        // Keep the recipe and caller styles on Popup, then mirror its computed stacking value.
        node.attrs.push({ name: "ref", value: { type: "variable", name: "capturePositioner" } });
      }
      if (node.type === "primitive" && node.component === "select" && node.part === part) {
        owners++;
        if (part === "Root") {
          for (const name of ["onOpenChange", "onValueChange"]) {
            const attr = node.attrs.find(
              (entry) => entry.name === name && entry.targetScopes?.includes("react"),
            );
            if (!attr) fail(`Select is missing its ${name} forwarding contract`);
            attr!.targetScopes = ["svelte"];
          }
        }
        if (part === "Value") {
          node.children = [];
          node.attrs.push({ name: "children", value: { type: "variable", name: "children" } });
        }
        if (part === "Trigger") {
          const attr = node.attrs.find((entry) => entry.name === "asChild");
          if (!attr) fail("SelectTrigger is missing its child composition contract");
          attr!.name = "child";
          attr!.value = { type: "variable", name: "child" };
        }
      }
      if (node.type === "condition") {
        if (part === "Trigger" && node.condition === "!asChild && showIcon")
          node.condition = "!child && showIcon";
        wire(node.then);
        wire(node.else);
      }
      if ("children" in node) wire(node.children);
      if (node.type === "slot") wire(node.fallback);
    }
  }
  wire(component.render);
  if (owners !== 1) fail(`Select requires one ${part} owner`);
  const variants = (component.props?.extends ?? []).filter(
    (entry) => entry.kind === "variant-props" && supportsSvelteScope(entry.targetScopes),
  );
  const extras = (component.props?.fields ?? [])
    .filter(
      (field) =>
        supportsSvelteScope(field.targetScopes) &&
        !["asChild", "portalContainer"].includes(field.name),
    )
    .map((field) => `${field.name}${field.optional ? "?" : ""}: ${field.type};`);
  const snippets = part === "Trigger" ? ["icon"] : part === "Item" ? ["indicator"] : [];
  const props = (component.destructure?.props ?? []).filter(
    (prop) => supportsSvelteScope(prop.targetScopes) && prop.name !== "asChild",
  );
  if (part === "Root") {
    props.push(
      { name: "open", defaultValue: "$bindable()" },
      { name: "value", defaultValue: "$bindable()" },
      { name: "onOpenChange" },
      { name: "onValueChange" },
    );
  }
  if (part === "Trigger") props.push({ name: "child" });
  props.push({ name: "children" }, ...snippets.map((name) => ({ name })));
  const nativeName = `Select${part}`;
  const contentProps =
    part === "Popup"
      ? ' & Pick<ComponentProps<typeof SelectPositioner>, "alignItemWithTrigger"> & { portalContainer?: ComponentProps<typeof SelectPortal>["container"] }'
      : "";
  return {
    imports: [
      { source: "svelte", names: ["ComponentProps", "Snippet"], typeOnly: true },
      { source: "tailwind-variants", names: ["VariantProps"], typeOnly: true },
      { source: "tailwind-variants", names: ["cx"] },
      {
        source: sveltePrimitiveImport("select", options),
        names: [nativeName, ...(part === "Popup" ? ["SelectPortal", "SelectPositioner"] : [])],
      },
      { source: "./variants.js", names: group.variants.map((variant) => variant.name) },
    ],
    publicTypes: `export type ${component.exportName}Props = Omit<ComponentProps<typeof ${nativeName}>, "children">${contentProps}${variants.map((entry) => (entry.kind === "variant-props" ? ` & VariantProps<typeof ${entry.variant}>` : "")).join("")} & { children?: ${part === "Value" ? `ComponentProps<typeof ${nativeName}>["children"]` : "Snippet"}; ${snippets.map((name) => `${name}?: Snippet;`).join(" ")} ${extras.join(" ")} };`,
    destructure: props,
    rest: component.destructure?.rest,
    setup:
      part === "Popup"
        ? [
            printSvelteNativePopupPresentation(),
            `let authoredRoot: HTMLElement | null = null;
let positioner = $state.raw<HTMLDivElement | null>(null);
const capturePositioner = (node: HTMLDivElement | null) => {
  if (node) authoredRoot = node.closest<HTMLElement>("[data-sw-select]");
  positioner = node;
};
$effect(() => {
  const node = positioner;
  const popup = node?.querySelector<HTMLElement>("[data-sw-select-popup]");
  const view = node?.ownerDocument.defaultView;
  if (!node || !popup || !view) return;
  const releaseNative = connectNativePopup(popup, () => Boolean(authoredRoot?.closest("[popover]:popover-open")));
  const initial = node.style.zIndex;
  const syncStacking = () => {
    const next = view.getComputedStyle(popup).zIndex;
    if (node.style.zIndex !== next) node.style.zIndex = next;
  };
  syncStacking();
  const observer = new view.MutationObserver(syncStacking);
  observer.observe(popup, { attributes: true, attributeFilter: ["class", "style", "data-state"] });
  view.addEventListener("resize", syncStacking);
  return () => {
    observer.disconnect();
    releaseNative();
    view.removeEventListener("resize", syncStacking);
    node.style.zIndex = initial;
  };
});`,
          ]
        : [],
  };
}
