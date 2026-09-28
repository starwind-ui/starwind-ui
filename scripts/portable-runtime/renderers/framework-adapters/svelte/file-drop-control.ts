import {
  dropzoneConnection,
  dropzoneIndicatorHidden,
  dropzoneInitialState,
  dropzoneTabIndex,
} from "../../shared-recipes/structured/file-controls/dropzone-recipe.js";
import type {
  AdapterComponentFile,
  AdapterFileDropControlFacts,
  AdapterFileDropControlPartName,
  AdapterIndexFile,
  AdapterPrintedFile,
} from "../types.js";
import { printSvelteRefAttachment } from "./attachments.js";

export function printSvelteFileDropControlIndex(file: AdapterIndexFile): AdapterPrintedFile {
  if (file.family?.kind !== "file-drop-control")
    throw new TypeError("Dropzone requires file-drop-control facts.");
  const facts = file.family.facts;
  return {
    path: file.path,
    contents: `${facts.index.importMembers.map(({ name, from }) => `import ${name} from "${from}.svelte";`).join("\n")}
const ${facts.exports.namespace} = { ${facts.index.namespaceMembers.map(({ key, name }) => `${key}: ${name}`).join(", ")} };
export { ${facts.exports.namespace}, ${facts.index.importMembers.map(({ name }) => name).join(", ")} };
export default ${facts.exports.namespace};
export type { ${facts.index.typeExports.join(", ")} } from "${facts.runtime.typeImportSource}";
`,
  };
}

export function printSvelteFileDropControlComponent(
  file: AdapterComponentFile,
): AdapterPrintedFile {
  const family = file.component.family;
  if (family?.kind !== "file-drop-control")
    throw new TypeError("Dropzone requires file-drop-control facts.");
  return {
    path: `${file.path}.svelte`,
    contents:
      family.part === "root" ? printRoot(family.facts) : printPart(family.facts, family.part),
  };
}

function printRoot(facts: AdapterFileDropControlFacts): string {
  const connection = dropzoneConnection(facts, {
    read: "readInputs()",
    notify: (files, detail) => `onFilesChange?.(${files}, ${detail});`,
    untrack: (body) => `untrack(() => { ${body} });`,
  });
  return `<script lang="ts">
  import { ${facts.runtime.factory}, type ${facts.event.detailsType} } from "${facts.runtime.importSource}";
  import { untrack, type Snippet } from "svelte";
  import type { Attachment } from "svelte/attachments";
  import { observeFormDiscovery } from "../_internal/form-discovery.js";
  import type { HTMLLabelAttributes } from "svelte/elements";
  type Props = Omit<HTMLLabelAttributes, "children" | "onchange"> & {
    children?: Snippet;
    disabled?: boolean;
    isUploading?: boolean;
    onFilesChange?: (files: File[], detail: ${facts.event.detailsType}) => void;
    ref?: (element: HTMLLabelElement | null) => void;
  };
  let { children, disabled = ${facts.props.disabled.defaultValue}, isUploading = ${facts.props.isUploading.defaultValue}, onFilesChange, ref, ...rest }: Props = $props();
  const readInputs = () => ({ disabled, isUploading });
  ${connection}
  const attachRuntime: Attachment<HTMLLabelElement> = (element) => {
    const connection = untrack(() => connectDropzone(element));
    $effect(() => {
      readInputs();
      untrack(() => connection.update());
    });
    return () => connection.destroy();
  };
${printSvelteRefAttachment("HTMLLabelElement")}
</script>
<label {...rest} ${facts.attrs.root}="" ${facts.attrs.disabled}={disabled ? "" : undefined}
  ${facts.attrs.dragActive}="${dropzoneInitialState.dragActive}" ${facts.attrs.hasFiles}="${dropzoneInitialState.hasFiles}" ${facts.attrs.isUploading}={String(isUploading)}
  ${facts.attrs.ariaDisabled}={disabled} role="${facts.parts.root.role}" tabindex={${dropzoneTabIndex("disabled")}}
  {@attach attachRuntime} {@attach attachRef}>
  {@render children?.()}
</label>
`;
}

function printPart(
  facts: AdapterFileDropControlFacts,
  part: Exclude<AdapterFileDropControlPartName, "root">,
): string {
  const input = part === "input",
    files = part === "filesList";
  const element = input ? "HTMLInputElement" : "HTMLDivElement";
  return `<script lang="ts">
${!input && !files ? '  import type { Snippet } from "svelte";\n' : ""}
  import type { ${input ? "HTMLInputAttributes" : "HTMLAttributes"} } from "svelte/elements";
  type Props = Omit<${input ? "HTMLInputAttributes" : "HTMLAttributes<HTMLDivElement>"}, "children"${input ? ' | "type" | "files"' : ""}> & {
${input ? "    disabled?: boolean;\n" : files ? "" : "    children?: Snippet; isUploading?: boolean;\n"}    ref?: (element: ${element} | null) => void;
  };
  let { ${input ? "disabled = false, class: className," : files ? "" : "children, isUploading = false,"} ref, ...rest }: Props = $props();
${printSvelteRefAttachment(element)}
</script>
${
  input
    ? `<input {...rest} ${facts.attrs.input}="" class={["${facts.fileInput.hiddenClassValue}", className]} ${facts.attrs.disabled}={disabled ? "" : undefined}
  {disabled} type="${facts.fileInput.typeValue}" tabindex="${facts.fileInput.tabIndexValue}" {@attach attachRef} />`
    : `<div {...rest} ${facts.parts[part].discoveryAttribute}=""${files ? ` ${facts.fileList.stateAttribute}="${facts.fileList.emptyInitialState}"` : ` ${facts.attrs.isUploading}={String(isUploading)} hidden={${dropzoneIndicatorHidden(part, "isUploading")}}`} {@attach attachRef}>${files ? "" : "{@render children?.()}"}</div>`
}
`;
}
