import type {
  AdapterAnchoredMenuOverlayFacts,
  AdapterComponentFile,
  AdapterIndexFile,
  AdapterPrintedFile,
} from "../types.js";
import { printSvelteRefAttachment } from "./attachments.js";
import { printSvelteMenuRoot } from "./composite-menu-overlay.js";

const NOTICE = "Svelte 5 public beta adapter output.";

export function printSvelteAnchoredMenuOverlayComponent(
  file: AdapterComponentFile,
): AdapterPrintedFile {
  const family = file.component.family;
  if (family?.kind !== "anchored-menu-overlay")
    throw new TypeError("Svelte Context Menu component requires anchored-menu-overlay facts.");
  return {
    path: `${file.path}.svelte`,
    contents: (family.part === "root"
      ? printSvelteMenuRoot(family.facts)
      : printTrigger(family.facts)
    ).replace(/[ \t]+$/gm, ""),
  };
}

export function printSvelteAnchoredMenuOverlayIndex(file: AdapterIndexFile): AdapterPrintedFile {
  if (file.family?.kind !== "anchored-menu-overlay")
    throw new TypeError("Svelte Context Menu index requires anchored-menu-overlay facts.");
  const { facts } = file.family;
  const names = [
    ...facts.index.importMembers.map(({ name }) => name),
    ...facts.index.menuAliasMembers.map(({ contextName }) => contextName),
  ];
  return {
    path: file.path,
    contents: `// ${NOTICE}
${facts.index.menuAliasMembers.map(({ contextName, menuName }) => `import ${contextName} from "../menu/${menuName}.svelte";`).join("\n")}
${facts.index.importMembers.map(({ from, name }) => `import ${name} from "${from}.svelte";`).join("\n")}
const ${facts.exports.namespace} = {
${facts.index.namespaceMembers.map(({ key, name }) => `  ${key}: ${name},`).join("\n")}
};
export { ${facts.exports.namespace}, ${names.join(", ")} };
export default ${facts.exports.namespace};
export type { ${facts.index.typeExports.join(", ")} } from "${facts.runtime.typeImportSource}";
`,
  };
}

function printTrigger(f: AdapterAnchoredMenuOverlayFacts): string {
  const { trigger } = f;
  return `<!-- ${NOTICE} -->
<script lang="ts">
  import { untrack, type Snippet } from "svelte";
  import type { Attachment } from "svelte/attachments";
  import type { HTMLAttributes } from "svelte/elements";
  import { getMenuTreeContext, getMenuOwnerContext } from "../menu/MenuRoot.svelte";
  type Props = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
    children?: Snippet; disabled?: boolean; ref?: (element: HTMLDivElement | null) => void;
  };
  let { children, disabled = false, tabindex = ${trigger.tabIndexDefaultValue}, style, ref, ...rest }: Props = $props();
  let elementProps = $derived({ ...rest });
  const tree = getMenuTreeContext(); const menu = getMenuOwnerContext(); const owner = Symbol("Context Menu trigger");
  const attachPart: Attachment<HTMLDivElement> = (element) => {
    tree?.registerPart(owner, { element, scope: menu!.scope, part: "trigger" });
    return () => tree?.registerPart(owner, null);
  };
${printSvelteRefAttachment("HTMLDivElement")}
</script>
<!-- svelte-ignore a11y_no_noninteractive_tabindex (Runtime binds ContextMenu and Shift+F10 to this focusable context region.) -->
<${f.parts.trigger.defaultElement} {...elementProps} ${f.attrs.trigger}="" ${f.attrs.menuTrigger}="" data-sw-part="${f.parts.trigger.name}" ${trigger.disclosure.ariaHaspopup.attribute}="${trigger.disclosure.ariaHaspopup.value}" ${trigger.disclosure.ariaExpanded}={!!menu?.open} ${trigger.disabled.ariaAttribute}={disabled ? "true" : undefined} ${trigger.disabled.dataAttribute}={disabled ? "" : undefined} ${trigger.disclosure.stateAttribute}={menu?.open ? "${trigger.disclosure.openStateValue}" : "${trigger.disclosure.closedStateValue}"} tabindex={disabled ? -1 : tabindex} style={"${trigger.touchCalloutStyle.property}: ${trigger.touchCalloutStyle.value}; " + (style ?? "")} {@attach attachPart} {@attach attachRef}>{@render children?.()}</${f.parts.trigger.defaultElement}>
`;
}
