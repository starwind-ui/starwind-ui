import { initializeThemeControl } from "../../../shared-recipes/passive/theme-toggle.js";
import type {
  StyledOutputComponent,
  StyledOutputComponentGroup,
} from "../../../styled-output-model/index.js";
import { sveltePrimitiveImport } from "./imports.js";
import { supportsSvelteScope } from "./scope.js";
import type { SvelteStyledComponentProjection, SvelteStyledRenderOptions } from "./types.js";

/** The document owner destroys Theme. A mounted control only discovers and synchronizes controls. */
export function specializeSvelteStyledThemeToggle(
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
  const native = inherited.find(
    (entry) => entry.kind === "omit-element-attributes" && entry.element === "button",
  );
  const variants = inherited.filter((entry) => entry.kind === "variant-props");
  if (
    !native ||
    native.kind !== "omit-element-attributes" ||
    inherited.length !== variants.length + 1
  ) {
    return fail("Theme Toggle requires its native button prop contract");
  }
  if (
    component.client?.effects.join("\n") !== initializeThemeControl() ||
    component.client.effectDependencies
  ) {
    fail("unsupported Theme client behavior");
  }
  for (const entry of component.imports.filter((entry) =>
    supportsSvelteScope(entry.targetScopes),
  )) {
    if (!entry.svg) fail(`unsupported Theme import "${entry.source}"`);
  }
  component.client = undefined;
  component.imports = [];
  const fields = (component.props?.fields ?? []).filter((entry) =>
    supportsSvelteScope(entry.targetScopes),
  );
  const props = (component.destructure?.props ?? []).filter((entry) =>
    supportsSvelteScope(entry.targetScopes),
  );
  const rest = component.destructure?.rest;
  if (!rest) return fail("Theme Toggle requires a native attribute rest binding");
  const root = component.render[0];
  if (component.render.length !== 1 || root?.type !== "element" || root.tag !== "button") {
    return fail("Theme Toggle requires one native button owner");
  }
  for (const attr of root.attrs) {
    if (attr.name === "spread" && attr.value?.type === "variable" && attr.value.name === rest) {
      attr.value = { type: "variable", name: "nativeProps" };
    }
  }
  const omitted = [
    ...new Set([...native.keys, "class", "children", ...fields.map((field) => field.name)]),
  ];
  return {
    imports: [
      { source: "svelte", names: ["Snippet"], typeOnly: true },
      { source: "svelte", names: ["untrack"] },
      { source: "svelte/elements", names: ["HTMLButtonAttributes", "ClassValue"], typeOnly: true },
      { source: "tailwind-variants", names: ["VariantProps"], typeOnly: true },
      { source: "tailwind-variants", names: ["cx"] },
      { source: sveltePrimitiveImport("theme", options), names: ["initThemeController"] },
      { source: "./variants.js", names: group.variants.map((variant) => variant.name) },
    ],
    publicTypes: `export type ${component.exportName}Props = Omit<HTMLButtonAttributes, ${omitted.map((name) => JSON.stringify(name)).join(" | ")}> & ${variants.map((variant) => `VariantProps<typeof ${variant.variant}>`).join(" & ")} & {
${fields.map((field) => `  ${JSON.stringify(field.name)}${field.optional ? "?" : ""}: ${field.type};`).join("\n")}
  class?: ClassValue;
  children?: Snippet;
  lightIcon?: Snippet;
  darkIcon?: Snippet;
  ref?: (element: HTMLButtonElement | null) => void;
};`,
    destructure: [
      ...props,
      { name: "children" },
      { name: "lightIcon" },
      { name: "darkIcon" },
      { name: "ref" },
    ],
    rest,
    setup: [
      `let nativeProps = $derived({ ...${rest} } as HTMLButtonAttributes);
function attachTheme(element: HTMLButtonElement): void {
  ${initializeThemeControl("element.ownerDocument")}
  $effect(() => {
    const callback = ref;
    untrack(() => callback?.(element));
    return () => untrack(() => callback?.(null));
  });
}`,
    ],
  };
}
