import type {
  StyledOutputComponent,
  StyledOutputComponentGroup,
  StyledOutputRenderNode,
} from "../../../styled-output-model/index.js";
import { sveltePrimitiveImport } from "./imports.js";
import { supportsSvelteScope } from "./scope.js";
import type { SvelteStyledComponentProjection, SvelteStyledRenderOptions } from "./types.js";

/** Bind the accepted Primitive model directly so undefined inputs and synchronous readback survive. */
export function specializeSvelteStyledCheckbox(
  group: StyledOutputComponentGroup,
  component: StyledOutputComponent,
  options: SvelteStyledRenderOptions,
): Pick<
  SvelteStyledComponentProjection,
  "imports" | "publicTypes" | "destructure" | "rest" | "setup"
> {
  const fail = (detail: string): never => {
    throw new TypeError(
      `Svelte Styled ${group.component}/${component.exportName}.svelte: ${detail}.`,
    );
  };
  const inherited = (component.props?.extends ?? []).filter((entry) =>
    supportsSvelteScope(entry.targetScopes),
  );
  const variants = inherited.filter((entry) => entry.kind === "variant-props");
  if (
    !inherited.some(
      (entry) => entry.kind === "omit-element-attributes" && entry.element === "span",
    ) ||
    inherited.length !== variants.length + 1
  )
    fail("Checkbox requires its native prop contract");
  const fields = (component.props?.fields ?? []).filter((field) =>
    supportsSvelteScope(field.targetScopes),
  );
  if (!fields.some((field) => field.name === "checked" && field.type === "boolean"))
    fail("Checkbox requires its boolean checked model");
  for (const entry of component.imports.filter((entry) => supportsSvelteScope(entry.targetScopes)))
    if (!entry.svg) fail(`unsupported Checkbox import "${entry.source}"`);
  component.imports = [];
  const props = (component.destructure?.props ?? []).filter((prop) =>
    supportsSvelteScope(prop.targetScopes),
  );
  const rest = component.destructure?.rest;
  if (!rest) return fail("Checkbox requires a native attribute rest binding");
  let roots = 0;
  function wire(nodes: StyledOutputRenderNode[]) {
    for (const node of nodes) {
      if (node.type === "primitive" && node.component === "checkbox" && node.part === "Root") {
        roots++;
        node.attrs = node.attrs.filter(
          (attr) => attr.name !== "nativeButton" && attr.name !== "ref",
        );
        for (const name of ["onCheckedChange", "spread", "aria-label"]) {
          const attr = node.attrs.find(
            (entry) => entry.name === name && entry.targetScopes?.includes("react"),
          );
          if (!attr) fail(`Checkbox is missing its ${name} forwarding contract`);
          attr!.targetScopes = ["svelte"];
          if (name === "spread")
            attr!.value = {
              type: "raw",
              code: "({ ...rest, nativeButton, ref } as PrimitiveProps)",
            };
        }
      }
      if (node.type === "element" && node.tag === "label") {
        const attr = node.attrs.find((entry) => entry.name === "for");
        if (!attr) fail("Checkbox is missing its label association");
        attr!.targetScopes = ["svelte"];
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
  if (roots !== 1) fail("Checkbox requires one Primitive root");
  return {
    imports: [
      { source: "svelte", names: ["ComponentProps"], typeOnly: true },
      { source: "tailwind-variants", names: ["VariantProps"], typeOnly: true },
      { source: "tailwind-variants", names: ["cx"] },
      { source: sveltePrimitiveImport("checkbox", options), names: ["CheckboxRoot"] },
      { source: "./variants.js", names: group.variants.map((variant) => variant.name) },
    ],
    publicTypes: `type PrimitiveProps = ComponentProps<typeof CheckboxRoot>;
type WithStyledProps<T> = T extends unknown ? Omit<T, "children"> & ${variants.map((variant) => `VariantProps<typeof ${variant.variant}>`).join(" & ")} & { label?: string } : never;
export type ${component.exportName}Props = WithStyledProps<PrimitiveProps>;`,
    destructure: [
      ...props,
      { name: "checked", defaultValue: "$bindable()" },
      { name: "onCheckedChange" },
      { name: "ref" },
    ],
    rest,
    setup: [],
  };
}
