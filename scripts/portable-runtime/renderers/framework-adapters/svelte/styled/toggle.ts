import type {
  StyledOutputComponent,
  StyledOutputComponentGroup,
  StyledOutputRenderNode,
} from "../../../styled-output-model/index.js";
import { sveltePrimitiveImport } from "./imports.js";
import { supportsSvelteScope } from "./scope.js";
import type { SvelteStyledComponentProjection, SvelteStyledRenderOptions } from "./types.js";
export function specializeSvelteStyledToggle(
  group: StyledOutputComponentGroup,
  component: StyledOutputComponent,
  options: SvelteStyledRenderOptions,
): Pick<
  SvelteStyledComponentProjection,
  "imports" | "publicTypes" | "destructure" | "rest" | "setup"
> {
  const isRoot = component.exportName === "ToggleGroup",
    isSolo = component.exportName === "Toggle",
    model = isRoot ? "value" : "pressed",
    primitive = isRoot ? "ToggleGroupRoot" : "ToggleRoot";
  if (!isRoot && !isSolo && component.exportName !== "ToggleGroupItem")
    throw new TypeError("Unexpected Toggle part.");
  if (!component.destructure?.rest) throw new TypeError("Toggle requires rest forwarding.");
  component.imports = [];
  if (isRoot)
    for (const variable of component.variables ?? [])
      if (variable.name === "toggleGroupStyle")
        variable.value = { type: "raw", code: '`--gap: ${spacing}; ${style ?? ""}`' };
  let roots = 0;
  function wire(nodes: StyledOutputRenderNode[]) {
    for (const node of nodes) {
      if (node.type === "primitive" && node.part === "Root") {
        roots++;
        node.attrs = node.attrs.filter((attr) => attr.name !== model);
        if (isRoot) {
          for (const attr of node.attrs) {
            if (
              ["ref", "onValueChange"].includes(attr.name) ||
              (attr.name === "style" && attr.value?.type === "variable")
            )
              attr.targetScopes = ["svelte"];
          }
        } else {
          const names = [
            "nativeButton",
            "ref",
            "value",
            "defaultPressed",
            "disabled",
            "onPressedChange",
            ...(isSolo ? ["syncGroup"] : []),
          ];
          const spread = node.attrs.find((attr) => attr.name === "spread");
          if (!spread) throw new TypeError("Toggle requires native forwarding.");
          spread.value = {
            type: "raw",
            code: `({ ...rest, ${names.join(", ")} } as PrimitiveProps)`,
          };
          node.attrs = node.attrs.filter((attr) => !names.includes(attr.name));
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
  if (roots !== 1) throw new TypeError("Toggle requires one Primitive owner.");
  return {
    imports: [
      { source: "svelte", names: ["ComponentProps"], typeOnly: true },
      { source: "svelte", names: ["untrack"] },
      { source: "tailwind-variants", names: ["VariantProps"], typeOnly: true },
      { source: "tailwind-variants", names: ["cx"] },
      {
        source: sveltePrimitiveImport(isRoot ? "toggle-group" : "toggle", options),
        names: [primitive],
      },
      { source: "./variants.js", names: group.variants.map((v) => v.name) },
    ],
    publicTypes: isRoot
      ? `export type ToggleGroupProps=ComponentProps<typeof ToggleGroupRoot> & {variant?:"default"|"outline";size?:"sm"|"md"|"lg";spacing?:number};`
      : `type PrimitiveProps=ComponentProps<typeof ToggleRoot>;
type StyledProps<T>=T extends unknown?${isSolo ? "T & VariantProps<typeof toggle>" : 'Omit<T,"syncGroup"> & {variant?:"default"|"outline"}'}:never;
export type ${component.exportName}Props=StyledProps<PrimitiveProps>;`,
    destructure: [
      ...component.destructure.props.filter(
        (prop) => supportsSvelteScope(prop.targetScopes) && prop.name !== model,
      ),
      { name: model, defaultValue: "$bindable()" },
      { name: model, alias: "commandValue" },
      { name: "ref" },
      { name: isRoot ? "onValueChange" : "onPressedChange" },
      { name: "children" },
    ],
    rest: component.destructure.rest,
    setup: [
      isRoot
        ? `const copy=(next:string[]|undefined)=>next===undefined?undefined:[...next];
const equal=(a:string[]|undefined,b:string[]|undefined)=>a===b||a!==undefined&&b!==undefined&&a.length===b.length&&a.every((item,index)=>item===b[index]);
let observedCommand=untrack(()=>copy(commandValue));
$effect(()=>{const next=copy(commandValue);untrack(()=>{if(equal(next,observedCommand))return;observedCommand=next;if(!equal(next,value))value=next;});});`
        : `let observedCommand=untrack(()=>commandValue);
$effect(()=>{const next=commandValue;untrack(()=>{if(Object.is(next,observedCommand))return;observedCommand=next;if(!Object.is(next,${model}))${model}=next;});});`,
    ],
  };
}
