import type {
  AdapterComponentFile,
  AdapterIndexFile,
  AdapterOutputModel,
  AdapterPrintedFile,
  AdapterSharedViewportNavigationFacts,
  AdapterSharedViewportNavigationPartName,
} from "../types.js";
import { VUE_NON_SHIPPING_COMMENT } from "./primitive/shared-fragments.js";

export function isVueSharedViewportNavigationOutput(model: AdapterOutputModel): boolean {
  return model.files.some(
    (file) =>
      file.kind === "component" && file.component.family?.kind === "shared-viewport-navigation",
  );
}

export function printVueSharedViewportNavigationOutput(
  model: AdapterOutputModel,
): AdapterPrintedFile[] {
  const components = model.files.filter(
    (file): file is AdapterComponentFile =>
      file.kind === "component" && file.component.family?.kind === "shared-viewport-navigation",
  );
  const family = components[0]?.component.family;
  if (!family || family.kind !== "shared-viewport-navigation") {
    throw new TypeError("Vue shared-viewport-navigation projection requires family facts.");
  }
  const index = model.files.find(
    (file): file is AdapterIndexFile =>
      file.kind === "index" && file.family?.kind === "shared-viewport-navigation",
  );
  if (!index)
    throw new TypeError("Vue shared-viewport-navigation projection requires an index file.");
  const facts = family.facts;
  return [
    ...components.map((file) => printComponent(file, facts)),
    { contents: printIndex(facts), path: index.path },
  ];
}

function printComponent(
  file: AdapterComponentFile,
  facts: AdapterSharedViewportNavigationFacts,
): AdapterPrintedFile {
  const family = file.component.family;
  if (!family || family.kind !== "shared-viewport-navigation") {
    throw new TypeError(`Vue ${facts.displayName} component requires shared viewport facts.`);
  }
  const printers: Record<AdapterSharedViewportNavigationPartName, () => string> = {
    root: () => printRoot(facts),
    list: () => printList(facts),
    item: () => printItem(facts),
    trigger: () => printTrigger(facts),
    icon: () => printSimple(facts, "icon"),
    content: () => printContent(facts),
    link: () => printLink(facts),
    portal: () => printPortal(facts),
    positioner: () => printPositioner(facts),
    popup: () => printSimple(facts, "popup"),
    viewport: () => printViewport(facts),
    arrow: () => printSimple(facts, "arrow"),
  };
  return { contents: printers[family.part](), path: `${file.path}.vue` };
}

function printContext(facts: AdapterSharedViewportNavigationFacts): string {
  return `<script lang="ts">
import { inject, type ComputedRef, type InjectionKey, type Ref } from "vue";

export type ${facts.displayName}Orientation = ${facts.props.orientation.type};
export type ${facts.displayName}RootContextValue = {
  mounted: Ref<boolean>;
  orientation: ComputedRef<${facts.displayName}Orientation>;
  refreshPortalTarget: () => Promise<void>;
  value: ComputedRef<${facts.props.value.type}>;
};
export type ${facts.displayName}ItemContextValue = {
  open: ComputedRef<boolean>;
  value: ComputedRef<string | undefined>;
};
export type ${facts.displayName}ViewportContextValue = { element: Ref<HTMLDivElement | null> };

export const ${facts.displayName}RootContext: InjectionKey<${facts.displayName}RootContextValue> = Symbol("${facts.displayName}RootContext");
export const ${facts.displayName}ItemContext: InjectionKey<${facts.displayName}ItemContextValue> = Symbol("${facts.displayName}ItemContext");
export const ${facts.displayName}ViewportContext: InjectionKey<${facts.displayName}ViewportContextValue> = Symbol("${facts.displayName}ViewportContext");

function required<T>(key: InjectionKey<T>, consumer: string): T {
  const value = inject(key);
  if (!value) throw new TypeError(consumer + " must be used inside ${facts.displayName}.Root.");
  return value;
}
export function use${facts.displayName}RootContext(consumer: string) { return required(${facts.displayName}RootContext, consumer); }
export function use${facts.displayName}ItemContext(consumer: string) { return required(${facts.displayName}ItemContext, consumer); }
export function use${facts.displayName}ViewportContext(consumer: string) { return required(${facts.displayName}ViewportContext, consumer); }
</script>`;
}

function printRoot(facts: AdapterSharedViewportNavigationFacts): string {
  const p = facts.props;
  const event = facts.valueControl.event;
  return `<!-- ${VUE_NON_SHIPPING_COMMENT} -->
${printContext(facts)}
<script setup lang="ts">
import { ${facts.runtime.factory}, type ${event.detailsType} } from "${facts.runtime.importSource}";
import { computed, nextTick, onBeforeUnmount, onMounted, onUpdated, provide, ref, useAttrs, watch } from "vue";
import { useVueAsChildRuntimeOwner } from "../_internal/as-child";
defineOptions({ inheritAttrs: false });
defineSlots<{ default?: () => unknown }>();
const props = withDefaults(defineProps<{ modelValue?: ${p.value.type}; ${p.defaultValue.name}?: ${p.defaultValue.type}; ${p.openDelay.name}?: ${p.openDelay.type}; ${p.closeDelay.name}?: ${p.closeDelay.type}; ${p.closeOnEscape.name}?: ${p.closeOnEscape.type}; ${p.closeOnOutsideInteract.name}?: ${p.closeOnOutsideInteract.type}; ${p.orientation.name}?: ${facts.displayName}Orientation }>(), { modelValue: undefined, ${p.defaultValue.name}: ${valueDefault(p.defaultValue, "null")}, ${p.openDelay.name}: ${valueDefault(p.openDelay, "50")}, ${p.closeDelay.name}: ${valueDefault(p.closeDelay, "50")}, ${p.closeOnEscape.name}: ${valueDefault(p.closeOnEscape, "true")}, ${p.closeOnOutsideInteract.name}: ${valueDefault(p.closeOnOutsideInteract, "true")}, ${p.orientation.name}: ${valueDefault(p.orientation, '"horizontal"')} });
const emit = defineEmits<{ "update:modelValue": [value: ${event.valueType}]; ${event.name}: [value: ${event.valueType}, detail: ${event.detailsType}] }>();
const publicAttrs = useAttrs(); const element = ref<HTMLElement | null>(null); const mounted = ref(false); const initialDefaultValue = props.${p.defaultValue.name}; const uncontrolledValue = ref<${event.valueType}>(initialDefaultValue); const value = computed(() => props.modelValue !== undefined ? props.modelValue : uncontrolledValue.value); const orientation = computed(() => props.${p.orientation.name});
let instance: ReturnType<typeof ${facts.runtime.factory}> | undefined; let generation = 0; let pendingDetail: ${event.detailsType} | undefined; let acceptedDetail: ${event.detailsType} | undefined; let unsubscribeValueChange: (() => void) | undefined;
provide(${facts.displayName}RootContext, { mounted, orientation, refreshPortalTarget, value }); defineExpose({ element, getValue: () => instance?.${facts.valueControl.state.getter}(), setValue: (next: ${event.valueType}) => instance?.${facts.valueControl.controlledResync.setter}(next) });
function handleValueChange(next: ${event.valueType}, detail: ${event.detailsType}) { pendingDetail = detail; emit("${event.name}", next, detail); }
function handleAcceptedValueChange(detail: ${event.detailsType}) { if (pendingDetail === detail) pendingDetail = undefined; if (props.modelValue === undefined) uncontrolledValue.value = detail.value; emit("update:modelValue", detail.value); if (props.modelValue !== undefined) { acceptedDetail = detail; void resyncControlled(detail); } }
async function resyncControlled(detail: ${event.detailsType}) { await nextTick(); if (acceptedDetail !== detail || props.modelValue === undefined || !instance) return; acceptedDetail = undefined; instance.${facts.valueControl.controlledResync.setter}(props.modelValue, { emit: false, ${facts.valueControl.controlledResync.preserveDetailFields.map((field) => `${field}: detail.${field}`).join(", ")} }); }
function syncUncontrolledFromRuntime() { if (props.modelValue !== undefined || !instance) return; const current = instance.${facts.valueControl.state.getter}(); if (!Object.is(uncontrolledValue.value, current)) uncontrolledValue.value = current; }
async function refreshPortalTarget() { const owned = instance; const ownGeneration = generation; if (!mounted.value || !owned) return; await nextTick(); if (!mounted.value || ownGeneration !== generation || instance !== owned) return; const replayValue = props.modelValue !== undefined ? props.modelValue : owned.${facts.valueControl.state.getter}(); owned.${facts.valueControl.controlledResync.setter}(replayValue, { emit: false }); }
function destroyOwnedInstance() { const owned = instance; instance = undefined; unsubscribeValueChange?.(); unsubscribeValueChange = undefined; pendingDetail = undefined; acceptedDetail = undefined; owned?.${facts.runtime.destroyMethod}(); }
function setupRuntime() { if (!element.value) return; instance = ${facts.runtime.factory}(element.value, { ${p.defaultValue.name}: uncontrolledValue.value, ${p.openDelay.name}: props.${p.openDelay.name}, ${p.closeDelay.name}: props.${p.closeDelay.name}, ${p.closeOnEscape.name}: props.${p.closeOnEscape.name}, ${p.closeOnOutsideInteract.name}: props.${p.closeOnOutsideInteract.name}, ...(props.modelValue === undefined ? {} : { ${p.value.name}: props.modelValue }), ${event.callbackProp}: handleValueChange }); unsubscribeValueChange = instance.subscribe("valueChange", handleAcceptedValueChange); }
async function recreateRuntime() { const current = instance?.${facts.valueControl.state.getter}(); if (props.modelValue === undefined && current !== undefined) uncontrolledValue.value = current; const ownGeneration = ++generation; mounted.value = false; destroyOwnedInstance(); await nextTick(); if (ownGeneration !== generation || !element.value) return; setupRuntime(); mounted.value = true; }
useVueAsChildRuntimeOwner(element, recreateRuntime);
onMounted(() => { setupRuntime(); mounted.value = true; });
onUpdated(syncUncontrolledFromRuntime);
watch(() => props.modelValue, (next, previous) => { if ((next === undefined) !== (previous === undefined)) { void recreateRuntime(); return; } if (next === undefined || !instance || Object.is(instance.${facts.valueControl.state.getter}(), next)) return; instance.${facts.valueControl.controlledResync.setter}(next, { emit: false }); }, { flush: "post" });
watch([() => props.${p.openDelay.name}, () => props.${p.closeDelay.name}, () => props.${p.closeOnEscape.name}, () => props.${p.closeOnOutsideInteract.name}], () => { void recreateRuntime(); }, { flush: "post" });
onBeforeUnmount(() => { generation += 1; mounted.value = false; destroyOwnedInstance(); });
</script>
<template><${facts.parts.root.defaultElement} ref="element" v-bind="publicAttrs" ${facts.attrs.root} data-sw-part="${facts.parts.root.name}" :${facts.attrs.defaultValue}="props.modelValue === undefined ? initialDefaultValue ?? undefined : undefined" :${facts.attrs.controlledValue}="props.modelValue === null ? '' : undefined" :${facts.attrs.value}="props.modelValue ?? undefined" :${facts.attrs.openDelay}="props.${p.openDelay.name}" :${facts.attrs.closeDelay}="props.${p.closeDelay.name}" :${facts.attrs.closeOnEscape}="props.${p.closeOnEscape.name} ? 'true' : 'false'" :${facts.attrs.closeOnOutsideInteract}="props.${p.closeOnOutsideInteract.name} ? 'true' : 'false'" :${facts.attrs.orientation}="props.${p.orientation.name}" :${facts.valueControl.state.renderedStateAttribute}="value === null ? 'closed' : 'open'"><slot /></${facts.parts.root.defaultElement}></template>
`;
}

function printItem(facts: AdapterSharedViewportNavigationFacts): string {
  return `<!-- ${VUE_NON_SHIPPING_COMMENT} -->
<script setup lang="ts">import { computed, provide, ref, useAttrs } from "vue"; import { ${facts.displayName}ItemContext, use${facts.displayName}RootContext } from "./${facts.exports.root}.vue"; defineOptions({ inheritAttrs: false }); const props = defineProps<{ ${facts.item.valueProp.name}?: ${facts.item.valueProp.type} }>(); defineSlots<{ default?: () => unknown }>(); const attrs = useAttrs(); const root = use${facts.displayName}RootContext("${facts.exports.item}"); const element = ref<HTMLLIElement | null>(null); const itemValue = computed(() => props.${facts.item.valueProp.name}); const open = computed(() => itemValue.value !== undefined && root.value.value === itemValue.value); provide(${facts.displayName}ItemContext, { open, value: itemValue }); defineExpose({ element });</script>
<template><${facts.parts.item.defaultElement} ref="element" v-bind="attrs" ${facts.attrs.item} data-sw-part="${facts.parts.item.name}" :${facts.attrs.itemValue}="props.${facts.item.valueProp.name}" :${facts.item.stateAttribute}="open ? 'open' : '${facts.item.stateValue}'"><slot /></${facts.parts.item.defaultElement}></template>
`;
}

function printList(facts: AdapterSharedViewportNavigationFacts): string {
  const part = facts.parts.list;
  return `<!-- ${VUE_NON_SHIPPING_COMMENT} -->
<script setup lang="ts">import { ref, useAttrs } from "vue"; import { use${facts.displayName}RootContext } from "./${facts.exports.root}.vue"; defineOptions({ inheritAttrs: false }); defineSlots<{ default?: () => unknown }>(); const attrs = useAttrs(); const root = use${facts.displayName}RootContext("${facts.exports.list}"); const element = ref<HTMLElement | null>(null); defineExpose({ element });</script>
<template><${part.defaultElement} ref="element" v-bind="attrs" ${part.discoveryAttribute} data-sw-part="${part.name}" :${facts.attrs.orientation}="root.orientation.value"><slot /></${part.defaultElement}></template>
`;
}

function printTrigger(facts: AdapterSharedViewportNavigationFacts): string {
  const t = facts.trigger;
  return `<!-- ${VUE_NON_SHIPPING_COMMENT} -->
<script setup lang="ts">import { defineComponent, ref, useAttrs, type VNode } from "vue"; import { createVueAsChild } from "../_internal/as-child"; import { use${facts.displayName}ItemContext } from "./${facts.exports.root}.vue"; defineOptions({ inheritAttrs: false }); const props = withDefaults(defineProps<{ ${t.asChild.name}?: ${t.asChild.type}; ${t.disabled.prop.name}?: ${t.disabled.prop.type}; ${t.openDelay.name}?: ${t.openDelay.type}; ${t.closeDelay.name}?: ${t.closeDelay.type} }>(), { ${t.asChild.name}: ${valueDefault(t.asChild, "false")}, ${t.disabled.prop.name}: ${valueDefault(t.disabled.prop, "false")} }); const slots = defineSlots<{ default?: () => VNode[] }>(); const attrs = useAttrs(); const item = use${facts.displayName}ItemContext("${facts.exports.trigger}"); const element = ref<HTMLElement | null>(null); const asChild = createVueAsChild("${facts.exports.trigger}", element); const { setElement } = asChild; const AsChild = defineComponent({ setup() { return () => asChild.render({ children: slots.default?.() ?? [], consumerProps: attrs, protectedProps: protectedAttrs() }); } }); function protectedAttrs() { return { "${facts.attrs.trigger}": "", "${facts.attrs.triggerOpenDelay}": props.${t.openDelay.name} == null ? undefined : String(props.${t.openDelay.name}), "${facts.attrs.triggerCloseDelay}": props.${t.closeDelay.name} == null ? undefined : String(props.${t.closeDelay.name}), "${t.disabled.dataAttribute}": props.${t.disabled.prop.name} ? "" : undefined, "${t.disabled.ariaAttribute}": props.${t.disabled.prop.name} ? true : undefined, "${t.disclosure.ariaExpanded}": item.open.value, "${t.disclosure.ariaHaspopup.attribute}": "${t.disclosure.ariaHaspopup.value}" as const, "${t.disclosure.stateAttribute}": item.open.value ? "open" : "${t.disclosure.closedStateValue}" }; } defineExpose({ element });</script>
<template><AsChild v-if="props.${t.asChild.name}" /><${facts.parts.trigger.defaultElement} v-else :ref="setElement" v-bind="{ ...attrs, ...protectedAttrs() }" ${t.typeAttribute.attribute}="${t.typeAttribute.value}" :${t.disabled.nativeAttribute}="props.${t.disabled.prop.name}"><slot /></${facts.parts.trigger.defaultElement}></template>
`;
}

function printContent(facts: AdapterSharedViewportNavigationFacts): string {
  return `<!-- ${VUE_NON_SHIPPING_COMMENT} -->
<script setup lang="ts">import { ref, useAttrs } from "vue"; import { use${facts.displayName}ItemContext } from "./${facts.exports.root}.vue"; defineOptions({ inheritAttrs: false }); defineSlots<{ default?: () => unknown }>(); const attrs = useAttrs(); const item = use${facts.displayName}ItemContext("${facts.exports.content}"); const element = ref<HTMLDivElement | null>(null); defineExpose({ element });</script>
<template><${facts.parts.content.defaultElement} ref="element" v-bind="attrs" ${facts.attrs.content} data-sw-part="${facts.parts.content.name}" :${facts.content.stateAttribute}="item.open.value ? 'open' : '${facts.content.stateValue}'" ${facts.content.hiddenAttribute}><slot /></${facts.parts.content.defaultElement}></template>
`;
}

function printLink(facts: AdapterSharedViewportNavigationFacts): string {
  const active = facts.link.active;
  const close = facts.link.closeOnClick;
  return `<!-- ${VUE_NON_SHIPPING_COMMENT} -->
<script setup lang="ts">import { ref, useAttrs } from "vue"; defineOptions({ inheritAttrs: false }); const props = withDefaults(defineProps<{ href?: string; ${active.prop.name}?: ${active.prop.type}; ${close.prop.name}?: ${close.prop.type} }>(), { ${active.prop.name}: ${valueDefault(active.prop, "false")}, ${close.prop.name}: ${valueDefault(close.prop, "true")} }); defineSlots<{ default?: () => unknown }>(); const attrs = useAttrs(); const element = ref<HTMLAnchorElement | null>(null); defineExpose({ element });</script>
<template><${facts.parts.link.defaultElement} ref="element" v-bind="attrs" ${facts.attrs.link} data-sw-part="${facts.parts.link.name}" :href="props.href" :${facts.attrs.active}="props.${active.prop.name} ? '' : undefined" :${active.ariaCurrentAttribute}="props.${active.prop.name} ? '${active.ariaCurrentValue}' : undefined" :${facts.attrs.linkCloseOnClick}="props.${close.prop.name} ? undefined : '${close.falseValue}'"><slot /></${facts.parts.link.defaultElement}></template>
`;
}

function printPortal(facts: AdapterSharedViewportNavigationFacts): string {
  return `<!-- ${VUE_NON_SHIPPING_COMMENT} -->
<script setup lang="ts">import { ref, useAttrs, watch } from "vue"; import { use${facts.displayName}RootContext } from "./${facts.exports.root}.vue"; defineOptions({ inheritAttrs: false }); const props = withDefaults(defineProps<{ container?: string | HTMLElement; disabled?: boolean }>(), { container: "body", disabled: false }); defineSlots<{ default?: () => unknown }>(); const attrs = useAttrs(); const root = use${facts.displayName}RootContext("${facts.exports.portal}"); const element = ref<HTMLDivElement | null>(null); watch([() => root.mounted.value, () => props.container, () => props.disabled], ([mounted]) => { if (mounted) void root.refreshPortalTarget(); }, { flush: "post" }); defineExpose({ element });</script>
<template><Teleport :to="props.container" :disabled="props.disabled || !root.mounted.value"><${facts.parts.portal.defaultElement} ref="element" v-bind="attrs" ${facts.attrs.portal} data-floating-root data-sw-part="${facts.parts.portal.name}"><slot /></${facts.parts.portal.defaultElement}></Teleport></template>
`;
}

function printPositioner(facts: AdapterSharedViewportNavigationFacts): string {
  const f = facts.floating;
  return `<!-- ${VUE_NON_SHIPPING_COMMENT} -->
<script setup lang="ts">import { ref, useAttrs } from "vue"; defineOptions({ inheritAttrs: false }); const props = withDefaults(defineProps<{ ${f.side.name}?: ${f.side.type}; ${f.align.name}?: ${f.align.type}; ${f.sideOffset.name}?: ${f.sideOffset.type}; ${f.alignOffset.name}?: ${f.alignOffset.type}; ${f.avoidCollisions.name}?: ${f.avoidCollisions.type}; ${f.collisionPadding.name}?: ${f.collisionPadding.type} }>(), { ${f.side.name}: ${valueDefault(f.side, '"bottom"')}, ${f.align.name}: ${valueDefault(f.align, '"start"')}, ${f.sideOffset.name}: ${valueDefault(f.sideOffset, "4")}, ${f.alignOffset.name}: ${valueDefault(f.alignOffset, "0")}, ${f.avoidCollisions.name}: ${valueDefault(f.avoidCollisions, "true")}, ${f.collisionPadding.name}: ${valueDefault(f.collisionPadding, "8")} }); defineSlots<{ default?: () => unknown }>(); const attrs = useAttrs(); const element = ref<HTMLDivElement | null>(null); defineExpose({ element });</script>
<template><${facts.parts.positioner.defaultElement} ref="element" v-bind="attrs" ${facts.attrs.positioner} data-sw-part="${facts.parts.positioner.name}" ${facts.positioner.stateAttribute}="${facts.positioner.stateValue}" :${facts.attrs.side}="props.${f.side.name}" :${facts.attrs.align}="props.${f.align.name}" :${facts.attrs.sideOffset}="props.${f.sideOffset.name}" :${facts.attrs.alignOffset}="props.${f.alignOffset.name}" :${facts.attrs.avoidCollisions}="props.${f.avoidCollisions.name} ? 'true' : 'false'" :${facts.attrs.collisionPadding}="props.${f.collisionPadding.name}"><slot /></${facts.parts.positioner.defaultElement}></template>
`;
}

function printViewport(facts: AdapterSharedViewportNavigationFacts): string {
  const part = facts.parts.viewport;
  return `<!-- ${VUE_NON_SHIPPING_COMMENT} -->
<script setup lang="ts">import { provide, ref, useAttrs } from "vue"; import { ${facts.displayName}ViewportContext } from "./${facts.exports.root}.vue"; defineOptions({ inheritAttrs: false }); defineSlots<{ default?: () => unknown }>(); const attrs = useAttrs(); const element = ref<HTMLDivElement | null>(null); provide(${facts.displayName}ViewportContext, { element }); defineExpose({ element });</script>
<template><${part.defaultElement} ref="element" v-bind="attrs" ${part.discoveryAttribute} data-sw-part="${part.name}" ${part.stateAttribute}="${part.stateValue}" ${part.hiddenAttribute}><slot /></${part.defaultElement}></template>
`;
}

function printSimple(
  facts: AdapterSharedViewportNavigationFacts,
  partName: "arrow" | "icon" | "popup",
): string {
  const part = facts.parts[partName];
  return `<!-- ${VUE_NON_SHIPPING_COMMENT} -->
<script setup lang="ts">import { ref, useAttrs } from "vue"; defineOptions({ inheritAttrs: false }); defineSlots<{ default?: () => unknown }>(); const attrs = useAttrs(); const element = ref<HTMLElement | null>(null); defineExpose({ element });</script>
<template><${part.defaultElement} ref="element" v-bind="attrs" ${part.discoveryAttribute} data-sw-part="${part.name}"${part.ariaHidden ? ' aria-hidden="true"' : ""}${part.stateAttribute ? ` ${part.stateAttribute}="${part.stateValue}"` : ""}${part.hidden ? ` ${part.hiddenAttribute}` : ""}><slot /></${part.defaultElement}></template>
`;
}

function printIndex(facts: AdapterSharedViewportNavigationFacts): string {
  const imports = facts.index.importMembers
    .map((member) => `import ${member.name} from "${member.from}.vue";`)
    .join("\n");
  const namespace = facts.index.namespaceMembers
    .map((member) => `  ${member.key}: ${member.name},`)
    .join("\n");
  const named = [facts.exports.namespace, ...facts.index.importMembers.map((member) => member.name)]
    .map((name) => `  ${name},`)
    .join("\n");
  return `${imports}\n\nconst ${facts.exports.namespace} = {\n${namespace}\n};\n\nexport {\n${named}\n};\n\nexport default ${facts.exports.namespace};\n\nexport type { ${facts.index.typeExports.join(", ")} } from "${facts.runtime.typeImportSource}";\nexport type { ${facts.displayName}ItemContextValue, ${facts.displayName}Orientation, ${facts.displayName}RootContextValue, ${facts.displayName}ViewportContextValue } from "./${facts.exports.root}.vue";\nexport { ${facts.displayName}ItemContext, ${facts.displayName}RootContext, ${facts.displayName}ViewportContext, use${facts.displayName}ItemContext, use${facts.displayName}RootContext, use${facts.displayName}ViewportContext } from "./${facts.exports.root}.vue";\n`;
}

function valueDefault(prop: { defaultValue?: string }, fallback: string): string {
  return prop.defaultValue ?? fallback;
}
