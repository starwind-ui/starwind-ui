import type {
  StyledOutputComponent,
  StyledOutputComponentGroup,
  StyledOutputRenderNode,
} from "../../../styled-output-model/index.js";
import { sveltePrimitiveImport } from "./imports.js";
import { supportsSvelteScope } from "./scope.js";
import type { SvelteStyledComponentProjection, SvelteStyledRenderOptions } from "./types.js";

export function specializeSvelteStyledSlider(
  group: StyledOutputComponentGroup,
  component: StyledOutputComponent,
  options: SvelteStyledRenderOptions,
): Pick<
  SvelteStyledComponentProjection,
  "imports" | "publicTypes" | "destructure" | "rest" | "setup" | "initialization"
> {
  const [root] = component.render;
  if (
    component.exportName !== "Slider" ||
    component.render.length !== 1 ||
    root?.type !== "primitive" ||
    root.component !== "slider" ||
    root.part !== "Root" ||
    !component.destructure?.rest
  )
    throw new TypeError("Styled Slider requires its contracted Root and native forwarding.");
  // An omitted default preserves the Primitive initial-model reset seed.
  const props = component.destructure.props
    .filter((prop) => supportsSvelteScope(prop.targetScopes) && prop.name !== "value")
    .map((prop) => (prop.name === "defaultValue" ? { ...prop, defaultValue: undefined } : prop));
  root.attrs = root.attrs.filter((attr) => attr.name !== "value");
  for (const name of ["onValueChange", "onValueCommitted", "ref"]) {
    const attr = root.attrs.find((attr) => attr.name === name);
    if (!attr) throw new TypeError(`Styled Slider requires its ${name} forwarding.`);
    attr.targetScopes = ["svelte"];
    props.push({ name });
  }
  props.push(
    { name: "value", defaultValue: "$bindable()" },
    { name: "value", alias: "commandValue" },
  );
  const resolved = component.variables.find((variable) => variable.name === "resolvedValue");
  const range = component.variables.find((variable) => variable.name === "rangeStyle");
  if (!resolved || !range)
    throw new TypeError("Styled Slider requires its contracted value and range expressions.");
  resolved.value = { type: "raw", code: "value ?? retainedValue" };
  range.value = {
    type: "raw",
    code: 'orientation === "horizontal" ? `left: ${rangeStart}%; width: ${rangeEnd - rangeStart}%` : `bottom: ${rangeStart}%; height: ${rangeEnd - rangeStart}%`',
  };
  function visit(node: StyledOutputRenderNode): void {
    if (node.type === "primitive" && node.component === "slider" && node.part === "Thumb") {
      const style = node.attrs.find((attr) => attr.name === "style");
      if (!style) throw new TypeError("Styled Slider requires its contracted thumb position.");
      style.value = {
        type: "raw",
        code: 'orientation === "horizontal" ? `left: ${getPercentage(values[index] ?? min)}%` : `bottom: ${getPercentage(values[index] ?? min)}%`',
      };
    }
    if ("children" in node) node.children.forEach(visit);
  }
  root.children.forEach(visit);
  return {
    imports: [
      { source: "svelte", names: ["ComponentProps"], typeOnly: true },
      { source: "svelte", names: ["untrack"] },
      { source: "tailwind-variants", names: ["VariantProps"], typeOnly: true },
      { source: "tailwind-variants", names: ["cx"] },
      { source: sveltePrimitiveImport("slider", options), names: ["SliderRoot as PrimitiveRoot"] },
      { source: sveltePrimitiveImport("slider", options), names: ["SliderValue"], typeOnly: true },
      { source: "./variants.js", names: group.variants.map((variant) => variant.name) },
    ],
    publicTypes:
      'export type SliderProps = Omit<ComponentProps<typeof PrimitiveRoot>, "children" | "minStepsBetweenValues"> & VariantProps<typeof sliderRange> & VariantProps<typeof sliderThumb>;',
    destructure: props,
    rest: component.destructure.rest,
    initialization: [
      `const copy = (next: SliderValue | undefined) => Array.isArray(next) ? [...next] : next;
let retainedValue = $state<SliderValue>(untrack(() => copy(value ?? defaultValue ?? 0)!));`,
    ],
    setup: [
      `const equal = (left: SliderValue | undefined, right: SliderValue | undefined) => Array.isArray(left) && Array.isArray(right) ? left.length === right.length && left.every((value, index) => Object.is(value, right[index])) : Object.is(left, right);
let observedCommand = untrack(() => copy(commandValue));
$effect(() => {
  const next = copy(commandValue);
  untrack(() => {
    if (equal(next, observedCommand)) return;
    observedCommand = copy(next);
    if (!equal(next, value)) value = copy(next);
  });
});
$effect(() => {
  const next = copy(value);
  if (next !== undefined) retainedValue = next;
});`,
    ],
  };
}
