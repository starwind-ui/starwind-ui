import type {
  StyledOutputComponent,
  StyledOutputComponentGroup,
} from "../../../styled-output-model/index.js";
import { sveltePrimitiveImport } from "./imports.js";
import { supportsSvelteScope } from "./scope.js";
import type { SvelteStyledComponentProjection, SvelteStyledRenderOptions } from "./types.js";

export function specializeSvelteStyledDropzone(
  group: StyledOutputComponentGroup,
  component: StyledOutputComponent,
  options: SvelteStyledRenderOptions,
): Pick<
  SvelteStyledComponentProjection,
  "imports" | "publicTypes" | "destructure" | "rest" | "setup"
> {
  const part = (
    {
      Dropzone: "Root",
      DropzoneFilesList: "FilesList",
      DropzoneLoadingIndicator: "LoadingIndicator",
      DropzoneUploadIndicator: "UploadIndicator",
    } as Record<string, string>
  )[component.exportName];
  const [owner] = component.render;
  if (
    !part ||
    component.render.length !== 1 ||
    owner?.type !== "primitive" ||
    owner.component !== "dropzone" ||
    owner.part !== part ||
    !component.destructure?.rest
  )
    throw new TypeError(
      "Styled Dropzone requires its contracted Primitive owner and native forwarding.",
    );
  component.imports = [];
  const props = component.destructure.props.filter((prop) =>
    supportsSvelteScope(prop.targetScopes),
  );
  if (part === "Root") {
    for (const name of ["ref", "onFilesChange"]) {
      const attr = owner.attrs.find((attr) => attr.name === name);
      if (!attr) throw new TypeError(`Styled Dropzone requires its ${name} contract.`);
      attr.targetScopes = ["svelte"];
      props.push({ name });
    }
    const inputs = owner.children.filter(
      (node) => node.type === "primitive" && node.part === "Input",
    );
    if (
      inputs.length !== 1 ||
      !owner.children.some((node) => node.type === "slot" && node.fallback.length === 3)
    )
      throw new TypeError(
        "Styled Dropzone requires one native input beside its default content slot.",
      );
  }
  if (part !== "FilesList") props.push({ name: "children" });
  return {
    imports: [
      { source: "svelte", names: ["ComponentProps", "Snippet"], typeOnly: true },
      { source: "tailwind-variants", names: ["cx"] },
      {
        source: sveltePrimitiveImport("dropzone", options),
        names: [
          `Dropzone${part} as PrimitivePart`,
          ...(part === "Root" ? ["DropzoneInput as NativeInput"] : []),
        ],
      },
      { source: "./variants.js", names: group.variants.map((variant) => variant.name) },
    ],
    publicTypes:
      part === "Root"
        ? `export type DropzoneProps = Omit<ComponentProps<typeof NativeInput>, "ref" | "id"> & Pick<ComponentProps<typeof PrimitivePart>, "disabled" | "isUploading" | "onFilesChange" | "ref"> & { children?: Snippet; id?: string };`
        : `export type ${component.exportName}Props = ComponentProps<typeof PrimitivePart>;`,
    destructure: props,
    rest: component.destructure.rest,
    setup: [],
  };
}
