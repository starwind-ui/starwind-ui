import { aspectRatioPercentage } from "../../../shared-recipes/passive/aspect-ratio.js";
import { nativeValuePolicy } from "../../../shared-recipes/passive/native-values.js";
import type {
  StyledOutputComponent,
  StyledOutputComponentGroup,
} from "../../../styled-output-model/index.js";
import { collectStyledOutputVariantReferences } from "../../../styled-output-model/index.js";
import { supportsSvelteScope } from "./scope.js";
import type { SvelteStyledComponentProjection } from "./types.js";

type NativeStyledOwner = {
  tag: string;
  element: string;
  container?: "div";
  dynamic?: "as" | "href";
  svgAsset?: true;
  snippets?: readonly string[];
  fallbackSlots?: readonly string[];
};

/** Admitted semantic owners. Contracts retain prop, variant, wrapper, and markup facts. */
export const nativeStyledOwners: Readonly<
  Record<string, Readonly<Record<string, NativeStyledOwner>>>
> = {
  "input-group": {
    InputGroup: { tag: "div", element: "HTMLDivElement" },
    InputGroupAddon: { tag: "div", element: "HTMLDivElement" },
    InputGroupText: { tag: "span", element: "HTMLSpanElement" },
  },
  "native-select": {
    NativeSelect: {
      tag: "select",
      element: "HTMLSelectElement",
      snippets: ["icon"],
    },
    NativeSelectOption: { tag: "option", element: "HTMLOptionElement" },
    NativeSelectOptGroup: { tag: "optgroup", element: "HTMLOptGroupElement" },
  },
  textarea: { Textarea: { tag: "textarea", element: "HTMLTextAreaElement" } },
  prose: { Prose: { tag: "div", element: "HTMLDivElement" } },
  spinner: { Spinner: { tag: "svg", element: "SVGSVGElement", svgAsset: true } },
  "button-group": {
    ButtonGroup: { tag: "div", element: "HTMLDivElement" },
    ButtonGroupText: { tag: "div", element: "HTMLDivElement" },
  },
  pagination: {
    Pagination: { tag: "nav", element: "HTMLElement" },
    PaginationContent: { tag: "ul", element: "HTMLUListElement" },
    PaginationItem: { tag: "li", element: "HTMLLIElement" },
    PaginationEllipsis: {
      tag: "span",
      element: "HTMLSpanElement",
      fallbackSlots: ["icon", "children"],
    },
  },
  breadcrumb: {
    Breadcrumb: { tag: "nav", element: "HTMLElement" },
    BreadcrumbList: { tag: "ol", element: "HTMLOListElement" },
    BreadcrumbItem: { tag: "li", element: "HTMLLIElement" },
    BreadcrumbPage: { tag: "span", element: "HTMLSpanElement" },
    BreadcrumbSeparator: { tag: "li", element: "HTMLLIElement", fallbackSlots: ["children"] },
    BreadcrumbEllipsis: {
      tag: "span",
      element: "HTMLSpanElement",
      fallbackSlots: ["children", "icon"],
    },
  },
  "aspect-ratio": {
    AspectRatio: { tag: "Tag", element: "HTMLElement", container: "div", dynamic: "as" },
  },
  badge: {
    Badge: { tag: "Tag", element: "HTMLDivElement | HTMLAnchorElement", dynamic: "href" },
  },
  item: {
    Item: { tag: "Tag", element: "HTMLElement", dynamic: "as" },
    ItemActions: { tag: "div", element: "HTMLDivElement" },
    ItemContent: { tag: "div", element: "HTMLDivElement" },
    ItemDescription: { tag: "p", element: "HTMLParagraphElement" },
    ItemFooter: { tag: "div", element: "HTMLDivElement" },
    ItemGroup: { tag: "div", element: "HTMLDivElement" },
    ItemHeader: { tag: "div", element: "HTMLDivElement" },
    ItemMedia: { tag: "div", element: "HTMLDivElement" },
    ItemTitle: { tag: "div", element: "HTMLDivElement" },
  },
  separator: {
    Separator: { tag: "div", element: "HTMLDivElement" },
  },
  label: {
    Label: { tag: "label", element: "HTMLLabelElement" },
  },
  skeleton: {
    Skeleton: { tag: "div", element: "HTMLDivElement" },
  },
  alert: {
    Alert: { tag: "div", element: "HTMLDivElement" },
    AlertTitle: { tag: "h5", element: "HTMLHeadingElement" },
    AlertDescription: { tag: "p", element: "HTMLParagraphElement" },
  },
  card: {
    Card: { tag: "div", element: "HTMLDivElement" },
    CardHeader: { tag: "div", element: "HTMLDivElement" },
    CardTitle: { tag: "div", element: "HTMLDivElement" },
    CardDescription: { tag: "div", element: "HTMLDivElement" },
    CardContent: { tag: "div", element: "HTMLDivElement" },
    CardFooter: { tag: "div", element: "HTMLDivElement" },
    CardAction: { tag: "div", element: "HTMLDivElement" },
  },
  kbd: {
    Kbd: { tag: "kbd", element: "HTMLElement" },
    KbdGroup: { tag: "kbd", element: "HTMLElement" },
  },
  table: {
    Table: { tag: "table", element: "HTMLTableElement", container: "div" },
    TableHeader: { tag: "thead", element: "HTMLTableSectionElement" },
    TableBody: { tag: "tbody", element: "HTMLTableSectionElement" },
    TableFoot: { tag: "tfoot", element: "HTMLTableSectionElement" },
    TableRow: { tag: "tr", element: "HTMLTableRowElement" },
    TableHead: { tag: "th", element: "HTMLTableCellElement" },
    TableCell: { tag: "td", element: "HTMLTableCellElement" },
    TableCaption: { tag: "caption", element: "HTMLTableCaptionElement" },
  },
};

export function specializeSvelteStyledNative(
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
  if (group.component === "item" && component.exportName === "ItemSeparator") {
    const [root] = component.render;
    if (
      component.render.length !== 1 ||
      root?.type !== "component" ||
      root.component !== "separator" ||
      root.exportName !== "Separator" ||
      root.children.length ||
      !root.selfClosing ||
      !component.destructure?.rest
    )
      return fail("requires the Separator component owner");
    const bases = component.props?.extends ?? [];
    if (
      bases.length !== 1 ||
      bases[0]?.kind !== "component-props" ||
      bases[0].component !== "separator" ||
      bases[0].exportName !== "Separator"
    )
      return fail("requires Separator component props");
    return {
      imports: [
        { source: "../separator/index.js", names: ["SeparatorProps"], typeOnly: true },
        { source: "tailwind-variants", names: ["cx"] },
        { source: "./variants.js", names: ["itemSeparator"] },
      ],
      publicTypes: "export type ItemSeparatorProps = SeparatorProps;",
      destructure: component.destructure.props.filter((prop) =>
        supportsSvelteScope(prop.targetScopes),
      ),
      rest: component.destructure.rest,
      setup: [],
    };
  }
  const owner = nativeStyledOwners[group.component]?.[component.exportName];
  if (!owner) return fail("missing native projection owner");
  const valuePolicy = nativeValuePolicy(group.component, component.exportName);
  let [root] = component.render;
  if (owner.container) {
    if (
      component.render.length !== 1 ||
      root?.type !== "element" ||
      root.tag !== owner.container ||
      root.tagBinding ||
      root.children.length !== 1
    )
      return fail("requires one fixed native container");
    if (group.component === "aspect-ratio") {
      const names = root.attrs
        .filter((attr) => supportsSvelteScope(attr.targetScopes))
        .map((attr) => attr.name)
        .sort();
      if (names.join(",") !== "class,data-slot,style")
        return fail("ratio container must own only class, slot, and layout style");
    }
    if (
      root.attrs
        .filter((attr) => supportsSvelteScope(attr.targetScopes))
        .some((attr) => {
          if (group.component === "aspect-ratio")
            return !(
              (attr.name === "class" &&
                attr.value?.type === "class-variant" &&
                attr.value.variant === "aspectRatioWrapper") ||
              (attr.name === "style" &&
                attr.value?.type === "variable" &&
                attr.value.name === "wrapperStyle") ||
              (attr.name === "data-slot" &&
                attr.value?.type === "literal" &&
                attr.value.value === "aspect-ratio-wrapper")
            );
          return attr.value?.type !== "literal" || ["spread", "ref"].includes(attr.name);
        })
    )
      return fail("native container must not own forwarded props");
    root = root.children[0];
  }
  if (
    component.render.length !== 1 ||
    (owner.svgAsset
      ? root?.type !== "icon" || !root.asset
      : root?.type !== "element" ||
        root.tag !== owner.tag ||
        Boolean(root.tagBinding) !== Boolean(owner.dynamic))
  )
    return fail("requires one fixed native semantic owner");
  if (
    root.type === "element" &&
    root.children.some(
      (node) =>
        node.type !== "slot" ||
        (node.name && !owner.fallbackSlots?.includes(node.name)) ||
        (node.fallback.length && !owner.fallbackSlots?.includes(node.name ?? "children")),
    )
  )
    return fail("unsupported native children shape");
  if (root.type !== "element" && root.type !== "icon")
    return fail("requires one fixed native semantic owner");
  if (!component.destructure?.rest) return fail("requires native rest props");
  const spreads = root.attrs.filter(
    (attr) => attr.name === "spread" && supportsSvelteScope(attr.targetScopes),
  );
  if (
    spreads.length !== 1 ||
    spreads[0]?.value?.type !== "variable" ||
    spreads[0].value.name !== component.destructure.rest
  )
    return fail("requires one native attribute spread");
  if (owner.dynamic === "as") {
    const as = component.destructure.props.find((prop) => prop.name === "as");
    if (as?.alias !== "Tag" || as.defaultValue !== '"div"')
      return fail("requires native as with div default");
  }
  if (group.component === "aspect-ratio") {
    component.variables.push({
      name: "wrapperStyle",
      value: { type: "raw", code: "`padding-bottom: " + aspectRatioPercentage() + "`" },
    });
  }
  if (root.type === "element") root.selfClosing = false;
  const omitted = new Set<string>();
  let nativeCount = 0;
  const bases = (component.props?.extends ?? [])
    .filter((entry) => supportsSvelteScope(entry.targetScopes))
    .map((entry) => {
      if (entry.kind === "element-attributes" || entry.kind === "omit-element-attributes") {
        if (!owner.dynamic && entry.element !== owner.tag)
          return fail("native attribute type differs from semantic owner");
        nativeCount++;
        const base = `SvelteHTMLElements[${JSON.stringify(entry.element)}]`;
        const keys = [
          ...(entry.kind === "omit-element-attributes" ? entry.keys : []),
          ...(owner.svgAsset ? ["children"] : []),
          ...(valuePolicy?.typeOmissions ?? []),
        ];
        if (!keys.length) return base;
        keys.forEach((key) => omitted.add(key));
        return `Omit<${base}, ${keys.map((key) => JSON.stringify(key)).join(" | ")}>`;
      }
      if (entry.kind === "variant-props") {
        const base = `VariantProps<typeof ${entry.variant}>`;
        return entry.omit?.length
          ? `Omit<${base}, ${entry.omit.map((key) => JSON.stringify(key)).join(" | ")}>`
          : base;
      }
      return fail(`unsupported native prop inheritance "${entry.kind}"`);
    });
  if (nativeCount !== (group.component === "badge" || component.exportName === "Item" ? 2 : 1))
    return fail("requires one native attribute type");
  if (omitted.size) spreads[0].value = { type: "variable", name: "nativeProps" };
  const fields = (component.props?.fields ?? []).filter((field) =>
    supportsSvelteScope(field.targetScopes),
  );
  if (
    fields.some(
      (field) =>
        !(field.name === "data-slot" && field.type === "string") &&
        !(group.component === "aspect-ratio" && field.name === "ratio" && field.type === "number"),
    )
  )
    return fail("unsupported native prop field");
  const snippets = [
    ...(owner.fallbackSlots?.filter((name) => name !== "children") ?? []),
    ...(owner.snippets ?? []),
  ];
  if (valuePolicy?.declarations.length)
    bases.push(
      `{ ${valuePolicy.declarations.map((name) => `${name}?: ${valuePolicy.declarationType};`).join(" ")} }`,
    );
  bases.push(
    `{ ${owner.svgAsset ? "[key: symbol]: unknown; " : ""}${owner.dynamic === "as" ? "as?: keyof HTMLElementTagNameMap; " : ""}ref?: ${owner.element}; ${fields.map((field) => `${JSON.stringify(field.name)}${field.optional ? "?" : ""}: ${field.type};`).join(" ")}${snippets.map((name) => ` ${name}?: Snippet;`).join("")} }`,
  );
  const destructure = component.destructure.props.filter((prop) =>
    supportsSvelteScope(prop.targetScopes),
  );
  if (valuePolicy) destructure.push({ name: valuePolicy.name, defaultValue: "$bindable()" });
  destructure.push(
    { name: "ref", defaultValue: "$bindable()" },
    ...snippets.map((name) => ({ name })),
  );
  if (!omitted.has("children")) destructure.push({ name: "children" });
  for (const name of valuePolicy?.nativeDefaults ?? []) omitted.delete(name);
  // Omitted native props remain protected when JavaScript consumers bypass TypeScript.
  const rest = component.destructure.rest;
  const slot = root.attrs.find(
    (attr) => attr.name === "data-slot" && supportsSvelteScope(attr.targetScopes),
  );
  if (
    ["breadcrumb", "pagination"].includes(group.component) &&
    (slot?.value?.type !== "literal" || typeof slot.value.value !== "string")
  )
    return fail("requires a literal native data-slot owner");
  return {
    semanticNativeTag: owner.tag,
    semanticNativeSlot:
      ["breadcrumb", "pagination"].includes(group.component) && slot?.value?.type === "literal"
        ? String(slot.value.value)
        : undefined,
    imports: [
      ...(snippets.length ? [{ source: "svelte", names: ["Snippet"], typeOnly: true }] : []),
      { source: "svelte/elements", names: ["SvelteHTMLElements"], typeOnly: true },
      { source: "tailwind-variants", names: ["VariantProps"], typeOnly: true },
      { source: "tailwind-variants", names: ["cx"] },
      {
        source: "./variants.js",
        names: collectStyledOutputVariantReferences(component, { target: "svelte" }),
      },
    ],
    publicTypes: `export type ${component.exportName}Props = ${bases.join(" & ")};`,
    destructure,
    rest,
    setup: [
      ...(owner.dynamic
        ? [
            'let nativeIsVoid = $derived(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"].includes(Tag));',
          ]
        : []),
      ...svelteNativeSetup(rest, owner.element, omitted),
    ],
  };
}

/** Svelte owns symbol effects; the captured callback owns the public element ref. */
export function svelteNativeSetup(
  rest: string,
  _element: string,
  omitted: ReadonlySet<string> = new Set(),
): string[] {
  return [
    ...(omitted.size
      ? [
          `let nativeProps = $derived.by(() => {
  const props = { ...${rest} };
  for (const key of ${JSON.stringify([...omitted])}) delete (props as Record<string, unknown>)[key];
  return props;
});`,
        ]
      : []),
  ];
}
