import {
  navigationInitialProjection,
  navigationItemOpen,
  navigationMenuConnection,
  navigationMenuFragments,
  navigationMenuPlan,
} from "../../shared-recipes/structured/navigation-menu.js";
import type {
  AdapterComponentFile,
  AdapterIndexFile,
  AdapterPrintedFile,
  AdapterSharedViewportNavigationFacts,
  AdapterSharedViewportNavigationPartName,
} from "../types.js";
import { printSvelteForwardedAttachments, printSvelteRefAttachment } from "./attachments.js";
import { printSvelteButtonChild } from "./button-child.js";
import { printSvelteOverlayPortal } from "./overlay-portal.js";

const NOTICE = "Svelte 5 public beta adapter output.";
type Facts = AdapterSharedViewportNavigationFacts;

export function printSvelteSharedViewportNavigationIndex(
  file: AdapterIndexFile,
): AdapterPrintedFile {
  if (file.family?.kind !== "shared-viewport-navigation")
    throw new TypeError("Svelte Navigation Menu index requires shared-viewport-navigation facts.");
  const f = file.family.facts;
  return {
    path: file.path,
    contents: `// ${NOTICE}
${f.index.importMembers.map(({ from, name }) => `import ${name} from "${from}.svelte";`).join("\n")}
const ${f.exports.namespace} = {
${f.index.namespaceMembers.map(({ key, name }) => `  ${key}: ${name},`).join("\n")}
};
export { ${f.exports.namespace}, ${f.index.importMembers.map(({ name }) => name).join(", ")} };
export default ${f.exports.namespace};
export type { ButtonChildProps, ButtonChildPayload } from "../button/ButtonRoot.svelte";
export type { ${f.index.typeExports.join(", ")} } from "${f.runtime.typeImportSource}";
`,
  };
}

export function printSvelteSharedViewportNavigationComponent(
  file: AdapterComponentFile,
): AdapterPrintedFile {
  if (file.component.family?.kind !== "shared-viewport-navigation")
    throw new TypeError(
      "Svelte Navigation Menu component requires shared-viewport-navigation facts.",
    );
  const { facts: f, part } = file.component.family;
  const contents =
    part === "root"
      ? printRoot(f)
      : part === "trigger"
        ? printTrigger(f)
        : part === "portal"
          ? printSvelteOverlayPortal(
              f,
              "getNavigationMenuContext",
              `element.parentElement?.closest<HTMLElement>("[${f.attrs.root}]") ?? element.parentElement ?? element`,
              true,
            )
          : printPart(f, part);
  return { path: `${file.path}.svelte`, contents: contents.replace(/[ \t]+$/gm, "") };
}

function printRoot(f: Facts): string {
  const event = f.valueControl.event;
  const initial = navigationInitialProjection("svelte", {
    readModel: "initialModel",
    readDefault: "untrack(() => defaultValue)",
    readDefaultCell: "initialDefault",
    readAccepted: "accepted",
    fallback: f.props.defaultValue.defaultValue ?? "null",
  });
  return `<!-- ${NOTICE} -->
<script module lang="ts">
  import { getContext } from "svelte";
  export type NavigationMenuPart = { element: HTMLElement; part: string; attributes?: Record<string, string | undefined> };
  export type NavigationMenuContext = {
    readonly value: string | null;
    readonly orientation: "horizontal" | "vertical";
    readonly mounted: boolean;
    isItemOpen(element: HTMLElement | null, value: string | undefined): boolean;
    registerPart(owner: symbol, part: NavigationMenuPart | null): void;
    registerContent(element: HTMLElement, carrier: HTMLElement): () => void;
    registerPortal(owner: symbol, element: HTMLElement | null, authoredParent?: HTMLElement, prepare?: () => () => void): void;
  };
  export type NavigationMenuItemContext = { readonly open: boolean };
  export const navigationMenuKey = Symbol("Navigation Menu root");
  export const navigationMenuItemKey = Symbol("Navigation Menu item");
  export function getNavigationMenuContext(): NavigationMenuContext | undefined { return getContext(navigationMenuKey); }
  export function getNavigationMenuItemContext(): NavigationMenuItemContext | undefined { return getContext(navigationMenuItemKey); }
</script>
<script lang="ts">
  import { ${f.runtime.factory}, createPortalBinding, readyPortalBindingSnapshot, type NavigationMenuInstance, type ${event.detailsType} } from "${f.runtime.importSource}";
  import { setContext, untrack, type Snippet } from "svelte";
  import type { Attachment } from "svelte/attachments";
  import type { HTMLAttributes } from "svelte/elements";
  type Props = Omit<HTMLAttributes<HTMLElement>, "children"> & {
    children?: Snippet<[string | null]>; value?: string | null; defaultValue?: string | null;
    openDelay?: number; closeDelay?: number; closeOnEscape?: boolean; closeOnOutsideInteract?: boolean;
    orientation?: "horizontal" | "vertical";
    ${event.callbackProp}?: (value: string | null, details: ${event.detailsType}) => void;
    ref?: (element: HTMLElement | null) => void;
  };
  let { children, value = $bindable(), defaultValue, openDelay = ${f.props.openDelay.defaultValue}, closeDelay = ${f.props.closeDelay.defaultValue}, closeOnEscape = ${f.props.closeOnEscape.defaultValue}, closeOnOutsideInteract = ${f.props.closeOnOutsideInteract.defaultValue}, orientation = ${f.props.orientation.defaultValue}, ${event.callbackProp}, ref, ...rest }: Props = $props();
  const initialModel = untrack(() => value);
  const initialDefault = untrack(() => defaultValue) ?? ${f.props.defaultValue.defaultValue};
  let accepted = $state<string | null>(${initial.acceptedSeed});
  let mounted = $state(false);
  let revision = $state(0);
  let rootElement: HTMLElement | undefined;
  let binding: ReturnType<typeof createPortalBinding> | undefined;
  let disconnectCurrent: (() => void) | undefined;
  const parts = new Map<symbol, NavigationMenuPart>();
  const contents = new Map<HTMLElement, HTMLElement>();
  const portals = new Map<symbol, { wrapper: HTMLElement; authoredParent: HTMLElement; prepare?: () => () => void }>();
  function restoreContents(): void {
    // The carrier has one Svelte-owned child. Remove retired Runtime scaffolding inside it.
    for (const [content, carrier] of contents) {
      carrier.append(content);
      for (const node of [...carrier.childNodes]) if (node !== content) node.remove();
    }
  }
  function beforeRemoval(element: HTMLElement): void {
    if ([...contents.keys()].some((content) => element.contains(content))) disconnectCurrent?.();
  }
  setContext<NavigationMenuContext>(navigationMenuKey, {
    get value() { return accepted; }, get orientation() { return orientation; }, get mounted() { return mounted; },
    isItemOpen(element, itemValue) {
      // Runtime also permits implicit item values. Its public state attribute identifies that item.
      const current = accepted;
      return ${navigationItemOpen("current", "itemValue", 'element?.getAttribute("data-state") === "open"')};
    },
    registerPart(owner, part) {
      const previous = parts.get(owner);
      if (!part && previous) beforeRemoval(previous.element);
      if (part) parts.set(owner, part); else parts.delete(owner);
      untrack(() => revision++);
    },
    registerContent(element, carrier) {
      contents.set(element, carrier);
      return () => { disconnectCurrent?.(); contents.delete(element); element.remove(); untrack(() => revision++); };
    },
    registerPortal(owner, element, authoredParent, prepare) {
      const previous = portals.get(owner);
      if (!element && previous) beforeRemoval(previous.wrapper);
      if (element && authoredParent) portals.set(owner, { wrapper: element, authoredParent, prepare }); else portals.delete(owner);
      if (rootElement) binding?.publish(readyPortalBindingSnapshot(rootElement, [...portals.values()]));
      untrack(() => revision++);
    },
  });
  const attachRuntime: Attachment<HTMLElement> = (root) => {
    rootElement = root;
    binding = createPortalBinding(root);
    binding.publish(readyPortalBindingSnapshot(root, [...portals.values()]));
    mounted = true;
    let alive = true;
    let queued = false;
    let current: { instance: NavigationMenuInstance; unsubscribe: () => void; initialized: boolean; captures: NavigationMenuPart[]; options: Options } | undefined;
    type Options = { revision: number; openDelay: number; closeDelay: number; closeOnEscape: boolean; closeOnOutsideInteract: boolean };
    let desired = untrack(() => ({ revision, ${navigationMenuPlan.options.join(", ")} }));
    function disconnect(): void {
      const owned = current?.instance; if (!owned) return;
      ${navigationMenuFragments("svelte", f).cleanup}
    }
    disconnectCurrent = disconnect;
    function queueConnection(): void {
      if (queued || !alive) return;
      queued = true;
      queueMicrotask(() => { queued = false; if (alive) untrack(connect); });
    }
    function connect(): void {
      if (!root.isConnected) return;
      ${navigationMenuConnection("svelte", f)}
    }
    $effect(() => {
      desired = { revision, ${navigationMenuPlan.options.join(", ")} };
      untrack(queueConnection);
    });
    $effect(() => {
      const next = value;
      if (next !== undefined && current?.initialized && !Object.is(current.instance.${f.valueControl.state.getter}(), next)) {
        untrack(() => { ${navigationMenuFragments("svelte", f).parentCommand} });
      }
    });
    return () => { alive = false; disconnect(); disconnectCurrent = undefined; mounted = false; binding?.destroy(); binding = undefined; rootElement = undefined; };
  };
  let elementProps = $derived({ ...rest });
${printSvelteRefAttachment("HTMLElement")}
</script>
<nav {...elementProps} ${f.attrs.root}="" data-sw-part="${f.parts.root.name}" ${f.attrs.openDelay}={openDelay} ${f.attrs.closeDelay}={closeDelay} ${f.attrs.closeOnEscape}={closeOnEscape} ${f.attrs.closeOnOutsideInteract}={closeOnOutsideInteract} ${f.attrs.orientation}={orientation} data-state="closed" {@attach attachRuntime} {@attach attachRef}>{@render children?.(${initial.rendered})}</nav>
`;
}

function printTrigger(f: Facts): string {
  return printSvelteButtonChild({
    name: f.exports.trigger,
    imports: `import { getNavigationMenuContext, getNavigationMenuItemContext } from "./${f.exports.root}.svelte";`,
    init: `const menu = getNavigationMenuContext(); const item = getNavigationMenuItemContext();
  let openDelay = $derived(allProps.openDelay); let closeDelay = $derived(allProps.closeDelay);
  $effect(() => {
    const element = currentElement; const attributes = { "${f.attrs.triggerOpenDelay}": openDelay === undefined ? undefined : String(openDelay), "${f.attrs.triggerCloseDelay}": closeDelay === undefined ? undefined : String(closeDelay) };
    if (!element) return;
    untrack(() => menu?.registerPart(owner, { element, part: "trigger", attributes }));
    return () => menu?.registerPart(owner, null);
  });`,
    extraProps: "openDelay?: number; closeDelay?: number;",
    omit: "openDelay: _openDelay, closeDelay: _closeDelay,",
    register: "return () => {};",
    attributes: `"${f.attrs.trigger}": "", type: "button", "${f.attrs.triggerOpenDelay}": openDelay, "${f.attrs.triggerCloseDelay}": closeDelay, "${f.attrs.disabled}": allProps.disabled ? "" : undefined, "aria-disabled": allProps.disabled ? true : undefined, "${f.trigger.disclosure.ariaHaspopup.attribute}": "${f.trigger.disclosure.ariaHaspopup.value}", "${f.trigger.disclosure.ariaExpanded}": !!item?.open, "data-state": item?.open ? "open" : "closed", "data-sw-part": "${f.parts.trigger.name}",`,
    independentAttachments: true,
  });
}

function printPart(
  f: Facts,
  part: Exclude<AdapterSharedViewportNavigationPartName, "root" | "trigger" | "portal">,
): string {
  const tag = f.parts[part].defaultElement;
  const elementType =
    part === "list"
      ? "HTMLUListElement"
      : part === "item"
        ? "HTMLLIElement"
        : part === "link"
          ? "HTMLAnchorElement"
          : part === "icon"
            ? "HTMLSpanElement"
            : "HTMLDivElement";
  const extra =
    part === "item"
      ? "value?: string;"
      : part === "link"
        ? "active?: boolean; closeOnClick?: boolean;"
        : part === "popup"
          ? `side?: ${f.floating.side.type}; align?: ${f.floating.align.type};`
          : part === "positioner"
            ? Object.entries(f.floating)
                .map(([name, prop]) => `${name}?: ${prop.type};`)
                .join(" ")
            : "";
  const defaults =
    part === "item"
      ? "value,"
      : part === "link"
        ? `active = ${f.link.active.prop.defaultValue}, closeOnClick = ${f.link.closeOnClick.prop.defaultValue},`
        : part === "popup"
          ? `side = ${f.floating.side.defaultValue}, align = ${f.floating.align.defaultValue},`
          : part === "positioner"
            ? Object.entries(f.floating)
                .map(([name, prop]) => `${name} = ${prop.defaultValue}`)
                .join(", ") + ","
            : "";
  const attributes =
    part === "item"
      ? `{ "${f.attrs.itemValue}": value }`
      : part === "positioner"
        ? `{ ${Object.keys(f.floating)
            .map((name) => `"${f.attrs[name as keyof Facts["attrs"]]}": String(${name})`)
            .join(", ")} }`
        : part === "popup"
          ? `{ "${f.attrs.side}": side, "${f.attrs.align}": align }`
          : "{}";
  const markup =
    part === "item"
      ? `${f.attrs.itemValue}={value} data-state={open ? "open" : "closed"}`
      : part === "list"
        ? `${f.attrs.orientation}={menu?.orientation}`
        : part === "link"
          ? `${f.attrs.active}={active ? "" : undefined} ${f.link.active.ariaCurrentAttribute}={active ? "${f.link.active.ariaCurrentValue}" : undefined} ${f.attrs.linkCloseOnClick}={closeOnClick ? undefined : "${f.link.closeOnClick.falseValue}"}`
          : part === "positioner"
            ? `data-state="closed" ${Object.keys(f.floating)
                .map((name) => `${f.attrs[name as keyof Facts["attrs"]]}={${name}}`)
                .join(" ")}`
            : part === "popup"
              ? `data-state="closed" ${f.attrs.side}={side} ${f.attrs.align}={align} hidden`
              : part === "content"
                ? `data-state={item?.open ? "open" : "closed"} hidden`
                : part === "viewport"
                  ? `data-state="closed" hidden`
                  : part === "icon"
                    ? `aria-hidden="true" data-state={item?.open ? "open" : "closed"}`
                    : `aria-hidden="true" data-state="closed"`;
  return `<!-- ${NOTICE} -->
<script lang="ts">
  import { ${part === "item" ? "setContext, " : ""}untrack, type Snippet } from "svelte";
  import type { Attachment } from "svelte/attachments";
  import type { ${part === "link" ? "HTMLAnchorAttributes" : "HTMLAttributes"} } from "svelte/elements";
  import { getNavigationMenuContext, getNavigationMenuItemContext${part === "item" ? ", navigationMenuItemKey, type NavigationMenuItemContext" : ""} } from "./${f.exports.root}.svelte";
  type Props = Omit<${part === "link" ? "HTMLAnchorAttributes" : `HTMLAttributes<${elementType}>`}, "children"${part === "item" ? ' | "value"' : ""}> & { children?: Snippet; ${extra} ref?: (element: ${elementType} | null) => void };
  let { children, ${defaults} ref, ...rest }: Props = $props();
  const menu = getNavigationMenuContext(); const item = getNavigationMenuItemContext();
  const owner = Symbol("${f.exports[part]} owner");
${
  part === "item"
    ? `  let currentElement = $state.raw<HTMLLIElement | null>(null);
  let open = $derived(menu?.isItemOpen(currentElement, value) ?? false);
  setContext<NavigationMenuItemContext>(navigationMenuItemKey, { get open() { return open; } });
`
    : ""
}  const attachPart: Attachment<${elementType}> = (element) => {
${part === "item" ? "    currentElement = element;\n" : ""}${part === "content" ? "    const releaseContent = untrack(() => menu?.registerContent(element, element.parentElement!));\n" : ""}    $effect(() => {
      const attributes = ${attributes};
      untrack(() => menu?.registerPart(owner, { element, part: "${part}", attributes }));
      return () => menu?.registerPart(owner, null);
    });
    return () => { ${part === "item" ? "currentElement = null;" : part === "content" ? "releaseContent?.();" : ""} };
  };
  let elementProps = $derived({ ...rest });
${printSvelteRefAttachment(elementType)}
</script>
${part === "content" ? '<div style="display: contents" data-sw-nav-menu-content-carrier>\n  ' : ""}<${tag} {...elementProps} ${f.attrs[part]}="" data-sw-part="${f.parts[part].name}" ${markup} {@attach attachPart} {@attach attachRef}>{@render children?.()}</${tag}>${part === "content" ? "\n</div>" : ""}
`;
}
