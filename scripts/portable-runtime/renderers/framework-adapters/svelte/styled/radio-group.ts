import type {
  StyledOutputComponent,
  StyledOutputComponentGroup,
  StyledOutputRenderNode,
} from "../../../styled-output-model/index.js";
import { sveltePrimitiveImport } from "./imports.js";
import { supportsSvelteScope } from "./scope.js";
import type { SvelteStyledComponentProjection, SvelteStyledRenderOptions } from "./types.js";

export function specializeSvelteStyledRadioGroup(
  group: StyledOutputComponentGroup,
  component: StyledOutputComponent,
  options: SvelteStyledRenderOptions,
): Pick<
  SvelteStyledComponentProjection,
  "imports" | "publicTypes" | "destructure" | "rest" | "setup"
> {
  const isRoot = component.exportName === "RadioGroup",
    model = isRoot ? "value" : "checked",
    primitive = isRoot ? "RadioGroupRoot" : "RadioRoot";
  if (!isRoot && component.exportName !== "RadioGroupItem")
    throw new TypeError("Unexpected Styled Radio Group part.");
  if (!component.destructure?.rest)
    throw new TypeError("Styled Radio Group requires rest forwarding.");
  component.imports = [];
  let roots = 0;
  function wire(nodes: StyledOutputRenderNode[]) {
    for (const node of nodes) {
      if (node.type === "primitive" && node.part === "Root") {
        roots++;
        node.attrs = node.attrs.filter(
          (attr) => attr.name !== model && !(attr.name === "nativeButton" && !isRoot),
        );
        for (const name of ["ref", isRoot ? "onValueChange" : "onCheckedChange"]) {
          const attr = node.attrs.find((attr) => attr.name === name);
          if (!attr) throw new TypeError(`Missing Radio ${name} contract.`);
          attr.targetScopes = ["svelte"];
        }
        if (!isRoot) {
          const spread = node.attrs.find((attr) => attr.name === "spread");
          if (!spread) throw new TypeError("Missing Radio rest contract.");
          spread.value = {
            type: "raw",
            code: "({ ...rest, nativeButton, ref, value, defaultChecked, disabled, form, id, name, onCheckedChange, readOnly, required } as PrimitiveProps)",
          };
          node.attrs = node.attrs.filter(
            (attr) =>
              ![
                "ref",
                "value",
                "defaultChecked",
                "disabled",
                "form",
                "id",
                "name",
                "onCheckedChange",
                "readOnly",
                "required",
              ].includes(attr.name),
          );
        }
      }
      if ("children" in node) wire(node.children);
      if (node.type === "condition") {
        wire(node.then);
        wire(node.else);
      }
      if (node.type === "slot") wire(node.fallback);
    }
  }
  wire(component.render);
  if (roots !== 1) throw new TypeError("Styled Radio requires one Primitive root.");
  return {
    imports: [
      { source: "svelte", names: ["ComponentProps", "Snippet"], typeOnly: true },
      { source: "svelte", names: ["untrack"] },
      { source: "tailwind-variants", names: ["VariantProps"], typeOnly: true },
      { source: "tailwind-variants", names: ["cx"] },
      {
        source: sveltePrimitiveImport(isRoot ? "radio-group" : "radio", options),
        names: [primitive],
      },
      { source: "./variants.js", names: group.variants.map((v) => v.name) },
    ],
    publicTypes: isRoot
      ? `export type RadioGroupProps=ComponentProps<typeof RadioGroupRoot> & {legend?:string;size?:"sm"|"md"|"lg"};`
      : `type PrimitiveProps=ComponentProps<typeof RadioRoot>;
type WithStyledProps<T>=T extends unknown?Omit<T,"children"> & VariantProps<typeof radioControl> & {icon?:Snippet}:never;
export type RadioGroupItemProps=WithStyledProps<PrimitiveProps>;`,
    destructure: [
      ...component.destructure.props.filter(
        (prop) => supportsSvelteScope(prop.targetScopes) && prop.name !== model,
      ),
      { name: model, defaultValue: "$bindable()" },
      { name: model, alias: "commandValue" },
      { name: "ref" },
      { name: isRoot ? "onValueChange" : "onCheckedChange" },
      { name: isRoot ? "children" : "icon" },
    ],
    rest: component.destructure.rest,
    setup: [
      `let observedCommand=untrack(()=>commandValue);
$effect(()=>{const next=commandValue;untrack(()=>{if(Object.is(next,observedCommand))return;observedCommand=next;if(!Object.is(next,${model}))${model}=next;});});`,
    ],
  };
}
