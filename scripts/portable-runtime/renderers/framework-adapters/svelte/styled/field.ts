import type {
  StyledOutputComponent,
  StyledOutputComponentGroup,
} from "../../../styled-output-model/index.js";
import type { SvelteStyledComponentProjection, SvelteStyledRenderOptions } from "./types.js";
import { sveltePrimitiveImport } from "./imports.js";
import { supportsSvelteScope } from "./scope.js";
import { specializeSvelteStyledInput } from "./input.js";
export function specializeSvelteStyledField(
  group: StyledOutputComponentGroup,
  component: StyledOutputComponent,
  options: SvelteStyledRenderOptions,
): Pick<
  SvelteStyledComponentProjection,
  "imports" | "publicTypes" | "destructure" | "rest" | "setup" | "semanticNativeTag"
> {
  const root = component.render[0];
  if (
    component.render.length !== 1 ||
    !root ||
    (root.type !== "primitive" && root.type !== "element") ||
    !component.destructure?.rest
  )
    throw new TypeError("Styled Field requires a semantic owner and native forwarding.");
  const owners: Record<string, string> = {
    Field: "field.Root",
    FieldControl: "field.Control",
    FieldDescription: "field.Description",
    FieldError: "field.Error",
    FieldItem: "field.Item",
    FieldLabel: "field.Label",
    FieldValidity: "field.Validity",
    FieldSet: "fieldset.Root",
    FieldLegend: "fieldset.Legend",
    FieldContent: "div",
    FieldGroup: "div",
    FieldTitle: "div",
    FieldSeparator: "div",
  };
  const identity = root.type === "primitive" ? root.component + "." + root.part : root.tag;
  if (owners[component.exportName] !== identity)
    throw new TypeError(
      `Styled Field ${component.exportName} requires its contracted semantic owner.`,
    );
  if (component.exportName === "FieldControl") {
    const adapted = structuredClone(component);
    adapted.exportName = "Input";
    const owner = adapted.render[0];
    if (owner?.type !== "primitive")
      throw new TypeError("FieldControl requires Input composition.");
    owner.component = "input";
    owner.part = "Root";
    const result = specializeSvelteStyledInput(group, adapted, options);
    root.attrs = root.attrs.filter((attr) => attr.name !== "value");
    for (const attr of root.attrs)
      if (["ref", "onValueChange"].includes(attr.name)) attr.targetScopes = ["svelte"];
    return {
      ...result,
      imports: result.imports.map((entry) =>
        entry.names.includes("InputRoot")
          ? {
              ...entry,
              source: sveltePrimitiveImport("field", options),
              names: ["FieldControl as PrimitivePart"],
            }
          : entry,
      ),
      publicTypes: result.publicTypes
        .replaceAll("InputProps", "FieldControlProps")
        .replaceAll("InputRoot", "PrimitivePart")
        .replace("typeof input", "typeof fieldControl"),
      setup: result.setup.map((code) => code.replaceAll("InputProps", "FieldControlProps")),
    };
  }
  const ref = root.attrs.find((attr) => attr.name === "ref");
  if (!ref)
    throw new TypeError(`Styled Field ${component.exportName} requires native ref forwarding.`);
  if (ref) {
    if (root.type === "primitive") ref.targetScopes = ["svelte"];
    else root.attrs = root.attrs.filter((attr) => attr !== ref);
  }
  const variants = (component.props?.extends ?? []).filter(
    (entry) => entry.kind === "variant-props",
  );
  const variantType = variants
    .map((entry) => (entry.kind === "variant-props" ? `VariantProps<typeof ${entry.variant}>` : ""))
    .join(" & ");
  const native = root.type === "element";
  const imports: SvelteStyledComponentProjection["imports"] = [
    { source: "svelte", names: ["ComponentProps", "Snippet"], typeOnly: true },
    { source: "tailwind-variants", names: ["VariantProps"], typeOnly: true },
    { source: "tailwind-variants", names: ["cx"] },
    { source: "./variants.js", names: group.variants.map((variant) => variant.name) },
  ];
  let base: string;
  if (root.type === "primitive") {
    imports.push({
      source: sveltePrimitiveImport(root.component, options),
      names: [
        `${root.component === "fieldset" ? "Fieldset" : "Field"}${root.part} as PrimitivePart`,
      ],
    });
    base = "ComponentProps<typeof PrimitivePart>";
  } else {
    imports.push(
      { source: "svelte/elements", names: ["HTMLAttributes"], typeOnly: true },
      { source: "svelte", names: ["untrack"] },
      { source: "svelte/attachments", names: ["Attachment"], typeOnly: true },
    );
    base =
      'Omit<HTMLAttributes<HTMLDivElement>, "children"> & { children?: Snippet; ref?: (element: HTMLDivElement | null) => void; "data-slot"?: string }';
  }
  const separator = component.exportName === "FieldSeparator";
  if (separator) {
    component.variables = [];
    root.attrs = root.attrs.filter((attr) => attr.name !== "data-content");
    root.attrs.push({
      name: "data-content",
      value: { type: "raw", code: 'hasContent ? "true" : "false"' },
    });
  }
  return {
    imports,
    publicTypes: `export type ${component.exportName}Props = ${variantType ? `Omit<${base}, "size"> & ${variantType}` : base};`,
    destructure: [
      ...component.destructure.props.filter((prop) => supportsSvelteScope(prop.targetScopes)),
      { name: "children" },
      { name: "ref" },
    ],
    rest: component.destructure.rest,
    setup: [
      ...(native ? [printInlineNativeRefAttachment()] : []),
      ...(separator ? ["let hasContent = $derived(Boolean(children));"] : []),
    ],
    ...(native ? { semanticNativeTag: root.tag } : {}),
  };
}

function printInlineNativeRefAttachment(): string {
  return `  let attachNativeCallback = $derived(ref);
  const attachNative: Attachment<HTMLDivElement> = (element) => {
    const callback = attachNativeCallback;
    untrack(() => callback?.(element));
    return () => untrack(() => callback?.(null));
  };`;
}
