import {
  collectStyledOutputVariantReferences,
  type StyledOutputComponent,
  type StyledOutputComponentGroup,
} from "../../../styled-output-model/index.js";
import { nativeStyledOwners, specializeSvelteStyledNative } from "./native.js";
import { supportsSvelteScope } from "./scope.js";
import type { SvelteStyledComponentProjection } from "./types.js";

/** Component wrappers forward native ownership to the existing Styled dependency. */
export function specializeSvelteStyledNavigation(
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
    throw new TypeError(
      `Svelte Styled ${group.component}/${component.exportName}.svelte: ${detail}.`,
    );
  };
  for (const entry of component.imports.filter((entry) =>
    supportsSvelteScope(entry.targetScopes),
  )) {
    if (!entry.svg) fail(`unsupported navigation import "${entry.source}"`);
  }
  component.imports = [];
  if (component.exportName === "PaginationEllipsis") {
    const [root] = component.render;
    if (root?.type !== "element") return fail("requires native PaginationEllipsis markup");
    // Svelte needs an explicit boolean for the contract's present aria-hidden attribute.
    for (const attr of root.attrs)
      if (attr.name === "aria-hidden" && !attr.value) attr.value = { type: "literal", value: true };
  }
  if (nativeStyledOwners[group.component]?.[component.exportName])
    return specializeSvelteStyledNative(group, component);
  const owners: Record<
    string,
    { component: string; name: string; keys: readonly string[]; icon?: boolean }
  > = {
    ButtonGroupSeparator: { component: "separator", name: "Separator", keys: [] },
    PaginationLink: { component: "button", name: "Button", keys: ["variant", "as", "ref"] },
    PaginationPrevious: { component: "pagination", name: "PaginationLink", keys: [], icon: true },
    PaginationNext: { component: "pagination", name: "PaginationLink", keys: [], icon: true },
  };
  const owner = owners[component.exportName];
  if (!owner) return fail("missing composed navigation owner");
  const [root] = component.render;
  if (
    component.render.length !== 1 ||
    root?.type !== "component" ||
    root.component !== owner.component ||
    root.exportName !== owner.name ||
    root.localName ||
    !component.destructure?.rest
  )
    return fail("requires the declared Styled component owner");
  const inherited =
    component.props?.extends?.filter((entry) => supportsSvelteScope(entry.targetScopes)) ?? [];
  const base = inherited[0];
  if (
    inherited.length !== 1 ||
    base?.kind !== "component-props" ||
    base.component !== owner.component ||
    base.exportName !== owner.name ||
    base.localName ||
    JSON.stringify(base.keys) !== JSON.stringify(owner.keys)
  )
    return fail("requires the declared component prop inheritance");
  const fields =
    component.props?.fields?.filter((entry) => supportsSvelteScope(entry.targetScopes)) ?? [];
  const link = component.exportName === "PaginationLink";
  if (
    link
      ? fields.length !== 1 || fields[0]?.name !== "isActive" || fields[0].type !== "boolean"
      : fields.length !== 0
  )
    return fail("unsupported composed navigation prop fields");
  const attrs = root.attrs.filter((attr) => supportsSvelteScope(attr.targetScopes));
  const spreads = attrs.filter((attr) => attr.name === "spread");
  if (
    spreads.length !== 1 ||
    spreads[0]?.value?.type !== "variable" ||
    spreads[0].value.name !== component.destructure.rest
  )
    return fail("requires one component prop spread");
  if (
    link &&
    !attrs.some(
      (attr) => attr.name === "as" && attr.value?.type === "literal" && attr.value.value === "a",
    )
  )
    return fail("PaginationLink requires the Button anchor branch");
  if (
    owner.name === "Separator" ? root.children.length !== 0 || !root.selfClosing : root.selfClosing
  )
    return fail("unsupported component content shape");
  const allowed = owner.icon ? ["children", "icon"] : ["children"];
  for (const child of root.children) {
    if (
      child.type !== "slot" ||
      !allowed.includes(child.name ?? "children") ||
      (!child.name && child.fallback.length)
    )
      return fail("unsupported composed navigation content slot");
  }
  if (
    owner.name !== "Separator" &&
    root.children.filter((child) => child.type === "slot" && !child.name).length !== 1
  )
    return fail("requires one children content slot");
  if (
    owner.icon &&
    root.children.filter((child) => child.type === "slot" && child.name === "icon").length !== 1
  )
    return fail("requires one icon content slot");
  // The contract forces Button's anchor branch, which narrows its union before omitted keys are applied.
  const inheritedType = link
    ? `Extract<ComponentProps<typeof ${owner.name}>, { as: "a" }>`
    : `ComponentProps<typeof ${owner.name}>`;
  const baseType = base.keys.length
    ? `Omit<${inheritedType}, ${base.keys.map((key) => JSON.stringify(key)).join(" | ")}>`
    : inheritedType;
  const additions = [
    ...fields.map(
      (field) => `${JSON.stringify(field.name)}${field.optional ? "?" : ""}: ${field.type};`,
    ),
    ...(link ? ["ref?: (element: HTMLAnchorElement | null) => void;"] : []),
    ...(owner.icon ? ["icon?: Snippet;"] : []),
  ];
  const destructure = component.destructure.props.filter((prop) =>
    supportsSvelteScope(prop.targetScopes),
  );
  destructure.push({ name: "ref" });
  root.attrs.push({ name: "ref", value: { type: "variable", name: "ownerRef" } });
  if (owner.name !== "Separator") destructure.push({ name: "children" });
  if (owner.icon) destructure.push({ name: "icon" });
  const variants = collectStyledOutputVariantReferences(component, { target: "svelte" });
  return {
    imports: [
      {
        source: "svelte",
        names: ["ComponentProps", ...(owner.icon ? ["Snippet"] : [])],
        typeOnly: true,
      },
      { source: "tailwind-variants", names: ["cx"] },
      ...(variants.length ? [{ source: "./variants.js", names: variants }] : []),
    ],
    publicTypes: `export type ${component.exportName}Props = ${baseType}${additions.length ? ` & { ${additions.join(" ")} }` : ""};`,
    destructure,
    rest: component.destructure.rest,
    setup: ["let ownerRef = $derived(ref);"],
  };
}
