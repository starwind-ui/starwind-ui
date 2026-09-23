import type {
  StyledOutputComponent,
  StyledOutputComponentGroup,
  StyledOutputRenderNode,
} from "../../../styled-output-model/index.js";
import { sveltePrimitiveImport } from "./imports.js";
import { renderSvelteStyledValue } from "./render.js";
import { supportsSvelteScope } from "./scope.js";
import type { SvelteStyledComponentProjection, SvelteStyledRenderOptions } from "./types.js";
export function specializeSvelteStyledSwitch(
  group: StyledOutputComponentGroup,
  component: StyledOutputComponent,
  options: SvelteStyledRenderOptions,
): Pick<
  SvelteStyledComponentProjection,
  "imports" | "publicTypes" | "destructure" | "rest" | "setup"
> {
  const fail = (message: string): never => {
    throw new TypeError(`Svelte Styled Switch: ${message}.`);
  };
  if (component.exportName !== "Switch" || !component.destructure?.rest)
    fail("requires its Switch component and rest props");
  const inherited =
    component.props?.extends?.filter((entry) => supportsSvelteScope(entry.targetScopes)) ?? [];
  if (
    !inherited.some(
      (entry) => entry.kind === "omit-element-attributes" && entry.element === "button",
    )
  )
    fail("requires native button props");
  const variants = inherited.filter((entry) => entry.kind === "variant-props");
  let roots = 0,
    thumbs = 0;
  function wire(nodes: StyledOutputRenderNode[]) {
    for (const node of nodes) {
      if (node.type === "primitive" && node.component === "switch") {
        if (node.part === "Root") {
          roots++;
          node.attrs = node.attrs.filter((attr) => attr.name !== "checked");
          for (const name of ["ref", "onCheckedChange"]) {
            const attr = node.attrs.find((entry) => entry.name === name);
            if (!attr) fail(`missing ${name} contract`);
            attr!.targetScopes = ["svelte"];
          }
        } else if (node.part === "Thumb") thumbs++;
        const style = node.attrs.find(
          (entry) => entry.name === "style" && entry.targetScopes?.includes("astro"),
        );
        if (!style) fail("missing style variables");
        style!.targetScopes = ["svelte"];
      }
      if (node.type === "element" && node.tag === "label") {
        const attr = node.attrs.find((entry) => entry.name === "for");
        if (!attr) fail("missing label association");
        attr!.targetScopes = ["svelte"];
      }
      if ("children" in node) wire(node.children);
      if (node.type === "condition") {
        wire(node.then);
        wire(node.else);
      }
    }
  }
  wire(component.render);
  if (roots !== 1 || thumbs !== 1) fail("requires one native-button Root and Thumb");
  for (const variable of component.variables) {
    if (["switchStyle", "thumbStyle"].includes(variable.name)) {
      if (variable.value.type !== "object")
        throw new TypeError("Svelte Styled Switch requires contract style object.");
      variable.value.entries = Object.fromEntries(
        Object.entries(variable.value.entries).map(([key, value]) => [
          key.startsWith('"') ? (JSON.parse(key) as string) : key,
          value,
        ]),
      );
      variable.value = {
        type: "raw",
        code: `Object.entries(${renderSvelteStyledValue(variable.value)}).map(([key, value]) => key + ":" + value).join(";")`,
      };
    }
  }
  return {
    imports: [
      { source: "svelte", names: ["ComponentProps"], typeOnly: true },
      { source: "tailwind-variants", names: ["VariantProps"], typeOnly: true },
      { source: "tailwind-variants", names: ["cx"] },
      { source: sveltePrimitiveImport("switch", options), names: ["SwitchRoot"] },
      { source: "./variants.js", names: group.variants.map((variant) => variant.name) },
    ],
    publicTypes: `type NativeProps=Extract<ComponentProps<typeof SwitchRoot>,{nativeButton:true}>;
export type SwitchProps=Omit<NativeProps,"nativeButton"|"children"|"id"> & ${variants.map((variant) => `VariantProps<typeof ${variant.variant}>`).join(" & ")} & {id:string;label?:string;padding?:number};`,
    destructure: [
      ...component.destructure!.props.filter(
        (prop) => supportsSvelteScope(prop.targetScopes) && prop.name !== "checked",
      ),
      { name: "checked", defaultValue: "$bindable()" },
      { name: "ref" },
      { name: "onCheckedChange" },
    ],
    rest: component.destructure!.rest,
    setup: [],
  };
}
