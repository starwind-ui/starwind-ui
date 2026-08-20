import { projectVueAttributeAccess } from "./public-contract.js";

const VUE_TEMPLATE_ONLY_ATTRIBUTE_ACCESS = projectVueAttributeAccess([]);

import type {
  AdapterComponentFile,
  AdapterCompositeMenuOverlayFacts,
  AdapterCompositeMenuOverlayPartName,
  AdapterHelperFile,
  AdapterIndexFile,
  AdapterOutputModel,
  AdapterPrintedFile,
} from "../types.js";
import { printVueIndexFile } from "./exports.js";
import { VUE_NON_SHIPPING_COMMENT } from "./primitive/shared-fragments.js";

export function isVueCompositeMenuOverlayOutput(model: AdapterOutputModel): boolean {
  return model.files.some(
    (file) => file.kind === "component" && file.component.family?.kind === "composite-menu-overlay",
  );
}

export function printVueCompositeMenuOverlayOutput(
  model: AdapterOutputModel,
): AdapterPrintedFile[] {
  const components = model.files.filter(
    (file): file is AdapterComponentFile =>
      file.kind === "component" && file.component.family?.kind === "composite-menu-overlay",
  );
  const family = components[0]?.component.family;
  if (!family || family.kind !== "composite-menu-overlay") {
    throw new TypeError("Vue composite-menu-overlay projection requires family facts.");
  }
  const helper = model.files.find(
    (file): file is AdapterHelperFile =>
      file.kind === "helper" && file.family?.kind === "composite-menu-overlay-radio-context",
  );
  const index = model.files.find(
    (file): file is AdapterIndexFile =>
      file.kind === "index" && file.family?.kind === "composite-menu-overlay",
  );
  if (!helper || !index) {
    throw new TypeError(
      "Vue composite-menu-overlay projection requires typed context and index files.",
    );
  }
  const facts = family.facts;
  return [
    ...components.map((file) => printComponent(file, facts)),
    { contents: printContext(facts), path: helper.path },
    { contents: printIndex(index, facts), path: index.path },
  ];
}

function printComponent(
  file: AdapterComponentFile,
  facts: AdapterCompositeMenuOverlayFacts,
): AdapterPrintedFile {
  const family = file.component.family;
  if (!family || family.kind !== "composite-menu-overlay") {
    throw new TypeError(
      `Vue ${facts.displayName} component requires composite-menu-overlay facts.`,
    );
  }
  const printers: Record<
    AdapterCompositeMenuOverlayPartName,
    (facts: AdapterCompositeMenuOverlayFacts) => string
  > = {
    root: printRoot,
    trigger: printTrigger,
    portal: printPortal,
    positioner: (value) => printFloating(value, "positioner"),
    popup: (value) => printFloating(value, "popup"),
    item: printItem,
    linkItem: printLinkItem,
    checkboxItem: printCheckboxItem,
    checkboxItemIndicator: printCheckboxIndicator,
    radioGroup: printRadioGroup,
    radioItem: printRadioItem,
    radioItemIndicator: printRadioIndicator,
    group: (value) => printStatic(value, "group"),
    label: (value) => printStatic(value, "label"),
    separator: (value) => printStatic(value, "separator"),
    shortcut: (value) => printStatic(value, "shortcut"),
    submenuRoot: printSubmenuRoot,
    submenuTrigger: printSubmenuTrigger,
  };
  return { contents: printers[family.part](facts), path: `${file.path}.vue` };
}

function printContext(facts: AdapterCompositeMenuOverlayFacts): string {
  return `// ${VUE_NON_SHIPPING_COMMENT}
import { type ComputedRef, type InjectionKey, inject, type Ref } from "vue";

export type ${facts.displayName}RootContextValue = Readonly<{
  element: Readonly<Ref<HTMLElement | null>>;
  mounted: Readonly<Ref<boolean>>;
  open: ComputedRef<boolean>;
  registerPortal(owner: symbol, element: HTMLElement | null): void;
}>;
export type ${facts.displayName}OwnerContextValue = Readonly<{ kind: "root" | "submenu" }>;
export type ${facts.displayName}CheckedContextValue = Readonly<{ checked: ComputedRef<boolean> }>;
export type ${facts.displayName}RadioGroupContextValue = Readonly<{ value: ComputedRef<string | undefined> }>;
export type ${facts.displayName}SubmenuContextValue = Readonly<{ root: Ref<HTMLDivElement | null> }>;

export const ${facts.displayName}RootContext: InjectionKey<${facts.displayName}RootContextValue> = Symbol("Starwind${facts.displayName}RootContext");
export const ${facts.displayName}OwnerContext: InjectionKey<${facts.displayName}OwnerContextValue> = Symbol("Starwind${facts.displayName}OwnerContext");
export const ${facts.displayName}CheckboxItemContext: InjectionKey<${facts.displayName}CheckedContextValue> = Symbol("Starwind${facts.displayName}CheckboxItemContext");
export const ${facts.displayName}RadioGroupContext: InjectionKey<${facts.displayName}RadioGroupContextValue> = Symbol("Starwind${facts.displayName}RadioGroupContext");
export const ${facts.displayName}RadioItemContext: InjectionKey<${facts.displayName}CheckedContextValue> = Symbol("Starwind${facts.displayName}RadioItemContext");
export const ${facts.displayName}SubmenuContext: InjectionKey<${facts.displayName}SubmenuContextValue> = Symbol("Starwind${facts.displayName}SubmenuContext");

function required<T>(value: T | undefined, part: string, owner: string): T {
  if (!value) throw new Error("${facts.displayName}." + part + " requires an owning ${facts.displayName}." + owner + ".");
  return value;
}
export const use${facts.displayName}RootContext = (part = "part") => required(inject(${facts.displayName}RootContext), part, "Root");
export const use${facts.displayName}OwnerContext = (part = "part") => required(inject(${facts.displayName}OwnerContext), part, "Root or SubmenuRoot");
export const use${facts.displayName}CheckboxItemContext = (part = "part") => required(inject(${facts.displayName}CheckboxItemContext), part, "CheckboxItem");
export const use${facts.displayName}RadioGroupContext = (part = "part") => required(inject(${facts.displayName}RadioGroupContext), part, "RadioGroup");
export const use${facts.displayName}RadioItemContext = (part = "part") => required(inject(${facts.displayName}RadioItemContext), part, "RadioItem");
export const use${facts.displayName}SubmenuContext = (part = "part") => required(inject(${facts.displayName}SubmenuContext), part, "SubmenuRoot");
`;
}

function printRoot(facts: AdapterCompositeMenuOverlayFacts): string {
  const { attrs, events, props, runtime, state } = facts;
  return `<!-- ${VUE_NON_SHIPPING_COMMENT} -->
<script setup lang="ts">
import { ${runtime.factory}, type ${events.closeComplete.detailsType}, type ${events.openChange.detailsType} } from "${runtime.importSource}";
import { computed, nextTick, onBeforeUnmount, onMounted, provide, ref, useAttrs, watch } from "vue";
import { useVueAsChildRuntimeOwner } from "../_internal/as-child";
import { ${facts.displayName}OwnerContext, ${facts.displayName}RootContext } from "./${facts.displayName}Context";

defineOptions({ inheritAttrs: false });
defineSlots<{ default?: () => unknown }>();
const props = withDefaults(defineProps<{
  ${props.defaultOpen.name}?: ${props.defaultOpen.type};
  ${props.open.name}?: ${props.open.type};
  ${props.disabled.name}?: ${props.disabled.type};
  ${props.modal.name}?: ${props.modal.type};
  ${props.openOnHover.name}?: ${props.openOnHover.type};
  ${props.closeDelay.name}?: ${props.closeDelay.type};
}>(), {
  ${props.defaultOpen.name}: ${state.open.defaultValue},
  ${props.open.name}: undefined,
  ${props.disabled.name}: false,
  ${props.modal.name}: false,
  ${props.openOnHover.name}: false,
  ${props.closeDelay.name}: 200,
});
const emit = defineEmits<{
  "update:open": [open: boolean];
  ${events.openChange.name}: [open: boolean, detail: ${events.openChange.detailsType}];
  ${events.closeComplete.name}: [detail: ${events.closeComplete.detailsType}];
}>();
const attrs = useAttrs();
const rootRef = ref<HTMLDivElement | null>(null);
const mounted = ref(false);
const initialDefaultOpen = props.${props.defaultOpen.name};
const uncontrolledOpen = ref(initialDefaultOpen);
const renderedOpen = computed(() => props.${props.open.name} ?? uncontrolledOpen.value);
let instance: ReturnType<typeof ${runtime.factory}> | undefined;
let portalOwner: symbol | undefined;
let portalReference: HTMLElement | null = null;
let generation = 0;

provide(${facts.displayName}RootContext, {
  element: rootRef,
  mounted,
  open: renderedOpen,
  registerPortal(owner, element) {
    if (element) { portalOwner = owner; portalReference = element; }
    else if (portalOwner === owner) { portalOwner = undefined; portalReference = null; }
  },
});
provide(${facts.displayName}OwnerContext, { kind: "root" });

defineExpose({
  element: rootRef,
  close: () => instance?.close(),
  open: () => instance?.open(),
  updatePosition: () => instance?.updatePosition(),
});

function handleOpenChange(open: boolean, detail: ${events.openChange.detailsType}): void {
  emit("${events.openChange.name}", open, detail);
  if (detail.isCanceled) return;
  if (props.${props.open.name} === undefined) uncontrolledOpen.value = open;
  emit("update:open", open);
}
function destroyOwnedInstance(): void {
  const owned = instance;
  instance = undefined;
  owned?.destroy();
}
function setupRuntime(): void {
  const element = rootRef.value;
  if (!element) return;
  instance = ${runtime.factory}(element, {
    ${props.defaultOpen.name}: uncontrolledOpen.value,
    ${props.disabled.name}: props.${props.disabled.name},
    ${props.modal.name}: props.${props.modal.name},
    ${props.openOnHover.name}: props.${props.openOnHover.name},
    ${props.closeDelay.name}: props.${props.closeDelay.name},
    portalReference: portalReference ?? undefined,
    ${events.openChange.callbackProp}: handleOpenChange,
    ${events.closeComplete.callbackProp}: (detail) => emit("${events.closeComplete.name}", detail),
    ...(props.${props.open.name} === undefined ? {} : { ${props.open.name}: props.${props.open.name} }),
  });
}
async function recreateRuntime(): Promise<void> {
  const current = instance?.${state.open.getter}();
  if (props.${props.open.name} === undefined && current !== undefined) uncontrolledOpen.value = current;
  const ownGeneration = ++generation;
  mounted.value = false;
  destroyOwnedInstance();
  await nextTick();
  if (ownGeneration !== generation || !rootRef.value) return;
  setupRuntime();
  mounted.value = true;
}
useVueAsChildRuntimeOwner(rootRef, recreateRuntime);
onMounted(() => { setupRuntime(); mounted.value = true; });
watch(() => props.${props.open.name}, (open, previous) => {
  if ((open === undefined) !== (previous === undefined)) { void recreateRuntime(); return; }
  if (open === undefined || !instance || Object.is(instance.${state.open.getter}(), open)) return;
  instance.${facts.setters.open.method}(open, { emit: false });
}, { flush: "post" });
watch([
  () => props.${props.disabled.name},
  () => props.${props.modal.name},
  () => props.${props.openOnHover.name},
  () => props.${props.closeDelay.name},
], () => { void recreateRuntime(); }, { flush: "post" });
onBeforeUnmount(() => { generation += 1; mounted.value = false; destroyOwnedInstance(); });
</script>

<template>
  <${facts.parts.root.defaultElement}
    ref="rootRef"
    v-bind="attrs"
    ${attrs.root}
    data-sw-part="${facts.parts.root.name}"
    :${attrs.defaultOpen}="initialDefaultOpen ? 'true' : undefined"
    :${attrs.disabled}="props.${props.disabled.name} ? '' : undefined"
    :${attrs.modal}="props.${props.modal.name} ? 'true' : 'false'"
    :${attrs.openOnHover}="props.${props.openOnHover.name} ? '' : undefined"
    :${attrs.closeDelay}="props.${props.closeDelay.name}"
    :data-state="renderedOpen ? 'open' : 'closed'"
  ><slot /></${facts.parts.root.defaultElement}>
</template>
`;
}

function printTrigger(facts: AdapterCompositeMenuOverlayFacts): string {
  const { attrs, props } = facts;
  return `<!-- ${VUE_NON_SHIPPING_COMMENT} -->
<script setup lang="ts">
import { defineComponent, ref, useAttrs, type VNode } from "vue";
import { createVueAsChild } from "../_internal/as-child";
import { use${facts.displayName}RootContext } from "./${facts.displayName}Context";
defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<{ ${props.asChild.name}?: boolean; ${props.disabled.name}?: boolean }>(), { ${props.asChild.name}: false, ${props.disabled.name}: false });
const slots = defineSlots<{ default?: () => VNode[] }>();
const attrs = useAttrs();
const menu = use${facts.displayName}RootContext("Trigger");
const element = ref<HTMLElement | null>(null);
const asChild = createVueAsChild("${facts.exports.trigger}", element);
const { setElement } = asChild;
defineExpose({ element });
function protectedProps() { return { "${attrs.trigger}": "", "data-as-child": "", "data-sw-part": "${facts.parts.trigger.name}", "aria-haspopup": "menu", "aria-expanded": menu.open.value, "data-state": menu.open.value ? "open" : "closed", "aria-disabled": props.${props.disabled.name} ? "true" : undefined, "data-disabled": props.${props.disabled.name} ? "" : undefined }; }
const AsChildTrigger = defineComponent({ inheritAttrs: false, setup() { return () => asChild.render({ children: slots.default?.() ?? [], consumerProps: attrs, protectedProps: protectedProps() }); } });
</script>
<template>
  <AsChildTrigger v-if="props.${props.asChild.name}" />
  <${facts.parts.trigger.defaultElement} v-else :ref="setElement" v-bind="attrs" ${attrs.trigger} data-sw-part="${facts.parts.trigger.name}" type="button" aria-haspopup="menu" :aria-expanded="menu.open.value" :data-state="menu.open.value ? 'open' : 'closed'" :disabled="props.${props.disabled.name}"><slot /></${facts.parts.trigger.defaultElement}>
</template>
`;
}

function printPortal(facts: AdapterCompositeMenuOverlayFacts): string {
  return `<!-- ${VUE_NON_SHIPPING_COMMENT} -->
<script setup lang="ts">
import { reportPortalPlacement, resolvePortalPlacement } from "${facts.runtime.importSource}";
import { onBeforeUnmount, onMounted, ref } from "vue";
import { useVuePortalPlacement } from "../_internal/portal";
import { use${facts.displayName}OwnerContext, use${facts.displayName}RootContext } from "./${facts.displayName}Context";
defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<{ container?: string | HTMLElement; disabled?: boolean }>(), { disabled: false });
defineSlots<{ default?: () => unknown }>();
const menu = use${facts.displayName}RootContext("Portal");
const ownerContext = use${facts.displayName}OwnerContext("Portal");
const portalRef = ref<HTMLDivElement | null>(null);
const owner = Symbol("${facts.displayName}PortalOwner");
const placement = useVuePortalPlacement({
  active: () => menu.mounted.value && ownerContext.kind === "root",
  container: () => props.container,
  disabled: () => props.disabled,
  element: portalRef,
  reference: () => menu.element.value,
  runtime: { reportPortalPlacement, resolvePortalPlacement },
});
onMounted(() => { if (ownerContext.kind === "root") menu.registerPortal(owner, portalRef.value); });
onBeforeUnmount(() => { if (ownerContext.kind === "root") menu.registerPortal(owner, null); });
defineExpose({ element: portalRef });
</script>
<template><Teleport :to="placement.target.value" :disabled="placement.disabled.value"><${facts.parts.portal.defaultElement} ref="portalRef" v-bind="${VUE_TEMPLATE_ONLY_ATTRIBUTE_ACCESS.templateBinding}" ${facts.attrs.portal} :data-container="typeof props.container === 'string' ? props.container : undefined" :data-disabled="props.disabled ? '' : undefined" :data-placement="placement.ready.value ? 'ready' : 'pending'" data-sw-portal-placement="framework" data-sw-part="${facts.parts.portal.name}" data-floating-root><slot /></${facts.parts.portal.defaultElement}></Teleport></template>
`;
}

function printFloating(
  facts: AdapterCompositeMenuOverlayFacts,
  partName: "popup" | "positioner",
): string {
  const part = facts.parts[partName];
  const attr = facts.attrs[partName];
  const popup = partName === "popup";
  return `<!-- ${VUE_NON_SHIPPING_COMMENT} -->
<script setup lang="ts">
import { ref } from "vue";
defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<{ ${facts.props.side.name}?: ${facts.props.side.type}; ${facts.props.align.name}?: ${facts.props.align.type}; ${facts.props.sideOffset.name}?: ${facts.props.sideOffset.type}; ${facts.props.avoidCollisions.name}?: ${facts.props.avoidCollisions.type} }>(), { ${facts.props.side.name}: ${facts.floating.sideDefault}, ${facts.props.align.name}: ${facts.floating.alignDefault}, ${facts.props.sideOffset.name}: ${facts.floating.sideOffsetDefault}, ${facts.props.avoidCollisions.name}: ${facts.floating.avoidCollisionsDefault} });
defineSlots<{ default?: () => unknown }>();
const element = ref<HTMLDivElement | null>(null); defineExpose({ element });
</script>
<template><${part.defaultElement} ref="element" v-bind="${VUE_TEMPLATE_ONLY_ATTRIBUTE_ACCESS.templateBinding}" ${attr} data-sw-part="${part.name}"${popup ? ' role="menu" tabindex="-1" hidden' : ""} data-state="closed" :${facts.attrs.side}="props.${facts.props.side.name}" :${facts.attrs.align}="props.${facts.props.align.name}" :${facts.attrs.sideOffset}="props.${facts.props.sideOffset.name}" :${facts.attrs.avoidCollisions}="props.${facts.props.avoidCollisions.name} ? 'true' : 'false'"><slot /></${part.defaultElement}></template>
`;
}

function printItem(facts: AdapterCompositeMenuOverlayFacts): string {
  const branch = facts.staticBranches.item;
  return printInteractiveStatic(facts, "item", branch.closeOnClick, branch.disabled, branch.role);
}

function printLinkItem(facts: AdapterCompositeMenuOverlayFacts): string {
  const branch = facts.staticBranches.linkItem;
  return `<!-- ${VUE_NON_SHIPPING_COMMENT} -->
<script setup lang="ts">import { ref } from "vue"; defineOptions({ inheritAttrs: false }); const props = withDefaults(defineProps<{ href?: string; ${branch.closeOnClick.prop.name}?: boolean; ${branch.disabled.prop.name}?: boolean }>(), { ${branch.closeOnClick.prop.name}: ${branch.closeOnClick.defaultValue}, ${branch.disabled.prop.name}: false }); defineSlots<{ default?: () => unknown }>();
const element = ref<HTMLAnchorElement | null>(null); defineExpose({ element });</script>
<template><${facts.parts.linkItem.defaultElement} ref="element" v-bind="${VUE_TEMPLATE_ONLY_ATTRIBUTE_ACCESS.templateBinding}" ${facts.attrs.linkItem} data-sw-part="${facts.parts.linkItem.name}" role="${branch.role}" tabindex="0" :href="props.${branch.disabled.prop.name} ? undefined : props.href" :${branch.closeOnClick.attribute}="props.${branch.closeOnClick.prop.name} ? 'true' : undefined" :${branch.disabled.ariaAttribute}="props.${branch.disabled.prop.name} ? 'true' : undefined" :${branch.disabled.dataAttribute}="props.${branch.disabled.prop.name} ? '' : undefined"><slot /></${facts.parts.linkItem.defaultElement}></template>
`;
}

function printInteractiveStatic(
  facts: AdapterCompositeMenuOverlayFacts,
  partName: "item",
  close: AdapterCompositeMenuOverlayFacts["staticBranches"]["item"]["closeOnClick"],
  disabled: AdapterCompositeMenuOverlayFacts["staticBranches"]["item"]["disabled"],
  role?: string,
): string {
  return `<!-- ${VUE_NON_SHIPPING_COMMENT} -->
<script setup lang="ts">import { ref } from "vue"; defineOptions({ inheritAttrs: false }); const props = withDefaults(defineProps<{ ${close.prop.name}?: boolean; ${disabled.prop.name}?: boolean }>(), { ${close.prop.name}: ${close.defaultValue}, ${disabled.prop.name}: false }); defineSlots<{ default?: () => unknown }>();
const element = ref<HTMLDivElement | null>(null); defineExpose({ element });</script>
<template><${facts.parts[partName].defaultElement} ref="element" v-bind="${VUE_TEMPLATE_ONLY_ATTRIBUTE_ACCESS.templateBinding}" ${facts.attrs[partName]} data-sw-part="${facts.parts[partName].name}" role="${role}" tabindex="0" :${close.attribute}="props.${close.prop.name} ? undefined : 'false'" :${disabled.ariaAttribute}="props.${disabled.prop.name} ? 'true' : undefined" :${disabled.dataAttribute}="props.${disabled.prop.name} ? '' : undefined"><slot /></${facts.parts[partName].defaultElement}></template>
`;
}

function printCheckboxItem(facts: AdapterCompositeMenuOverlayFacts): string {
  const recipe = facts.checkboxItem;
  return `<!-- ${VUE_NON_SHIPPING_COMMENT} -->
<script setup lang="ts">
import type { ${recipe.event.detailsType} } from "${facts.runtime.typeImportSource}";
import { computed, nextTick, onBeforeUnmount, onMounted, provide, ref, useAttrs, watch } from "vue";
import { ${facts.displayName}CheckboxItemContext } from "./${facts.displayName}Context";
defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<{ ${recipe.checkedState.controlledProp.name}?: boolean; ${recipe.checkedState.defaultProp.name}?: boolean; ${recipe.closeOnClick.prop.name}?: boolean; ${recipe.disabled.prop.name}?: boolean }>(), { ${recipe.checkedState.controlledProp.name}: undefined, ${recipe.checkedState.defaultProp.name}: false, ${recipe.closeOnClick.prop.name}: ${recipe.closeOnClick.defaultValue}, ${recipe.disabled.prop.name}: false });
const emit = defineEmits<{ "update:checked": [checked: boolean]; ${recipe.event.name}: [checked: boolean, detail: ${recipe.event.detailsType}] }>();
defineSlots<{ default?: () => unknown }>(); const attrs = useAttrs(); const element = ref<HTMLDivElement | null>(null); const uncontrolledChecked = ref(props.${recipe.checkedState.defaultProp.name}); const checked = computed(() => props.${recipe.checkedState.controlledProp.name} ?? uncontrolledChecked.value); provide(${facts.displayName}CheckboxItemContext, { checked }); defineExpose({ element });
function sync(value: boolean) {
  const item = element.value;
  if (!item) return;
  item.setAttribute("${recipe.stateAttributes.ariaChecked}", String(value));
  item.toggleAttribute("${recipe.stateAttributes.checked}", value);
  item.toggleAttribute("${recipe.stateAttributes.unchecked}", !value);
  item.querySelectorAll<HTMLElement>("[${facts.attrs.checkboxItemIndicator}]").forEach((indicator) => {
    indicator.setAttribute("${recipe.indicator.stateAttribute}", value ? "${recipe.indicator.checkedStateValue}" : "${recipe.indicator.uncheckedStateValue}");
    indicator.toggleAttribute("${recipe.indicator.visibleAttribute}", value);
    indicator.toggleAttribute("${recipe.indicator.hiddenAttribute}", !value);
  });
}
function handle(event: Event) { const detail = (event as CustomEvent<${recipe.event.detailsType}>).detail; emit("${recipe.event.name}", detail.${recipe.event.valueProperty}, detail); if (detail.isCanceled) return; if (props.${recipe.checkedState.controlledProp.name} === undefined) uncontrolledChecked.value = detail.${recipe.event.valueProperty}; else void nextTick(() => sync(props.${recipe.checkedState.controlledProp.name}!)); emit("update:checked", detail.${recipe.event.valueProperty}); }
onMounted(() => element.value?.addEventListener("${recipe.event.domEvent}", handle)); onBeforeUnmount(() => element.value?.removeEventListener("${recipe.event.domEvent}", handle)); watch(() => props.${recipe.checkedState.controlledProp.name}, (value) => { if (value !== undefined) sync(value); }, { flush: "post" });
</script>
<template><${facts.parts.checkboxItem.defaultElement} ref="element" v-bind="attrs" ${facts.attrs.checkboxItem} data-sw-part="${facts.parts.checkboxItem.name}" role="${recipe.role}" tabindex="0" :${recipe.checkedState.initialAttribute}="props.${recipe.checkedState.defaultProp.name} ? 'true' : undefined" :${recipe.closeOnClick.attribute}="props.${recipe.closeOnClick.prop.name} ? 'true' : undefined" :${recipe.stateAttributes.ariaChecked}="checked" :${recipe.stateAttributes.checked}="checked ? '' : undefined" :${recipe.stateAttributes.unchecked}="checked ? undefined : ''" :${recipe.disabled.ariaAttribute}="props.${recipe.disabled.prop.name} ? 'true' : undefined" :${recipe.disabled.dataAttribute}="props.${recipe.disabled.prop.name} ? '' : undefined"><slot /></${facts.parts.checkboxItem.defaultElement}></template>
`;
}

function printCheckboxIndicator(facts: AdapterCompositeMenuOverlayFacts): string {
  return printIndicator(
    facts,
    "checkboxItemIndicator",
    "CheckboxItem",
    facts.checkboxItem.indicator,
  );
}

function printRadioGroup(facts: AdapterCompositeMenuOverlayFacts): string {
  const recipe = facts.radioGroup;
  return `<!-- ${VUE_NON_SHIPPING_COMMENT} -->
<script setup lang="ts">
import type { ${recipe.event.detailsType} } from "${facts.runtime.typeImportSource}";
import { computed, nextTick, onBeforeUnmount, onMounted, provide, ref, useAttrs, watch } from "vue";
import { ${facts.displayName}RadioGroupContext } from "./${facts.displayName}Context";
defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<{ modelValue?: string; ${recipe.valueState.defaultProp.name}?: string }>(), { modelValue: undefined, ${recipe.valueState.defaultProp.name}: undefined });
const emit = defineEmits<{ "update:modelValue": [value: string]; ${recipe.event.name}: [value: string, detail: ${recipe.event.detailsType}] }>(); defineSlots<{ default?: () => unknown }>(); const attrs = useAttrs(); const element = ref<HTMLDivElement | null>(null); const uncontrolledValue = ref<string | undefined>(props.${recipe.valueState.defaultProp.name}); const value = computed(() => props.modelValue ?? uncontrolledValue.value); provide(${facts.displayName}RadioGroupContext, { value }); defineExpose({ element });
function sync(next: string) {
  const group = element.value;
  if (!group) return;
  group.setAttribute("${recipe.valueState.initialAttribute}", next);
  group.querySelectorAll<HTMLElement>("[${facts.attrs.radioItem}]").forEach((item) => {
    if (item.closest("[${facts.attrs.radioGroup}]") !== group) return;
    const checked = item.getAttribute("${facts.radioItem.valueProp.attribute}") === next;
    item.setAttribute("${facts.radioItem.stateAttributes.ariaChecked}", String(checked));
    item.toggleAttribute("${facts.radioItem.stateAttributes.checked}", checked);
    item.toggleAttribute("${facts.radioItem.stateAttributes.unchecked}", !checked);
    item.querySelectorAll<HTMLElement>("[${facts.attrs.radioItemIndicator}]").forEach((indicator) => {
      indicator.setAttribute("${facts.radioItem.indicator.stateAttribute}", checked ? "${facts.radioItem.indicator.checkedStateValue}" : "${facts.radioItem.indicator.uncheckedStateValue}");
      indicator.toggleAttribute("${facts.radioItem.indicator.visibleAttribute}", checked);
      indicator.toggleAttribute("${facts.radioItem.indicator.hiddenAttribute}", !checked);
    });
  });
}
function handle(event: Event) { const detail = (event as CustomEvent<${recipe.event.detailsType}>).detail; emit("${recipe.event.name}", detail.${recipe.event.valueProperty}, detail); if (detail.isCanceled) return; if (props.modelValue === undefined) uncontrolledValue.value = detail.${recipe.event.valueProperty}; else void nextTick(() => sync(props.modelValue!)); emit("update:modelValue", detail.${recipe.event.valueProperty}); }
onMounted(() => element.value?.addEventListener("${recipe.event.domEvent}", handle)); onBeforeUnmount(() => element.value?.removeEventListener("${recipe.event.domEvent}", handle)); watch(() => props.modelValue, (next) => { if (next !== undefined) sync(next); }, { flush: "post" });
</script>
<template><${facts.parts.radioGroup.defaultElement} ref="element" v-bind="attrs" ${facts.attrs.radioGroup} data-sw-part="${facts.parts.radioGroup.name}" role="${recipe.role}" :${recipe.valueState.initialAttribute}="value"><slot /></${facts.parts.radioGroup.defaultElement}></template>
`;
}

function printRadioItem(facts: AdapterCompositeMenuOverlayFacts): string {
  const recipe = facts.radioItem;
  return `<!-- ${VUE_NON_SHIPPING_COMMENT} -->
<script setup lang="ts">
import { computed, provide, ref } from "vue";
import { ${facts.displayName}RadioItemContext, use${facts.displayName}RadioGroupContext } from "./${facts.displayName}Context";
defineOptions({ inheritAttrs: false }); const props = withDefaults(defineProps<{ ${recipe.valueProp.name}: string; ${recipe.checkedState.controlledProp.name}?: boolean; ${recipe.checkedState.defaultProp.name}?: boolean; ${recipe.closeOnClick.prop.name}?: boolean; ${recipe.disabled.prop.name}?: boolean }>(), { ${recipe.checkedState.controlledProp.name}: undefined, ${recipe.checkedState.defaultProp.name}: false, ${recipe.closeOnClick.prop.name}: ${recipe.closeOnClick.defaultValue}, ${recipe.disabled.prop.name}: false }); defineSlots<{ default?: () => unknown }>();
const element = ref<HTMLDivElement | null>(null); const group = use${facts.displayName}RadioGroupContext("RadioItem"); const checked = computed(() => group.value.value === undefined ? (props.${recipe.checkedState.controlledProp.name} ?? props.${recipe.checkedState.defaultProp.name}) : group.value.value === props.${recipe.valueProp.name}); provide(${facts.displayName}RadioItemContext, { checked }); defineExpose({ element });
</script>
<template><${facts.parts.radioItem.defaultElement} ref="element" v-bind="${VUE_TEMPLATE_ONLY_ATTRIBUTE_ACCESS.templateBinding}" ${facts.attrs.radioItem} data-sw-part="${facts.parts.radioItem.name}" role="${recipe.role}" tabindex="0" :${recipe.valueProp.attribute}="props.${recipe.valueProp.name}" :${recipe.checkedState.initialAttribute}="props.${recipe.checkedState.defaultProp.name} ? 'true' : undefined" :${recipe.closeOnClick.attribute}="props.${recipe.closeOnClick.prop.name} ? 'true' : undefined" :${recipe.stateAttributes.ariaChecked}="checked" :${recipe.stateAttributes.checked}="checked ? '' : undefined" :${recipe.stateAttributes.unchecked}="checked ? undefined : ''" :${recipe.disabled.ariaAttribute}="props.${recipe.disabled.prop.name} ? 'true' : undefined" :${recipe.disabled.dataAttribute}="props.${recipe.disabled.prop.name} ? '' : undefined"><slot /></${facts.parts.radioItem.defaultElement}></template>
`;
}

function printRadioIndicator(facts: AdapterCompositeMenuOverlayFacts): string {
  return printIndicator(facts, "radioItemIndicator", "RadioItem", facts.radioItem.indicator);
}

function printIndicator(
  facts: AdapterCompositeMenuOverlayFacts,
  partName: "checkboxItemIndicator" | "radioItemIndicator",
  context: "CheckboxItem" | "RadioItem",
  projection: AdapterCompositeMenuOverlayFacts["checkboxItem"]["indicator"],
): string {
  return `<!-- ${VUE_NON_SHIPPING_COMMENT} -->
<script setup lang="ts">import { ref } from "vue"; import { use${facts.displayName}${context}Context } from "./${facts.displayName}Context"; defineOptions({ inheritAttrs: false }); defineSlots<{ default?: () => unknown }>();
const item = use${facts.displayName}${context}Context("${facts.parts[partName].namespaceKey}"); const element = ref<HTMLElement | null>(null); defineExpose({ element });</script>
<template><${facts.parts[partName].defaultElement} ref="element" v-bind="${VUE_TEMPLATE_ONLY_ATTRIBUTE_ACCESS.templateBinding}" ${facts.attrs[partName]} data-sw-part="${facts.parts[partName].name}" aria-hidden="${projection.ariaHidden}" :${projection.stateAttribute}="item.checked.value ? '${projection.checkedStateValue}' : '${projection.uncheckedStateValue}'" :${projection.visibleAttribute}="item.checked.value ? '' : undefined" :${projection.hiddenAttribute}="item.checked.value ? undefined : ''"><slot /></${facts.parts[partName].defaultElement}></template>
`;
}

function printStatic(
  facts: AdapterCompositeMenuOverlayFacts,
  partName: "group" | "label" | "separator" | "shortcut",
): string {
  const part = facts.parts[partName];
  const branch = facts.staticBranches[partName];
  const attrs = [
    branch.role ? `role="${branch.role}"` : "",
    ...(partName === "separator"
      ? facts.staticBranches.separator.ariaAttributes.map(
          (entry) => `${entry.name}="${entry.value}"`,
        )
      : []),
  ]
    .filter(Boolean)
    .join(" ");
  return `<!-- ${VUE_NON_SHIPPING_COMMENT} -->
<script setup lang="ts">import { ref, useAttrs } from "vue"; defineOptions({ inheritAttrs: false }); defineSlots<{ default?: () => unknown }>(); const publicAttrs = useAttrs(); const element = ref<HTMLElement | null>(null); defineExpose({ element });</script>
<template><${part.defaultElement} ref="element" v-bind="publicAttrs" ${facts.attrs[partName]} data-sw-part="${part.name}" ${attrs}><slot /></${part.defaultElement}></template>
`;
}

function printSubmenuRoot(facts: AdapterCompositeMenuOverlayFacts): string {
  const recipe = facts.submenu.root;
  return `<!-- ${VUE_NON_SHIPPING_COMMENT} -->
<script setup lang="ts">import { provide, ref } from "vue"; import { ${facts.displayName}OwnerContext, ${facts.displayName}SubmenuContext } from "./${facts.displayName}Context"; defineOptions({ inheritAttrs: false }); const props = withDefaults(defineProps<{ ${recipe.closeDelay.name}?: ${recipe.closeDelay.type} }>(), { ${recipe.closeDelay.name}: 200 }); defineSlots<{ default?: () => unknown }>();
const element = ref<HTMLDivElement | null>(null); provide(${facts.displayName}SubmenuContext, { root: element }); provide(${facts.displayName}OwnerContext, { kind: "submenu" }); defineExpose({ element });</script>
<template><${facts.parts.submenuRoot.defaultElement} ref="element" v-bind="${VUE_TEMPLATE_ONLY_ATTRIBUTE_ACCESS.templateBinding}" ${facts.attrs.submenuRoot} data-sw-part="${facts.parts.submenuRoot.name}" :${recipe.closeDelay.attribute}="props.${recipe.closeDelay.name}" ${recipe.stateAttributes.state}="${recipe.stateAttributes.closedValue}"><slot /></${facts.parts.submenuRoot.defaultElement}></template>
`;
}

function printSubmenuTrigger(facts: AdapterCompositeMenuOverlayFacts): string {
  const recipe = facts.submenu.trigger;
  return `<!-- ${VUE_NON_SHIPPING_COMMENT} -->
<script setup lang="ts">import { ref } from "vue"; import { use${facts.displayName}SubmenuContext } from "./${facts.displayName}Context"; defineOptions({ inheritAttrs: false }); const props = withDefaults(defineProps<{ ${recipe.disabled.prop.name}?: boolean }>(), { ${recipe.disabled.prop.name}: false }); defineSlots<{ default?: () => unknown }>();
use${facts.displayName}SubmenuContext("SubmenuTrigger"); const element = ref<HTMLDivElement | null>(null); defineExpose({ element });</script>
<template><${facts.parts.submenuTrigger.defaultElement} ref="element" v-bind="${VUE_TEMPLATE_ONLY_ATTRIBUTE_ACCESS.templateBinding}" ${facts.attrs.submenuTrigger} data-sw-part="${facts.parts.submenuTrigger.name}" role="${recipe.role}" tabindex="${recipe.tabIndex.value}" ${recipe.disclosure.ariaHaspopup.attribute}="${recipe.disclosure.ariaHaspopup.value}" ${recipe.disclosure.ariaExpanded}="false" ${recipe.disclosure.stateAttribute}="${recipe.disclosure.closedStateValue}" :${recipe.disabled.ariaAttribute}="props.${recipe.disabled.prop.name} ? 'true' : undefined" :${recipe.disabled.dataAttribute}="props.${recipe.disabled.prop.name} ? '' : undefined"><slot /></${facts.parts.submenuTrigger.defaultElement}></template>
`;
}

function printIndex(file: AdapterIndexFile, facts: AdapterCompositeMenuOverlayFacts): string {
  return `${printVueIndexFile(file)}

export type { ${facts.index.typeExports.join(", ")} } from "${facts.runtime.typeImportSource}";
`;
}
