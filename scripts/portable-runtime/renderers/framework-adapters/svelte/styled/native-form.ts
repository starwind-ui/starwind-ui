import type {
  StyledOutputComponent,
  StyledOutputComponentGroup,
} from "../../../styled-output-model/index.js";
import { specializeSvelteStyledNative } from "./native.js";
import { supportsSvelteScope } from "./scope.js";

/** The select's shell and icon stay contract-owned. Its inner control owns native wiring. */
export function specializeSvelteStyledNativeForm(
  group: StyledOutputComponentGroup,
  component: StyledOutputComponent,
) {
  const fail = (detail: string): never => {
    throw new TypeError(
      `Svelte Styled ${group.component}/${component.exportName}.svelte: ${detail}.`,
    );
  };
  if (
    group.component === "textarea" &&
    !(component.props?.extends ?? []).some(
      (base) =>
        base.kind === "omit-element-attributes" &&
        base.element === "textarea" &&
        base.keys.includes("children"),
    )
  )
    return fail("requires textarea children omission");
  if (group.component !== "native-select" || component.exportName !== "NativeSelect") {
    const projection = specializeSvelteStyledNative(group, component);
    if (group.component === "native-select") {
      const root = component.render[0];
      if (root?.type !== "element") return fail("requires a native option owner");
      const classes = root.attrs.find((attr) => attr.name === "class")?.value;
      if (classes?.type !== "class-join") return fail("requires native option class composition");
      classes.items = classes.items.map((item) =>
        item.type === "variable" && item.name === "className"
          ? { type: "raw", code: "cx(className)" }
          : item,
      );
    }
    return projection;
  }
  const [wrapper] = component.render;
  if (
    component.render.length !== 1 ||
    wrapper?.type !== "element" ||
    wrapper.tag !== "div" ||
    wrapper.tagBinding ||
    wrapper.children.length !== 2
  )
    return fail("requires the native select shell and icon");
  const attrs = wrapper.attrs.filter((attr) => supportsSvelteScope(attr.targetScopes));
  if (
    attrs
      .map((attr) => attr.name)
      .sort()
      .join(",") !== "class,data-size,data-slot" ||
    !attrs.every(
      (attr) =>
        (attr.name === "class" &&
          attr.value?.type === "class-variant" &&
          attr.value.variant === "nativeSelectWrapper") ||
        (attr.name === "data-size" &&
          attr.value?.type === "variable" &&
          attr.value.name === "size") ||
        (attr.name === "data-slot" &&
          attr.value?.type === "literal" &&
          attr.value.value === "native-select-wrapper"),
    )
  )
    return fail("select shell must own only its contract classes, size and slot");
  const [select, icon] = wrapper.children;
  if (
    select?.type !== "element" ||
    select.tag !== "select" ||
    icon?.type !== "slot" ||
    icon.name !== "icon" ||
    icon.fallback.length !== 1 ||
    icon.fallback[0]?.type !== "icon" ||
    !icon.fallback[0].asset
  )
    return fail("requires the inner select and projected icon fallback");
  const bases = component.props?.extends ?? [];
  if (
    !bases.some(
      (base) =>
        base.kind === "omit-element-attributes" &&
        base.element === "select" &&
        base.keys.includes("size"),
    )
  )
    return fail("requires native select size omission");
  for (const entry of component.imports.filter((entry) => supportsSvelteScope(entry.targetScopes)))
    if (!entry.svg) return fail("requires projected SVG imports");
  component.imports = [];
  component.render = [select];
  const result = specializeSvelteStyledNative(group, component);
  component.render = [wrapper];
  const variants = result.imports.find((entry) => entry.source === "./variants.js")!;
  variants.names.push("nativeSelectWrapper", "nativeSelectIcon");
  return result;
}
