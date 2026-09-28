import type {
  StyledOutputComponent,
  StyledOutputComponentGroup,
} from "../../../styled-output-model/index.js";
import { sveltePrimitiveImport } from "./imports.js";
import { supportsSvelteScope } from "./scope.js";
import type { SvelteStyledComponentProjection, SvelteStyledRenderOptions } from "./types.js";

export function specializeSvelteStyledCheckboxGroup(
  group: StyledOutputComponentGroup,
  component: StyledOutputComponent,
  options: SvelteStyledRenderOptions,
): Pick<
  SvelteStyledComponentProjection,
  "imports" | "publicTypes" | "destructure" | "rest" | "setup"
> {
  const [root] = component.render;
  if (
    component.exportName !== "CheckboxGroup" ||
    component.render.length !== 1 ||
    root?.type !== "primitive" ||
    root.component !== "checkbox-group" ||
    root.part !== "Root" ||
    !component.destructure?.rest
  )
    throw new TypeError(
      "Styled Checkbox Group requires its Primitive Root and forwarding contract.",
    );
  root.attrs = root.attrs.filter((attr) => attr.name !== "value");
  for (const name of ["onValueChange", "ref"]) {
    const attr = root.attrs.find((attr) => attr.name === name);
    if (!attr) throw new TypeError(`Styled Checkbox Group requires ${name} forwarding.`);
    attr.targetScopes = ["svelte"];
  }
  return {
    imports: [
      { source: "svelte", names: ["ComponentProps"], typeOnly: true },
      { source: "svelte", names: ["untrack"] },
      { source: "tailwind-variants", names: ["cx"] },
      { source: sveltePrimitiveImport("checkbox-group", options), names: ["CheckboxGroupRoot"] },
      { source: "./variants.js", names: group.variants.map((variant) => variant.name) },
    ],
    publicTypes: "export type CheckboxGroupProps = ComponentProps<typeof CheckboxGroupRoot>;",
    destructure: [
      ...component.destructure.props.filter(
        (prop) => supportsSvelteScope(prop.targetScopes) && prop.name !== "value",
      ),
      { name: "value", defaultValue: "$bindable()" },
      { name: "value", alias: "commandValue" },
      { name: "onValueChange" },
      { name: "ref" },
      { name: "children" },
    ],
    rest: component.destructure.rest,
    setup: [
      `const equal = (left: string[] | undefined, right: string[] | undefined) => left === undefined || right === undefined ? left === right : left.length === right.length && left.every((entry, index) => entry === right[index]);
let observedCommand = untrack(() => commandValue === undefined ? undefined : [...commandValue]);
$effect(() => {
  const next = commandValue === undefined ? undefined : [...commandValue];
  untrack(() => {
    if (equal(next, observedCommand)) return;
    observedCommand = next;
    if (!equal(next, value)) value = next;
  });
});`,
    ],
  };
}
