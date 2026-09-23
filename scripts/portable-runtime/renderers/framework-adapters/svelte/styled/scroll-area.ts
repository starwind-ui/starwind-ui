import type {
  StyledOutputComponent,
  StyledOutputComponentGroup,
} from "../../../styled-output-model/index.js";
import { sveltePrimitiveImport } from "./imports.js";
import { supportsSvelteScope } from "./scope.js";
import type { SvelteStyledComponentProjection, SvelteStyledRenderOptions } from "./types.js";

export function specializeSvelteStyledScrollArea(
  group: StyledOutputComponentGroup,
  component: StyledOutputComponent,
  options: SvelteStyledRenderOptions,
): Pick<
  SvelteStyledComponentProjection,
  "imports" | "publicTypes" | "destructure" | "rest" | "setup"
> {
  const part = (
    {
      ScrollArea: "Root",
      ScrollAreaViewport: "Viewport",
      ScrollAreaContent: "Content",
      ScrollBar: "Scrollbar",
      ScrollAreaThumb: "Thumb",
      ScrollAreaCorner: "Corner",
    } as Record<string, string>
  )[component.exportName];
  const fail = (detail: string): never => {
    throw new TypeError(`Svelte Styled scroll-area/${component.exportName}: ${detail}.`);
  };
  if (!group.styles || group.styles.importFrom.join(",") !== "ScrollArea,ScrollAreaViewport")
    return fail("requires the contract stylesheet on Root and Viewport");
  const [owner] = component.render;
  if (
    !part ||
    component.render.length !== 1 ||
    owner?.type !== "primitive" ||
    owner.component !== "scroll-area" ||
    owner.part !== part
  )
    return fail("requires its contract Primitive owner");
  if (!component.destructure?.rest || !owner.attrs.some((attr) => attr.name === "spread"))
    return fail("requires native attribute forwarding");
  const bases = component.props?.extends.filter((entry) => supportsSvelteScope(entry.targetScopes));
  if (bases?.length !== 1 || bases[0]?.kind !== "element-attributes" || bases[0].element !== "div")
    return fail("requires native div props");
  const fields = component.props!.fields.filter((field) => supportsSvelteScope(field.targetScopes));
  const allowed =
    part === "Root"
      ? ["overflowEdgeThreshold"]
      : part === "Scrollbar"
        ? ["keepMounted", "orientation"]
        : [];
  if (fields.some((field) => !allowed.includes(field.name)))
    return fail("unsupported public field");
  const props = component.destructure.props.filter((prop) =>
    supportsSvelteScope(prop.targetScopes),
  );
  props.push({ name: "children" });
  if (part === "Root") {
    const [viewport, scrollbar, corner] = owner.children;
    if (
      owner.children.length !== 3 ||
      viewport?.type !== "primitive" ||
      viewport.part !== "Viewport" ||
      viewport.children[0]?.type !== "primitive" ||
      viewport.children[0].part !== "Content" ||
      scrollbar?.type !== "slot" ||
      scrollbar.name !== "scrollbar" ||
      corner?.type !== "primitive" ||
      corner.part !== "Corner"
    )
      return fail("requires composed viewport, content, scrollbar snippet and corner");
    const viewportClass = viewport.attrs.find(
      (attr) => attr.name === "class" && attr.targetScopes?.includes("vue"),
    );
    if (!viewportClass) return fail("requires the contract viewport class");
    viewportClass.targetScopes = ["svelte"];
    owner.children[0] = {
      type: "condition",
      condition: "autoViewport",
      then: [viewport],
      else: [{ type: "slot", fallback: [] }],
    };
    props.push(
      { name: "autoViewport", defaultValue: "true" },
      { name: "viewportClass" },
      { name: "scrollbar" },
    );
  }
  return {
    imports: [
      { source: "svelte", names: ["ComponentProps", "Snippet"], typeOnly: true },
      {
        source: sveltePrimitiveImport("scroll-area", options),
        names: [`ScrollArea${part} as PrimitivePart`],
      },
      { source: "tailwind-variants", names: ["cx"] },
      { source: "./variants.js", names: group.variants.map((variant) => variant.name) },
    ],
    publicTypes: `export type ${component.exportName}Props = ComponentProps<typeof PrimitivePart>${part === "Root" ? " & { autoViewport?: boolean; viewportClass?: string; scrollbar?: Snippet }" : ""};`,
    destructure: props,
    rest: component.destructure.rest,
    setup: [],
  };
}
