import { initialCheckedValue, initialModelValue } from "../../shared-recipes/initial-state.js";
import {
  menuConnection,
  menuFragments,
  menuInitialProjection,
  menuPlan,
} from "../../shared-recipes/structured/menu.js";
import {
  menuCheckedProjection,
  menuItemHandler,
  menuLinkHref,
  menuRadioChecked,
  menuRadioProjection,
} from "../../shared-recipes/structured/menu-items.js";
import type {
  AdapterAnchoredMenuOverlayFacts,
  AdapterComponentFile,
  AdapterCompositeMenuOverlayFacts,
  AdapterCompositeMenuOverlayPartName,
  AdapterIndexFile,
  AdapterPrintedFile,
} from "../types.js";
import { printSvelteRefAttachment } from "./attachments.js";
import { printSvelteButtonChild } from "./button-child.js";
import { printSvelteOverlayPortal } from "./overlay-portal.js";

const NOTICE = "Svelte 5 public beta adapter output.";
type Facts = AdapterCompositeMenuOverlayFacts;

export function printSvelteCompositeMenuOverlayIndex(file: AdapterIndexFile): AdapterPrintedFile {
  if (file.family?.kind !== "composite-menu-overlay")
    throw new TypeError("Svelte Menu index requires composite-menu-overlay facts.");
  const { facts } = file.family;
  return {
    path: file.path,
    contents: `// ${NOTICE}
${facts.index.importMembers.map(({ from, name }) => `import ${name} from "${from}.svelte";`).join("\n")}
const ${facts.exports.namespace} = {
${facts.index.namespaceMembers.map(({ key, name }) => `  ${key}: ${name},`).join("\n")}
};
export { ${facts.exports.namespace}, ${facts.index.importMembers.map(({ name }) => name).join(", ")} };
export default ${facts.exports.namespace};
export type { ButtonChildProps, ButtonChildPayload } from "../button/ButtonRoot.svelte";
export type { ${facts.index.typeExports.join(", ")} } from "${facts.runtime.typeImportSource}";
`,
  };
}

export function printSvelteCompositeMenuOverlayComponent(
  file: AdapterComponentFile,
): AdapterPrintedFile {
  if (file.component.family?.kind !== "composite-menu-overlay")
    throw new TypeError("Svelte Menu component requires composite-menu-overlay facts.");
  const { facts, part } = file.component.family;
  const contents =
    part === "root"
      ? printSvelteMenuRoot(facts)
      : part === "trigger"
        ? printTrigger(facts)
        : part === "portal"
          ? printSvelteOverlayPortal(
              facts,
              "getMenuOwnerContext",
              `element.parentElement?.closest<HTMLElement>("[${facts.attrs.submenuRoot}], [${facts.attrs.root}]") ?? element.parentElement ?? element`,
              true,
            )
          : part === "submenuRoot"
            ? printSubmenuRoot(facts)
            : part === "checkboxItem" || part === "radioGroup"
              ? printItemModel(facts, part)
              : part === "radioItem"
                ? printRadioItem(facts)
                : part === "checkboxItemIndicator" || part === "radioItemIndicator"
                  ? printIndicator(facts, part)
                  : printPart(facts, part);
  return { contents: contents.replace(/[ \t]+$/gm, ""), path: `${file.path}.svelte` };
}

export function printSvelteMenuRoot(f: Facts | AdapterAnchoredMenuOverlayFacts): string {
  const openEvent = f.events.openChange;
  const initial = menuInitialProjection("svelte", {
    readModel: "initialModel",
    readDefault: "untrack(() => defaultOpen)",
    readDefaultCell: "initialDefault",
    readAccepted: "accepted",
    fallback: f.props.defaultOpen.defaultValue ?? "false",
  });
  const closeEvent = f.events.closeComplete;
  const contextMenu = "menuRoot" in f.attrs ? (f as AdapterAnchoredMenuOverlayFacts) : undefined;
  const hover = "openOnHover" in f.props ? (f as Facts) : undefined;
  return `<!-- ${NOTICE} -->
${
  contextMenu
    ? ""
    : `<script module lang="ts">
  import { getContext } from "svelte";
  export type MenuPart = { element: HTMLElement; scope: symbol; part: string; attributes?: Record<string, string> };
  export type MenuItemModel = { prepare(): void; accept(): void };
  export type MenuTreeContext = {
    registerPart(owner: symbol, part: MenuPart | null): void;
    registerModel(owner: symbol, model: MenuItemModel | null): void;
    beginTransaction?(): () => void;
    readonly mounted: boolean;
  };
  export type MenuOwnerContext = {
    readonly scope: symbol;
    readonly open: boolean;
    readonly mounted: boolean;
    registerPortal(owner: symbol, element: HTMLElement | null, authoredParent?: HTMLElement, prepare?: () => () => void): void;
  };
  export const menuTreeKey = Symbol("Menu tree");
  export const menuOwnerKey = Symbol("Menu surface owner");
  export const menuRadioKey = Symbol("Menu radio group");
  export const menuCheckedKey = Symbol("Menu item checked");
  export function getMenuTreeContext(): MenuTreeContext | undefined { return getContext(menuTreeKey); }
  export function getMenuOwnerContext(): MenuOwnerContext | undefined { return getContext(menuOwnerKey); }
  export function getMenuRadioContext(): { readonly value: string | undefined } | undefined { return getContext(menuRadioKey); }
  export function getMenuCheckedContext(): { readonly checked: boolean } | undefined { return getContext(menuCheckedKey); }
</script>`
}
<script lang="ts">
  import { ${f.runtime.factory}, ${contextMenu ? "" : "createPortalBinding, readyPortalBindingSnapshot, "}type ${openEvent.detailsType}, type ${closeEvent.detailsType} } from "${f.runtime.importSource}";
${
  contextMenu
    ? `  import { createPortalBinding, readyPortalBindingSnapshot } from "${contextMenu.runtime.portalOwner.importSource}";
  import { menuTreeKey, menuOwnerKey, type MenuPart, type MenuItemModel, type MenuTreeContext, type MenuOwnerContext } from "../menu/MenuRoot.svelte";
`
    : ""
}  import { setContext, untrack, type Snippet } from "svelte";
  import type { Attachment } from "svelte/attachments";
  import type { HTMLAttributes } from "svelte/elements";
  type Props = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
    children?: Snippet<[boolean]>; open?: boolean; defaultOpen?: boolean;
    disabled?: boolean; modal?: boolean; ${hover ? "openOnHover?: boolean; " : ""}closeDelay?: number;
    ${openEvent.callbackProp}?: (open: boolean, detail: ${openEvent.detailsType}) => void;
    ${closeEvent.callbackProp}?: (detail: ${closeEvent.detailsType}) => void;
    ref?: (element: HTMLDivElement | null) => void;
  };
  let { children, open = $bindable(), defaultOpen, disabled = ${f.props.disabled.defaultValue}, modal = ${f.props.modal.defaultValue}, ${hover ? `openOnHover = ${hover.props.openOnHover.defaultValue}, ` : ""}closeDelay = ${f.props.closeDelay.defaultValue}, ${openEvent.callbackProp}, ${closeEvent.callbackProp}, ref, ...rest }: Props = $props();
  const initialModel = untrack(() => open);
  const initialDefault = ${initial.defaultSeed};
  let accepted = $state(${initial.acceptedSeed});
  let mounted = $state(false);
  let revision = $state(0);
  const scope = Symbol("Menu root scope");
  const parts = new Map<symbol, MenuPart>();
  const models = new Map<symbol, MenuItemModel>();
  const portals = new Map<symbol, { wrapper: HTMLElement; authoredParent: HTMLElement; prepare?: () => () => void }>();
  let binding: ReturnType<typeof createPortalBinding> | undefined;
  let rootElement: HTMLDivElement | undefined;
  setContext<MenuTreeContext>(menuTreeKey, {
    get mounted() { return mounted; },
    registerPart(owner, part) { if (part) parts.set(owner, part); else parts.delete(owner); untrack(() => revision++); },
    registerModel(owner, model) { if (model) models.set(owner, model); else models.delete(owner); },
  });
  setContext<MenuOwnerContext>(menuOwnerKey, {
    scope, get open() { return accepted; }, get mounted() { return mounted; },
    registerPortal(owner, element, authoredParent, prepare) {
      if (element && authoredParent) portals.set(owner, { wrapper: element, authoredParent, prepare }); else portals.delete(owner);
      if (rootElement) binding?.publish(readyPortalBindingSnapshot(rootElement, [...portals.values()]));
      untrack(() => revision++);
    },
  });
  const attachRuntime: Attachment<HTMLDivElement> = (root) => {
    rootElement = root;
    binding = createPortalBinding(root);
    binding.publish(readyPortalBindingSnapshot(root, [...portals.values()]));
    mounted = true;
    let instance: ReturnType<typeof ${f.runtime.factory}> | undefined;
    $effect(() => {
      revision;
      ${menuPlan[contextMenu ? "contextMenu" : "menu"].options.map((name) => `void ${name};`).join(" ")}
      return untrack(() => {
        ${menuConnection("svelte", contextMenu ? "contextMenu" : "menu")}
        return () => { ${menuFragments("svelte", contextMenu ? "contextMenu" : "menu").cleanup} };
      });
    });
    $effect(() => { void open; untrack(() => { ${menuFragments("svelte", contextMenu ? "contextMenu" : "menu").parentCommand} }); });
    return () => { mounted = false; binding?.destroy(); binding = undefined; rootElement = undefined; };
  };
${printSvelteRefAttachment("HTMLDivElement")}
</script>
<div {...rest} ${f.attrs.root}="" ${contextMenu ? `${contextMenu.attrs.menuRoot}="" ` : ""}data-sw-part="${f.parts.root.name}" ${f.attrs.defaultOpen}={initialDefault ? "true" : undefined} ${f.attrs.disabled}={disabled ? "" : undefined} ${f.attrs.modal}={String(modal)} ${hover ? `${hover.attrs.openOnHover}={openOnHover ? "" : undefined} ` : ""}${f.attrs.closeDelay}={closeDelay} data-state={${initial.rendered} ? "open" : "closed"} {@attach attachRuntime} {@attach attachRef}>
  {@render children?.(accepted)}
</div>
`;
}

function printTrigger(f: Facts): string {
  return printSvelteButtonChild({
    name: f.exports.trigger,
    imports: `import { getMenuTreeContext, getMenuOwnerContext } from "./${f.exports.root}.svelte";`,
    init: "const tree = getMenuTreeContext(); const menu = getMenuOwnerContext();",
    register: `tree?.registerPart(owner, { element: root, scope: menu!.scope, part: "trigger" }); return () => tree?.registerPart(owner, null);`,
    attributes: `"${f.attrs.trigger}": "", type: "button", "aria-haspopup": "menu", "aria-expanded": !!menu?.open, "data-state": menu?.open ? "open" : "closed", "data-sw-part": "${f.parts.trigger.name}",`,
    independentAttachments: true,
  });
}

function printSubmenuRoot(f: Facts): string {
  return `<!-- ${NOTICE} -->
<script lang="ts">
  import { createPortalBinding, readyPortalBindingSnapshot } from "${f.runtime.importSource}";
  import { setContext, untrack, type Snippet } from "svelte";
  import type { Attachment } from "svelte/attachments";
  import type { HTMLAttributes } from "svelte/elements";
  import { getMenuTreeContext, menuOwnerKey, type MenuOwnerContext } from "./${f.exports.root}.svelte";
  type Props = Omit<HTMLAttributes<HTMLDivElement>, "children"> & { children?: Snippet; closeDelay?: number; ref?: (element: HTMLDivElement | null) => void };
  let { children, closeDelay = ${f.submenu.root.closeDelay.defaultValue}, ref, ...rest }: Props = $props();
  const tree = getMenuTreeContext();
  const scope = Symbol("Menu submenu scope");
  const portals = new Map<symbol, { wrapper: HTMLElement; authoredParent: HTMLElement; prepare?: () => () => void }>();
  let binding: ReturnType<typeof createPortalBinding> | undefined;
  let rootElement: HTMLDivElement | undefined;
  setContext<MenuOwnerContext>(menuOwnerKey, {
    scope, get open() { return false; }, get mounted() { return tree?.mounted ?? false; },
    registerPortal(owner, element, authoredParent, prepare) {
      if (element && authoredParent) portals.set(owner, { wrapper: element, authoredParent, prepare }); else portals.delete(owner);
      if (rootElement) binding?.publish(readyPortalBindingSnapshot(rootElement, [...portals.values()]));
    },
  });
  const attachOwner: Attachment<HTMLDivElement> = (element) => {
    rootElement = element;
    binding = createPortalBinding(element);
    binding.publish(readyPortalBindingSnapshot(element, [...portals.values()]));
    $effect(() => {
      const attributes = { "${f.attrs.closeDelay}": String(closeDelay) };
      untrack(() => tree?.registerPart(scope, { element, scope, part: "submenuRoot", attributes }));
      return () => tree?.registerPart(scope, null);
    });
    return () => { binding?.destroy(); binding = undefined; rootElement = undefined; };
  };
${printSvelteRefAttachment("HTMLDivElement")}
</script>
<div {...rest} ${f.attrs.submenuRoot}="" data-sw-part="${f.parts.submenuRoot.name}" ${f.attrs.closeDelay}={closeDelay} data-state="closed" {@attach attachOwner} {@attach attachRef}>{@render children?.()}</div>
`;
}

function printItemModel(f: Facts, part: "checkboxItem" | "radioGroup"): string {
  const checkbox = part === "checkboxItem";
  const recipe = checkbox ? f.checkboxItem : f.radioGroup;
  const event = recipe.event;
  const model = checkbox ? "checked" : "value";
  const type = checkbox ? "boolean" : "string";
  const fallback = checkbox ? " ?? false" : "";
  const read = checkbox
    ? 'element.getAttribute("aria-checked") === "true"'
    : `element.getAttribute("${f.attrs.radioGroupValue}") ?? undefined`;
  return `<!-- ${NOTICE} -->
<script lang="ts">
  import type { ${event.detailsType} } from "${f.runtime.importSource}";
  import { setContext, untrack, type Snippet } from "svelte";
  import type { Attachment } from "svelte/attachments";
  import type { HTMLAttributes } from "svelte/elements";
  import { getMenuTreeContext, ${checkbox ? "menuCheckedKey" : "menuRadioKey"} } from "./${f.exports.root}.svelte";
  type Props = Omit<HTMLAttributes<HTMLDivElement>, "children"${checkbox ? "" : ' | "defaultValue"'}> & {
    children?: Snippet; ${model}?: ${type}; ${checkbox ? "defaultChecked?: boolean; disabled?: boolean; closeOnClick?: boolean" : "defaultValue?: string"};
    ${event.callbackProp}?: (${model}: ${type}, detail: ${event.detailsType}) => void;
    ref?: (element: HTMLDivElement | null) => void;
  };
  let { children, ${model} = $bindable(), ${checkbox ? "defaultChecked, disabled = false, closeOnClick = false" : "defaultValue"}, ${event.callbackProp}, ref, ...rest }: Props = $props();
  const initial = untrack(() => ${model});
  let accepted = $state(${initialModelValue("initial", `untrack(() => ${checkbox ? "defaultChecked" : "defaultValue"})`)}${fallback});
  const tree = getMenuTreeContext();
  const owner = Symbol("${f.exports[part]} model");
  setContext(${checkbox ? "menuCheckedKey" : "menuRadioKey"}, { get ${model}() { return accepted; } });
  const attachModel: Attachment<HTMLDivElement> = (element) => {
    let alive = true;
    function project(next: ${type} | undefined): void {
      ${
        checkbox
          ? `if (next === undefined) return;
      ${menuCheckedProjection(f, "element", "next", "checkboxItem")}`
          : `if (next === undefined) return;
      ${menuRadioProjection(f, "element", "next")}`
      }
    }
    function prepare(): void {
      if (${model} !== undefined) accepted = ${model};
      project(accepted);
    }
    function accept(): void { if (alive) accepted = ${read}; }
    function handle(event: Event): void { ${menuItemHandler("svelte", part)} }
    untrack(prepare);
    tree?.registerModel(owner, {prepare,accept});
    element.addEventListener("${event.domEvent}",handle);
    $effect(() => { void ${model}; untrack(prepare); });
    return () => { alive = false; tree?.registerModel(owner, null); element.removeEventListener("${event.domEvent}", handle); };
  };
${printSvelteRefAttachment("HTMLDivElement")}
</script>
<div {...rest} ${f.parts[part].discoveryAttribute}="" data-sw-part="${f.parts[part].name}" role="${recipe.role}" ${checkbox ? `tabindex="0" aria-checked={accepted} data-checked={accepted ? "" : undefined} data-unchecked={accepted ? undefined : ""} data-default-checked={accepted ? "true" : undefined} data-close-on-click={String(closeOnClick)} aria-disabled={disabled ? "true" : undefined} data-disabled={disabled ? "" : undefined}` : `${f.attrs.radioGroupValue}={accepted}`} {@attach attachModel} {@attach attachRef}>{@render children?.()}</div>
`;
}

function printRadioItem(f: Facts): string {
  return `<!-- ${NOTICE} -->
<script lang="ts">
  import { setContext, untrack, type Snippet } from "svelte";
  import type { Attachment } from "svelte/attachments";
  import type { HTMLAttributes } from "svelte/elements";
  import { getMenuRadioContext, menuCheckedKey } from "./${f.exports.root}.svelte";
  type Props = Omit<HTMLAttributes<HTMLDivElement>, "children"> & { children?: Snippet; value: string; checked?: boolean; defaultChecked?: boolean; disabled?: boolean; closeOnClick?: boolean; ref?: (element: HTMLDivElement | null) => void };
  let { children, value, checked, defaultChecked = false, disabled = false, closeOnClick = false, ref, ...rest }: Props = $props();
  const group = getMenuRadioContext();
  const initialDefault = untrack(() => defaultChecked);
  let accepted = $derived(${menuRadioChecked("group?.value", "value", initialCheckedValue("checked", "initialDefault"))});
  setContext(menuCheckedKey, { get checked() { return accepted; } });
${printSvelteRefAttachment("HTMLDivElement")}
</script>
<div {...rest} ${f.attrs.radioItem}="" data-sw-part="${f.parts.radioItem.name}" role="${f.radioItem.role}" tabindex="0" ${f.attrs.radioItemValue}={value} ${f.attrs.radioItemDefaultChecked}={initialDefault ? "true" : undefined} ${f.attrs.radioItemCloseOnClick}={String(closeOnClick)} aria-checked={accepted} data-checked={accepted ? "" : undefined} data-unchecked={accepted ? undefined : ""} aria-disabled={disabled ? "true" : undefined} data-disabled={disabled ? "" : undefined} {@attach attachRef}>{@render children?.()}</div>
`;
}

function printIndicator(f: Facts, part: "checkboxItemIndicator" | "radioItemIndicator"): string {
  return `<!-- ${NOTICE} -->
<script lang="ts">
  import { untrack, type Snippet } from "svelte";
  import type { Attachment } from "svelte/attachments";
  import type { HTMLAttributes } from "svelte/elements";
  import { getMenuCheckedContext } from "./${f.exports.root}.svelte";
  type Props = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & { children?: Snippet; ref?: (element: HTMLSpanElement | null) => void };
  let { children, ref, ...rest }: Props = $props();
  const item = getMenuCheckedContext();
${printSvelteRefAttachment("HTMLSpanElement")}
</script>
<span {...rest} ${f.parts[part].discoveryAttribute}="" data-sw-part="${f.parts[part].name}" aria-hidden="true" data-state={item?.checked ? "checked" : "unchecked"} data-visible={item?.checked ? "" : undefined} data-hidden={item?.checked ? undefined : ""} {@attach attachRef}>{@render children?.()}</span>
`;
}

function printPart(
  f: Facts,
  name: Exclude<
    AdapterCompositeMenuOverlayPartName,
    | "root"
    | "trigger"
    | "portal"
    | "submenuRoot"
    | "checkboxItem"
    | "radioGroup"
    | "radioItem"
    | "checkboxItemIndicator"
    | "radioItemIndicator"
  >,
): string {
  const part = f.parts[name];
  const floating = name === "popup" || name === "positioner";
  const interactive = name === "item" || name === "linkItem" || name === "submenuTrigger";
  const capture = floating || name === "submenuTrigger";
  const type =
    part.defaultElement === "span"
      ? "HTMLSpanElement"
      : part.defaultElement === "a"
        ? "HTMLAnchorElement"
        : "HTMLDivElement";
  const native = part.defaultElement === "a" ? "HTMLAnchorAttributes" : `HTMLAttributes<${type}>`;
  const branch =
    name in f.staticBranches ? f.staticBranches[name as keyof typeof f.staticBranches] : undefined;
  const attributes = [
    `${part.discoveryAttribute}=""`,
    `data-sw-part="${part.name}"`,
    ...(floating
      ? [
          `data-state="closed"`,
          `${f.attrs.side}={side}`,
          `${f.attrs.align}={align}`,
          `${f.attrs.sideOffset}={sideOffset}`,
          `${f.attrs.avoidCollisions}={String(avoidCollisions)}`,
        ]
      : []),
    ...(name === "popup" ? ['role="menu"', 'tabindex="-1"', "hidden"] : []),
    ...(branch?.role ? [`role="${branch.role}"`] : []),
    ...(name === "linkItem" ? [`href={${menuLinkHref("disabled", "href")}}`] : []),
    ...(name === "separator" ? ['aria-orientation="horizontal"'] : []),
    ...(interactive
      ? [
          'tabindex="0"',
          'aria-disabled={disabled ? "true" : undefined}',
          'data-disabled={disabled ? "" : undefined}',
        ]
      : []),
    ...(name === "item" || name === "linkItem"
      ? ["data-close-on-click={String(closeOnClick)}"]
      : []),
    ...(name === "submenuTrigger"
      ? ['role="menuitem"', 'aria-haspopup="menu"', 'aria-expanded="false"', 'data-state="closed"']
      : []),
  ];
  return `<!-- ${NOTICE} -->
<script lang="ts">
  import { untrack, type Snippet } from "svelte";
  import type { Attachment } from "svelte/attachments";
  import type { ${part.defaultElement === "a" ? "HTMLAnchorAttributes" : "HTMLAttributes"} } from "svelte/elements";
${capture ? `  import { getMenuTreeContext, getMenuOwnerContext } from "./${f.exports.root}.svelte";` : ""}
  type Props = Omit<${native}, "children"> & { children?: Snippet; ref?: (element: ${type} | null) => void; ${floating ? `side?: ${f.props.side.type}; align?: ${f.props.align.type}; sideOffset?: number; avoidCollisions?: boolean;` : ""} ${interactive ? "disabled?: boolean;" : ""} ${name === "item" || name === "linkItem" ? "closeOnClick?: boolean;" : ""} };
  let { children, ref, ${name === "linkItem" ? "href," : ""} ${floating ? `side = ${f.floating.sideDefault}, align = ${f.floating.alignDefault}, sideOffset = ${f.floating.sideOffsetDefault}, avoidCollisions = ${f.floating.avoidCollisionsDefault},` : ""} ${interactive ? "disabled = false," : ""} ${name === "item" || name === "linkItem" ? `closeOnClick = ${f.staticBranches[name].closeOnClick.defaultValue},` : ""} ...rest }: Props = $props();
${
  capture
    ? `  const tree = getMenuTreeContext(); const menu = getMenuOwnerContext(); const owner = Symbol("${part.name}");
  const attachPart: Attachment<${type}> = (element) => {
    $effect(() => {
      const attributes = ${floating ? `{ "${f.attrs.side}": side, "${f.attrs.align}": align, "${f.attrs.sideOffset}": String(sideOffset), "${f.attrs.avoidCollisions}": String(avoidCollisions) }` : "undefined"};
      untrack(() => tree?.registerPart(owner, { element, scope: menu!.scope, part: "${name}", attributes }));
      return () => tree?.registerPart(owner, null);
    });
  };`
    : ""
}
${printSvelteRefAttachment(type)}
</script>
<${part.defaultElement} {...rest} ${attributes.join(" ")} ${capture ? "{@attach attachPart}" : ""} {@attach attachRef}>{@render children?.()}</${part.defaultElement}>
`;
}
