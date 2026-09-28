import { renderCollapsibleRoot } from "../../shared-recipes/structured/disclosure/frame.js";
import {
  collapsibleParts,
  disclosureDisabled,
} from "../../shared-recipes/structured/disclosure/recipe.js";
import type {
  AdapterComponentFile,
  AdapterDisclosurePresenceFacts,
  AdapterIndexFile,
  AdapterPrintedFile,
} from "../types.js";
import { printSvelteRefAttachment } from "./attachments.js";

export function printSvelteDisclosurePresenceIndex(file: AdapterIndexFile): AdapterPrintedFile {
  if (file.family?.kind !== "disclosure-presence")
    throw new TypeError("Svelte disclosure-presence index requires family facts.");
  const facts = file.family.facts;
  return {
    path: file.path,
    contents: `import ${facts.exports.root} from "./${facts.exports.root}.svelte";
import ${facts.exports.trigger} from "./${facts.exports.trigger}.svelte";
import ${facts.exports.panel} from "./${facts.exports.panel}.svelte";
const ${facts.exports.namespace} = { Root: ${facts.exports.root}, Trigger: ${facts.exports.trigger}, Panel: ${facts.exports.panel} };
export { ${facts.exports.namespace}, ${facts.exports.root}, ${facts.exports.trigger}, ${facts.exports.panel} };
export default ${facts.exports.namespace};
export type { ${facts.event.detailsType} } from "${facts.runtime.typeImportSource}";
export type { ButtonChildProps, ButtonChildPayload } from "../button/ButtonRoot.svelte";
`,
  };
}

export function printSvelteDisclosurePresenceComponent(
  file: AdapterComponentFile,
): AdapterPrintedFile {
  const family = file.component.family;
  if (family?.kind !== "disclosure-presence")
    throw new TypeError("Svelte disclosure-presence component requires family facts.");
  return {
    path: `${file.path}.svelte`,
    contents:
      family.part === "root"
        ? printRoot(family.facts)
        : family.part === "trigger"
          ? printTrigger(family.facts)
          : printPanel(family.facts),
  };
}

function printRoot(_facts: AdapterDisclosurePresenceFacts): string {
  return renderCollapsibleRoot("svelte");
}

function printTrigger(facts: AdapterDisclosurePresenceFacts): string {
  return `<script module lang="ts">
  export type { ButtonChildProps, ButtonChildPayload } from "../button/ButtonRoot.svelte";
</script>
<script lang="ts">
  import { getDisclosurePresenceContext } from "./${facts.exports.root}.svelte";
  import { createAttachmentKey } from "svelte/attachments";
  import { untrack, type Snippet } from "svelte";
  import type { ButtonChildProps, ButtonChildPayload } from "../button/ButtonRoot.svelte";
  type Props = ButtonChildProps & { child?: Snippet<[ButtonChildPayload]>; children?: Snippet; ref?: (element: HTMLButtonElement | null) => void };
  let allProps: Props = $props();
  let child = $derived(allProps.child);
  let children = $derived(allProps.children);
  let ref = $derived(allProps.ref);
  const disclosure = getDisclosurePresenceContext();
  let nativeProps = $derived.by(() => {
    const { child: _child, children: _children, ref: _ref, ...native } = allProps;
    return {
      ...native,
      "${facts.attrs.trigger}": "",
      type: "button" as const,
      disabled: ${disclosureDisabled("disclosure?.disabled", "native.disabled")},
      "data-disabled": (${disclosureDisabled("disclosure?.disabled", "native.disabled")}) ? "" : undefined,
      "${facts.attrs.triggerExpanded}": ${collapsibleParts.trigger.expanded},
      "${facts.attrs.triggerState}": "${collapsibleParts.trigger.state}",
    } satisfies ButtonChildProps;
  });
${printSvelteRefAttachment("HTMLButtonElement")}
  const refKey = createAttachmentKey();
  let buttonProps = $derived({ ...nativeProps, [refKey]: attachRef } as ButtonChildProps);
</script>
{#if child}
  {@render child({ props: buttonProps, children })}
{:else}
  <button {...buttonProps}>{@render children?.()}</button>
{/if}
`;
}

function printPanel(facts: AdapterDisclosurePresenceFacts): string {
  const hidden = facts.props.hiddenUntilFound;
  return `<script lang="ts">
  import { untrack, type Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  type Props = Omit<HTMLAttributes<HTMLDivElement>, "hidden"> & { children?: Snippet; ref?: (element: HTMLDivElement | null) => void; ${hidden.name}?: ${hidden.type} };
  let { children, ref, ${hidden.name} = ${hidden.defaultValue}, ...rest }: Props = $props();
  const initialHidden = untrack(() => ${hidden.name} ? "${collapsibleParts.panel.hiddenUntilFound}" : ${collapsibleParts.panel.hidden});
${printSvelteRefAttachment("HTMLDivElement")}
</script>
<${facts.parts.panel.defaultElement} {...rest} ${facts.attrs.panel} ${facts.attrs.panelHiddenUntilFound}={${hidden.name} ? "" : undefined} ${facts.attrs.panelState}="${collapsibleParts.panel.state}" ${facts.attrs.panelHidden}={initialHidden} {@attach attachRef}>
  {@render children?.()}
</${facts.parts.panel.defaultElement}>
`;
}
