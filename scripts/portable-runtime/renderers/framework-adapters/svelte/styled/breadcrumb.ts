import type {
  StyledOutputComponent,
  StyledOutputComponentGroup,
} from "../../../styled-output-model/index.js";
import { specializeSvelteStyledNative, svelteNativeSetup } from "./native.js";
import { supportsSvelteScope } from "./scope.js";
import type { SvelteStyledComponentProjection } from "./types.js";

export function specializeSvelteStyledBreadcrumb(
  group: StyledOutputComponentGroup,
  component: StyledOutputComponent,
): Pick<
  SvelteStyledComponentProjection,
  | "imports"
  | "publicTypes"
  | "destructure"
  | "rest"
  | "setup"
  | "semanticNativeTag"
  | "semanticNativeSlot"
> {
  const fail = (detail: string): never => {
    throw new TypeError(`Svelte Styled breadcrumb/${component.exportName}.svelte: ${detail}.`);
  };
  for (const entry of component.imports.filter((entry) =>
    supportsSvelteScope(entry.targetScopes),
  )) {
    if (!entry.svg) fail(`unsupported Breadcrumb import "${entry.source}"`);
  }
  component.imports = [];
  if (component.exportName !== "BreadcrumbLink")
    return specializeSvelteStyledNative(group, component);

  const [branch] = component.render;
  if (
    component.render.length !== 1 ||
    branch?.type !== "condition" ||
    branch.condition !== "asChild" ||
    branch.then.length !== 1 ||
    branch.then[0]?.type !== "slot" ||
    branch.then[0].name ||
    branch.then[0].fallback.length ||
    branch.else.length !== 1
  )
    return fail("requires the asChild passthrough branch");
  const [anchor] = branch.else;
  if (
    anchor?.type !== "element" ||
    anchor.tag !== "a" ||
    anchor.tagBinding ||
    anchor.children.length !== 1 ||
    anchor.children[0]?.type !== "slot" ||
    anchor.children[0].name ||
    anchor.children[0].fallback.length
  )
    return fail("requires one native anchor with children content");
  const inherited =
    component.props?.extends?.filter((entry) => supportsSvelteScope(entry.targetScopes)) ?? [];
  if (
    inherited.length !== 1 ||
    inherited[0]?.kind !== "element-attributes" ||
    inherited[0].element !== "a"
  )
    return fail("requires native anchor attributes");
  const fields =
    component.props?.fields?.filter((field) => supportsSvelteScope(field.targetScopes)) ?? [];
  if (fields.length !== 1 || fields[0]?.name !== "asChild" || fields[0].type !== "boolean")
    return fail("requires the asChild boolean contract");
  const rest = component.destructure?.rest;
  if (!rest) return fail("requires native anchor rest props");
  const attrs = anchor.attrs.filter((attr) => supportsSvelteScope(attr.targetScopes));
  const spreads = attrs.filter((attr) => attr.name === "spread");
  if (
    spreads.length !== 1 ||
    spreads[0]?.value?.type !== "variable" ||
    spreads[0].value.name !== rest
  )
    return fail("requires one native anchor attribute spread");
  anchor.selfClosing = false;
  return {
    semanticNativeTag: "a",
    semanticNativeSlot: "breadcrumb-link",
    imports: [
      { source: "svelte", names: ["Snippet"], typeOnly: true },
      { source: "svelte/elements", names: ["HTMLAnchorAttributes"], typeOnly: true },
      { source: "tailwind-variants", names: ["cx"] },
      { source: "./variants.js", names: ["breadcrumbLink"] },
    ],
    publicTypes: `export type BreadcrumbLinkProps = Omit<HTMLAnchorAttributes, "children"> & { asChild?: boolean; children?: Snippet; ref?: HTMLAnchorElement; };`,
    destructure: [
      ...component.destructure!.props.filter((prop) => supportsSvelteScope(prop.targetScopes)),
      { name: "ref", defaultValue: "$bindable()" },
      { name: "children" },
    ],
    rest,
    setup: svelteNativeSetup(rest, "HTMLAnchorElement"),
  };
}
