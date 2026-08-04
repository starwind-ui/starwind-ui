import type {
  AdapterComponentFile,
  AdapterIndexFile,
  AdapterNativeOverlayFacts,
  AdapterPrintedFile,
} from "../types.js";

const NON_SHIPPING_COMMENT =
  "Internal non-shipping Svelte proof output. Do not publish, expose through the CLI registry, claim in public docs, or copy into public demo dependencies.";

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
                : printOptionalPart(facts, part);
  return { contents, path: `${file.path}.svelte` };
}

function printRoot(facts: AdapterNativeOverlayFacts): string {
  const open = facts.props.open.name;
  const defaultOpen = facts.props.defaultOpen.name;
  const closeOnEscape = facts.props.closeOnEscape.name;
  const closeOnOutsideInteract = facts.props.closeOnOutsideInteract.name;
  const modal = facts.props.modal.name;
  const openEvent = facts.events.openChange;
  const closeEvent = facts.events.closeComplete;
  return `<!-- ${NON_SHIPPING_COMMENT} -->
<script lang="ts">
  import { type ${closeEvent.detailsType}, type ${openEvent.detailsType}, ${facts.runtime.factory} } from "${facts.runtime.importSource}";
  import { untrack, type Snippet } from "svelte";
  import type { Attachment } from "svelte/attachments";
  import type { HTMLAttributes } from "svelte/elements";

  type Props = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
    children?: Snippet<[boolean]>;
    ${defaultOpen}?: ${facts.props.defaultOpen.type};
    ${open}?: ${facts.props.open.type};
    ${closeOnEscape}?: ${facts.props.closeOnEscape.type};
    ${closeOnOutsideInteract}?: ${facts.props.closeOnOutsideInteract.type};
    ${modal}?: ${facts.props.modal.type};
    ${openEvent.callbackProp}?: (open: boolean, detail: ${openEvent.detailsType}) => void;
    ${closeEvent.callbackProp}?: (detail: ${closeEvent.detailsType}) => void;
    ref?: (element: HTMLDivElement | null) => void;
  };

  let { children, ${defaultOpen} = ${facts.props.defaultOpen.defaultValue}, ${open} = $bindable(), ${closeOnEscape} = ${facts.props.closeOnEscape.defaultValue}, ${closeOnOutsideInteract} = ${facts.props.closeOnOutsideInteract.defaultValue}, ${modal} = ${facts.props.modal.defaultValue}, ${openEvent.callbackProp}, ${closeEvent.callbackProp}, ref, ...rest }: Props = $props();
  const externallyControlled = untrack(() => ${open} !== undefined);
  const initialDefaultOpen = untrack(() => ${defaultOpen});
  let uncontrolledOpen = $state(initialDefaultOpen);
  let renderedOpen = $derived(${open} !== undefined ? ${open} : uncontrolledOpen);

  function handleOpenChange(nextOpen: boolean, detail: ${openEvent.detailsType}): void {
    ${openEvent.callbackProp}?.(nextOpen, detail);
    if (detail.isCanceled) return;
    if (!externallyControlled) uncontrolledOpen = nextOpen;
    ${open} = nextOpen;
  }

  function handleCloseComplete(detail: ${closeEvent.detailsType}): void {
    ${closeEvent.callbackProp}?.(detail);
  }

  const attachRuntime: Attachment<HTMLDivElement> = (root) => {
    let instance: ReturnType<typeof ${facts.runtime.factory}> | undefined;
    let retainedOpen: boolean | undefined;
    $effect(() => {
      const connectionCloseOnEscape = ${closeOnEscape};
      const connectionCloseOnOutsideInteract = ${closeOnOutsideInteract};
      const connectionModal = ${modal};
      const acceptedOpen = externallyControlled
        ? untrack(() => renderedOpen)
        : retainedOpen ?? untrack(() => renderedOpen);
      retainedOpen = undefined;
      if (!externallyControlled) uncontrolledOpen = acceptedOpen;
      instance = ${facts.runtime.factory}(root, {
        ${defaultOpen}: acceptedOpen,
        ${closeOnEscape}: connectionCloseOnEscape,
        ${closeOnOutsideInteract}: connectionCloseOnOutsideInteract,
        ${modal}: connectionModal,
        ${openEvent.callbackProp}: handleOpenChange,
        ${closeEvent.callbackProp}: handleCloseComplete,
        ...(externallyControlled ? { ${open}: acceptedOpen } : {}),
      });
      $effect(() => {
        const nextOpen = renderedOpen;
        if (!instance || Object.is(instance.${facts.state.getter}(), nextOpen)) return;
        instance.${facts.setter.method}(nextOpen, ${JSON.stringify(facts.setter.options ?? {})});
      });
      return () => {
        if (!instance) return;
        retainedOpen = externallyControlled ? undefined : instance.${facts.state.getter}();
        instance.destroy();
        instance = undefined;
      };
    });
  };
  const attachRef: Attachment<HTMLDivElement> = (element) => {
    const callback = ref;
    untrack(() => callback?.(element));
    return () => callback?.(null);
  };
</script>

<${facts.parts.root.defaultElement}
  {...rest}
  ${facts.attrs.root}=""
  data-sw-part="${facts.parts.root.name}"
  ${facts.attrs.defaultOpen}={initialDefaultOpen ? "true" : undefined}
  ${facts.attrs.closeOnEscape}={String(${closeOnEscape})}
  ${facts.attrs.closeOnOutsideInteract}={String(${closeOnOutsideInteract})}
  ${facts.attrs.modal}={String(${modal})}
  ${facts.attrs.rootState}={renderedOpen ? "open" : "closed"}
  {@attach attachRuntime}
  {@attach attachRef}
>
  {@render children?.(renderedOpen)}
</${facts.parts.root.defaultElement}>
`;
}

function printTrigger(facts: AdapterNativeOverlayFacts): string {
  const part = facts.parts.trigger;
  return printPart({
    facts,
    part,
    elementType: "HTMLButtonElement",
    htmlType: "HTMLButtonAttributes",
    extraProps: `${facts.props.targetId.name}?: ${facts.props.targetId.type};`,
    destructure: `${facts.props.targetId.name}, `,
    attributes: `${facts.attrs.trigger}=""\n  ${facts.attrs.triggerType}="button"\n  ${facts.attrs.triggerAriaHaspopup}="dialog"\n  ${facts.attrs.targetId}={${facts.props.targetId.name}}\n  ${facts.attrs.triggerState}="closed"`,
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
    attributes: `${facts.attrs.popup}=""\n  ${facts.attrs.popupState}="closed"${facts.attrs.popupRole && facts.popupRoleValue ? `\n  ${facts.attrs.popupRole}="${facts.popupRoleValue}"` : ""}`,
  });
}

function printClose(facts: AdapterNativeOverlayFacts): string {
  return printPart({
    facts,
    part: facts.parts.close,
    elementType: "HTMLButtonElement",
    htmlType: "HTMLButtonAttributes",
    attributes: `${facts.attrs.close}=""\n  ${facts.attrs.closeType}="button"`,
  });
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
  const attachRef: Attachment<${elementType}> = (element) => {
    const callback = ref;
    untrack(() => callback?.(element));
    return () => callback?.(null);
  };
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
