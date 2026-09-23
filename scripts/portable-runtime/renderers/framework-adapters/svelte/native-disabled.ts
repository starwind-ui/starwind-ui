import { renderSimpleRoot } from "../../shared-recipes/simple/frame.js";
import type { AdapterComponentFile, AdapterIndexFile, AdapterPrintedFile } from "../types.js";
import { printSvelteRefAttachment } from "./attachments.js";

export function printSvelteNativeDisabledIndex(file: AdapterIndexFile): AdapterPrintedFile {
  if (file.family?.kind !== "native-disabled")
    throw new TypeError("Svelte Fieldset requires native-disabled facts.");
  const facts = file.family.facts;
  return {
    path: file.path,
    contents: `${facts.index.importMembers.map(({ name, from }) => `import ${name} from "${from}.svelte";`).join("\n")}
const ${facts.exports.namespace} = { ${facts.index.namespaceMembers.map(({ key, name }) => `${key}: ${name}`).join(", ")} };
export { ${facts.exports.namespace}, ${facts.index.importMembers.map(({ name }) => name).join(", ")} };
export default ${facts.exports.namespace};
`,
  };
}

export function printSvelteNativeDisabledComponent(file: AdapterComponentFile): AdapterPrintedFile {
  if (file.component.family?.kind === "native-disabled" && file.component.family.part === "root")
    return {
      path: file.path + ".svelte",
      contents: renderSimpleRoot("svelte", "fieldset", file.component.family.facts),
    };

  const family = file.component.family;
  if (family?.kind !== "native-disabled")
    throw new TypeError("Svelte Fieldset requires native-disabled facts.");
  const facts = family.facts;
  const part = facts.parts.all.find((part) => part.name === family.part);
  if (!part) throw new TypeError("Svelte Fieldset is missing its native part.");
  const elementType = "HTMLDivElement";
  return {
    path: `${file.path}.svelte`,
    contents: `<script lang="ts">
  import { untrack, type Snippet } from "svelte";
  import type { Attachment } from "svelte/attachments";
  import type { HTMLAttributes } from "svelte/elements";
  type Props = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
    children?: Snippet;
    ref?: (element: ${elementType} | null) => void;
  };
  let { children, ref, ...rest }: Props = $props();
${printSvelteRefAttachment(elementType)}
</script>
<${part.defaultElement} {...rest} ${part.discoveryAttribute}="" {@attach attachRef}>
  {@render children?.()}
</${part.defaultElement}>
`,
  };
}
