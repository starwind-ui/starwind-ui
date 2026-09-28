import type {
  StyledOutputComponent,
  StyledOutputComponentGroup,
} from "../../../styled-output-model/index.js";
import { sveltePrimitiveImport } from "./imports.js";
import { supportsSvelteScope } from "./scope.js";
import type { SvelteStyledComponentProjection, SvelteStyledRenderOptions } from "./types.js";

const parts: Record<string, string> = {
  Carousel: "Root",
  CarouselContent: "Viewport",
  CarouselItem: "Item",
  CarouselPrevious: "Previous",
  CarouselNext: "Next",
};

/** Styled anatomy forwards the service props and native owners to the existing Primitive. */
export function specializeSvelteStyledCarousel(
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
  const owner = component.render[0];
  if (
    !part ||
    !component.destructure?.rest ||
    component.render.length !== 1 ||
    owner?.type !== "primitive" ||
    owner.component !== "carousel" ||
    owner.part !== part
  )
    return fail("missing Carousel part owner");
  for (const entry of component.imports.filter((entry) => supportsSvelteScope(entry.targetScopes)))
    if (!entry.svg) fail(`unsupported import "${entry.source}"`);
  component.imports = [];
  const control = part === "Previous" || part === "Next";
  return {
    imports: [
      { source: "svelte", names: ["ComponentProps"], typeOnly: true },
      { source: sveltePrimitiveImport("carousel", options), names: [`Carousel${part}`] },
      { source: "tailwind-variants", names: ["cx"] },
      ...(control
        ? [{ source: "tailwind-variants", names: ["VariantProps"], typeOnly: true }]
        : []),
      {
        source: "./variants.js",
        names: [
          ...group.variants.map((variant) => variant.name),
          ...(group.variantAliases ?? []).map((alias) => alias.name),
        ],
      },
    ],
    publicTypes: `export type ${component.exportName}Props = ComponentProps<typeof Carousel${part}>${control ? " & VariantProps<typeof carouselControl>" : ""};`,
    destructure: [
      ...component.destructure.props.filter((prop) => supportsSvelteScope(prop.targetScopes)),
      { name: "children" },
    ],
    rest: component.destructure.rest,
    setup: [],
  };
}
