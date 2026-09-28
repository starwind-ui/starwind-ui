import {
  comboboxFragments,
  comboboxModelObservers,
  comboboxOptionObservers,
  comboboxPlan,
  comboboxResetSettlement,
} from "../../shared-recipes/structured/combobox.js";
import {
  comboboxInheritedBoolean,
  comboboxSelection,
  comboboxSelectionAttributes,
  comboboxValueFallback,
} from "../../shared-recipes/structured/combobox-parts.js";
import type {
  AdapterComponentFile,
  AdapterEditableCollectionOverlayFacts,
  AdapterEditableCollectionOverlayPartName,
  AdapterIndexFile,
  AdapterPrintedFile,
} from "../types.js";
import { printSvelteForwardedAttachments, printSvelteRefAttachment } from "./attachments.js";
import { printSvelteButtonChild } from "./button-child.js";
import { printSvelteOverlayPortal } from "./overlay-portal.js";

const NOTICE = "Svelte 5 public beta adapter output.";
type Facts = AdapterEditableCollectionOverlayFacts;

export function printSvelteEditableCollectionOverlayIndex(
  file: AdapterIndexFile,
): AdapterPrintedFile {
  if (file.family?.kind !== "editable-collection-overlay")
    throw new TypeError("Svelte Combobox index requires editable-collection-overlay facts.");
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
export type { ${Object.values(f.events)
      .map((event) => event.detailsType)
      .join(", ")} } from "${f.runtime.importSource}";
`,
  };
}

export function printSvelteEditableCollectionOverlayComponent(
  file: AdapterComponentFile,
): AdapterPrintedFile {
  if (file.component.family?.kind !== "editable-collection-overlay")
    throw new TypeError("Svelte Combobox component requires editable-collection-overlay facts.");
  const { facts: f, part } = file.component.family;
  const contents =
    part === "root"
      ? printRoot(f)
      : part === "portal"
        ? printSvelteOverlayPortal(
            f,
            "getComboboxContext",
            `element.parentElement?.closest<HTMLElement>("[${f.attrs.root}]") ?? element.parentElement ?? element`,
            true,
          )
        : part === "trigger" || part === "clear"
          ? printButton(f, part)
          : printPart(f, part);
  return { path: `${file.path}.svelte`, contents };
}

function printButton(f: Facts, part: "trigger" | "clear"): string {
  return printSvelteButtonChild({
    name: f.exports[part],
    imports: `import { getComboboxContext } from "./${f.exports.root}.svelte";`,
    init: `const combobox = getComboboxContext();`,
    register: `combobox?.registerPart(owner, { element: root, part: "${part}" }); return () => combobox?.registerPart(owner, null);`,
    attributes: `"${f.attrs[part]}": "", type: "button", disabled: !!(allProps.disabled || combobox?.disabled), "${f.attrs.disabled}": allProps.disabled || combobox?.disabled ? "" : undefined, "data-sw-part": "${f.parts[part].name}", ${part === "trigger" ? '"aria-haspopup": "listbox", "aria-expanded": !!combobox?.open,' : '"aria-label": allProps["aria-label"] ?? "Clear selection",'}`,
    independentAttachments: true,
  });
}

function printPart(
  f: Facts,
  part: Exclude<AdapterEditableCollectionOverlayPartName, "root" | "portal" | "trigger" | "clear">,
): string {
  const tag = f.parts[part].defaultElement;
  const elementType =
    tag === "input" ? "HTMLInputElement" : tag === "span" ? "HTMLSpanElement" : "HTMLDivElement";
  const floating = part === "popup" || part === "positioner";
  const floatingNames = ["side", "align", "sideOffset", "alignOffset", "avoidCollisions"] as const;
  const captured = ["input", "inputGroup", "label", "positioner", "popup"].includes(part);
  const extraProps =
    part === "input"
      ? "defaultValue?: string;"
      : part === "value"
        ? "placeholder?: string;"
        : part === "item"
          ? "value: string; disabled?: boolean;"
          : floating
            ? floatingNames.map((name) => `${name}?: ${f.props[name].type};`).join(" ")
            : "";
  const extraDefaults =
    part === "input"
      ? "defaultValue, disabled = false, readonly: nativeReadOnly = false,"
      : part === "value"
        ? "placeholder,"
        : part === "item"
          ? "value, disabled = false,"
          : floating
            ? floatingNames.map((name) => `${name} = ${f.floating[`${name}Default`]}`).join(", ") +
              ","
            : "";
  const attributes = floating
    ? `{ ${floatingNames.map((name) => `"${f.attrs[name]}": String(${name})`).join(", ")} }`
    : "{}";
  const markup =
    part === "input"
      ? `role="${f.inputSemantics.role}" autocomplete="${f.inputSemantics.autocomplete}" aria-autocomplete="${f.inputSemantics.ariaAutocomplete}" aria-expanded={combobox?.open ?? false} disabled={${comboboxInheritedBoolean("disabled", "combobox?.disabled")}} readonly={${comboboxInheritedBoolean("nativeReadOnly", "combobox?.readOnly")}} value={combobox?.inputValue ?? defaultValue ?? ""}`
      : part === "item"
        ? `${f.attrs.valueData}={value} role="${f.collection.item.role}" ${comboboxSelectionAttributes("svelte", "item")} aria-disabled={disabled ? "true" : undefined} ${f.attrs.disabled}={disabled ? "" : undefined} tabindex="${f.collection.item.initialProjection.tabIndex}"`
        : part === "itemIndicator"
          ? `aria-hidden="true" ${comboboxSelectionAttributes("svelte", "indicator")}`
          : part === "icon"
            ? 'aria-hidden="true" data-state={combobox?.open ? "open" : "closed"}'
            : part === "group"
              ? `role="${f.collection.group.role}"`
              : part === "separator"
                ? `role="${f.collection.separator.role}" aria-orientation="${f.collection.separator.ariaOrientation}"`
                : part === "empty"
                  ? "hidden"
                  : part === "value"
                    ? "data-placeholder={placeholder}"
                    : floating
                      ? `${part === "popup" ? `role="${f.popupRole}" tabindex="-1" hidden` : ""} data-state="closed" ${floatingNames.map((name) => `${f.attrs[name]}={${name}}`).join(" ")}`
                      : "";
  return `<!-- ${NOTICE} -->
<script lang="ts">
  import { ${part === "item" ? "setContext, " : ""}untrack, type Snippet } from "svelte";
  import type { Attachment } from "svelte/attachments";
  import type { ${part === "input" ? "HTMLInputAttributes" : "HTMLAttributes"} } from "svelte/elements";
  import { getComboboxContext${part === "item" ? ", comboboxItemKey, type ComboboxItemContext" : part === "itemIndicator" ? ", getComboboxItemContext" : ""} } from "./${f.exports.root}.svelte";
  type Props = Omit<${part === "input" ? "HTMLInputAttributes" : `HTMLAttributes<${elementType}>`}, "children"${part === "input" ? ' | "defaultValue"' : ""}> & { ${part === "input" ? "" : "children?: Snippet;"} ${extraProps} ref?: (element: ${elementType} | null) => void };
  let { ${part === "input" ? "" : "children,"} ${extraDefaults} ref, ...rest }: Props = $props();
  const combobox = getComboboxContext();
${
  part === "item"
    ? `  let selected = $derived(${comboboxSelection("combobox?.value", "value")});
  setContext<ComboboxItemContext>(comboboxItemKey, { get value() { return value; }, get disabled() { return disabled; } });`
    : part === "itemIndicator"
      ? `  const item = getComboboxItemContext();
  let selected = $derived(${comboboxSelection("combobox?.value", "item?.value")});`
      : ""
}
${
  captured
    ? `  const owner = Symbol("${f.exports[part]} owner");
  const attachPart: Attachment<${elementType}> = (element) => {
    $effect(() => {
      const attributes = ${attributes};
      untrack(() => combobox?.registerPart(owner, { element, part: "${part}", attributes }));
      return () => combobox?.registerPart(owner, null);
    });
  };`
    : ""
}
  let elementProps = $derived({ ...rest });
${printSvelteRefAttachment(elementType)}
</script>
<${tag} {...elementProps} ${part === "value" ? `${f.attrs.value}={children ? undefined : ""}` : `${f.attrs[part]}=""`} data-sw-part="${f.parts[part].name}" ${markup} ${captured ? "{@attach attachPart}" : ""} {@attach attachRef}${part === "input" ? " />" : `>${part === "value" ? '{#if children}{@render children()}{:else}{placeholder ?? ""}{/if}' : "{@render children?.()}"}</${tag}>`}
`;
}

function printRoot(f: Facts): string {
  return `<!-- ${NOTICE} -->
<script module lang="ts">
  import { getContext } from "svelte";
  export type ComboboxPart = { element: HTMLElement; part: string; attributes?: Record<string, string | undefined> };
  export type ComboboxContext = {
    readonly disabled: boolean; readonly inputValue: string | undefined; readonly mounted: boolean; readonly open: boolean; readonly readOnly: boolean; readonly required: boolean; readonly value: string | null;
    registerPart(owner: symbol, part: ComboboxPart | null): void;
    registerPortal(owner: symbol, element: HTMLElement | null, authoredParent?: HTMLElement, prepare?: () => () => void): void;
  };
  export type ComboboxItemContext = { readonly value: string; readonly disabled: boolean };
  export const comboboxKey = Symbol("Combobox root");
  export const comboboxItemKey = Symbol("Combobox item");
  export function getComboboxContext(): ComboboxContext | undefined { return getContext(comboboxKey); }
  export function getComboboxItemContext(): ComboboxItemContext | undefined { return getContext(comboboxItemKey); }
</script>
<script lang="ts">
  import { ${f.runtime.factory}, createPortalBinding, readyPortalBindingSnapshot, ${Object.values(
    f.events,
  )
    .map((event) => `type ${event.detailsType}`)
    .join(", ")} } from "${f.runtime.importSource}";
  import { setContext, untrack, type Snippet } from "svelte";
  import type { Attachment } from "svelte/attachments";
  import type { HTMLAttributes } from "svelte/elements";
  type Props = Omit<HTMLAttributes<HTMLDivElement>, "children" | "form"> & {
    children?: Snippet; ref?: (element: HTMLDivElement | null) => void;
${["autoComplete", "defaultInputValue", "defaultOpen", "defaultValue", "disabled", "filterMode", "form", "highlightItemOnHover", "inputValue", "locale", "modal", "name", "open", "readOnly", "required", "value"].map((name) => `    ${name}?: ${f.props[name as keyof Facts["props"]].type};`).join("\n")}
${Object.values(f.events)
  .map(
    (event) =>
      `    ${event.callbackProp}?: (value: ${event.valueType}, detail: ${event.detailsType}) => void;`,
  )
  .join("\n")}
  };
  let { children, ref, autoComplete, defaultInputValue, defaultOpen, defaultValue, disabled = false, filterMode = ${f.props.filterMode.defaultValue}, form, highlightItemOnHover = ${f.props.highlightItemOnHover.defaultValue}, inputValue = $bindable(), locale, modal = ${f.props.modal.defaultValue}, name, open = $bindable(), readOnly = false, required = false, value = $bindable(), ${Object.values(
    f.events,
  )
    .map((event) => event.callbackProp)
    .join(", ")}, ...rest }: Props = $props();
  const initialModels = untrack(() => ({ value, inputValue, open }));
  const initialDefaults = untrack(() => ({ value: defaultValue === undefined ? initialModels.value ?? null : defaultValue, inputValue: defaultInputValue ?? initialModels.inputValue, open: defaultOpen ?? initialModels.open ?? false }));
  let accepted = $state<{ value: string | null; inputValue: string | undefined; open: boolean }>({ value: initialModels.value === undefined ? initialDefaults.value : initialModels.value, inputValue: initialModels.inputValue ?? initialDefaults.inputValue, open: untrack(() => disabled) ? false : initialModels.open ?? initialDefaults.open });
  let mounted = $state(false);
  let revision = $state(0);
  let rootElement: HTMLDivElement | undefined;
  let binding: ReturnType<typeof createPortalBinding> | undefined;
  const parts = new Map<symbol, ComboboxPart>();
  const portals = new Map<symbol, { wrapper: HTMLElement; authoredParent: HTMLElement; prepare?: () => () => void }>();
  setContext<ComboboxContext>(comboboxKey, {
    get disabled() { return disabled; }, get inputValue() { return accepted.inputValue; }, get mounted() { return mounted; }, get open() { return accepted.open; }, get readOnly() { return readOnly; }, get required() { return required; }, get value() { return accepted.value; },
    registerPart(owner, part) { if (part) parts.set(owner, part); else parts.delete(owner); untrack(() => revision++); },
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
    let current: { instance: ReturnType<typeof createCombobox>; cleanups: (() => void)[] } | undefined;
    let resetForm: HTMLFormElement | null = null;
    let resetTimer: number | undefined;
    function synchronizeModels(): void { ${comboboxFragments("svelte").synchronization} }
    function readAccepted(): void {
      const instance = current?.instance;
      if (instance) { ${comboboxFragments("svelte").readback} }
    }
    const handleReset = (event: Event) => { ${comboboxResetSettlement("svelte")} };
    function bindReset(): void {
      const next = root.querySelector<HTMLInputElement>("[${f.attrs.hiddenInput}]")?.form ?? null;
      if (next === resetForm) return;
      resetForm?.removeEventListener("reset", handleReset);
      resetForm = next;
      resetForm?.addEventListener("reset", handleReset);
    }
    $effect(() => {
      revision;
      ${comboboxPlan.constructorOnlyInputs.map((name) => `void ${name};`).join(" ")}
      return untrack(() => {
        const captures = [...parts.values()];
        if (!${JSON.stringify(comboboxPlan.requiredParts)}.every(part => captures.some(capture => capture.part === part))) return;
        for (const { element, attributes } of captures) for (const [name, next] of Object.entries(attributes ?? {})) {
          if (next === undefined) element.removeAttribute(name); else element.setAttribute(name, next);
        }
        ${comboboxFragments("svelte").construction}
        ${comboboxFragments("svelte").subscriptions}
        synchronizeModels();
        readAccepted();
        bindReset();
        return () => {
          readAccepted();
          const retired = current;
          current = undefined;
          retired?.cleanups.forEach(cleanup => cleanup());
          window.clearTimeout(resetTimer);
          instance.destroy();
        };
      });
    });
    ${comboboxModelObservers("svelte")}
    ${comboboxOptionObservers("svelte")}
    const observer = new MutationObserver(() => untrack(readAccepted));
    observer.observe(root, { attributes: true, attributeFilter: ["${f.attrs.inputValue}"] });
    return () => {
      observer.disconnect();
      resetForm?.removeEventListener("reset", handleReset);
      window.clearTimeout(resetTimer);
      mounted = false; binding?.destroy(); binding = undefined; rootElement = undefined;
    };
  };
  let elementProps = $derived({ ...rest });
${printSvelteRefAttachment("HTMLDivElement")}
</script>
<div {...elementProps} ${f.attrs.root}="" data-sw-part="${f.parts.root.name}" ${f.attrs.defaultValue}={initialDefaults.value ?? undefined} ${f.attrs.defaultInputValue}={initialDefaults.inputValue} ${f.attrs.disabled}={disabled ? "" : undefined} ${f.attrs.readOnly}={readOnly ? "" : undefined} ${f.attrs.name}={name} ${f.attrs.form}={form} ${f.attrs.required}={required ? "" : undefined} data-state="closed" {@attach attachRuntime} {@attach attachRef}>
  {@render children?.()}
  <input type="${f.hiddenInput.constantAttributes.type}" ${f.attrs.hiddenInput}="" aria-hidden="${f.hiddenInput.constantAttributes.ariaHidden}" tabindex={${f.hiddenInput.constantAttributes.tabIndex}} value={initialDefaults.value ?? ""} {name} {form} {required} {disabled} />
</div>
`.replace(/[ \t]+$/gm, "");
}
