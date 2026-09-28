import {
  controlAttributes,
  floatingInputs,
  partAttributes,
  popoverPartPolicy,
} from "../../shared-recipes/structured/part-policy.js";
import { renderRoot as renderSharedPopoverRoot } from "../../shared-recipes/structured/popover.js";
import type {
  AdapterComponentFile,
  AdapterIndexFile,
  AdapterPresenceFloatingOverlayFacts,
  AdapterPrintedFile,
} from "../types.js";
import { printSvelteRefAttachment } from "./attachments.js";
import { printSvelteButtonChild } from "./button-child.js";
import { printSvelteOverlayPortal } from "./overlay-portal.js";

const NON_SHIPPING_COMMENT = "Svelte 5 public beta adapter output.";

export function printSveltePresenceFloatingOverlayIndex(
  file: AdapterIndexFile,
): AdapterPrintedFile {
  const family = file.family;
  if (family?.kind !== "presence-floating-overlay") {
    throw new TypeError(
      "Svelte presence-floating-overlay index requires presence-floating-overlay facts.",
    );
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
export type { ButtonChildProps, ButtonChildPayload } from "../button/ButtonRoot.svelte";

export type { ${facts.index.typeExports.join(", ")} } from "${facts.runtime.typeImportSource}";
`,
    path: file.path,
  };
}

export function printSveltePresenceFloatingOverlayComponent(
  file: AdapterComponentFile,
): AdapterPrintedFile {
  const family = file.component.family;
  if (family?.kind !== "presence-floating-overlay") {
    throw new TypeError(
      "Svelte presence-floating-overlay projection requires presence-floating-overlay facts.",
    );
  }
  const { facts, part } = family;
  const contents =
    part === "root"
      ? printRoot(facts)
      : part === "trigger"
        ? printTrigger(facts)
        : part === "backdrop"
          ? printBackdrop(facts)
          : part === "popup"
            ? printPopup(facts)
            : part === "close"
              ? printClose(facts)
              : part === "title" || part === "description"
                ? printSimplePart(facts, part)
                : part === "portal"
                  ? printSvelteOverlayPortal(facts)
                  : printOptionalPart(facts, part);
  return { contents: contents.replace(/[ \t]+\n/g, "\n"), path: `${file.path}.svelte` };
}

function printRoot(_facts: AdapterPresenceFloatingOverlayFacts): string {
  return renderSharedPopoverRoot("svelte");
}

function printTrigger(facts: AdapterPresenceFloatingOverlayFacts): string {
  return printSvelteButtonChild({
    name: facts.exports.trigger,
    imports: "",
    init: "",
    register: "",
    attributes: `${controlAttributes(popoverPartPolicy(facts, "trigger"), true)} "data-sw-part": "${facts.parts.trigger.name}",`,
  });
}

function printBackdrop(facts: AdapterPresenceFloatingOverlayFacts): string {
  return printPart({
    facts,
    part: facts.parts.backdrop,
    elementType: "HTMLDivElement",
    htmlType: "HTMLAttributes<HTMLDivElement>",
    attributes: partAttributes("svelte", popoverPartPolicy(facts, "backdrop")),
  });
}

function printPopup(facts: AdapterPresenceFloatingOverlayFacts): string {
  return printFloatingPart(facts, "popup");
}

function printFloatingPart(
  facts: AdapterPresenceFloatingOverlayFacts,
  name: "popup" | "positioner",
): string {
  const propNames = [
    "side",
    "align",
    "sideOffset",
    "avoidCollisions",
    "collisionStrategy",
  ] as const;
  const placementInputs = floatingInputs(facts);
  return printPart({
    facts,
    part: facts.parts[name],
    elementType: "HTMLDivElement",
    htmlType: "HTMLAttributes<HTMLDivElement>",
    extraProps: propNames.map((name) => `${name}?: ${facts.props[name].type};`).join(" "),
    destructure: propNames.map((name) => `${name} = ${facts.props[name].defaultValue}, `).join(""),
    attributes: partAttributes("svelte", popoverPartPolicy(facts, name)),
    imports: `import { getDialogButtonContext } from "./${facts.exports.root}.svelte";`,
    setup: `const context = getDialogButtonContext();
  const attachPlacement: Attachment<HTMLDivElement> = (element) => {
    $effect(() => {
      const attributes = { ${placementInputs.map(([attr, input]) => `"${attr}": String(${input})`).join(", ")} };
      untrack(() => context?.registerPlacement(element, attributes));
    });
    return () => context?.registerPlacement(element, null);
  };`,
    attachment: "attachPlacement",
  });
}

function printClose(facts: AdapterPresenceFloatingOverlayFacts): string {
  const policy = popoverPartPolicy(facts, "close");
  if (policy.composition !== "native") throw new TypeError("Close requires a native owner.");
  return printPart({
    facts,
    part: facts.parts.close,
    elementType: "HTMLButtonElement",
    htmlType: "HTMLButtonAttributes",
    attributes: partAttributes("svelte", policy),
  });
}

function printSimplePart(
  facts: AdapterPresenceFloatingOverlayFacts,
  name: "title" | "description",
): string {
  return printPart({
    facts,
    part: facts.parts[name],
    elementType: name === "title" ? "HTMLHeadingElement" : "HTMLParagraphElement",
    htmlType:
      name === "title"
        ? "HTMLAttributes<HTMLHeadingElement>"
        : "HTMLAttributes<HTMLParagraphElement>",
    attributes: partAttributes("svelte", popoverPartPolicy(facts, name)),
  });
}

function printOptionalPart(
  facts: AdapterPresenceFloatingOverlayFacts,
  name: "portal" | "viewport" | "positioner" | "arrow",
): string {
  if (name === "positioner") return printFloatingPart(facts, name);
  const part = facts.parts[name];
  const attribute = facts.attrs[name];
  if (!part || !attribute)
    throw new Error(`${facts.displayName} presence-floating-overlay adapter cannot print ${name}.`);
  return printPart({
    facts,
    part,
    elementType: "HTMLDivElement",
    htmlType: "HTMLAttributes<HTMLDivElement>",
    attributes: partAttributes("svelte", popoverPartPolicy(facts, name)),
  });
}

function printPart({
  part,
  elementType,
  htmlType,
  extraProps = "",
  destructure = "",
  attributes,
  imports = "",
  setup = "",
  attachment,
}: {
  facts: AdapterPresenceFloatingOverlayFacts;
  part: { defaultElement: string; name: string };
  elementType: string;
  htmlType: string;
  extraProps?: string;
  destructure?: string;
  attributes: string;
  imports?: string;
  setup?: string;
  attachment?: string;
}): string {
  const elementImport =
    htmlType === "HTMLButtonAttributes" ? "HTMLButtonAttributes" : "HTMLAttributes";
  return `<!-- ${NON_SHIPPING_COMMENT} -->
<script lang="ts">
  import { untrack, type Snippet } from "svelte";
  import type { Attachment } from "svelte/attachments";
  import type { ${elementImport} } from "svelte/elements";
  ${imports}

  type Props = Omit<${htmlType}, "children"> & { children?: Snippet; ${extraProps} ref?: (element: ${elementType} | null) => void };
  let { children, ${destructure}ref, ...rest }: Props = $props();
${printSvelteRefAttachment(elementType)}
  ${setup}
</script>

<${part.defaultElement}
  {...rest}
  ${attributes}
  data-sw-part="${part.name}"
  {@attach attachRef}
  ${attachment ? `{@attach ${attachment}}` : ""}
>
  {@render children?.()}
</${part.defaultElement}>
`;
}
