import {
  selectFragments,
  selectOptionObservers,
  selectParentCommand,
  selectResetSettlement,
} from "../../shared-recipes/structured/select.js";
import {
  selectSelection,
  selectSelectionAttributes,
  selectValueFallback,
} from "../../shared-recipes/structured/select-parts.js";
import { getVueAcceptedModelEvent } from "./accepted-model-publication.js";
import { projectVueAttributeAccess } from "./public-contract.js";

const VUE_TEMPLATE_ONLY_ATTRIBUTE_ACCESS = projectVueAttributeAccess([]);

import type {
  AdapterComponentFile,
  AdapterIndexFile,
  AdapterOptionCollectionOverlayFacts,
  AdapterOptionCollectionOverlayPartName,
  AdapterOutputModel,
  AdapterPrintedFile,
} from "../types.js";
import { printVueFamilyIndex } from "./primitive/shared-fragments.js";

export function printVueOptionCollectionOverlayIndex(file: AdapterIndexFile): AdapterPrintedFile {
  return printVueFamilyIndex(file, "option-collection-overlay");
}

export function isVueOptionCollectionOverlayOutput(model: AdapterOutputModel): boolean {
  return model.files.some(
    (file) =>
      file.kind === "component" && file.component.family?.kind === "option-collection-overlay",
  );
}

export function printVueOptionCollectionOverlayOutput(
  model: AdapterOutputModel,
): AdapterPrintedFile[] {
  const components = model.files.filter(
    (file): file is AdapterComponentFile =>
      file.kind === "component" && file.component.family?.kind === "option-collection-overlay",
  );
  const facts = components[0]?.component.family;
  if (!facts || facts.kind !== "option-collection-overlay") {
    throw new TypeError("Vue option-collection-overlay projection requires family facts.");
  }
  assertVueOptionCollectionOverlayFacts(facts.facts);
  const index = model.files.find((file): file is AdapterIndexFile => file.kind === "index");
  if (!index)
    throw new TypeError("Vue option-collection-overlay projection requires an index file.");

  return [
    ...components.map((file) => printComponent(file, facts.facts)),
    printVueOptionCollectionOverlayIndex(index),
  ];
}

function printComponent(
  file: AdapterComponentFile,
  facts: AdapterOptionCollectionOverlayFacts,
): AdapterPrintedFile {
  const family = file.component.family;
  if (!family || family.kind !== "option-collection-overlay") {
    throw new TypeError(
      `Vue ${facts.displayName} component is missing option-collection-overlay facts.`,
    );
  }

  const printers: Record<
    AdapterOptionCollectionOverlayPartName,
    (facts: AdapterOptionCollectionOverlayFacts) => string
  > = {
    root: (value) =>
      printRoot(
        value,
        getVueAcceptedModelEvent(file, "open"),
        getVueAcceptedModelEvent(file, "value"),
      ),
    label: (value) => printSimplePart(value, "label"),
    trigger: printTrigger,
    value: printValue,
    icon: (value) => printSimplePart(value, "icon", 'aria-hidden="true"'),
    portal: printPortal,
    positioner: (value) => printFloatingPart(value, "positioner"),
    popup: (value) => printFloatingPart(value, "popup"),
    list: (value) => printSimplePart(value, "list"),
    group: (value) => printSimplePart(value, "group", 'role="group"'),
    groupLabel: (value) => printSimplePart(value, "groupLabel"),
    item: printItem,
    itemText: (value) => printSimplePart(value, "itemText"),
    itemIndicator: printItemIndicator,
    separator: printSeparator,
    scrollUpArrow: (value) => printSimplePart(value, "scrollUpArrow", 'aria-hidden="true" hidden'),
    scrollDownArrow: (value) =>
      printSimplePart(value, "scrollDownArrow", 'aria-hidden="true" hidden'),
  };

  return {
    contents: printers[family.part](facts),
    path: `${file.path}.vue`,
  };
}

function printContextModule(facts: AdapterOptionCollectionOverlayFacts): string {
  const context = facts.context;
  return `<script lang="ts">
import {
  type ComputedRef,
  type InjectionKey,
  inject,
  type Ref,
} from "vue";

export type ${context.rootContextValueType} = Readonly<{
  disabled: ComputedRef<boolean>;
  element: Readonly<Ref<HTMLElement | null>>;
  mounted: Readonly<Ref<boolean>>;
  open: ComputedRef<boolean>;
  readOnly: ComputedRef<boolean>;
  requestRefresh(): void;
  registerPortal(owner: symbol, element: HTMLElement | null): void;
  required: ComputedRef<boolean>;
  selectedLabel: ComputedRef<string | null>;
  value: ComputedRef<string | null>;
}>;

export type ${context.itemContextValueType} = Readonly<{
  disabled: ComputedRef<boolean>;
  value: ComputedRef<string>;
}>;

export const ${context.rootContext}: InjectionKey<${context.rootContextValueType}> = Symbol("Starwind${context.rootContext}");
export const ${context.itemContext}: InjectionKey<${context.itemContextValueType}> = Symbol("Starwind${context.itemContext}");

export function ${context.useRootContext}(part = "part"): ${context.rootContextValueType} {
  const value = inject(${context.rootContext});
  if (!value) throw new Error(\`${facts.displayName}.\${part} requires an owning ${facts.displayName}.Root.\`);
  return value;
}

export function ${context.useItemContext}(part = "part"): ${context.itemContextValueType} {
  const value = inject(${context.itemContext});
  if (!value) throw new Error(\`${facts.displayName}.\${part} requires an owning ${facts.displayName}.Item.\`);
  return value;
}
</script>`;
}

function printRoot(
  facts: AdapterOptionCollectionOverlayFacts,
  acceptedOpenEvent: string,
  acceptedValueEvent: string,
): string {
  const { attrs, events, props, runtime, state } = facts;
  const openModel = requireModel(facts, "open");
  const valueModel = requireModel(facts, "value");
  const label = facts.collection.selectedLabel;
  const itemAttribute = facts.attrs[label.itemPart];
  const itemTextAttribute = facts.attrs[label.itemTextPart];
  const setters = facts.lifecycle.updateSetters;
  if (!openModel.event.cancelable || !valueModel.event.cancelable) {
    throw new TypeError(`Vue ${facts.displayName} projection requires cancelable model events.`);
  }
  return `${printContextModule(facts)}
<script setup lang="ts">
import {
  createPortalBinding,
  ${runtime.factory},
  readyPortalBindingSnapshot,
  reportPortalPlacement,
  type ${events.openChange.detailsType},
  type ${events.valueChange.detailsType},
} from "${runtime.importSource}";
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  provide,
  ref,
  useAttrs,
  watch,
} from "vue";

defineOptions({ inheritAttrs: false });
defineSlots<{ default?: () => unknown }>();

const props = withDefaults(
  defineProps<{
    ${props.autoComplete.name}?: ${props.autoComplete.type};
    ${props.defaultOpen.name}?: ${props.defaultOpen.type};
    ${props.defaultValue.name}?: ${props.defaultValue.type};
    ${props.disabled.name}?: ${props.disabled.type};
    ${props.form.name}?: ${props.form.type};
    ${props.highlightItemOnHover.name}?: ${props.highlightItemOnHover.type};
    ${props.modal.name}?: ${props.modal.type};
    ${props.name.name}?: ${props.name.type};
    open?: ${props.open.type};
    ${props.readOnly.name}?: ${props.readOnly.type};
    ${props.required.name}?: ${props.required.type};
    modelValue?: ${props.value.type};
  }>(),
  {
    ${props.defaultOpen.name}: ${state.open.defaultValue},
    ${props.defaultValue.name}: null,
    ${props.disabled.name}: false,
    ${props.highlightItemOnHover.name}: true,
    ${props.modal.name}: true,
    open: undefined,
    ${props.readOnly.name}: false,
    ${props.required.name}: false,
    modelValue: undefined,
  },
);
const emit = defineEmits<{
  "update:modelValue": [value: ${events.valueChange.valueType}];
  "update:open": [open: ${events.openChange.valueType}];
  openChange: [open: ${events.openChange.valueType}, detail: ${events.openChange.detailsType}];
  valueChange: [value: ${events.valueChange.valueType}, detail: ${events.valueChange.detailsType}];
}>();
const attrs = useAttrs();
const rootRef = ref<HTMLDivElement | null>(null);
const inputRef = ref<HTMLInputElement | null>(null);
const mounted = ref(false);
const initialDefaultOpen = props.${props.defaultOpen.name};
const initialDefaultValue = props.${props.defaultValue.name};
const uncontrolledOpen = ref(props.${props.disabled.name} ? false : initialDefaultOpen);
const uncontrolledValue = ref<string | null>(initialDefaultValue);
const selectedLabelState = ref<{ label: string | null; value: string | null }>({
  label: null,
  value: null,
});
const renderedOpen = computed(() =>
  props.${props.disabled.name} ? false : (props.open ?? uncontrolledOpen.value),
);
const renderedValue = computed(() =>
  props.modelValue !== undefined ? props.modelValue : uncontrolledValue.value,
);
const selectedLabel = computed(() =>
  selectedLabelState.value.value === renderedValue.value
    ? selectedLabelState.value.label
    : null,
);
const disabled = computed(() => props.${props.disabled.name});
const readOnly = computed(() => props.${props.readOnly.name});
const required = computed(() => props.${props.required.name});
let instance: ReturnType<typeof ${runtime.factory}> | undefined;
let portalBinding: ReturnType<typeof createPortalBinding> | undefined;
let unsubscribeOpenChange: (() => void) | undefined;
let unsubscribeValueChange: (() => void) | undefined;
let portalOwner: symbol | undefined;
let portalReference: HTMLElement | null = null;
let resetForm: HTMLFormElement | null = null;
let resetTimer: number | undefined;
let lifecycleGeneration = 0;
let refreshPending = false;

provide(${facts.context.rootContext}, {
  disabled,
  element: rootRef,
  mounted,
  open: renderedOpen,
  readOnly,
  requestRefresh,
  registerPortal(owner, element) {
    if (element) {
      if (portalOwner !== owner || portalReference !== element) clearPortalBinding();
      portalOwner = owner;
      portalReference = element;
    } else if (portalOwner === owner) {
      clearPortalBinding();
      portalOwner = undefined;
      portalReference = null;
    }
  },
  required,
  selectedLabel,
  value: renderedValue,
});

defineExpose({
  element: rootRef,
  close: () => instance?.close(),
  open: () => {
    if (!props.${props.disabled.name}) instance?.open();
  },
  updatePosition: () => instance?.updatePosition(),
});

function readItemLabel(item: HTMLElement | undefined): string | null {
  ${selectFragments("vue").labelReader}
}

function findSelectedLabel(value: string | null): string | null {
  if (value === null || !rootRef.value) return null;
  const roots = [rootRef.value, portalReference].filter(
    (candidate): candidate is HTMLElement => candidate instanceof HTMLElement,
  );
  const item = roots
    .flatMap((candidate) => [...candidate.querySelectorAll<HTMLElement>("[${itemAttribute}]")])
    .find((candidate) => candidate.getAttribute("${facts.collection.itemIdentity.attribute}") === value);
  return readItemLabel(item);
}

function syncSelectedLabel(value: string | null, item?: HTMLElement): void {
  selectedLabelState.value = { label: readItemLabel(item) ?? findSelectedLabel(value), value };
}

function unbindFormReset(): void {
  if (resetTimer !== undefined) window.clearTimeout(resetTimer);
  resetTimer = undefined;
  resetForm?.removeEventListener("reset", handleFormReset);
  resetForm = null;
}

function handleFormReset(event: Event): void {
  ${selectResetSettlement("vue")}
}

function bindFormReset(): void {
  const nextForm = inputRef.value?.form ?? null;
  if (resetForm === nextForm) return;
  unbindFormReset();
  resetForm = nextForm;
  resetForm?.addEventListener("reset", handleFormReset);
}

function destroyOwnedInstance(): void {
  unsubscribeOpenChange?.();
  unsubscribeOpenChange = undefined;
  unsubscribeValueChange?.();
  unsubscribeValueChange = undefined;
  unbindFormReset();
  const ownedInstance = instance;
  instance = undefined;
  ownedInstance?.${facts.lifecycle.cleanup}();
}

function clearPortalBinding(): void {
  portalBinding?.destroy();
  portalBinding = undefined;
}

function requestRefresh(): void {
  const owner = instance;
  if (refreshPending) return;
  refreshPending = true;
  queueMicrotask(() => {
    refreshPending = false;
    if (instance !== owner || (owner && rootRef.value !== owner.root) || !rootRef.value) return;
    if (owner) {
      if (props.open === undefined) uncontrolledOpen.value = owner.${state.open.getter}();
      if (props.modelValue === undefined) uncontrolledValue.value = owner.${state.value.getter}();
    }
    const trigger = [...rootRef.value.querySelectorAll<HTMLElement>("[${attrs.trigger}]")].find(
      (candidate) => candidate.closest("[${attrs.root}]") === rootRef.value,
    );
    if (!trigger) {
      destroyOwnedInstance();
      return;
    }
    setupRuntime();
  });
}

function setupRuntime(): void {
  destroyOwnedInstance();
  const element = rootRef.value;
  if (!element) return;
  const portalTarget = portalReference?.parentElement;
  if (portalReference && portalTarget) {
    portalBinding ??= createPortalBinding(element);
    portalBinding.publish(
      readyPortalBindingSnapshot(element, [{ authoredParent: element, wrapper: portalReference }]),
    );
    reportPortalPlacement(portalReference, { ready: true, target: portalTarget });
  }
  ${selectFragments("vue").connection}
  syncSelectedLabel(instance.${state.value.getter}());
  bindFormReset();
}

async function recreateRuntimeAfterControllednessChange(): Promise<void> {
  const generation = ++lifecycleGeneration;
  mounted.value = false;
  await nextTick();
  if (generation !== lifecycleGeneration || !rootRef.value) return;
  setupRuntime();
  mounted.value = true;
}

onMounted(() => {
  setupRuntime();
  mounted.value = true;
});

watch(
  () => props.open,
  (open, previousOpen) => {
    if ((open === undefined) !== (previousOpen === undefined)) {
      if (open === undefined && instance) uncontrolledOpen.value = instance.${state.open.getter}();
      void recreateRuntimeAfterControllednessChange();
      return;
    }
    if (
      open === undefined ||
      props.${props.disabled.name} ||
      !instance ||
      Object.is(instance.${state.open.getter}(), open)
    ) return;
    ${selectParentCommand("vue", "open", "open")}
  },
  { flush: "post" },
);
watch(
  () => props.modelValue,
  async (value, previousValue) => {
    if ((value === undefined) !== (previousValue === undefined)) {
      if (value === undefined && instance) uncontrolledValue.value = instance.${state.value.getter}();
      void recreateRuntimeAfterControllednessChange();
      return;
    }
    if (value === undefined || !instance) return;
    ${selectParentCommand("vue", "value", "value")}
    await nextTick();
    syncSelectedLabel(value);
  },
  { flush: "post" },
);

${selectOptionObservers("vue")}

onBeforeUnmount(() => {
  lifecycleGeneration += 1;
  mounted.value = false;
  destroyOwnedInstance();
  clearPortalBinding();
});
</script>

<template>
  <div
    ref="rootRef"
    v-bind="attrs"
    ${attrs.root}
    data-sw-part="${facts.parts.root.name}"
    :${attrs.autoComplete}="props.${props.autoComplete.name}"
    :${attrs.defaultOpen}="initialDefaultOpen ? 'true' : undefined"
    :${attrs.defaultValue}="initialDefaultValue ?? undefined"
    :${attrs.disabled}="props.${props.disabled.name} ? '' : undefined"
    :${attrs.form}="props.${props.form.name}"
    :${attrs.highlightItemOnHover}="props.${props.highlightItemOnHover.name} ? 'true' : 'false'"
    :${attrs.modal}="props.${props.modal.name} ? 'true' : 'false'"
    :${attrs.name}="props.${props.name.name}"
    :${attrs.readOnly}="props.${props.readOnly.name} ? '' : undefined"
    :${attrs.required}="props.${props.required.name} ? '' : undefined"
    :data-state="renderedOpen ? 'open' : 'closed'"
    :data-value="renderedValue ?? undefined"
    :data-placeholder="renderedValue === null ? '' : undefined"
    :data-selected-value="selectedLabel !== null && renderedValue !== null ? renderedValue : undefined"
    :data-selected-label="selectedLabel ?? undefined"
  >
    <input
      ref="inputRef"
      ${attrs.input}
      data-sw-part="${facts.parts.input.name}"
      type="hidden"
      :autocomplete="props.${props.autoComplete.name}"
      :disabled="props.${props.disabled.name}"
      :form="props.${props.form.name}"
      :name="props.${props.name.name}"
      :required="props.${props.required.name}"
      aria-hidden="true"
      tabindex="-1"
    />
    <slot />
  </div>
</template>
`;
}

function printTrigger(facts: AdapterOptionCollectionOverlayFacts): string {
  const part = facts.parts.trigger;
  return `<script setup lang="ts">
import { defineComponent, type HTMLAttributes, useAttrs, type VNode } from "vue";
import { useVueNativeControl } from "../_internal/native-control";
import { ${facts.context.useRootContext} } from "./${facts.exports.root}.vue";

defineOptions({ inheritAttrs: false });
type NativeElementProps = /* @vue-ignore */ HTMLAttributes;
const props = withDefaults(defineProps<{ ${facts.props.asChild.name}?: ${facts.props.asChild.type} } & NativeElementProps>(), { ${facts.props.asChild.name}: false });
const slots = defineSlots<{ default?: () => VNode[] }>();
const attrs = useAttrs();
const select = ${facts.context.useRootContext}("Trigger");
const { element, render: renderAsChild, setElement } = useVueNativeControl(
  "${facts.exports.trigger}",
  select.requestRefresh,
);
const AsChildTrigger = defineComponent({
  inheritAttrs: false,
  setup() {
    return () => {
      const children = slots.default?.() ?? [];
      const child = children[0];
      return renderAsChild({
        children,
        consumerProps: attrs,
        defaultNativeButtonType: "button",
        protectedProps: {
        "aria-disabled": select.disabled.value ? "true" : undefined,
        "aria-expanded": select.open.value,
        "aria-haspopup": "listbox",
        "aria-readonly": select.readOnly.value,
        "aria-required": select.required.value,
        "data-disabled": select.disabled.value ? "" : undefined,
        "data-state": select.open.value ? "open" : "closed",
        "${facts.attrs.trigger}": "",
        "data-sw-part": "${part.name}",
        disabled: child?.type === "button" && select.disabled.value ? true : undefined,
        role: "${part.role ?? "combobox"}",
        },
      });
    };
  },
});
defineExpose({ element });
</script>

<template>
  <AsChildTrigger v-if="props.${facts.props.asChild.name}" />
  <button
    v-else
    :ref="setElement"
    v-bind="${VUE_TEMPLATE_ONLY_ATTRIBUTE_ACCESS.templateBinding}"
    ${facts.attrs.trigger}
    data-sw-part="${part.name}"
    type="button"
    role="${part.role ?? "combobox"}"
    aria-haspopup="listbox"
    :aria-expanded="select.open.value"
    :aria-readonly="select.readOnly.value"
    :aria-required="select.required.value"
    :aria-disabled="select.disabled.value ? 'true' : undefined"
    :data-state="select.open.value ? 'open' : 'closed'"
    :disabled="select.disabled.value"
  >
    <slot />
  </button>
</template>
`;
}

function printValue(facts: AdapterOptionCollectionOverlayFacts): string {
  const part = facts.parts.value;
  return `<script setup lang="ts">
import { ref } from "vue";
import { ${facts.context.useRootContext} } from "./${facts.exports.root}.vue";

defineOptions({ inheritAttrs: false });
const props = defineProps<{ placeholder?: string }>();
defineSlots<{ default?: (props: { label: string | null; value: string | null }) => unknown }>();
const valueRef = ref<HTMLSpanElement | null>(null);
const select = ${facts.context.useRootContext}("Value");
defineExpose({ element: valueRef });
</script>

<template>
  <span
    ref="valueRef"
    v-bind="${VUE_TEMPLATE_ONLY_ATTRIBUTE_ACCESS.templateBinding}"
    ${facts.attrs.value}
    data-sw-part="${part.name}"
    :data-placeholder="props.placeholder"
  >
    <slot :label="select.selectedLabel.value" :value="select.value.value">{{
      ${selectValueFallback("select.selectedLabel.value", "props.placeholder")}
    }}</slot>
  </span>
</template>
`;
}

function printPortal(facts: AdapterOptionCollectionOverlayFacts): string {
  const part = facts.parts.portal;
  return `<script setup lang="ts">
import { reportPortalPlacement, resolvePortalPlacement } from "${facts.runtime.importSource}";
import { onBeforeUnmount, onMounted, ref } from "vue";
import { useVuePortalPlacement } from "../_internal/portal";
import { ${facts.context.useRootContext} } from "./${facts.exports.root}.vue";

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<{ container?: string | HTMLElement; disabled?: boolean }>(), {
  disabled: false,
});
defineSlots<{ default?: () => unknown }>();
const portalRef = ref<HTMLDivElement | null>(null);
const select = ${facts.context.useRootContext}("Portal");
const owner = Symbol("SelectPortalOwner");
const placement = useVuePortalPlacement({
  active: () => select.mounted.value,
  container: () => props.container,
  disabled: () => props.disabled,
  element: portalRef,
  reference: () => select.element.value,
  runtime: { reportPortalPlacement, resolvePortalPlacement },
});
onMounted(() => select.registerPortal(owner, portalRef.value));
onBeforeUnmount(() => select.registerPortal(owner, null));
defineExpose({ element: portalRef });
</script>

<template>
  <Teleport :to="placement.target.value" :disabled="placement.disabled.value">
    <div
      ref="portalRef"
      v-bind="${VUE_TEMPLATE_ONLY_ATTRIBUTE_ACCESS.templateBinding}"
      ${facts.attrs.portal}
      :data-container="typeof props.container === 'string' ? props.container : undefined"
      :data-disabled="props.disabled ? '' : undefined"
      :data-placement="placement.ready.value ? 'ready' : 'pending'"
      data-sw-portal-placement="framework"
      data-sw-part="${part.name}"
      data-floating-root
    >
      <slot />
    </div>
  </Teleport>
</template>
`;
}

function printFloatingPart(
  facts: AdapterOptionCollectionOverlayFacts,
  partName: "popup" | "positioner",
): string {
  const part = facts.parts[partName];
  const exportName = facts.exports[partName];
  const isPopup = partName === "popup";
  const alignItemWithTrigger = isPopup
    ? ""
    : `    ${facts.props.alignItemWithTrigger.name}?: ${facts.props.alignItemWithTrigger.type};\n`;
  const alignItemDefault = isPopup
    ? ""
    : `    ${facts.props.alignItemWithTrigger.name}: ${facts.floating.alignItemWithTriggerDefault},\n`;
  const alignItemAttribute = isPopup
    ? ""
    : `\n    :${facts.attrs.alignItemWithTrigger}="props.${facts.props.alignItemWithTrigger.name} ? 'true' : 'false'"`;
  return `<script setup lang="ts">
import { ref } from "vue";
import { ${facts.context.useRootContext} } from "./${facts.exports.root}.vue";

defineOptions({ inheritAttrs: false });
const props = withDefaults(
  defineProps<{
    ${facts.props.align.name}?: ${facts.props.align.type};
    ${facts.props.alignOffset.name}?: ${facts.props.alignOffset.type};
${alignItemWithTrigger}    ${facts.props.avoidCollisions.name}?: ${facts.props.avoidCollisions.type};
    ${facts.props.side.name}?: ${facts.props.side.type};
    ${facts.props.sideOffset.name}?: ${facts.props.sideOffset.type};
  }>(),
  {
    ${facts.props.align.name}: ${facts.floating.alignDefault},
    ${facts.props.alignOffset.name}: ${facts.floating.alignOffsetDefault},
${alignItemDefault}    ${facts.props.avoidCollisions.name}: ${facts.floating.avoidCollisionsDefault},
    ${facts.props.side.name}: ${facts.floating.sideDefault},
    ${facts.props.sideOffset.name}: ${facts.floating.sideOffsetDefault},
  },
);
defineSlots<{ default?: () => unknown }>();
const elementRef = ref<HTMLDivElement | null>(null);
const select = ${facts.context.useRootContext}("${part.namespaceKey}");
const initialOpen = select.open.value;
defineExpose({ element: elementRef });
</script>

<template>
  <${part.defaultElement}
    ref="elementRef"
    v-bind="${VUE_TEMPLATE_ONLY_ATTRIBUTE_ACCESS.templateBinding}"
    ${facts.attrs[partName]}
    data-sw-part="${part.name}"${isPopup ? `\n    role="${part.role ?? "listbox"}"\n    tabindex="-1"\n    :hidden="!initialOpen"` : ""}
    :data-state="initialOpen ? 'open' : 'closed'"
    :${facts.attrs.side}="props.${facts.props.side.name}"
    :${facts.attrs.align}="props.${facts.props.align.name}"
    :${facts.attrs.sideOffset}="props.${facts.props.sideOffset.name}"
    :${facts.attrs.alignOffset}="props.${facts.props.alignOffset.name}"${alignItemAttribute}
    :${facts.attrs.avoidCollisions}="props.${facts.props.avoidCollisions.name} ? 'true' : 'false'"
  >
    <slot />
  </${part.defaultElement}>
</template>
`;
}

function printItem(facts: AdapterOptionCollectionOverlayFacts): string {
  const part = facts.parts.item;
  const identity = facts.collection.itemIdentity;
  return `<script setup lang="ts">
import { computed, provide, ref } from "vue";
import {
  ${facts.context.itemContext},
  ${facts.context.useRootContext},
} from "./${facts.exports.root}.vue";

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<{ disabled?: boolean; ${identity.prop}: string }>(), { disabled: false });
defineSlots<{ default?: () => unknown }>();
const itemRef = ref<HTMLDivElement | null>(null);
const select = ${facts.context.useRootContext}("Item");
const value = computed(() => props.${identity.prop});
const disabled = computed(() => props.disabled);
const selected = computed(() => ${selectSelection("select.value.value", "value.value")});
provide(${facts.context.itemContext}, { disabled, value });
defineExpose({ element: itemRef });
</script>

<template>
  <${part.defaultElement}
    ref="itemRef"
    v-bind="${VUE_TEMPLATE_ONLY_ATTRIBUTE_ACCESS.templateBinding}"
    ${facts.attrs.item}
    data-sw-part="${part.name}"
    :${identity.attribute}="props.${identity.prop}"
    role="${part.role ?? "option"}"
    ${selectSelectionAttributes("vue", "item")}
    :aria-disabled="props.disabled ? 'true' : undefined"
    :${facts.attrs.disabled}="props.disabled ? '' : undefined"
    tabindex="-1"
  >
    <slot />
  </${part.defaultElement}>
</template>
`;
}

function printItemIndicator(facts: AdapterOptionCollectionOverlayFacts): string {
  const part = facts.parts.itemIndicator;
  return `<script setup lang="ts">
import { computed, ref } from "vue";
import {
  ${facts.context.useRootContext},
  ${facts.context.useItemContext},
} from "./${facts.exports.root}.vue";

defineOptions({ inheritAttrs: false });
defineSlots<{ default?: () => unknown }>();
const indicatorRef = ref<HTMLSpanElement | null>(null);
const select = ${facts.context.useRootContext}("ItemIndicator");
const item = ${facts.context.useItemContext}("ItemIndicator");
const selected = computed(() => ${selectSelection("select.value.value", "item.value.value")});
defineExpose({ element: indicatorRef });
</script>

<template>
  <${part.defaultElement}
    ref="indicatorRef"
    v-bind="${VUE_TEMPLATE_ONLY_ATTRIBUTE_ACCESS.templateBinding}"
    ${facts.attrs.itemIndicator}
    data-sw-part="${part.name}"
    aria-hidden="true"
    ${selectSelectionAttributes("vue", "indicator")}
  >
    <slot />
  </${part.defaultElement}>
</template>
`;
}

function printSeparator(facts: AdapterOptionCollectionOverlayFacts): string {
  return printSimplePart(facts, "separator", 'role="separator" aria-orientation="horizontal"');
}

function printSimplePart(
  facts: AdapterOptionCollectionOverlayFacts,
  partName:
    | Exclude<
        AdapterOptionCollectionOverlayPartName,
        | "item"
        | "itemIndicator"
        | "popup"
        | "portal"
        | "positioner"
        | "root"
        | "separator"
        | "trigger"
        | "value"
      >
    | "separator",
  extraAttributes = "",
): string {
  const part = facts.parts[partName];
  const htmlType = getElementType(part.defaultElement);
  return `<script setup lang="ts">
import { ref } from "vue";

defineOptions({ inheritAttrs: false });
defineSlots<{ default?: () => unknown }>();
const elementRef = ref<${htmlType} | null>(null);
defineExpose({ element: elementRef });
</script>

<template>
  <${part.defaultElement}
    ref="elementRef"
    v-bind="${VUE_TEMPLATE_ONLY_ATTRIBUTE_ACCESS.templateBinding}"
    ${facts.attrs[partName]}
    data-sw-part="${part.name}"${extraAttributes ? `\n    ${extraAttributes}` : ""}
  >
    <slot />
  </${part.defaultElement}>
</template>
`;
}

function getElementType(tag: string): string {
  const types: Record<string, string> = {
    button: "HTMLButtonElement",
    div: "HTMLDivElement",
    span: "HTMLSpanElement",
  };
  return types[tag] ?? "HTMLElement";
}

function requireModel(facts: AdapterOptionCollectionOverlayFacts, name: "open" | "value") {
  const model = facts.models.find((candidate) => candidate.name === name);
  if (!model) {
    throw new TypeError(`Vue ${facts.displayName} projection requires the ${name} model fact.`);
  }
  return model;
}

function assertVueOptionCollectionOverlayFacts(facts: AdapterOptionCollectionOverlayFacts): void {
  const hasAll = (actual: string[], expected: string[]) =>
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
    !hasAll(facts.context.rootOperations, ["registerPortal"])
  ) {
    throw new TypeError(
      `Vue ${facts.displayName} projection requires complete root and item context facts.`,
    );
  }
  if (
    facts.form.reset !== "runtime-readback-after-native-reset" ||
    facts.portal.activation !== "after-root-mount" ||
    facts.portal.owner !== "component-instance" ||
    facts.lifecycle.setup !== "after-mount" ||
    !hasAll(facts.lifecycle.recreateOnControllednessChange, ["open", "value"]) ||
    facts.presence.unmountPolicy !== "runtime-owned" ||
    !hasAll(facts.presence.initialHiddenParts, ["popup", "itemIndicator"]) ||
    !hasAll(facts.publicRefs, ["root", "trigger", "popup", "item"])
  ) {
    throw new TypeError(
      `Vue ${facts.displayName} projection requires complete form, portal, presence, ref, and lifecycle facts.`,
    );
  }
}
