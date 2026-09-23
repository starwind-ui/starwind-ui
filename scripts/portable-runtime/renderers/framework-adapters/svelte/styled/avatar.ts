import type {
  StyledOutputComponent,
  StyledOutputComponentGroup,
} from "../../../styled-output-model/index.js";
import { sveltePrimitiveImport } from "./imports.js";
import { supportsSvelteScope } from "./scope.js";
import type { SvelteStyledComponentProjection, SvelteStyledRenderOptions } from "./types.js";

export function specializeSvelteStyledAvatar(
  group: StyledOutputComponentGroup,
  component: StyledOutputComponent,
  options: SvelteStyledRenderOptions,
): Pick<
  SvelteStyledComponentProjection,
  "imports" | "publicTypes" | "destructure" | "rest" | "setup"
> {
  const part = (
    { Avatar: "Root", AvatarImage: "Image", AvatarFallback: "Fallback" } as Record<string, string>
  )[component.exportName];
  const fail = (message: string): never => {
    throw new TypeError(`Svelte Styled avatar/${component.exportName}: ${message}.`);
  };
  if (!part) return fail("missing part owner");
  const [owner] = component.render;
  if (
    component.render.length !== 1 ||
    owner?.type !== "primitive" ||
    owner.component !== "avatar" ||
    owner.part !== part
  )
    return fail("requires the contract Primitive owner");
  if (!component.destructure?.rest || !owner.attrs.some((attr) => attr.name === "spread"))
    return fail("requires attribute forwarding");
  const native = component.props?.extends.filter(
    (entry) => supportsSvelteScope(entry.targetScopes) && entry.kind !== "variant-props",
  );
  if (
    native?.length !== 1 ||
    !("element" in native[0]!) ||
    native[0]!.element !== (part === "Image" ? "img" : "span")
  )
    return fail("requires native part props");
  const variants =
    component.props?.extends
      .filter((entry) => entry.kind === "variant-props")
      .filter((entry) => supportsSvelteScope(entry.targetScopes)) ?? [];
  const props = component.destructure.props.filter((prop) =>
    supportsSvelteScope(prop.targetScopes),
  );
  if (part === "Image") {
    for (const name of ["alt", "onLoadingStatusChange"]) {
      const attr = owner.attrs.find(
        (entry) => entry.name === name && entry.targetScopes?.includes("vue"),
      );
      if (!attr) return fail(`missing ${name} forwarding`);
      attr.targetScopes = ["svelte"];
      props.push({ name });
    }
  } else props.push({ name: "children" });
  return {
    imports: [
      { source: "svelte", names: ["ComponentProps"], typeOnly: true },
      {
        source: sveltePrimitiveImport("avatar", options),
        names: [part === "Root" ? "AvatarRoot" : `Avatar${part} as PrimitivePart`],
      },
      { source: "tailwind-variants", names: ["VariantProps"], typeOnly: true },
      { source: "tailwind-variants", names: ["cx"] },
      { source: "./variants.js", names: group.variants.map((variant) => variant.name) },
    ],
    publicTypes: `export type ${component.exportName}Props = ComponentProps<typeof ${part === "Root" ? "AvatarRoot" : "PrimitivePart"}>${variants.map((variant) => ` & VariantProps<typeof ${variant.variant}>`).join("")};`,
    destructure: props,
    rest: component.destructure.rest,
    setup: [],
  };
}
