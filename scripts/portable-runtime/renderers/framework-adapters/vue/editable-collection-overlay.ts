import { projectVueAttributeAccess } from "./public-contract.js";

const VUE_TEMPLATE_ONLY_ATTRIBUTE_ACCESS = projectVueAttributeAccess([]);

import type {
  AdapterEditableCollectionOverlayComponentProjection,
  AdapterEditableCollectionOverlayFacts,
  AdapterEditableCollectionOverlayIndexProjection,
  AdapterEditableCollectionOverlayPartName,
  AdapterOutputModel,
  AdapterPrintedFile,
} from "../types.js";
import { projectVueModel } from "./public-contract.js";

const COMMENT =
  "Internal non-shipping Vue adapter output. Do not publish, expose through the CLI registry, claim in public docs, or copy into public demo dependencies.";

export function isVueEditableCollectionOverlayOutput(model: AdapterOutputModel): boolean {
  return model.files.some(
    (file) =>
      file.kind === "component" && file.component.family?.kind === "editable-collection-overlay",
  );
}

export function printVueEditableCollectionOverlayOutput(
  model: AdapterOutputModel,
): AdapterPrintedFile[] {
  return model.files.map((file) => {
    if (
      file.kind === "component" &&
      file.component.family?.kind === "editable-collection-overlay"
    ) {
      return {
        contents: printVueEditableCollectionOverlayComponent(file.component.family),
        path: `${file.path}.vue`,
      };
    }
    if (file.kind === "index" && file.family?.kind === "editable-collection-overlay") {
      return { contents: printVueEditableCollectionOverlayIndex(file.family), path: file.path };
    }
    throw new TypeError("Vue editable-collection-overlay output contains an unsupported file.");
  });
}

export function printVueEditableCollectionOverlayComponent(
  family: AdapterEditableCollectionOverlayComponentProjection,
): string {
  assertFacts(family.facts);
  switch (family.part) {
    case "root":
      return printRoot(family.facts);
    case "input":
      return printInput(family.facts);
    case "trigger":
    case "clear":
      return printButton(family.facts, family.part);
    case "portal":
      return printPortal(family.facts);
    case "popup":
    case "positioner":
      return printFloatingPart(family.facts, family.part);
    case "item":
      return printItem(family.facts);
    case "itemIndicator":
      return printItemIndicator(family.facts);
    case "empty":
      return printEmpty(family.facts);
    case "separator":
      return printSeparator(family.facts);
    case "value":
      return printValue(family.facts);
    default:
      return printSimplePart(family.facts, family.part);
  }
}

export function printVueEditableCollectionOverlayIndex(
  family: AdapterEditableCollectionOverlayIndexProjection,
): string {
  const facts = family.facts;
  const imports = facts.index.importMembers
    .map((member) => `import ${member.name} from "${member.from}.vue";`)
    .join("\n");
  const exports = facts.index.importMembers
    .map((member) => `export { default as ${member.name} } from "${member.from}.vue";`)
    .join("\n");
  const members = facts.index.namespaceMembers
    .map((member) => `  ${member.key}: ${member.name},`)
    .join("\n");
  const typeExports = facts.index.typeExports?.length
    ? `export type { ${facts.index.typeExports.join(", ")} } from "${facts.index.typeExportSource}";`
    : "";
  return `// ${COMMENT}
${imports}

export type { ${facts.context.rootContextValueType}, ${facts.context.itemContextValueType} } from "./${facts.exports.root}.vue";
export { ${facts.context.rootContext}, ${facts.context.itemContext}, ${facts.context.useRootContext}, ${facts.context.useItemContext} } from "./${facts.exports.root}.vue";

const ${facts.exports.namespace} = {
${members}
};

${exports}
export { ${facts.exports.namespace} };
export default ${facts.exports.namespace};

${typeExports}
`;
}

function printRoot(f: AdapterEditableCollectionOverlayFacts): string {
  const inputModel = projectVueModel(f.states.inputValue.name);
  const openModel = projectVueModel(f.states.open.name);
  const valueModel = projectVueModel(f.states.value.name);
  return `<!-- ${COMMENT} -->
<script lang="ts">
import { type ComputedRef, type InjectionKey, inject, type Ref } from "vue";

export type ${f.context.rootContextValueType} = Readonly<{
  disabled: ComputedRef<boolean>;
  element: Readonly<Ref<HTMLElement | null>>;
  inputValue: ComputedRef<string>;
  mounted: Readonly<Ref<boolean>>;
  open: ComputedRef<boolean>;
  readOnly: ComputedRef<boolean>;
  registerPortal(owner: symbol, element: HTMLElement | null): void;
  required: ComputedRef<boolean>;
  value: ComputedRef<string | null>;
}>;
export type ${f.context.itemContextValueType} = Readonly<{ disabled: ComputedRef<boolean>; value: ComputedRef<string> }>;
export const ${f.context.rootContext}: InjectionKey<${f.context.rootContextValueType}> = Symbol("Starwind${f.context.rootContext}");
export const ${f.context.itemContext}: InjectionKey<${f.context.itemContextValueType}> = Symbol("Starwind${f.context.itemContext}");
export function ${f.context.useRootContext}(part = "part"): ${f.context.rootContextValueType} {
  const value = inject(${f.context.rootContext});
  if (!value) throw new Error(\`${f.displayName}.\${part} requires an owning ${f.displayName}.Root.\`);
  return value;
}
export function ${f.context.useItemContext}(part = "part"): ${f.context.itemContextValueType} {
  const value = inject(${f.context.itemContext});
  if (!value) throw new Error(\`${f.displayName}.\${part} requires an owning ${f.displayName}.Item.\`);
  return value;
}
</script>
<script setup lang="ts">
import { ${f.runtime.factory}, type ${f.events.inputValueChange.detailsType}, type ${f.events.openChange.detailsType}, type ${f.events.valueChange.detailsType} } from "${f.runtime.importSource}";
import { computed, nextTick, onBeforeUnmount, onMounted, provide, ref, useAttrs, watch } from "vue";
import { useVueAsChildRuntimeOwner } from "../_internal/as-child";

defineOptions({ inheritAttrs: false });
defineSlots<{ default?: () => unknown }>();
const props = withDefaults(defineProps<{
  autoComplete?: string; defaultInputValue?: string; defaultOpen?: boolean; defaultValue?: string | null;
  disabled?: boolean; filterMode?: "contains" | "startsWith"; form?: string; highlightItemOnHover?: boolean;
  inputValue?: string; locale?: string; modal?: boolean; name?: string; open?: boolean; readOnly?: boolean;
  required?: boolean; modelValue?: string | null;
}>(), { defaultInputValue: undefined, defaultOpen: false, defaultValue: null, disabled: false, filterMode: "contains", highlightItemOnHover: true, modal: false, inputValue: undefined, open: undefined, readOnly: false, required: false, modelValue: undefined });
const emit = defineEmits<{
  "${inputModel.updateEvent}": [inputValue: string]; "${openModel.updateEvent}": [open: boolean]; "${valueModel.updateEvent}": [value: string | null];
  ${f.events.inputValueChange.name}: [inputValue: string, detail: ${f.events.inputValueChange.detailsType}];
  ${f.events.openChange.name}: [open: boolean, detail: ${f.events.openChange.detailsType}];
  ${f.events.valueChange.name}: [value: string | null, detail: ${f.events.valueChange.detailsType}];
}>();
const attrs = useAttrs();
const rootRef = ref<HTMLDivElement | null>(null);
const hiddenInputRef = ref<HTMLInputElement | null>(null);
const mounted = ref(false);
const initialDefaultInputValue = props.defaultInputValue;
const initialDefaultOpen = props.defaultOpen;
const initialDefaultValue = props.defaultValue;
const uncontrolledInputValue = ref<string | undefined>(initialDefaultInputValue);
const uncontrolledOpen = ref(props.disabled ? false : initialDefaultOpen);
const uncontrolledValue = ref<string | null>(initialDefaultValue);
const renderedInputValue = computed(() => props.inputValue ?? uncontrolledInputValue.value ?? "");
const renderedOpen = computed(() => props.disabled ? false : (props.open ?? uncontrolledOpen.value));
const renderedValue = computed(() => props.modelValue !== undefined ? props.modelValue : uncontrolledValue.value);
const disabled = computed(() => props.disabled);
const readOnly = computed(() => props.readOnly);
const required = computed(() => props.required);
let instance: ReturnType<typeof ${f.runtime.factory}> | undefined;
let unsubscribeAccepted: Array<() => void> = [];
let portalOwner: symbol | undefined;
let portalReference: HTMLElement | null = null;
let resetForm: HTMLFormElement | null = null;
let resetTimer: number | undefined;
let lifecycleGeneration = 0;

provide(${f.context.rootContext}, { disabled, element: rootRef, inputValue: renderedInputValue, mounted, open: renderedOpen, readOnly, registerPortal(owner, element) { if (element) { portalOwner = owner; portalReference = element; } else if (portalOwner === owner) { portalOwner = undefined; portalReference = null; } }, required, value: renderedValue });
defineExpose({ element: rootRef, close: () => instance?.close(), open: () => { if (!props.disabled) instance?.open(); }, updatePosition: () => instance?.updatePosition() });

function handleInputValueChange(inputValue: string, detail: ${f.events.inputValueChange.detailsType}): void { emit("${f.events.inputValueChange.name}", inputValue, detail); if (detail.isCanceled) return; }
function handleOpenChange(open: boolean, detail: ${f.events.openChange.detailsType}): void { emit("${f.events.openChange.name}", open, detail); if (detail.isCanceled) return; }
function handleValueChange(value: string | null, detail: ${f.events.valueChange.detailsType}): void { emit("${f.events.valueChange.name}", value, detail); if (detail.isCanceled) return; }
function acceptInputValue(detail: ${f.events.inputValueChange.detailsType}): void { const value = detail.${f.events.inputValueChange.valueProperty}; if (props.inputValue === undefined) uncontrolledInputValue.value = value; emit("${inputModel.updateEvent}", value); }
function acceptOpen(detail: ${f.events.openChange.detailsType}): void { const value = detail.${f.events.openChange.valueProperty}; if (props.open === undefined) uncontrolledOpen.value = value; emit("${openModel.updateEvent}", value); }
function acceptValue(detail: ${f.events.valueChange.detailsType}): void { const value = detail.${f.events.valueChange.valueProperty}; if (props.modelValue === undefined) uncontrolledValue.value = value; emit("${valueModel.updateEvent}", value); }
function unbindReset(): void { if (resetTimer !== undefined) window.clearTimeout(resetTimer); resetTimer = undefined; resetForm?.removeEventListener("reset", handleReset); resetForm = null; }
function handleReset(): void { resetTimer = window.setTimeout(() => { resetTimer = undefined; if (!instance) return; if (props.modelValue !== undefined) instance.${f.setters.value.method}(props.modelValue, { emit: false }); else uncontrolledValue.value = instance.${f.states.value.getter}(); if (props.inputValue !== undefined) instance.${f.setters.inputValue.method}(props.inputValue, { emit: false, filter: false }); else uncontrolledInputValue.value = instance.${f.states.inputValue.getter}(); }, 0); }
function bindReset(): void { const next = hiddenInputRef.value?.form ?? null; if (next === resetForm) return; unbindReset(); resetForm = next; resetForm?.addEventListener("reset", handleReset); }
function destroyOwnedInstance(): void { unbindReset(); unsubscribeAccepted.splice(0).forEach((unsubscribe) => unsubscribe()); const ownedInstance = instance; instance = undefined; ownedInstance?.destroy(); }
function setupRuntime(): void {
  const preservedInputValue = props.inputValue ?? uncontrolledInputValue.value;
  destroyOwnedInstance(); if (!rootRef.value) return;
  const created = ${f.runtime.factory}(rootRef.value, { autoComplete: props.autoComplete, defaultInputValue: preservedInputValue, defaultOpen: props.disabled ? false : uncontrolledOpen.value, defaultValue: uncontrolledValue.value, disabled: props.disabled, filterMode: props.filterMode, form: props.form, highlightItemOnHover: props.highlightItemOnHover, locale: props.locale, modal: props.modal, name: props.name, onInputValueChange: handleInputValueChange, onOpenChange: handleOpenChange, onValueChange: handleValueChange, portalReference: portalReference ?? undefined, readOnly: props.readOnly, required: props.required, ...(props.inputValue === undefined ? {} : { inputValue: props.inputValue }), ...(props.open === undefined ? {} : { open: props.open }), ...(props.modelValue === undefined ? {} : { value: props.modelValue }) });
  instance = created;
  unsubscribeAccepted = [created.subscribe("inputValueChange", acceptInputValue), created.subscribe("openChange", acceptOpen), created.subscribe("valueChange", acceptValue)];
  if (props.inputValue === undefined) uncontrolledInputValue.value = created.${f.states.inputValue.getter}();
  if (props.open === undefined) uncontrolledOpen.value = created.${f.states.open.getter}();
  if (props.modelValue === undefined) uncontrolledValue.value = created.${f.states.value.getter}();
  bindReset();
}
async function recreate(): Promise<void> { const generation = ++lifecycleGeneration; mounted.value = false; await nextTick(); if (generation !== lifecycleGeneration || !rootRef.value) return; setupRuntime(); mounted.value = true; }
useVueAsChildRuntimeOwner(rootRef, recreate);
onMounted(() => { setupRuntime(); mounted.value = true; });
watch(() => props.inputValue, (value, previous) => { if ((value === undefined) !== (previous === undefined)) { if (value === undefined && instance) uncontrolledInputValue.value = instance.${f.states.inputValue.getter}(); void recreate(); return; } if (value === undefined || !instance || Object.is(instance.${f.states.inputValue.getter}(), value)) return; instance.${f.setters.inputValue.method}(value, { emit: false, filter: false }); }, { flush: "post" });
watch(() => props.open, (value, previous) => { if ((value === undefined) !== (previous === undefined)) { if (value === undefined && instance) uncontrolledOpen.value = instance.${f.states.open.getter}(); void recreate(); return; } if (value === undefined || props.disabled || !instance || Object.is(instance.${f.states.open.getter}(), value)) return; instance.${f.setters.open.method}(value, { emit: false }); }, { flush: "post" });
watch(() => props.modelValue, (value, previous) => { if ((value === undefined) !== (previous === undefined)) { if (value === undefined && instance) uncontrolledValue.value = instance.${f.states.value.getter}(); void recreate(); return; } if (value === undefined || !instance || Object.is(instance.${f.states.value.getter}(), value)) return; instance.${f.setters.value.method}(value, { emit: false }); if (props.inputValue === undefined) uncontrolledInputValue.value = instance.${f.states.inputValue.getter}(); }, { flush: "post" });
watch(() => props.disabled, (value) => { if (!instance) return; instance.${f.setters.disabled.method}(value); if (value) { if (props.open === undefined) uncontrolledOpen.value = false; return; } const nextOpen = props.open ?? uncontrolledOpen.value; if (!Object.is(instance.${f.states.open.getter}(), nextOpen)) instance.${f.setters.open.method}(nextOpen, { emit: false }); });
watch(() => [props.readOnly, props.filterMode, props.locale, props.modal, props.highlightItemOnHover] as const, () => { void recreate(); }, { flush: "post" });
watch(() => [props.autoComplete, props.form, props.name, props.required] as const, ([autoComplete, form, name, required]) => { instance?.${f.formSetter.method}({ autoComplete, form, name, required }); bindReset(); }, { flush: "post" });
onBeforeUnmount(() => { lifecycleGeneration += 1; mounted.value = false; destroyOwnedInstance(); });
</script>
<template>
  <${f.parts.root.defaultElement} ref="rootRef" v-bind="attrs" ${f.attrs.root} data-sw-part="root" :${f.attrs.autoComplete}="props.autoComplete" :${f.attrs.defaultInputValue}="initialDefaultInputValue" :${f.attrs.defaultOpen}="initialDefaultOpen ? 'true' : undefined" :${f.attrs.defaultValue}="initialDefaultValue ?? undefined" :${f.attrs.disabled}="props.disabled ? '' : undefined" :${f.attrs.filterMode}="props.filterMode" :${f.attrs.form}="props.form" :${f.attrs.highlightItemOnHover}="props.highlightItemOnHover ? 'true' : 'false'" :${f.attrs.inputValue}="renderedInputValue" :${f.attrs.locale}="props.locale" :${f.attrs.modal}="props.modal ? 'true' : 'false'" :${f.attrs.name}="props.name" :${f.attrs.readOnly}="props.readOnly ? '' : undefined" :${f.attrs.required}="props.required ? '' : undefined" :data-state="renderedOpen ? 'open' : 'closed'" :data-value="renderedValue ?? undefined">
    <input ref="hiddenInputRef" ${f.attrs.hiddenInput} data-sw-part="hidden-input" type="${f.hiddenInput.constantAttributes.type}" :autocomplete="props.autoComplete" :disabled="props.disabled" :form="props.form" :name="props.name" :required="props.required" :value="renderedValue ?? ''" aria-hidden="${f.hiddenInput.constantAttributes.ariaHidden}" tabindex="${f.hiddenInput.constantAttributes.tabIndex}" readonly />
    <slot />
  </${f.parts.root.defaultElement}>
</template>
`;
}

function printInput(f: AdapterEditableCollectionOverlayFacts): string {
  const p = f.parts.input;
  return simpleSfc(
    f.exports.input,
    "HTMLInputElement",
    `input`,
    `${f.attrs.input} data-sw-part="${p.name}" role="${f.inputSemantics.role}" aria-autocomplete="${f.inputSemantics.ariaAutocomplete}" :aria-expanded="combobox.open.value" autocomplete="${f.inputSemantics.autocomplete}"`,
    `import { ${f.context.useRootContext} } from "./${f.exports.root}.vue";\n\nconst combobox = ${f.context.useRootContext}("Input");`,
    ``,
    ``,
    true,
  );
}

function printButton(f: AdapterEditableCollectionOverlayFacts, name: "clear" | "trigger"): string {
  const p = f.parts[name];
  const triggerProps =
    name === "trigger"
      ? `      "aria-haspopup": "${f.popupRole}" as const,
      "aria-expanded": combobox.open.value,
      "data-state": combobox.open.value ? "open" : "closed",
`
      : "";
  return `<!-- ${COMMENT} -->
<script setup lang="ts">
import { defineComponent, ref, useAttrs, type VNode } from "vue";
import { createVueAsChild } from "../_internal/as-child";
import { ${f.context.useRootContext} } from "./${f.exports.root}.vue";

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<{ ${f.props.asChild.name}?: ${f.props.asChild.type} }>(), { ${f.props.asChild.name}: false });
const slots = defineSlots<{ default?: () => VNode[] }>();
const attrs = useAttrs();
const element = ref<HTMLElement | null>(null);
const combobox = ${f.context.useRootContext}("${p.namespaceKey}");
const asChild = createVueAsChild("${f.exports[name]}", element);
const { setElement } = asChild;
defineExpose({ element });
function protectedAttrs(): Record<string, unknown> { return {
      "${f.attrs[name]}": "",
      "data-as-child": props.${f.props.asChild.name} ? "" : undefined,
      "data-sw-part": "${p.name}",
      "aria-disabled": combobox.disabled.value ? "true" : undefined,
      "aria-readonly": combobox.readOnly.value ? "true" : undefined,
      "data-disabled": combobox.disabled.value ? "" : undefined,
      "data-readonly": combobox.readOnly.value ? "" : undefined,
${triggerProps}      disabled: combobox.disabled.value || undefined,
    }; }
const AsChild = defineComponent({ inheritAttrs: false, setup() { return () => asChild.render({ children: slots.default?.() ?? [], consumerProps: attrs, defaultNativeButtonType: "${f.clearAction.typeAttribute.value}", protectedProps: protectedAttrs() }); } });
</script>
<template>
  <AsChild v-if="props.${f.props.asChild.name}" />
  <${p.defaultElement} v-else :ref="setElement" v-bind="{ ...attrs, ...protectedAttrs() }" type="${f.clearAction.typeAttribute.value}"><slot /></${p.defaultElement}>
</template>
`;
}

function printPortal(f: AdapterEditableCollectionOverlayFacts): string {
  return `<!-- ${COMMENT} -->
<script setup lang="ts">
import { reportPortalPlacement, resolvePortalPlacement } from "${f.runtime.importSource}";
import { onBeforeUnmount, onMounted, ref } from "vue";
import { useVuePortalPlacement } from "../_internal/portal";
import { ${f.context.useRootContext} } from "./${f.exports.root}.vue";

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<{ container?: string | HTMLElement; disabled?: boolean }>(), { disabled: false });
defineSlots<{ default?: () => unknown }>();
const combobox = ${f.context.useRootContext}("Portal"); const portalRef = ref<HTMLDivElement | null>(null); const owner = Symbol("${f.displayName}Portal");
const placement = useVuePortalPlacement({ active: () => combobox.mounted.value, container: () => props.container, disabled: () => props.disabled, element: portalRef, reference: () => combobox.element.value, runtime: { reportPortalPlacement, resolvePortalPlacement } });
onMounted(() => { combobox.registerPortal(owner, portalRef.value); });
onBeforeUnmount(() => { combobox.registerPortal(owner, null); });
</script>
<template><Teleport :to="placement.target.value" :disabled="placement.disabled.value"><div ref="portalRef" v-bind="${VUE_TEMPLATE_ONLY_ATTRIBUTE_ACCESS.templateBinding}" ${f.attrs.portal} :data-container="typeof props.container === 'string' ? props.container : undefined" :data-disabled="props.disabled ? '' : undefined" :data-placement="placement.ready.value ? 'ready' : 'pending'" data-sw-portal-placement="framework" data-sw-part="${f.parts.portal.name}" data-floating-root><slot /></div></Teleport></template>
`;
}

function printFloatingPart(
  f: AdapterEditableCollectionOverlayFacts,
  name: "popup" | "positioner",
): string {
  const p = f.parts[name];
  const popup =
    name === "popup" ? ` role="${f.popupRole}" tabindex="-1" :hidden="!combobox.open.value"` : "";
  return `<!-- ${COMMENT} -->
<script setup lang="ts">
import { ref } from "vue"; import { ${f.context.useRootContext} } from "./${f.exports.root}.vue";

defineOptions({ inheritAttrs: false }); const props=withDefaults(defineProps<{ align?: "start"|"center"|"end"; alignOffset?: number; avoidCollisions?: boolean; side?: "top"|"right"|"bottom"|"left"; sideOffset?: number }>(), { align: ${f.floating.alignDefault}, alignOffset: ${f.floating.alignOffsetDefault}, avoidCollisions: ${f.floating.avoidCollisionsDefault}, side: ${f.floating.sideDefault}, sideOffset: ${f.floating.sideOffsetDefault} }); defineSlots<{ default?: () => unknown }>();
const element=ref<HTMLDivElement|null>(null); const combobox=${f.context.useRootContext}("${p.namespaceKey}"); defineExpose({ element });
</script>
<template><${p.defaultElement} ref="element" v-bind="${VUE_TEMPLATE_ONLY_ATTRIBUTE_ACCESS.templateBinding}" ${f.attrs[name]} data-sw-part="${p.name}"${popup} :data-state="combobox.open.value ? 'open' : 'closed'" :${f.attrs.side}="props.side" :${f.attrs.align}="props.align" :${f.attrs.sideOffset}="props.sideOffset" :${f.attrs.alignOffset}="props.alignOffset" :${f.attrs.avoidCollisions}="props.avoidCollisions ? 'true' : 'false'"><slot /></${p.defaultElement}></template>
`;
}

function printItem(f: AdapterEditableCollectionOverlayFacts): string {
  const p = f.parts.item;
  return `<!-- ${COMMENT} -->
<script setup lang="ts">
import { computed, provide, ref } from "vue"; import { ${f.context.itemContext}, ${f.context.useRootContext} } from "./${f.exports.root}.vue";

defineOptions({ inheritAttrs:false }); const props=withDefaults(defineProps<{ disabled?: boolean; value: string }>(), { disabled:false }); defineSlots<{default?:()=>unknown}>();
const element=ref<HTMLDivElement|null>(null); const combobox=${f.context.useRootContext}("Item"); const value=computed(()=>props.value); const disabled=computed(()=>props.disabled); const selected=computed(()=>combobox.value.value===value.value); provide(${f.context.itemContext},{disabled,value}); defineExpose({element});
</script>
<template><${p.defaultElement} ref="element" v-bind="${VUE_TEMPLATE_ONLY_ATTRIBUTE_ACCESS.templateBinding}" ${f.attrs.item} data-sw-part="${p.name}" :${f.attrs.valueData}="props.value" role="${f.collection.item.role}" :aria-selected="selected" :aria-disabled="props.disabled ? 'true' : undefined" :${f.attrs.disabled}="props.disabled ? '' : undefined" :data-selected="selected ? '' : undefined" tabindex="${f.collection.item.initialProjection.tabIndex}"><slot /></${p.defaultElement}></template>
`;
}

function printItemIndicator(f: AdapterEditableCollectionOverlayFacts): string {
  const p = f.parts.itemIndicator;
  return `<!-- ${COMMENT} -->
<script setup lang="ts">
import { computed, ref } from "vue"; import { ${f.context.useRootContext}, ${f.context.useItemContext} } from "./${f.exports.root}.vue";

defineOptions({inheritAttrs:false}); defineSlots<{default?:()=>unknown}>();
const element=ref<HTMLSpanElement|null>(null); const combobox=${f.context.useRootContext}("ItemIndicator"); const item=${f.context.useItemContext}("ItemIndicator"); const selected=computed(()=>combobox.value.value===item.value.value); defineExpose({element});
</script>
<template><${p.defaultElement} ref="element" v-bind="${VUE_TEMPLATE_ONLY_ATTRIBUTE_ACCESS.templateBinding}" ${f.attrs.itemIndicator} data-sw-part="${p.name}" aria-hidden="true" :${f.collection.itemIndicator.selectedStateAttribute}="selected ? 'checked' : 'unchecked'" :${f.collection.itemIndicator.dataHiddenAttribute}="selected ? undefined : ''" :hidden="!selected"><slot /></${p.defaultElement}></template>
`;
}

function printEmpty(f: AdapterEditableCollectionOverlayFacts): string {
  return simpleSfc(
    f.exports.empty,
    "HTMLDivElement",
    f.parts.empty.defaultElement,
    `${f.attrs.empty} data-sw-part="${f.parts.empty.name}" hidden`,
  );
}
function printSeparator(f: AdapterEditableCollectionOverlayFacts): string {
  return simpleSfc(
    f.exports.separator,
    "HTMLDivElement",
    f.parts.separator.defaultElement,
    `${f.attrs.separator} data-sw-part="${f.parts.separator.name}" role="${f.collection.separator.role}" aria-orientation="${f.collection.separator.ariaOrientation}"`,
  );
}
function printValue(f: AdapterEditableCollectionOverlayFacts): string {
  const p = f.parts.value;
  return `<!-- ${COMMENT} -->
<script setup lang="ts">import { ref } from "vue"; import { ${f.context.useRootContext} } from "./${f.exports.root}.vue";\n\ndefineOptions({inheritAttrs:false}); const props=defineProps<{placeholder?:string}>(); const slots=defineSlots<{default?:()=>unknown}>();
const element=ref<HTMLSpanElement|null>(null); const initialPlaceholder=props.placeholder; ${f.context.useRootContext}("Value"); defineExpose({element});</script>
<template><${p.defaultElement} ref="element" v-bind="${VUE_TEMPLATE_ONLY_ATTRIBUTE_ACCESS.templateBinding}" :${f.attrs.value}="slots.default ? undefined : ''" data-sw-part="${p.name}" :data-placeholder="props.placeholder"><slot>{{ initialPlaceholder }}</slot></${p.defaultElement}></template>
`;
}
function printSimplePart(
  f: AdapterEditableCollectionOverlayFacts,
  name: Exclude<
    AdapterEditableCollectionOverlayPartName,
    | "root"
    | "input"
    | "trigger"
    | "clear"
    | "portal"
    | "popup"
    | "positioner"
    | "item"
    | "itemIndicator"
    | "empty"
    | "separator"
    | "value"
  >,
): string {
  const p = f.parts[name];
  const extra = name === "group" ? ` role="${f.collection.group.role}"` : "";
  return simpleSfc(
    f.exports[name],
    elementType(p.defaultElement),
    p.defaultElement,
    `${f.attrs[name]} data-sw-part="${p.name}"${extra}`,
  );
}

function simpleSfc(
  name: string,
  type: string,
  tag: string,
  attributes: string,
  setup = "",
  props = "",
  templatePrefix = "",
  voidElement = false,
): string {
  return `<!-- ${COMMENT} -->
<script setup lang="ts">
import { ref } from "vue";
${setup}
defineOptions({ inheritAttrs: false }); ${props} defineSlots<{ default?: () => unknown }>();
const element=ref<${type}|null>(null); defineExpose({element});
</script>
<template>${templatePrefix}<${tag} ref="element" v-bind="${VUE_TEMPLATE_ONLY_ATTRIBUTE_ACCESS.templateBinding}" ${attributes}${voidElement ? " />" : `><slot /></${tag}>`}</template>
`;
}
function elementType(tag: string): string {
  return tag === "span"
    ? "HTMLSpanElement"
    : tag === "label"
      ? "HTMLLabelElement"
      : "HTMLDivElement";
}
function assertFacts(f: AdapterEditableCollectionOverlayFacts): void {
  const names = [f.states.inputValue.name, f.states.open.name, f.states.value.name];
  if (names.join(",") !== "inputValue,open,value" || f.runtime.factory.length === 0)
    throw new TypeError(`Vue ${f.displayName} requires complete editable collection facts.`);
}
