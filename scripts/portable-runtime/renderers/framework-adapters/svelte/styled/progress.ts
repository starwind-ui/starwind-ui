import type {
  StyledOutputComponent,
  StyledOutputComponentGroup,
} from "../../../styled-output-model/index.js";
import { sveltePrimitiveImport } from "./imports.js";
import { supportsSvelteScope } from "./scope.js";
import type { SvelteStyledComponentProjection, SvelteStyledRenderOptions } from "./types.js";

export function specializeSvelteStyledProgress(
  group: StyledOutputComponentGroup,
  component: StyledOutputComponent,
  options: SvelteStyledRenderOptions,
): Pick<
  SvelteStyledComponentProjection,
  "imports" | "publicTypes" | "destructure" | "rest" | "setup"
> {
  const fail = (detail: string): never => {
    throw new TypeError(`Svelte Styled progress/${component.exportName}: ${detail}.`);
  };
  const [root] = component.render;
  const track = root && "children" in root ? root.children[0] : undefined;
  const indicator = track && "children" in track ? track.children[0] : undefined;
  if (
    component.exportName !== "Progress" ||
    component.render.length !== 1 ||
    root?.type !== "primitive" ||
    root.component !== "progress" ||
    root.part !== "Root" ||
    root.children.length !== 1 ||
    track?.type !== "primitive" ||
    track.component !== "progress" ||
    track.part !== "Track" ||
    track.children.length !== 1 ||
    indicator?.type !== "primitive" ||
    indicator.component !== "progress" ||
    indicator.part !== "Indicator" ||
    !indicator.selfClosing
  )
    return fail("requires the composed Root, Track and Indicator owners");
  const bases = component.props?.extends.filter((entry) => supportsSvelteScope(entry.targetScopes));
  if (
    bases?.length !== 1 ||
    bases[0]?.kind !== "omit-element-attributes" ||
    bases[0].element !== "div" ||
    !bases[0].keys.includes("value")
  )
    return fail("requires native div props and its value omission");
  if (!component.destructure?.rest) return fail("requires native attribute forwarding");
  const fields = component.props!.fields.filter((field) => supportsSvelteScope(field.targetScopes));
  if (fields.some((field) => !["value", "min", "max", "label", "variant"].includes(field.name)))
    return fail("unsupported public field");
  const style = component.variables.find((variable) => variable.name === "indicatorStyle");
  if (
    style?.value.type !== "raw" ||
    style.value.code !==
      "isIndeterminate ? undefined : { transform: `translateX(-${100 - progressPercent}%)` }"
  )
    return fail("requires the contract indicator transform expression");
  const styleAttr = indicator.attrs.find((attr) => attr.name === "style");
  if (styleAttr?.value?.type !== "variable" || styleAttr.value.name !== style.name)
    return fail("requires the contract indicator style owner");
  const percent = component.variables.find((variable) => variable.name === "progressPercent");
  if (percent?.value.type !== "raw")
    return fail("requires the contract progress percent expression");
  percent.value = {
    type: "raw",
    code: `((progressValue: number | null) => { const isIndeterminate = progressValue === null; return ${percent.value.code}; })(progressValue)`,
  };
  style.value = { type: "raw", code: `serializeIndicatorStyle(${style.value.code})` };
  return {
    imports: [
      { source: "svelte", names: ["ComponentProps"], typeOnly: true },
      { source: sveltePrimitiveImport("progress", options), names: ["ProgressRoot"] },
      { source: "tailwind-variants", names: ["cx"] },
      { source: "./variants.js", names: group.variants.map((variant) => variant.name) },
    ],
    publicTypes: `export type ProgressProps = Omit<ComponentProps<typeof ProgressRoot>, "children" | "format" | "locale" | "getAriaValueText"> & { ${fields
      .filter((field) => ["label", "variant"].includes(field.name))
      .map((field) => `${field.name}${field.optional ? "?" : ""}: ${field.type};`)
      .join(" ")} };`,
    destructure: component.destructure.props.filter((prop) =>
      supportsSvelteScope(prop.targetScopes),
    ),
    rest: component.destructure.rest,
    setup: [
      'function serializeIndicatorStyle(style: { transform: string } | undefined): string | undefined { return style ? "transform: " + style.transform : undefined; }',
    ],
  };
}
