import type {
  StyledOutputComponent,
  StyledOutputComponentGroup,
} from "../../../styled-output-model/index.js";
import { sveltePrimitiveImport } from "./imports.js";
import { supportsSvelteScope } from "./scope.js";
import type { SvelteStyledComponentProjection, SvelteStyledRenderOptions } from "./types.js";

export function specializeSvelteStyledInput(
  group: StyledOutputComponentGroup,
  component: StyledOutputComponent,
  options: SvelteStyledRenderOptions,
): Pick<
  SvelteStyledComponentProjection,
  "imports" | "publicTypes" | "destructure" | "rest" | "setup"
> {
  const [root] = component.render;
  if (
    component.exportName !== "Input" ||
    component.render.length !== 1 ||
    root?.type !== "primitive" ||
    root.component !== "input" ||
    root.part !== "Root" ||
    !root.selfClosing ||
    !component.destructure?.rest
  )
    throw new TypeError("Styled Input requires its native Primitive root and forwarding contract.");
  root.attrs = root.attrs.filter((attr) => attr.name !== "value");
  for (const name of ["onValueChange", "ref"]) {
    const attr = root.attrs.find((attr) => attr.name === name);
    if (!attr) throw new TypeError(`Styled Input requires ${name} forwarding.`);
    attr.targetScopes = ["svelte"];
  }
  return {
    imports: [
      { source: "svelte", names: ["ComponentProps"], typeOnly: true },
      { source: "svelte", names: ["untrack"] },
      { source: "tailwind-variants", names: ["VariantProps"], typeOnly: true },
      { source: "tailwind-variants", names: ["cx"] },
      { source: sveltePrimitiveImport("input", options), names: ["InputRoot"] },
      { source: "./variants.js", names: group.variants.map((variant) => variant.name) },
    ],
    publicTypes:
      'export type InputProps = Omit<ComponentProps<typeof InputRoot>, "size"> & VariantProps<typeof input>;',
    destructure: [
      ...component.destructure.props.filter(
        (prop) => supportsSvelteScope(prop.targetScopes) && prop.name !== "value",
      ),
      { name: "value", defaultValue: "$bindable()" },
      { name: "value", alias: "commandValue" },
      { name: "onValueChange" },
      { name: "ref" },
    ],
    rest: component.destructure.rest,
    setup: [
      `// Keep incoming commands observable after the bindable model publishes locally.
const copyCommand = (next: InputProps["value"]) => Array.isArray(next) ? [...next] : next;
let observedCommand = untrack(() => copyCommand(commandValue));
$effect(() => {
  const next = copyCommand(commandValue);
  untrack(() => {
    const previous = observedCommand;
    if (Array.isArray(next) && Array.isArray(previous) ? next.length === previous.length && next.every((entry, index) => entry === previous[index]) : Object.is(next, previous)) return;
    observedCommand = next;
    const current = value;
    if (Array.isArray(next) && Array.isArray(current) ? next.length === current.length && next.every((entry, index) => entry === current[index]) : Object.is(next, current)) return;
    value = next;
  });
});`,
    ],
  };
}
