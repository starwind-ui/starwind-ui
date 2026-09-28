import { partAttributes } from "../../shared-recipes/structured/part-policy.js";
import { renderTimedRoot } from "../../shared-recipes/structured/timed/frame.js";
import {
  timedPartPolicy,
  timedTriggerPolicy,
} from "../../shared-recipes/structured/timed/recipe.js";
import type {
  AdapterComponentFile,
  AdapterIndexFile,
  AdapterPrintedFile,
  AdapterTimedFloatingOverlayFacts,
} from "../types.js";
import { printSvelteAnchorChild } from "./anchor-child.js";
import { printSvelteRefAttachment } from "./attachments.js";
import { printSvelteButtonChild } from "./button-child.js";
import { printSvelteOverlayPortal } from "./overlay-portal.js";

const NON_SHIPPING_COMMENT = "Svelte 5 public beta adapter output.";

function assertTimedFacts(facts: AdapterTimedFloatingOverlayFacts): void {
  const tooltip =
    facts.trigger.triggerKind === "button" && facts.root.disabled && facts.popup.omitTabIndexProps;
  const preview =
    facts.trigger.triggerKind === "anchor" &&
    !facts.root.disabled &&
    !facts.popup.omitTabIndexProps &&
    facts.trigger.disabledNavigation &&
    facts.trigger.clickGuardWhenDisabled &&
    facts.trigger.delayOverrides &&
    facts.parts.backdrop &&
    facts.parts.viewport;
  if (!tooltip && !preview)
    throw new TypeError(
      "Svelte timed-floating-overlay requires the Tooltip button or Preview Card anchor contract.",
    );
}

export function printSvelteTimedFloatingOverlayIndex(file: AdapterIndexFile): AdapterPrintedFile {
  const family = file.family;
  if (family?.kind !== "timed-floating-overlay")
    throw new TypeError(
      "Svelte timed-floating-overlay index requires timed-floating-overlay facts.",
    );
  const { facts } = family;
  assertTimedFacts(facts);
  return {
    contents: `// ${NON_SHIPPING_COMMENT}
${facts.index.importMembers.map(({ from, name }) => `import ${name} from "${from}.svelte";`).join("\n")}
const ${facts.exports.namespace} = {
${facts.index.namespaceMembers.map(({ key, name }) => `  ${key}: ${name},`).join("\n")}
};
export { ${facts.exports.namespace}, ${facts.index.importMembers.map(({ name }) => name).join(", ")} };
export default ${facts.exports.namespace};
${facts.trigger.triggerKind === "button" ? 'export type { ButtonChildProps, ButtonChildPayload } from "../button/ButtonRoot.svelte";' : `export type { AnchorChildProps, AnchorChildPayload } from "./${facts.exports.trigger}.svelte";`}
export type { ${facts.index.typeExports.join(", ")} } from "${facts.runtime.typeImportSource}";
`,
    path: file.path,
  };
}

export function printSvelteTimedFloatingOverlayComponent(
  file: AdapterComponentFile,
): AdapterPrintedFile {
  const family = file.component.family;
  if (family?.kind !== "timed-floating-overlay")
    throw new TypeError(
      "Svelte timed-floating-overlay projection requires timed-floating-overlay facts.",
    );
  const { facts, part } = family;
  assertTimedFacts(facts);
  const contents =
    part === "root"
      ? printRoot(facts)
      : part === "trigger"
        ? printTrigger(facts)
        : part === "portal"
          ? printSvelteOverlayPortal(facts, "getTimedOverlayContext")
          : part === "popup" || part === "positioner"
            ? printFloatingPart(facts, part)
            : part === "backdrop" || part === "viewport"
              ? printPart(facts, part, {
                  attributes: partAttributes("svelte", timedPartPolicy(facts, part)),
                })
              : part === "arrow"
                ? printPart(facts, part, {
                    attributes: partAttributes("svelte", timedPartPolicy(facts, part)),
                  })
                : (() => {
                    throw new TypeError(`Svelte timed-floating-overlay cannot print ${part}.`);
                  })();
  return { contents: contents.replace(/[ \t]+\n/g, "\n"), path: `${file.path}.svelte` };
}

function printRoot(facts: AdapterTimedFloatingOverlayFacts): string {
  return renderTimedRoot("svelte", facts);
}

function printTrigger(facts: AdapterTimedFloatingOverlayFacts): string {
  if (facts.trigger.triggerKind === "anchor")
    return printSvelteAnchorChild({
      name: facts.exports.trigger,
      imports: "",
      init: "",
      register: "",
      omitEmptyRegistration: true,
      attributes: `"${facts.attrs.trigger}": "", "${facts.attrs.triggerDisabled}": allProps.disabled ? "" : undefined, "${facts.attrs.triggerAriaDisabled}": allProps.disabled ? "true" : undefined, "${facts.attrs.triggerState}": "${timedTriggerPolicy.state}", "data-sw-part": "${facts.parts.trigger.name}", ...(allProps.openDelay === undefined ? {} : {"${facts.attrs.triggerOpenDelay}": allProps.openDelay}), ...(allProps.closeDelay === undefined ? {} : {"${facts.attrs.triggerCloseDelay}": allProps.closeDelay}),`,
    });
  return printSvelteButtonChild({
    name: facts.exports.trigger,
    imports: "",
    init: "",
    register: "",
    omitEmptyRegistration: true,
    attributes: `"${facts.attrs.trigger}": "", type: "button", "${facts.attrs.triggerDisabled}": nativeProps.disabled ? "" : undefined, "${facts.attrs.triggerAriaDisabled}": nativeProps.disabled ? "true" : undefined, "${facts.attrs.triggerState}": "${timedTriggerPolicy.state}", "data-sw-part": "${facts.parts.trigger.name}",`,
  });
}

function printFloatingPart(
  facts: AdapterTimedFloatingOverlayFacts,
  part: "popup" | "positioner",
): string {
  const names = ["side", "align", "sideOffset", "avoidCollisions"] as const;
  const attrs = names.map((name) => facts.attrs[name]);
  return printPart(facts, part, {
    omit: part === "popup" && facts.popup.omitTabIndexProps ? ' | "tabindex" | "tabIndex"' : "",
    extraProps: names
      .map((name) => `${facts.props[name].name}?: ${facts.props[name].type};`)
      .join(" "),
    destructure: names
      .map((name) => `${facts.props[name].name} = ${facts.props[name].defaultValue}, `)
      .join(""),
    attributes: partAttributes("svelte", timedPartPolicy(facts, part)),
    setup: `const context = getTimedOverlayContext();
  const attachPlacement: Attachment<HTMLDivElement> = (element) => {
    $effect(() => {
      const attributes = { ${attrs.map((attr, index) => `"${attr}": String(${names[index]})`).join(", ")} };
      untrack(() => context?.registerPlacement(element, attributes));
    });
    return () => context?.registerPlacement(element, null);
  };`,
    attachment: "attachPlacement",
  });
}

function printPart(
  facts: AdapterTimedFloatingOverlayFacts,
  part: "popup" | "positioner" | "arrow" | "backdrop" | "viewport",
  {
    attributes,
    extraProps = "",
    destructure = "",
    setup = "",
    attachment,
    omit = "",
  }: {
    attributes: string;
    extraProps?: string;
    destructure?: string;
    setup?: string;
    attachment?: string;
    omit?: string;
  },
): string {
  return `<!-- ${NON_SHIPPING_COMMENT} -->
<script lang="ts">
  import { untrack, type Snippet } from "svelte";
  import type { Attachment } from "svelte/attachments";
  import type { HTMLAttributes } from "svelte/elements";
  import { getTimedOverlayContext } from "./${facts.exports.root}.svelte";
  type Props = Omit<HTMLAttributes<HTMLDivElement>, "children"${omit}> & { children?: Snippet; ${extraProps} ref?: (element: HTMLDivElement | null) => void };
  let { children, ${destructure}ref, ...rest }: Props = $props();
${printSvelteRefAttachment("HTMLDivElement")}
  ${setup}
</script>
<div {...rest} ${attributes}  ${attachment ? `{@attach ${attachment}}` : ""} {@attach attachRef}>
  {@render children?.()}
</div>
`;
}
