import type {
  StyledOutputComponent,
  StyledOutputComponentGroup,
} from "../../../styled-output-model/index.js";
import { sveltePrimitiveImport } from "./imports.js";
import { supportsSvelteScope } from "./scope.js";
import type { SvelteStyledComponentProjection, SvelteStyledRenderOptions } from "./types.js";

export function specializeSvelteStyledForm(
  group: StyledOutputComponentGroup,
  component: StyledOutputComponent,
  options: SvelteStyledRenderOptions,
): Pick<
  SvelteStyledComponentProjection,
  "imports" | "publicTypes" | "destructure" | "rest" | "setup"
> {
  const part =
    component.exportName === "Form"
      ? "Root"
      : component.exportName === "FormErrorSummary"
        ? "ErrorSummary"
        : undefined;
  const [owner] = component.render;
  if (
    !part ||
    component.render.length !== 1 ||
    owner?.type !== "primitive" ||
    owner.component !== "form" ||
    owner.part !== part ||
    !component.destructure?.rest ||
    !owner.attrs.some((attr) => attr.name === "spread")
  )
    throw new TypeError(
      `Svelte Styled form/${component.exportName} requires its Primitive owner and native forwarding.`,
    );
  const ref = owner.attrs.find((attr) => attr.name === "ref");
  if (!ref)
    throw new TypeError(`Svelte Styled form/${component.exportName} requires its ref contract.`);
  ref.targetScopes = ["svelte"];
  return {
    imports: [
      { source: "svelte", names: ["ComponentProps"], typeOnly: true },
      { source: sveltePrimitiveImport("form", options), names: [`Form${part} as PrimitivePart`] },
      { source: "tailwind-variants", names: ["cx"] },
      { source: "./variants.js", names: group.variants.map((variant) => variant.name) },
    ],
    publicTypes: `export type ${component.exportName}Props = ComponentProps<typeof PrimitivePart>;`,
    destructure: [
      ...component.destructure.props.filter((prop) => supportsSvelteScope(prop.targetScopes)),
      { name: "children" },
      { name: "ref" },
    ],
    rest: component.destructure.rest,
    setup: [],
  };
}
