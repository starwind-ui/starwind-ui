import type {
  StyledOutputComponent,
  StyledOutputComponentGroup,
} from "../../../styled-output-model/index.js";
import { sveltePrimitiveImport } from "./imports.js";
import { supportsSvelteScope } from "./scope.js";
import type { SvelteStyledComponentProjection, SvelteStyledRenderOptions } from "./types.js";

export function specializeSvelteStyledAccordion(
  group: StyledOutputComponentGroup,
  component: StyledOutputComponent,
  options: SvelteStyledRenderOptions,
): Pick<
  SvelteStyledComponentProjection,
  "imports" | "publicTypes" | "destructure" | "rest" | "setup" | "typeExports"
> {
  const part = (
    {
      Accordion: "Root",
      AccordionItem: "Item",
      AccordionTrigger: "Trigger",
      AccordionContent: "Panel",
    } as Record<string, string>
  )[component.exportName];
  const [owner] = component.render;
  if (
    !part ||
    component.render.length !== 1 ||
    owner?.type !== "primitive" ||
    owner.component !== "accordion" ||
    owner.part !== part ||
    !component.destructure?.rest ||
    !owner.attrs.some((attr) => attr.name === "spread")
  )
    throw new TypeError(
      "Styled Accordion requires its contracted Primitive owner and native forwarding.",
    );
  component.imports = [];
  const props = component.destructure.props.filter(
    (prop) => supportsSvelteScope(prop.targetScopes) && prop.name !== "value",
  );
  props.push({ name: "children" });
  if (part === "Root") {
    owner.attrs = owner.attrs.filter((attr) => attr.name !== "value");
    const callback = owner.attrs.find((attr) => attr.name === "onValueChange");
    if (!callback) throw new TypeError("Styled Accordion requires its value callback contract.");
    callback.targetScopes = ["svelte"];
    props.push(
      { name: "value", defaultValue: "$bindable()" },
      { name: "onValueChange" },
    );
    owner.children = [];
    owner.attrs.push({ name: "children", value: { type: "variable", name: "children" } });
  } else if (part === "Item") props.push({ name: "value" });
  else if (part === "Trigger") props.push({ name: "icon" });
  return {
    imports: [
      { source: "svelte", names: ["ComponentProps", "Snippet"], typeOnly: true },
      { source: "tailwind-variants", names: ["cx"] },
      {
        source: sveltePrimitiveImport("accordion", options),
        names: [`Accordion${part} as PrimitivePart`],
      },
      { source: "./variants.js", names: group.variants.map((variant) => variant.name) },
    ],
    publicTypes: `export type ${component.exportName}Props = ${part === "Item" ? 'Omit<ComponentProps<typeof PrimitivePart>, "value"> & { value: string }' : part === "Trigger" ? "ComponentProps<typeof PrimitivePart> & { icon?: Snippet }" : "ComponentProps<typeof PrimitivePart>"};`,
    typeExports: [],
    destructure: props,
    rest: component.destructure.rest,
    setup: [],
  };
}
