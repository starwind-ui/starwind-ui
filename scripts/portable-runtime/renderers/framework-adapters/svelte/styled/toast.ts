import type {
  StyledOutputComponent,
  StyledOutputComponentGroup,
} from "../../../styled-output-model/index.js";
import { sveltePrimitiveImport } from "./imports.js";
import { supportsSvelteScope } from "./scope.js";
import type { SvelteStyledComponentProjection, SvelteStyledRenderOptions } from "./types.js";

const parts: Record<string, string> = {
  Toaster: "Viewport",
  ToastTemplate: "Template",
  ToastItem: "Root",
  ToastContent: "Content",
  ToastTitle: "Title",
  ToastDescription: "Description",
  ToastAction: "Action",
  ToastClose: "Close",
};

/** Runtime clones the contract templates; Svelte retains the template source owners. */
export function specializeSvelteStyledToast(
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
  if (!group.styles || group.styles.importFrom.join(",") !== "Toaster")
    return fail("requires the contract stylesheet on Toaster");
  if (!group.primitiveFacadeExports) return fail("requires the Primitive service facade");
  const part = parts[component.exportName];
  const owner = component.render[0];
  if (
    !part ||
    !component.destructure?.rest ||
    component.render.length !== 1 ||
    owner?.type !== "primitive" ||
    owner.component !== "toast" ||
    owner.part !== part
  )
    return fail("missing Toast part owner");
  for (const entry of component.imports.filter((entry) => supportsSvelteScope(entry.targetScopes)))
    if (!entry.svg) fail(`unsupported import "${entry.source}"`);
  component.imports = [];
  if (part === "Viewport") {
    const style = owner.attrs.find((attr) => attr.name === "style");
    if (style?.value?.type !== "variable" || style.value.name !== "viewportStyle")
      return fail("requires viewport style forwarding");
    style.value = { type: "variable", name: "style" };
    // Primitive style directives own these variables. Forward the public props to that owner.
    owner.attrs.push(
      ...["gap", "peek"].map((name) => ({ name, value: { type: "variable" as const, name } })),
    );
  }
  const variant = part === "Root" ? "toastItem" : part === "Title" ? "toastTitle" : undefined;
  const extras =
    part === "Title"
      ? " & { icon?: Snippet }"
      : part === "Close"
        ? " & { showIcon?: boolean }"
        : "";
  return {
    imports: [
      {
        source: "svelte",
        names: ["ComponentProps", ...(part === "Title" ? ["Snippet"] : [])],
        typeOnly: true,
      },
      { source: sveltePrimitiveImport("toast", options), names: [`Toast${part}`] },
      { source: "tailwind-variants", names: ["cx"] },
      ...(variant
        ? [{ source: "tailwind-variants", names: ["VariantProps"], typeOnly: true }]
        : []),
      { source: "./variants.js", names: group.variants.map((recipe) => recipe.name) },
    ],
    publicTypes: `export type ${component.exportName}Props = ComponentProps<typeof Toast${part}>${variant ? ` & VariantProps<typeof ${variant}>` : ""}${extras};`,
    destructure: [
      ...component.destructure.props.filter((prop) => supportsSvelteScope(prop.targetScopes)),
      { name: "children" },
      ...(part === "Title" ? [{ name: "icon" }] : []),
    ],
    rest: component.destructure.rest,
    setup: [],
  };
}
