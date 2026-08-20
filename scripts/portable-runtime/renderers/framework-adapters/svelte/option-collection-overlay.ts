import type {
  AdapterComponentFile,
  AdapterIndexFile,
  AdapterOptionCollectionOverlayFacts,
  AdapterOptionCollectionOverlayPartName,
  AdapterPrintedFile,
} from "../types.js";

const NON_SHIPPING_COMMENT =
  "Internal non-shipping Svelte proof output. Do not publish, expose through the CLI registry, claim in public docs, or copy into public demo dependencies.";

export function printSvelteOptionCollectionOverlayComponent(
  file: AdapterComponentFile,
): AdapterPrintedFile {
  const family = file.component.family;
  if (family?.kind !== "option-collection-overlay") {
    throw new TypeError("Svelte option-collection-overlay projection requires family facts.");
  }
  assertFacts(family.facts);
  const printers: Record<
    AdapterOptionCollectionOverlayPartName,
    (facts: AdapterOptionCollectionOverlayFacts) => string
  > = {
    root: printRoot,
    label: (facts) => printSimplePart(facts, "label"),
    trigger: printTrigger,
    value: printValue,
    icon: (facts) => printSimplePart(facts, "icon", 'aria-hidden="true"'),
    portal: printPortal,
    positioner: (facts) => printFloatingPart(facts, "positioner"),
    popup: (facts) => printFloatingPart(facts, "popup"),
    list: (facts) => printSimplePart(facts, "list"),
    group: (facts) => printSimplePart(facts, "group", 'role="group"'),
    groupLabel: (facts) => printSimplePart(facts, "groupLabel"),
    item: printItem,
    itemText: (facts) => printSimplePart(facts, "itemText"),
    itemIndicator: printItemIndicator,
    separator: (facts) =>
      printSimplePart(facts, "separator", 'role="separator" aria-orientation="horizontal"'),
    scrollUpArrow: (facts) => printSimplePart(facts, "scrollUpArrow", 'aria-hidden="true" hidden'),
    scrollDownArrow: (facts) =>
      printSimplePart(facts, "scrollDownArrow", 'aria-hidden="true" hidden'),
  };
  return { contents: printers[family.part](family.facts), path: `${file.path}.svelte` };
}

export function printSvelteOptionCollectionOverlayIndex(
  file: AdapterIndexFile,
): AdapterPrintedFile {
  const family = file.family;
  if (family?.kind !== "option-collection-overlay") {
    throw new TypeError("Svelte option-collection-overlay index requires family facts.");
  }
  const { facts } = family;
  const imports = facts.index.importMembers
    .map((member) => `import ${member.name} from "${member.from}.svelte";`)
    .join("\n");
  const named = facts.index.importMembers
    .map((member) => `export { default as ${member.name} } from "${member.from}.svelte";`)
    .join("\n");
  const namespace = facts.index.namespaceMembers
    .map((member) => `  ${member.key}: ${member.name},`)
    .join("\n");
  const contextExports = `export type { ${facts.context.rootContextValueType}, ${facts.context.itemContextValueType} } from "./${facts.exports.root}.svelte";
export { ${facts.context.rootContext}, ${facts.context.itemContext}, ${facts.context.useRootContext}, ${facts.context.useItemContext} } from "./${facts.exports.root}.svelte";`;
  return {
    contents: `${imports}\n\n${contextExports}\n\nconst ${facts.exports.namespace} = {\n${namespace}\n};\n\n${named}\nexport { ${facts.exports.namespace} };\nexport default ${facts.exports.namespace};\nexport type { ${facts.events.openChange.detailsType}, ${facts.events.valueChange.detailsType} } from "${facts.runtime.importSource}";\n`,
    path: file.path,
  };
}

function printRoot(facts: AdapterOptionCollectionOverlayFacts): string {
  const openModel = requireModel(facts, "open");
  const valueModel = requireModel(facts, "value");
  const itemAttribute = facts.attrs[facts.collection.selectedLabel.itemPart];
  const itemTextAttribute = facts.attrs[facts.collection.selectedLabel.itemTextPart];
  return `<!-- ${NON_SHIPPING_COMMENT} -->
<script module lang="ts">
  import { getContext } from "svelte";

  export type ${facts.context.rootContextValueType} = Readonly<{
    disabled: boolean;
    mounted: boolean;
    open: boolean;
    readOnly: boolean;
    registerPortal(owner: symbol, element: HTMLElement | null): void;
    required: boolean;
    selectedLabel: string | null;
    value: string | null;
  }>;
  export type ${facts.context.itemContextValueType} = Readonly<{
    disabled: boolean;
    value: string;
  }>;
  export const ${facts.context.rootContext}: symbol = Symbol("Starwind ${facts.context.rootContext}");
  export const ${facts.context.itemContext}: symbol = Symbol("Starwind ${facts.context.itemContext}");
  export function ${facts.context.useRootContext}(part = "part"): ${facts.context.rootContextValueType} {
    const value = getContext<${facts.context.rootContextValueType} | undefined>(${facts.context.rootContext});
    if (!value) throw new Error("${facts.displayName}." + part + " requires an owning ${facts.displayName}.Root.");
    return value;
  }
  export function ${facts.context.useItemContext}(part = "part"): ${facts.context.itemContextValueType} {
    const value = getContext<${facts.context.itemContextValueType} | undefined>(${facts.context.itemContext});
    if (!value) throw new Error("${facts.displayName}." + part + " requires an owning ${facts.displayName}.Item.");
    return value;
  }
</script>

<script lang="ts">
  import {
    ${facts.runtime.factory},
    type ${facts.events.openChange.detailsType},
    type ${facts.events.valueChange.detailsType},
  } from "${facts.runtime.importSource}";
  import { setContext, untrack, type Snippet } from "svelte";
  import type { Attachment } from "svelte/attachments";
  import type { HTMLAttributes, HTMLInputAttributes } from "svelte/elements";

  type NativeProps = Omit<HTMLAttributes<HTMLDivElement>, "children" | "form" | "open" | "value">;
  type Props = NativeProps & {
    children?: Snippet;
    ${facts.props.autoComplete.name}?: ${facts.props.autoComplete.type};
    ${facts.props.defaultOpen.name}?: ${facts.props.defaultOpen.type};
    ${facts.props.defaultValue.name}?: ${facts.props.defaultValue.type};
    ${facts.props.disabled.name}?: ${facts.props.disabled.type};
    ${facts.props.form.name}?: ${facts.props.form.type};
    ${facts.props.highlightItemOnHover.name}?: ${facts.props.highlightItemOnHover.type};
    ${facts.props.modal.name}?: ${facts.props.modal.type};
    ${facts.props.name.name}?: ${facts.props.name.type};
    open?: ${facts.props.open.type};
    ${facts.events.openChange.callbackProp}?: (open: ${facts.events.openChange.valueType}, detail: ${facts.events.openChange.detailsType}) => void;
    ${facts.props.readOnly.name}?: ${facts.props.readOnly.type};
    ref?: (element: HTMLDivElement | null) => void;
    ${facts.props.required.name}?: ${facts.props.required.type};
    value?: ${facts.props.value.type};
    ${facts.events.valueChange.callbackProp}?: (value: ${facts.events.valueChange.valueType}, detail: ${facts.events.valueChange.detailsType}) => void;
  };

  const uncontrolledModel = Symbol("uncontrolled ${facts.displayName} model");
  let {
    children,
    ${facts.props.autoComplete.name},
    ${facts.props.defaultOpen.name} = false,
    ${facts.props.defaultValue.name} = null,
    ${facts.props.disabled.name} = false,
    ${facts.props.form.name},
    ${facts.props.highlightItemOnHover.name} = true,
    ${facts.props.modal.name} = true,
    ${facts.props.name.name},
    open = $bindable(uncontrolledModel as never),
    ${facts.events.openChange.callbackProp},
    ${facts.props.readOnly.name} = false,
    ref,
    ${facts.props.required.name} = false,
    value = $bindable(uncontrolledModel as never),
    ${facts.events.valueChange.callbackProp},
    ...rest
  }: Props = $props();

  let controlledOpen = $derived((open as unknown) !== uncontrolledModel);
  let controlledValue = $derived((value as unknown) !== uncontrolledModel);
  const initialDefaultOpen = untrack(() => ${facts.props.defaultOpen.name});
  const initialDefaultValue = untrack(() => ${facts.props.defaultValue.name});
  let uncontrolledOpen = $state(untrack(() => ${facts.props.disabled.name} ? false : initialDefaultOpen));
  let uncontrolledValue = $state<string | null>(initialDefaultValue);
  let selectedLabelState = $state<{ label: string | null; value: string | null }>({ label: null, value: null });
  let mounted = $state(false);
  let portalOwner: symbol | undefined;
  let portalReference = $state<HTMLElement | null>(null);
  let runtimeInstance: ReturnType<typeof ${facts.runtime.factory}> | undefined;
  let renderedOpen = $derived(${facts.props.disabled.name} ? false : (controlledOpen ? open : uncontrolledOpen));
  let renderedValue = $derived(controlledValue ? value : uncontrolledValue);
  let selectedLabel = $derived(selectedLabelState.value === renderedValue ? selectedLabelState.label : null);
  let nativeProps = $derived(Object.fromEntries(Object.entries(rest)) as NativeProps);
  const forwardedAttachments = untrack(() => Object.getOwnPropertySymbols(rest)
    .map((key) => (rest as NativeProps & Record<symbol, unknown>)[key])
    .filter((candidate): candidate is Attachment<HTMLDivElement> => typeof candidate === "function"));

  setContext<${facts.context.rootContextValueType}>(${facts.context.rootContext}, {
    get disabled() { return ${facts.props.disabled.name}; },
    get mounted() { return mounted; },
    get open() { return renderedOpen; },
    get readOnly() { return ${facts.props.readOnly.name}; },
    registerPortal(owner, element) {
      if (element) { portalOwner = owner; portalReference = element; }
      else if (portalOwner === owner) { portalOwner = undefined; portalReference = null; }
    },
    get required() { return ${facts.props.required.name}; },
    get selectedLabel() { return selectedLabel; },
    get value() { return renderedValue; },
  });

  export function close(): void { runtimeInstance?.close(); }
  export function show(): void { if (!${facts.props.disabled.name}) runtimeInstance?.open(); }
  export function updatePosition(): void { runtimeInstance?.updatePosition(); }

  function readItemLabel(item: HTMLElement | undefined): string | null {
    if (!item) return null;
    const textElement = item.querySelector<HTMLElement>("[${itemTextAttribute}]");
    if (textElement) return textElement.textContent?.trim() ?? "";
    const text = item.textContent?.trim() ?? "";
    return text.length > 0 ? text : null;
  }
  function findSelectedLabel(root: HTMLElement, nextValue: string | null): string | null {
    if (nextValue === null) return null;
    const candidates = [root, portalReference].filter((candidate): candidate is HTMLElement => candidate instanceof HTMLElement);
    const item = candidates.flatMap((candidate) => [...candidate.querySelectorAll<HTMLElement>("[${itemAttribute}]")])
      .find((candidate) => candidate.getAttribute("${facts.collection.itemIdentity.attribute}") === nextValue);
    return readItemLabel(item);
  }
  function syncSelectedLabel(root: HTMLElement, nextValue: string | null, item?: HTMLElement): void {
    selectedLabelState = { label: readItemLabel(item) ?? findSelectedLabel(root, nextValue), value: nextValue };
  }
  function handleOpenChange(nextOpen: boolean, detail: ${facts.events.openChange.detailsType}): void {
    untrack(() => ${facts.events.openChange.callbackProp}?.(nextOpen, detail));
    if (detail.isCanceled) return;
    if (controlledOpen) open = nextOpen;
    else uncontrolledOpen = nextOpen;
  }
  function handleValueChange(nextValue: string | null, detail: ${facts.events.valueChange.detailsType}, root: HTMLElement): void {
    untrack(() => ${facts.events.valueChange.callbackProp}?.(nextValue, detail));
    if (detail.isCanceled) return;
    syncSelectedLabel(root, nextValue, detail.item);
    if (controlledValue) value = nextValue;
    else uncontrolledValue = nextValue;
  }

  const attachForwarded: Attachment<HTMLDivElement> = (root) => {
    const cleanups = forwardedAttachments.map((attachment) => untrack(() => attachment(root)))
      .filter((cleanup): cleanup is () => void => typeof cleanup === "function");
    return () => { for (let index = cleanups.length - 1; index >= 0; index -= 1) cleanups[index]?.(); };
  };
  const attachRef: Attachment<HTMLDivElement> = (root) => {
    const callback = ref;
    untrack(() => callback?.(root));
    return () => callback?.(null);
  };
  const attachRuntime: Attachment<HTMLDivElement> = (root) => {
    $effect(() => {
    const connectionControlsOpen = controlledOpen;
    const connectionControlsValue = controlledValue;
    const input = root.querySelector<HTMLInputElement>("[${facts.attrs.input}]");
    const ownedPortal = root.querySelector<HTMLElement>("[${facts.attrs.portal}]");
    let resetForm: HTMLFormElement | null = null;
    let resetTimer: number | undefined;
    const instance = untrack(() => ${facts.runtime.factory}(root, {
      ${facts.props.autoComplete.name},
      ${facts.props.defaultOpen.name}: renderedOpen,
      ${facts.props.defaultValue.name}: renderedValue,
      ${facts.props.disabled.name},
      ${facts.props.form.name},
      ${facts.props.highlightItemOnHover.name},
      ${facts.props.modal.name},
      ${facts.props.name.name},
      ${facts.events.openChange.callbackProp}: handleOpenChange,
      ${facts.events.valueChange.callbackProp}: (nextValue, detail) => handleValueChange(nextValue, detail, root),
      ${facts.portal.referenceOption}: ownedPortal ?? undefined,
      ${facts.props.readOnly.name},
      ${facts.props.required.name},
      ...(connectionControlsOpen ? { open: renderedOpen } : {}),
      ...(connectionControlsValue ? { value: renderedValue } : {}),
    }));
    runtimeInstance = instance;
    untrack(() => syncSelectedLabel(root, instance.${valueModel.getter}()));
    const clearReset = () => { if (resetTimer !== undefined) window.clearTimeout(resetTimer); resetTimer = undefined; };
    const handleReset = () => {
      clearReset();
      resetTimer = window.setTimeout(() => {
        if (connectionControlsValue) instance.${valueModel.setter}(renderedValue, { emit: false });
        else { uncontrolledValue = instance.${valueModel.getter}(); syncSelectedLabel(root, uncontrolledValue); }
        resetTimer = undefined;
      }, 0);
    };
    const bindReset = () => {
      const nextForm = input?.form ?? null;
      if (nextForm === resetForm) return;
      resetForm?.removeEventListener("reset", handleReset);
      resetForm = nextForm;
      resetForm?.addEventListener("reset", handleReset);
    };
    bindReset();
    mounted = true;

    $effect(() => { const next = renderedOpen; if (!Object.is(instance.${openModel.getter}(), next)) instance.${openModel.setter}(next, { emit: false }); });
    $effect(() => { const next = renderedValue; if (!Object.is(instance.${valueModel.getter}(), next)) { instance.${valueModel.setter}(next, { emit: false }); syncSelectedLabel(root, next); } });
    let appliedDisabled = untrack(() => ${facts.props.disabled.name});
    $effect(() => { const next = ${facts.props.disabled.name}; if (next !== appliedDisabled) { appliedDisabled = next; instance.${facts.lifecycle.updateSetters.disabled}(next); } });
    let appliedReadOnly = untrack(() => ${facts.props.readOnly.name});
    $effect(() => { const next = ${facts.props.readOnly.name}; if (next !== appliedReadOnly) { appliedReadOnly = next; instance.${facts.lifecycle.updateSetters.readOnly}(next); } });
    let appliedModal = untrack(() => ${facts.props.modal.name});
    $effect(() => { const next = ${facts.props.modal.name}; if (next !== appliedModal) { appliedModal = next; instance.${facts.lifecycle.updateSetters.modal}(next); } });
    let appliedHighlight = untrack(() => ${facts.props.highlightItemOnHover.name});
    $effect(() => { const next = ${facts.props.highlightItemOnHover.name}; if (next !== appliedHighlight) { appliedHighlight = next; instance.${facts.lifecycle.updateSetters.highlightItemOnHover}(next); } });
    $effect(() => { instance.${facts.form.setter.method}({ ${facts.props.autoComplete.name}, ${facts.props.form.name}, ${facts.props.name.name}, ${facts.props.required.name} }); bindReset(); });

    return () => {
      mounted = false;
      clearReset();
      resetForm?.removeEventListener("reset", handleReset);
      if (connectionControlsOpen && !controlledOpen) uncontrolledOpen = instance.${openModel.getter}();
      if (connectionControlsValue && !controlledValue) {
        uncontrolledValue = instance.${valueModel.getter}();
        syncSelectedLabel(root, uncontrolledValue);
      }
      if (runtimeInstance === instance) runtimeInstance = undefined;
      instance.${facts.lifecycle.cleanup}();
    };
    });
  };
</script>

<div
  {...nativeProps}
  ${facts.attrs.root}=""
  data-sw-part="${facts.parts.root.name}"
  ${facts.attrs.autoComplete}={${facts.props.autoComplete.name}}
  ${facts.attrs.defaultOpen}={initialDefaultOpen ? "true" : undefined}
  ${facts.attrs.defaultValue}={initialDefaultValue ?? undefined}
  ${facts.attrs.disabled}={${facts.props.disabled.name} ? "" : undefined}
  ${facts.attrs.form}={${facts.props.form.name}}
  ${facts.attrs.highlightItemOnHover}={${facts.props.highlightItemOnHover.name} ? "true" : "false"}
  ${facts.attrs.modal}={${facts.props.modal.name} ? "true" : "false"}
  ${facts.attrs.name}={${facts.props.name.name}}
  ${facts.attrs.readOnly}={${facts.props.readOnly.name} ? "" : undefined}
  ${facts.attrs.required}={${facts.props.required.name} ? "" : undefined}
  data-state={renderedOpen ? "open" : "closed"}
  data-value={renderedValue ?? undefined}
  data-placeholder={renderedValue === null ? "" : undefined}
  data-selected-value={selectedLabel !== null && renderedValue !== null ? renderedValue : undefined}
  data-selected-label={selectedLabel ?? undefined}
  {@attach attachForwarded}
  {@attach attachRef}
  {@attach attachRuntime}
>
  <input
    ${facts.attrs.input}=""
    data-sw-part="${facts.parts.input.name}"
    type="hidden"
    autocomplete={${facts.props.autoComplete.name} as HTMLInputAttributes["autocomplete"]}
    disabled={${facts.props.disabled.name}}
    form={${facts.props.form.name}}
    name={${facts.props.name.name}}
    required={${facts.props.required.name}}
    aria-hidden="true"
    tabindex="-1"
  />
  {@render children?.()}
</div>
`;
}

function printTrigger(facts: AdapterOptionCollectionOverlayFacts): string {
  const part = facts.parts.trigger;
  return `<!-- ${NON_SHIPPING_COMMENT} -->
<script lang="ts">
  import { untrack, type Snippet } from "svelte";
  import type { Attachment } from "svelte/attachments";
  import type { HTMLButtonAttributes } from "svelte/elements";
  import { ${facts.context.useRootContext} } from "./${facts.exports.root}.svelte";
  type Props = Omit<HTMLButtonAttributes, "children" | "disabled" | "type"> & { children?: Snippet; ref?: (element: HTMLButtonElement | null) => void };
  let { children, ref, ...rest }: Props = $props();
  const select = ${facts.context.useRootContext}("Trigger");
  const attachRef: Attachment<HTMLButtonElement> = (element) => { const callback = ref; untrack(() => callback?.(element)); return () => callback?.(null); };
</script>
<button {...rest} ${facts.attrs.trigger}="" data-sw-part="${part.name}" type="button" role="${part.role ?? "combobox"}" aria-haspopup="listbox" aria-expanded={select.open} aria-readonly={select.readOnly} aria-required={select.required} aria-disabled={select.disabled ? "true" : undefined} data-state={select.open ? "open" : "closed"} disabled={select.disabled} {@attach attachRef}>{@render children?.()}</button>
`;
}

function printValue(facts: AdapterOptionCollectionOverlayFacts): string {
  const part = facts.parts.value;
  return `<!-- ${NON_SHIPPING_COMMENT} -->
<script lang="ts">
  import { untrack, type Snippet } from "svelte";
  import type { Attachment } from "svelte/attachments";
  import type { HTMLAttributes } from "svelte/elements";
  import { ${facts.context.useRootContext} } from "./${facts.exports.root}.svelte";
  type Props = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & { children?: Snippet<[label: string | null, value: string | null]>; placeholder?: string; ref?: (element: HTMLSpanElement | null) => void };
  let { children, placeholder, ref, ...rest }: Props = $props();
  const select = ${facts.context.useRootContext}("Value");
  const attachRef: Attachment<HTMLSpanElement> = (element) => { const callback = ref; untrack(() => callback?.(element)); return () => callback?.(null); };
</script>
<span {...rest} ${facts.attrs.value}="" data-sw-part="${part.name}" data-placeholder={placeholder} {@attach attachRef}>
  {#if children}{@render children(select.selectedLabel, select.value)}{:else}{select.selectedLabel ?? placeholder}{/if}
</span>
`;
}

function printPortal(facts: AdapterOptionCollectionOverlayFacts): string {
  const part = facts.parts.portal;
  return `<!-- ${NON_SHIPPING_COMMENT} -->
<script lang="ts">
  import { reportPortalPlacement, resolvePortalPlacement } from "${facts.runtime.importSource}";
  import { untrack, type Snippet } from "svelte";
  import type { Attachment } from "svelte/attachments";
  import type { HTMLAttributes } from "svelte/elements";
  import { ${facts.context.useRootContext} } from "./${facts.exports.root}.svelte";
  type Props = Omit<HTMLAttributes<HTMLDivElement>, "children"> & { children?: Snippet; container?: string | HTMLElement; disabled?: boolean; ref?: (element: HTMLDivElement | null) => void };
  let { children, container, disabled = false, ref, ...rest }: Props = $props();
  const select = ${facts.context.useRootContext}("Portal");
  const owner = Symbol("${facts.displayName}PortalOwner");
  const attachPortal: Attachment<HTMLDivElement> = (element) => {
    const authoredParent = element.parentNode;
    const authoredNextSibling = element.nextSibling;
    const reference = element.closest<HTMLElement>("[${facts.attrs.root}]") ?? element;
    let observer: MutationObserver | undefined;
    let placedTarget: HTMLElement | null = null;
    const restore = () => {
      if (!authoredParent) return;
      if (authoredNextSibling?.parentNode === authoredParent) authoredParent.insertBefore(element, authoredNextSibling);
      else authoredParent.appendChild(element);
    };
    const disconnectObserver = () => {
      observer?.disconnect();
      observer = undefined;
    };
    const resolveTarget = (requestedContainer: string | HTMLElement | undefined) =>
      resolvePortalPlacement(element, {
        container: requestedContainer,
        disabled: false,
        mode: "framework",
        reference,
      }).target;
    const place = (requestedContainer: string | HTMLElement | undefined) => {
      const target = resolveTarget(requestedContainer);
      if (placedTarget === target && element.parentElement === target) return;

      reportPortalPlacement(element, { ready: false, target });
      target.appendChild(element);
      placedTarget = target;
      if (element.parentElement === target) {
        reportPortalPlacement(element, { ready: true, target });
      }
    };
    select.registerPortal(owner, element);
    $effect(() => {
      const active = select.mounted && !disabled;
      const requestedContainer = container;
      disconnectObserver();
      reportPortalPlacement(element, null);
      placedTarget = null;
      restore();
      element.toggleAttribute("data-disabled", !active);
      if (!active) return;

      place(requestedContainer);
      const MutationObserverConstructor = element.ownerDocument.defaultView?.MutationObserver;
      if (MutationObserverConstructor) {
        observer = new MutationObserverConstructor(() => {
          const target = resolveTarget(requestedContainer);
          if (target !== placedTarget || element.parentElement !== target) place(requestedContainer);
        });
        observer.observe(element.ownerDocument, { childList: true, subtree: true });
      }
      return () => {
        disconnectObserver();
        reportPortalPlacement(element, null);
        placedTarget = null;
        restore();
      };
    });
    const callback = ref;
    untrack(() => callback?.(element));
    return () => {
      disconnectObserver();
      reportPortalPlacement(element, null);
      select.registerPortal(owner, null);
      restore();
      callback?.(null);
    };
  };
</script>
<div {...rest} ${facts.attrs.portal}="" data-sw-part="${part.name}" data-floating-root data-placement="pending" data-sw-portal-placement="framework" data-disabled={disabled ? "" : undefined} {@attach attachPortal}>{@render children?.()}</div>
`;
}

function printFloatingPart(
  facts: AdapterOptionCollectionOverlayFacts,
  partName: "popup" | "positioner",
): string {
  const part = facts.parts[partName];
  const isPopup = partName === "popup";
  return `<!-- ${NON_SHIPPING_COMMENT} -->
<script lang="ts">
  import { untrack, type Snippet } from "svelte";
  import type { Attachment } from "svelte/attachments";
  import type { HTMLAttributes } from "svelte/elements";
  import { ${facts.context.useRootContext} } from "./${facts.exports.root}.svelte";
  type Props = Omit<HTMLAttributes<HTMLDivElement>, "children"> & { children?: Snippet; ${facts.props.align.name}?: ${facts.props.align.type}; ${facts.props.alignOffset.name}?: ${facts.props.alignOffset.type}; ${isPopup ? "" : `${facts.props.alignItemWithTrigger.name}?: ${facts.props.alignItemWithTrigger.type};`} ${facts.props.avoidCollisions.name}?: ${facts.props.avoidCollisions.type}; ref?: (element: HTMLDivElement | null) => void; ${facts.props.side.name}?: ${facts.props.side.type}; ${facts.props.sideOffset.name}?: ${facts.props.sideOffset.type} };
  let { children, ${facts.props.align.name} = ${facts.floating.alignDefault}, ${facts.props.alignOffset.name} = ${facts.floating.alignOffsetDefault}, ${isPopup ? "" : `${facts.props.alignItemWithTrigger.name} = ${facts.floating.alignItemWithTriggerDefault},`} ${facts.props.avoidCollisions.name} = ${facts.floating.avoidCollisionsDefault}, ref, ${facts.props.side.name} = ${facts.floating.sideDefault}, ${facts.props.sideOffset.name} = ${facts.floating.sideOffsetDefault}, ...rest }: Props = $props();
  const select = ${facts.context.useRootContext}("${part.namespaceKey}");
  const initialOpen = untrack(() => select.open);
  const attachRef: Attachment<HTMLDivElement> = (element) => { const callback = ref; untrack(() => callback?.(element)); return () => callback?.(null); };
</script>
<div {...rest} ${facts.attrs[partName]}="" data-sw-part="${part.name}" ${isPopup ? `role="${part.role ?? "listbox"}" tabindex="-1" hidden={!initialOpen}` : ""} data-state={initialOpen ? "open" : "closed"} ${facts.attrs.side}={${facts.props.side.name}} ${facts.attrs.align}={${facts.props.align.name}} ${facts.attrs.sideOffset}={${facts.props.sideOffset.name}} ${facts.attrs.alignOffset}={${facts.props.alignOffset.name}} ${isPopup ? "" : `${facts.attrs.alignItemWithTrigger}={${facts.props.alignItemWithTrigger.name} ? "true" : "false"}`} ${facts.attrs.avoidCollisions}={${facts.props.avoidCollisions.name} ? "true" : "false"} {@attach attachRef}>{@render children?.()}</div>
`;
}

function printItem(facts: AdapterOptionCollectionOverlayFacts): string {
  const part = facts.parts.item;
  const identity = facts.collection.itemIdentity;
  return `<!-- ${NON_SHIPPING_COMMENT} -->
<script lang="ts">
  import { setContext, untrack, type Snippet } from "svelte";
  import type { Attachment } from "svelte/attachments";
  import type { HTMLAttributes } from "svelte/elements";
  import { ${facts.context.itemContext}, ${facts.context.useRootContext}, type ${facts.context.itemContextValueType} } from "./${facts.exports.root}.svelte";
  type Props = Omit<HTMLAttributes<HTMLDivElement>, "children"> & { children?: Snippet; disabled?: boolean; ref?: (element: HTMLDivElement | null) => void; ${identity.prop}: string };
  let { children, disabled = false, ref, ${identity.prop}, ...rest }: Props = $props();
  const select = ${facts.context.useRootContext}("Item");
  let selected = $derived(select.value === ${identity.prop});
  setContext<${facts.context.itemContextValueType}>(${facts.context.itemContext}, { get disabled() { return disabled; }, get value() { return ${identity.prop}; } });
  const attachRef: Attachment<HTMLDivElement> = (element) => { const callback = ref; untrack(() => callback?.(element)); return () => callback?.(null); };
</script>
<div {...rest} ${facts.attrs.item}="" data-sw-part="${part.name}" ${identity.attribute}={${identity.prop}} role="${part.role ?? "option"}" aria-selected={selected} aria-disabled={disabled ? "true" : undefined} ${facts.attrs.disabled}={disabled ? "" : undefined} data-selected={selected ? "" : undefined} tabindex="-1" {@attach attachRef}>{@render children?.()}</div>
`;
}

function printItemIndicator(facts: AdapterOptionCollectionOverlayFacts): string {
  const part = facts.parts.itemIndicator;
  return `<!-- ${NON_SHIPPING_COMMENT} -->
<script lang="ts">
  import { untrack, type Snippet } from "svelte";
  import type { Attachment } from "svelte/attachments";
  import type { HTMLAttributes } from "svelte/elements";
  import { ${facts.context.useItemContext}, ${facts.context.useRootContext} } from "./${facts.exports.root}.svelte";
  type Props = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & { children?: Snippet; ref?: (element: HTMLSpanElement | null) => void };
  let { children, ref, ...rest }: Props = $props();
  const select = ${facts.context.useRootContext}("ItemIndicator");
  const item = ${facts.context.useItemContext}("ItemIndicator");
  let selected = $derived(select.value === item.value);
  const initialSelected = untrack(() => selected);
  const attachRef: Attachment<HTMLSpanElement> = (element) => { const callback = ref; untrack(() => callback?.(element)); return () => callback?.(null); };
</script>
<span {...rest} ${facts.attrs.itemIndicator}="" data-sw-part="${part.name}" aria-hidden="true" data-state={selected ? "checked" : "unchecked"} data-visible={selected ? "" : undefined} data-hidden={selected ? undefined : ""} hidden={!initialSelected} {@attach attachRef}>{@render children?.()}</span>
`;
}

function printSimplePart(
  facts: AdapterOptionCollectionOverlayFacts,
  partName: Exclude<
    AdapterOptionCollectionOverlayPartName,
    "item" | "itemIndicator" | "popup" | "portal" | "positioner" | "root" | "trigger" | "value"
  >,
  extraAttributes = "",
): string {
  const part = facts.parts[partName];
  const element = part.defaultElement;
  const elementType = element === "span" ? "HTMLSpanElement" : "HTMLDivElement";
  const attributesType =
    element === "span" ? "HTMLAttributes<HTMLSpanElement>" : "HTMLAttributes<HTMLDivElement>";
  return `<!-- ${NON_SHIPPING_COMMENT} -->
<script lang="ts">
  import { untrack, type Snippet } from "svelte";
  import type { Attachment } from "svelte/attachments";
  import type { HTMLAttributes } from "svelte/elements";
  type Props = Omit<${attributesType}, "children"> & { children?: Snippet; ref?: (element: ${elementType} | null) => void };
  let { children, ref, ...rest }: Props = $props();
  const attachRef: Attachment<${elementType}> = (element) => { const callback = ref; untrack(() => callback?.(element)); return () => callback?.(null); };
</script>
<${element} {...rest} ${facts.attrs[partName]}="" data-sw-part="${part.name}" ${extraAttributes} {@attach attachRef}>{@render children?.()}</${element}>
`;
}

function requireModel(facts: AdapterOptionCollectionOverlayFacts, name: "open" | "value") {
  const model = facts.models.find((candidate) => candidate.name === name);
  if (!model)
    throw new TypeError(`Svelte ${facts.displayName} projection requires ${name} model facts.`);
  return model;
}

function assertFacts(facts: AdapterOptionCollectionOverlayFacts): void {
  const hasAll = (actual: readonly string[], expected: readonly string[]) =>
    actual.length === expected.length && expected.every((value) => actual.includes(value));
  if (
    !hasAll(facts.context.rootValues, [
      "disabled",
      "mounted",
      "open",
      "readOnly",
      "required",
      "selectedLabel",
      "value",
    ]) ||
    !hasAll(facts.context.itemValues, ["disabled", "value"]) ||
    !hasAll(facts.context.rootOperations, ["registerPortal"]) ||
    facts.collection.selectedLabel.emptyItemText !== "preserve" ||
    facts.collection.selectedLabel.fallbackEmptyText !== "missing" ||
    facts.portal.activation !== "after-root-mount" ||
    facts.portal.owner !== "component-instance" ||
    facts.form.reset !== "runtime-readback-after-native-reset" ||
    facts.presence.unmountPolicy !== "runtime-owned" ||
    facts.lifecycle.setup !== "after-mount" ||
    !hasAll(facts.lifecycle.recreateOnControllednessChange, ["open", "value"])
  ) {
    throw new TypeError(
      `Svelte ${facts.displayName} projection requires complete collection, context, form, portal, presence, and lifecycle facts.`,
    );
  }
}
