import { renderNativeRoot } from "../../shared-recipes/structured/native.js";
import type {
  AdapterComponentFile,
  AdapterIndexFile,
  AdapterNativeOverlayFacts,
  AdapterPrintedFile,
} from "../types.js";
import { printSvelteRefAttachment } from "./attachments.js";
import { printSvelteOverlayPortal } from "./overlay-portal.js";

const NON_SHIPPING_COMMENT = "Svelte 5 public beta adapter output.";

export function printSvelteNativeOverlayIndex(file: AdapterIndexFile): AdapterPrintedFile {
  const family = file.family;
  if (family?.kind !== "native-overlay") {
    throw new TypeError("Svelte native-overlay index requires native-overlay facts.");
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
${facts.displayName === "AlertDialog" ? `export { getAlertDialogControlRefresh } from "./${facts.exports.root}.svelte";\n` : ""}export type { ButtonChildProps, ButtonChildPayload } from "../button/ButtonRoot.svelte";

export type { ${facts.index.typeExports.join(", ")} } from "${facts.runtime.typeImportSource}";
`,
    path: file.path,
  };
}

export function printSvelteNativeOverlayComponent(file: AdapterComponentFile): AdapterPrintedFile {
  const family = file.component.family;
  if (family?.kind !== "native-overlay") {
    throw new TypeError("Svelte native-overlay projection requires native-overlay facts.");
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
  return { contents, path: `${file.path}.svelte` };
}

function printRoot(facts: AdapterNativeOverlayFacts): string {
  return renderNativeRoot("svelte", facts.displayName);
}

function printTrigger(facts: AdapterNativeOverlayFacts): string {
  return printControl(facts, {
    name: facts.exports.trigger,
    extraProps: `${facts.props.targetId.name}?: ${facts.props.targetId.type};`,
    omit: `${facts.props.targetId.name}: _targetId,`,
    attributes: `"${facts.attrs.trigger}": "", type: "button", "${facts.attrs.triggerAriaHaspopup}": "dialog", "${facts.attrs.targetId}": allProps.${facts.props.targetId.name}, "${facts.attrs.triggerState}": dialog?.open ? "open" : "closed", "data-sw-part": "${facts.parts.trigger.name}",`,
  });
}

function printBackdrop(facts: AdapterNativeOverlayFacts): string {
  return printPart({
    facts,
    part: facts.parts.backdrop,
    elementType: "HTMLDivElement",
    htmlType: "HTMLAttributes<HTMLDivElement>",
    attributes: `${facts.attrs.backdrop}=""\n  ${facts.attrs.backdropState}="closed"\n  ${facts.attrs.backdropHidden}`,
  });
}

function printPopup(facts: AdapterNativeOverlayFacts): string {
  return printPart({
    facts,
    part: facts.parts.popup,
    elementType: "HTMLDialogElement",
    htmlType: "HTMLAttributes<HTMLDialogElement>",
    extraProps: facts.props.side ? `${facts.props.side.name}?: ${facts.props.side.type};` : "",
    destructure: facts.props.side ? `${facts.props.side.name} = ${facts.sideDefault}, ` : "",
    attributes: `${facts.props.side ? `${facts.attrs.popupSide}={${facts.props.side.name}}\n  ` : ""}${facts.attrs.popup}=""\n  ${facts.attrs.popupState}="closed"${facts.attrs.popupRole && facts.popupRoleValue ? `\n  ${facts.attrs.popupRole}="${facts.popupRoleValue}"` : ""}`,
  });
}

function printClose(facts: AdapterNativeOverlayFacts): string {
  return printControl(facts, {
    name: facts.exports.close,
    attributes: `"${facts.attrs.close}": "", type: "button", "data-sw-part": "${facts.parts.close.name}",`,
  });
}

function printControl(
  facts: AdapterNativeOverlayFacts,
  {
    name,
    extraProps = "",
    omit = "",
    attributes,
  }: { name: string; extraProps?: string; omit?: string; attributes: string },
): string {
  return `<!-- ${NON_SHIPPING_COMMENT} -->
<script module lang="ts">
  export type { ButtonChildProps, ButtonChildPayload } from "../button/ButtonRoot.svelte";
</script>
<script lang="ts">
  import { untrack, type Snippet } from "svelte";
  import { createAttachmentKey, type Attachment } from "svelte/attachments";
  import type { ButtonChildProps, ButtonChildPayload } from "../button/ButtonRoot.svelte";
  import { getDialogButtonContext } from "./${facts.exports.root}.svelte";

  type Props = ButtonChildProps & {
    child?: Snippet<[ButtonChildPayload]>;
    children?: Snippet;
    ref?: (element: HTMLButtonElement | null) => void;${
      extraProps
        ? `
    ${extraProps}`
        : ""
    }
  };
  let allProps: Props = $props();
  let child = $derived(allProps.child);
  let children = $derived(allProps.children);
  let refCallback = $derived(allProps.ref);
  const dialog = getDialogButtonContext();
  let nativeProps = $derived.by(() => {
    const { child: _child, children: _children, ref: _ref, ${omit} ...native } = allProps;
    return {
      ...native,
      ${attributes}
    } as ButtonChildProps;
  });
  const attachControl: Attachment<HTMLButtonElement> = (button) => {
    const callback = refCallback;
    untrack(() => callback?.(button));
    dialog?.requestRefresh();
    return () => {
      untrack(() => callback?.(null));
      dialog?.requestRefresh();
    };
  };
  const refKey = createAttachmentKey();
  let buttonProps = $derived({ ...nativeProps, [refKey]: attachControl } as ButtonChildProps);
</script>

{#if child}
  {@render child({ props: buttonProps, children })}
{:else}
  <button {...buttonProps}>{@render children?.()}</button>
{/if}
`;
}

function printSimplePart(facts: AdapterNativeOverlayFacts, name: "title" | "description"): string {
  return printPart({
    facts,
    part: facts.parts[name],
    elementType: name === "title" ? "HTMLHeadingElement" : "HTMLParagraphElement",
    htmlType:
      name === "title"
        ? "HTMLAttributes<HTMLHeadingElement>"
        : "HTMLAttributes<HTMLParagraphElement>",
    attributes: `${facts.attrs[name]}=""`,
  });
}

function printOptionalPart(facts: AdapterNativeOverlayFacts, name: "portal" | "viewport"): string {
  const part = facts.parts[name];
  const attribute = facts.attrs[name];
  if (!part || !attribute)
    throw new Error(`${facts.displayName} native-overlay adapter cannot print ${name}.`);
  return printPart({
    facts,
    part,
    elementType: "HTMLDivElement",
    htmlType: "HTMLAttributes<HTMLDivElement>",
    attributes: `${attribute}=""`,
  });
}

function printPart({
  part,
  elementType,
  htmlType,
  extraProps = "",
  destructure = "",
  attributes,
}: {
  facts: AdapterNativeOverlayFacts;
  part: { defaultElement: string; name: string };
  elementType: string;
  htmlType: string;
  extraProps?: string;
  destructure?: string;
  attributes: string;
}): string {
  const elementImport =
    htmlType === "HTMLButtonAttributes" ? "HTMLButtonAttributes" : "HTMLAttributes";
  return `<!-- ${NON_SHIPPING_COMMENT} -->
<script lang="ts">
  import { untrack, type Snippet } from "svelte";
  import type { Attachment } from "svelte/attachments";
  import type { ${elementImport} } from "svelte/elements";

  type Props = Omit<${htmlType}, "children"> & { children?: Snippet; ${extraProps} ref?: (element: ${elementType} | null) => void };
  let { children, ${destructure}ref, ...rest }: Props = $props();
${printSvelteRefAttachment(elementType)}
</script>

<${part.defaultElement}
  {...rest}
  ${attributes}
  data-sw-part="${part.name}"
  {@attach attachRef}
>
  {@render children?.()}
</${part.defaultElement}>
`;
}
