import { renderSimpleRoot } from "../../shared-recipes/simple/frame.js";
import { progressPartPolicy } from "../../shared-recipes/simple/parts.js";
import type {
  AdapterComponentFile,
  AdapterIndexFile,
  AdapterPrintedFile,
  AdapterRangeStatusFacts,
  AdapterRangeStatusPartName,
} from "../types.js";
import { printSvelteRefAttachment } from "./attachments.js";

export function printSvelteRangeStatusIndex(file: AdapterIndexFile): AdapterPrintedFile {
  if (file.family?.kind !== "range-status")
    throw new TypeError("Svelte range-status index requires range-status facts.");
  const facts = file.family.facts;
  return {
    path: file.path,
    contents: `${facts.index.importMembers.map(({ name, from }) => `import ${name === facts.state.valueType ? `${name}Component` : name} from "${from}.svelte";`).join("\n")}
${facts.index.importMembers.some(({ name }) => name === facts.state.valueType) ? `const ${facts.state.valueType} = ${facts.state.valueType}Component;\ntype ${facts.state.valueType} = import("${facts.runtime.typeImportSource}").${facts.state.valueType};` : `type ${facts.state.valueType} = import("${facts.runtime.typeImportSource}").${facts.state.valueType};`}
const ${facts.exports.namespace} = { ${facts.index.namespaceMembers.map(({ key, name }) => `${key}: ${name}`).join(", ")} };
export { ${facts.exports.namespace}, ${facts.index.importMembers.map(({ name }) => name).join(", ")} };
export default ${facts.exports.namespace};

`,
  };
}

export function printSvelteRangeStatusComponent(file: AdapterComponentFile): AdapterPrintedFile {
  const family = file.component.family;
  if (family?.kind !== "range-status")
    throw new TypeError("Svelte range-status component requires range-status facts.");
  return {
    path: `${file.path}.svelte`,
    contents:
      family.part === "root" ? printRoot(family.facts) : printPart(family.facts, family.part),
  };
}

function printRoot(facts: AdapterRangeStatusFacts): string {
  return renderSimpleRoot("svelte", "progress", facts);
}

function printPart(
  facts: AdapterRangeStatusFacts,
  name: Exclude<AdapterRangeStatusPartName, "root">,
): string {
  const part = facts.parts[name];
  const elementType = part.defaultElement === "div" ? "HTMLDivElement" : "HTMLSpanElement";
  const policy = progressPartPolicy(facts, name);
  const indicator = policy.runtimeStyleProperties.includes("transform");
  const attributes =
    name === "label"
      ? ` ${facts.attrs.labelRole.attribute}="${facts.attrs.labelRole.value}"`
      : policy.childText === "runtime-unless-children"
        ? ` ${facts.attrs.valueAriaHidden.attribute}="${facts.attrs.valueAriaHidden.value}"`
        : "";
  const open = `<${part.defaultElement} {...rest} ${part.discoveryAttribute}${attributes}${indicator ? " style={initialStyle} {@attach attachPart}" : ""} {@attach attachRef}`;
  return `<script lang="ts">
  import { untrack, type Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import type { Attachment } from "svelte/attachments";
  type Props = HTMLAttributes<${elementType}> & { children?: Snippet; ref?: (element: ${elementType} | null) => void };
  let { children, ref, ${indicator ? "style, " : ""}...rest }: Props = $props();
${indicator ? "  const initialStyle = untrack(() => style);\n" : ""}${
    indicator
      ? `  const attachPart: Attachment<${elementType}> = (element) => {
    // Runtime owns the transform after connection, including removal in indeterminate mode.
    $effect(() => {
      const value = style;
      untrack(() => { const transform = element.style.transform; element.style.cssText = value ?? ""; element.style.transform = transform; });
    });
  };`
      : ""
  }
${printSvelteRefAttachment(elementType)}
</script>
${
  policy.childText === "runtime-unless-children"
    ? `{#if children}
  ${open} ${facts.attrs.valuePreserveText}>
    {@render children()}
  </${part.defaultElement}>
{:else}
  ${open} ${facts.attrs.valuePreserveText}={undefined}></${part.defaultElement}>
{/if}`
    : `${open}>\n  {@render children?.()}\n</${part.defaultElement}>`
}
`;
}
