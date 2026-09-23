import { sveltePrimitiveImport } from "./imports.js";
import type {
  StyledOutputComponent,
  StyledOutputComponentGroup,
  StyledOutputRenderNode,
} from "../../../styled-output-model/index.js";
import type { SvelteStyledComponentProjection, SvelteStyledRenderOptions } from "./types.js";
import { supportsSvelteScope } from "./scope.js";

/** Native branch and ref types belong to Svelte; shared render expressions retain their contract values. */
export function specializeSvelteStyledButton(
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
  const nativeExtends = (component.props?.extends ?? []).filter((entry) =>
    supportsSvelteScope(entry.targetScopes),
  );
  if (
    !nativeExtends?.some(
      (entry) => entry.kind === "element-attributes" && entry.element === "button",
    ) ||
    !nativeExtends.some(
      (entry) => entry.kind === "omit-element-attributes" && entry.element === "a",
    )
  ) {
    fail("Button requires its native button and anchor prop contracts");
  }
  const variants = nativeExtends.filter((entry) => entry.kind === "variant-props");
  if (nativeExtends.length !== 2 + variants.length) fail("unsupported Button prop inheritance");
  const fields = (component.props?.fields ?? []).filter(
    (field) => supportsSvelteScope(field.targetScopes) && field.name !== "as",
  );
  const common = [
    ...variants.map((entry) => `VariantProps<typeof ${entry.variant}>`),
    `{ ${fields.map((field) => `${JSON.stringify(field.name)}${field.optional ? "?" : ""}: ${field.type};`).join(" ")} }`,
  ].join(" & ");
  const props = (component.destructure?.props ?? []).filter((prop) =>
    supportsSvelteScope(prop.targetScopes),
  );
  const rest = component.destructure?.rest;
  if (!rest) fail("Button requires a native attribute rest binding");
  const asProp = props.find((prop) => prop.name === "as");
  if (!asProp || !props.some((prop) => prop.name === "href"))
    fail("Button requires as and href bindings");

  let anchors = 0;
  let buttons = 0;
  function specializeNodes(nodes: StyledOutputRenderNode[]): void {
    for (const node of nodes) {
      if (node.type === "condition") {
        specializeNodes(node.then);
        specializeNodes(node.else);
      }
      if (node.type === "element" && node.tag === "a") {
        anchors++;
        // The existing contract spells the HTML attribute for Astro/Vue and separately for React.
        const tab =
          node.attrs.find((attr) => attr.name === "tabindex") ??
          fail("anchor is missing the disabled tabindex contract");
        node.attrs = node.attrs.filter((attr) => attr !== tab);
        node.attrs.push({ ...tab, targetScopes: ["svelte"] });
        for (const attr of node.attrs) {
          if (
            attr.name === "spread" &&
            attr.value?.type === "variable" &&
            attr.value.name === rest
          ) {
            attr.value = { type: "raw", code: "nativeAnchorProps" };
          }
        }
      }
      if (node.type === "primitive" && node.component === "button" && node.part === "Root") {
        buttons++;
        node.attrs.push({
          name: "ref",
          value: { type: "raw", code: 'ref as NativeButtonProps["ref"]' },
        });
        node.attrs.push({ name: "tabindex", value: { type: "variable", name: "tabindex" } });
        for (const attr of node.attrs) {
          if (
            attr.name === "spread" &&
            attr.value?.type === "variable" &&
            attr.value.name === rest
          ) {
            attr.value = { type: "raw", code: `${rest} as NativeButtonProps` };
          }
        }
      }
      if ("children" in node) specializeNodes(node.children);
      if (node.type === "slot") specializeNodes(node.fallback);
    }
  }
  specializeNodes(component.render);
  if (anchors !== 1 || buttons !== 1)
    fail("Button requires one native anchor and one Primitive button branch");
  return {
    imports: [
      { source: "svelte", names: ["ComponentProps"], typeOnly: true },
      { source: "svelte", names: ["untrack"] },
      { source: "svelte/elements", names: ["HTMLAnchorAttributes"], typeOnly: true },
      { source: "tailwind-variants", names: ["VariantProps"], typeOnly: true },
      { source: "tailwind-variants", names: ["cx"] },
      { source: sveltePrimitiveImport("button", options), names: ["ButtonRoot"] },
      { source: "./variants.js", names: group.variants.map((variant) => variant.name) },
    ],
    publicTypes: `type NativeButtonProps = ComponentProps<typeof ButtonRoot>;
type CommonProps = ${common};
type AnchorProps = Omit<HTMLAnchorAttributes, "type" | "children"> & CommonProps & {
  children?: NativeButtonProps["children"];
  child?: never;
  disabled?: boolean;
  ref?: (element: HTMLAnchorElement | null) => void;
} & ({ as: "a"; href?: string } | { as?: "a" | "button"; href: string });
export type ${component.exportName}Props = (NativeButtonProps & CommonProps & { as?: "button"; href?: undefined }) | AnchorProps;`,
    destructure: [...props, { name: "ref" }, { name: "tabindex" }, { name: "children" }],
    rest,
    setup: [
      `let nativeAnchorProps = $derived({ ...${rest} } as HTMLAnchorAttributes);
let anchorRef = $derived(ref as ((element: HTMLAnchorElement | null) => void) | undefined);
function attachAnchor(element: HTMLAnchorElement): () => void {
  $effect(() => {
    const callback = anchorRef;
    untrack(() => callback?.(element));
    return () => untrack(() => callback?.(null));
  });
  return () => {};
}`,
    ],
  };
}
