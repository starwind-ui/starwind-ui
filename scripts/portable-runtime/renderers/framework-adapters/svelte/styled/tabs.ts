import type {
  StyledOutputComponent,
  StyledOutputComponentGroup,
} from "../../../styled-output-model/index.js";
import { sveltePrimitiveImport } from "./imports.js";
import { supportsSvelteScope } from "./scope.js";
import type { SvelteStyledComponentProjection, SvelteStyledRenderOptions } from "./types.js";
export function specializeSvelteStyledTabs(
  group: StyledOutputComponentGroup,
  component: StyledOutputComponent,
  options: SvelteStyledRenderOptions,
): Pick<
  SvelteStyledComponentProjection,
  "imports" | "publicTypes" | "destructure" | "rest" | "setup"
> {
  const part = (
    { Tabs: "Root", TabsList: "List", TabsTrigger: "Tab", TabsContent: "Panel" } as Record<
      string,
      string
    >
  )[component.exportName];
  const [owner] = component.render;
  if (
    !part ||
    component.render.length !== 1 ||
    owner?.type !== "primitive" ||
    owner.component !== "tabs" ||
    owner.part !== part ||
    !component.destructure?.rest
  )
    throw new TypeError(
      "Styled Tabs requires its contracted Primitive owner and native forwarding.",
    );
  const props = component.destructure.props.filter(
    (prop) => supportsSvelteScope(prop.targetScopes) && (part !== "Root" || prop.name !== "value"),
  );
  const ref = owner.attrs.find((attr) => attr.name === "ref");
  if (!ref) throw new TypeError("Styled Tabs requires its native ref.");
  ref.targetScopes = ["svelte"];
  props.push({ name: "ref" }, { name: "children" });
  owner.children = [];
  owner.attrs.push({ name: "children", value: { type: "variable", name: "children" } });
  if (part === "Root") {
    owner.attrs = owner.attrs.filter((attr) => attr.name !== "value");
    const callback = owner.attrs.find((attr) => attr.name === "onValueChange");
    if (!callback) throw new TypeError("Styled Tabs requires its proposal callback.");
    callback.targetScopes = ["svelte"];
    props.push(
      { name: "value", defaultValue: "$bindable()" },
      { name: "value", alias: "commandValue" },
      { name: "onValueChange" },
    );
  }
  return {
    imports: [
      { source: "svelte", names: ["ComponentProps"], typeOnly: true },
      ...(part === "Root" ? [{ source: "svelte", names: ["untrack"] }] : []),
      { source: "tailwind-variants", names: ["cx"] },
      { source: sveltePrimitiveImport("tabs", options), names: [`Tabs${part} as PrimitivePart`] },
      { source: "./variants.js", names: group.variants.map((variant) => variant.name) },
    ],
    publicTypes: `export type ${component.exportName}Props = ComponentProps<typeof PrimitivePart>;`,
    destructure: props,
    rest: component.destructure.rest,
    setup:
      part === "Root"
        ? [
            `let observedCommand=untrack(()=>commandValue);
$effect(()=>{const next=commandValue;untrack(()=>{if(Object.is(next,observedCommand))return;observedCommand=next;if(!Object.is(next,value))value=next;});});`,
          ]
        : [],
  };
}
