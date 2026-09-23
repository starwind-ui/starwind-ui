import { renderSlider } from "../../shared-recipes/structured/range/frame.js";
import type {
  AdapterComponentFile,
  AdapterIndexFile,
  AdapterPrintedFile,
  AdapterRangeControlFacts,
  AdapterRangeControlPartName,
} from "../types.js";
import { printSvelteRefAttachment } from "./attachments.js";

const NON_SHIPPING_COMMENT = "Svelte 5 public beta adapter output.";

export function printSvelteRangeControlIndex(file: AdapterIndexFile): AdapterPrintedFile {
  const family = file.family;
  if (family?.kind !== "range-control") {
    throw new TypeError("Svelte range-control index requires range-control facts.");
  }
  const { facts } = family;
  const imports = facts.index.importMembers
    .map(({ from, name }) => `import ${name} from "${from}.svelte";`)
    .join("\n");
  const members = facts.index.namespaceMembers
    .map(({ key, name }) => `  ${key}: ${name},`)
    .join("\n");
  const exports = facts.index.importMembers.map(({ name }) => name).join(",\n  ");
  return {
    contents: `// ${NON_SHIPPING_COMMENT}

${imports}

const ${facts.exports.namespace} = {
${members}
};

export {
  ${facts.exports.namespace},
  ${exports},
};

export default ${facts.exports.namespace};

export type { ${facts.index.typeExports.join(", ")} } from "${facts.runtime.typeImportSource}";
`,
    path: file.path,
  };
}

export function printSvelteRangeControlComponent(file: AdapterComponentFile): AdapterPrintedFile {
  const family = file.component.family;
  if (family?.kind !== "range-control") {
    throw new TypeError("Svelte range-control projection requires range-control facts.");
  }
  const contents =
    family.part === "root"
      ? printRoot(family.facts)
      : family.part === "thumb"
        ? printThumb(family.facts)
        : printSimplePart(family.facts, family.part);
  return { contents, path: `${file.path}.svelte` };
}

function printRoot(facts: AdapterRangeControlFacts): string {
  return renderSlider("svelte", facts);
}

function printSimplePart(
  facts: AdapterRangeControlFacts,
  partName: Exclude<AdapterRangeControlPartName, "root" | "thumb">,
): string {
  const part = facts.parts[partName];
  const elementType = part.defaultElement === "span" ? "HTMLSpanElement" : "HTMLDivElement";
  const htmlType =
    part.defaultElement === "span"
      ? "HTMLAttributes<HTMLSpanElement>"
      : "HTMLAttributes<HTMLDivElement>";
  return printPart({
    attributes: `${facts.attrs[partName]}=""`,
    elementType,
    htmlType,
    part,
  });
}

function printThumb(facts: AdapterRangeControlFacts): string {
  const part = facts.parts.thumb;
  const index = facts.props.index.name;
  return `<!-- ${NON_SHIPPING_COMMENT} -->
<script lang="ts">
  import { untrack, type Snippet } from "svelte";
  import type { Attachment } from "svelte/attachments";
  import type { HTMLAttributes } from "svelte/elements";

  type Props = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
    children?: Snippet;
    ${index}?: ${facts.props.index.type};
    ref?: (element: HTMLDivElement | null) => void;
    ${facts.inputRefPropName}?: (element: HTMLInputElement | null) => void;
  };
  let { children, ${index}, ref, ${facts.inputRefPropName}, ...rest }: Props = $props();
${printSvelteRefAttachment("HTMLDivElement")}
${printSvelteRefAttachment("HTMLInputElement", facts.inputRefPropName, "attachInputRef")}
</script>

<${part.defaultElement}
  {...rest}
  ${facts.attrs.thumb}=""
  ${facts.attrs.index}={${index}}
  data-sw-part="${part.name}"
  {@attach attachRef}
>
  {@render children?.()}
  <input
    ${facts.attrs.input}=""
    ${facts.attrs.inputAriaHidden}="${facts.thumbInput.hiddenRangeInput.ariaHiddenValue}"
    ${facts.attrs.inputTabIndex === "tabIndex" ? "tabindex" : facts.attrs.inputTabIndex}={${facts.thumbInput.hiddenRangeInput.tabIndexValue}}
    ${facts.attrs.inputType}="${facts.thumbInput.hiddenRangeInput.typeValue}"
    style:border="0"
    style:clip-path="inset(50%)"
    style:height="1px"
    style:margin="-1px"
    style:overflow="hidden"
    style:position="absolute"
    style:white-space="nowrap"
    style:width="1px"
    {@attach attachInputRef}
  />
</${part.defaultElement}>
`;
}

function printPart({
  attributes,
  elementType,
  htmlType,
  part,
}: {
  attributes: string;
  elementType: string;
  htmlType: string;
  part: { defaultElement: string; name: string };
}): string {
  return `<!-- ${NON_SHIPPING_COMMENT} -->
<script lang="ts">
  import { untrack, type Snippet } from "svelte";
  import type { Attachment } from "svelte/attachments";
  import type { HTMLAttributes } from "svelte/elements";

  type Props = Omit<${htmlType}, "children"> & { children?: Snippet; ref?: (element: ${elementType} | null) => void };
  let { children, ref, ...rest }: Props = $props();
${printSvelteRefAttachment(elementType)}
</script>

<${part.defaultElement} {...rest} ${attributes} data-sw-part="${part.name}" {@attach attachRef}>
  {@render children?.()}
</${part.defaultElement}>
`;
}
