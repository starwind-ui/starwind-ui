import type {
  StyledOutputComponent,
  StyledOutputComponentGroup,
} from "../../../styled-output-model/index.js";
import { sveltePrimitiveImport } from "./imports.js";
import { supportsSvelteScope } from "./scope.js";
import type { SvelteStyledComponentProjection, SvelteStyledRenderOptions } from "./types.js";

export function specializeSvelteStyledCollapsible(
  group: StyledOutputComponentGroup,
  component: StyledOutputComponent,
  options: SvelteStyledRenderOptions,
): Pick<
  SvelteStyledComponentProjection,
  "imports" | "publicTypes" | "destructure" | "rest" | "setup" | "typeExports"
> {
  const part = (
    { Collapsible: "Root", CollapsibleTrigger: "Trigger", CollapsibleContent: "Panel" } as Record<
      string,
      string
    >
  )[component.exportName];
  const fail = (detail: string): never => {
    throw new TypeError(`Svelte Styled collapsible/${component.exportName}: ${detail}.`);
  };
  const [owner] = component.render;
  if (
    !part ||
    component.render.length !== 1 ||
    owner?.type !== "primitive" ||
    owner.component !== "collapsible" ||
    owner.part !== part
  )
    return fail("requires its contract Primitive owner");
  const bases = component.props?.extends.filter((entry) => supportsSvelteScope(entry.targetScopes));
  if (
    bases?.length !== 1 ||
    bases[0]?.kind !== "element-attributes" ||
    bases[0].element !== (part === "Trigger" ? "button" : "div")
  )
    return fail("requires native part props");
  if (!component.destructure?.rest || !owner.attrs.some((attr) => attr.name === "spread"))
    return fail("requires native attribute forwarding");
  const props = component.destructure.props.filter(
    (prop) => supportsSvelteScope(prop.targetScopes) && prop.name !== "asChild",
  );
  props.push({ name: "children" });
  if (part === "Root") {
    const callback = owner.attrs.find(
      (attr) => attr.name === "onOpenChange" && attr.targetScopes?.includes("react"),
    );
    if (!callback) return fail("requires the proposal callback contract");
    callback.targetScopes = ["svelte"];
    props.push({ name: "open", defaultValue: "$bindable()" }, { name: "onOpenChange" });
    owner.children = [];
    owner.attrs.push({ name: "children", value: { type: "variable", name: "children" } });
  }
  if (part === "Trigger") {
    const child = owner.attrs.find((attr) => attr.name === "asChild");
    if (!child) return fail("requires the semantic child contract");
    child.name = "child";
    child.value = { type: "variable", name: "child" };
    props.push({ name: "child" });
  }
  return {
    imports: [
      { source: "svelte", names: ["ComponentProps"], typeOnly: true },
      {
        source: sveltePrimitiveImport("collapsible", options),
        names: [`Collapsible${part} as PrimitivePart`],
      },
      ...(part === "Trigger"
        ? [
            {
              source: sveltePrimitiveImport("collapsible", options),
              names: ["ButtonChildProps", "ButtonChildPayload"],
              typeOnly: true,
            },
          ]
        : []),
      { source: "tailwind-variants", names: ["cx"] },
      { source: "./variants.js", names: group.variants.map((variant) => variant.name) },
    ],
    publicTypes: `export type ${component.exportName}Props = ComponentProps<typeof PrimitivePart>;${part === "Trigger" ? "\nexport type { ButtonChildProps, ButtonChildPayload };" : ""}`,
    typeExports: part === "Trigger" ? ["ButtonChildProps", "ButtonChildPayload"] : [],
    destructure: props,
    rest: component.destructure.rest,
    setup: [],
  };
}
