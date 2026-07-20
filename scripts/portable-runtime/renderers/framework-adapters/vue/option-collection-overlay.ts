import type {
  AdapterComponentFile,
  AdapterIndexFile,
  AdapterOptionCollectionOverlayFacts,
  AdapterOptionCollectionOverlayPartName,
  AdapterOutputModel,
  AdapterPrintedFile,
} from "../types.js";
import { printVueFamilyIndex, VUE_NON_SHIPPING_COMMENT } from "./primitive/shared-fragments.js";

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
    throw new TypeError("Vue Select component is missing option-collection-overlay facts.");
  }

  const printers: Record<
    AdapterOptionCollectionOverlayPartName,
    (facts: AdapterOptionCollectionOverlayFacts) => string
  > = {
    root: printRoot,
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
  mounted: Readonly<Ref<boolean>>;
  open: ComputedRef<boolean>;
  readOnly: ComputedRef<boolean>;
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
  if (!value) throw new Error(\`Select.\${part} requires an owning Select.Root.\`);
  return value;
}

export function ${context.useItemContext}(part = "part"): ${context.itemContextValueType} {
  const value = inject(${context.itemContext});
  if (!value) throw new Error(\`Select.\${part} requires an owning Select.Item.\`);
  return value;
}
</script>`;
}

function printRoot(facts: AdapterOptionCollectionOverlayFacts): string {
  const { attrs, events, props, runtime, state } = facts;
  return `<!-- ${VUE_NON_SHIPPING_COMMENT} -->
${printContextModule(facts)}
<script setup lang="ts">
import {
  ${runtime.factory},
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
let portalOwner: symbol | undefined;
let portalReference: HTMLElement | null = null;
let resetForm: HTMLFormElement | null = null;
let resetTimer: number | undefined;
let lifecycleGeneration = 0;

provide(${facts.context.rootContext}, {
  disabled,
  mounted,
  open: renderedOpen,
  readOnly,
  registerPortal(owner, element) {
    if (element) {
      portalOwner = owner;
      portalReference = element;
    } else if (portalOwner === owner) {
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
  if (!item) return null;
  const textElement = item.querySelector<HTMLElement>("[${attrs.itemText}]");
  const text = (textElement ?? item).textContent?.trim() ?? "";
  return text.length > 0 ? text : null;
}

function findSelectedLabel(value: string | null): string | null {
  if (value === null || !rootRef.value) return null;
  const roots = [rootRef.value, portalReference].filter(
    (candidate): candidate is HTMLElement => candidate instanceof HTMLElement,
  );
  const item = roots
    .flatMap((candidate) => [...candidate.querySelectorAll<HTMLElement>("[${attrs.item}]")])
    .find((candidate) => candidate.getAttribute("${attrs.valueData}") === value);
  return readItemLabel(item);
}

function syncSelectedLabel(value: string | null, item?: HTMLElement): void {
  selectedLabelState.value = { label: readItemLabel(item) ?? findSelectedLabel(value), value };
}

function handleOpenChange(open: boolean, detail: ${events.openChange.detailsType}): void {
  emit("openChange", open, detail);
  if (detail.isCanceled) return;
  if (props.open === undefined) uncontrolledOpen.value = open;
  emit("update:open", open);
}

function handleValueChange(value: string | null, detail: ${events.valueChange.detailsType}): void {
  emit("valueChange", value, detail);
  if (detail.isCanceled) return;
  syncSelectedLabel(value, detail.item);
  if (props.modelValue === undefined) uncontrolledValue.value = value;
  emit("update:modelValue", value);
}

function unbindFormReset(): void {
  if (resetTimer !== undefined) window.clearTimeout(resetTimer);
  resetTimer = undefined;
  resetForm?.removeEventListener("reset", handleFormReset);
  resetForm = null;
}

function handleFormReset(): void {
  if (resetTimer !== undefined) window.clearTimeout(resetTimer);
  resetTimer = window.setTimeout(() => {
    resetTimer = undefined;
    if (!instance) return;
    if (props.modelValue !== undefined) {
      instance.${state.value.setter}(props.modelValue, { emit: false });
      return;
    }
    uncontrolledValue.value = instance.${state.value.getter}();
    syncSelectedLabel(uncontrolledValue.value);
  }, 0);
}

function bindFormReset(): void {
  const nextForm = inputRef.value?.form ?? null;
  if (resetForm === nextForm) return;
  unbindFormReset();
  resetForm = nextForm;
  resetForm?.addEventListener("reset", handleFormReset);
}

function destroyOwnedInstance(): void {
  unbindFormReset();
  const ownedInstance = instance;
  instance = undefined;
  ownedInstance?.destroy();
}

function setupRuntime(): void {
  destroyOwnedInstance();
  const element = rootRef.value;
  if (!element) return;
  instance = ${runtime.factory}(element, {
    ${props.autoComplete.name}: props.${props.autoComplete.name},
    ${props.defaultOpen.name}: props.${props.disabled.name} ? false : uncontrolledOpen.value,
    ${props.defaultValue.name}: uncontrolledValue.value,
    ${props.disabled.name}: props.${props.disabled.name},
    ${props.form.name}: props.${props.form.name},
    ${props.highlightItemOnHover.name}: props.${props.highlightItemOnHover.name},
    ${props.modal.name}: props.${props.modal.name},
    ${props.name.name}: props.${props.name.name},
    ${events.openChange.callbackProp}: handleOpenChange,
    ${events.valueChange.callbackProp}: handleValueChange,
    portalReference: portalReference ?? undefined,
    ${props.readOnly.name}: props.${props.readOnly.name},
    ${props.required.name}: props.${props.required.name},
    ...(props.open === undefined
      ? {}
      : { open: props.${props.disabled.name} ? false : props.open }),
    ...(props.modelValue === undefined ? {} : { value: props.modelValue }),
  });
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
    instance.${state.open.setter}(open, { emit: false });
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
    if (value === undefined || !instance || Object.is(instance.${state.value.getter}(), value)) return;
    instance.${state.value.setter}(value, { emit: false });
    await nextTick();
    syncSelectedLabel(value);
  },
  { flush: "post" },
);
watch(
  () => props.${props.disabled.name},
  (value) => {
    if (!instance) return;
    instance.setDisabled(value);
    if (value) {
      if (props.open === undefined) uncontrolledOpen.value = false;
      return;
    }

    const nextOpen = props.open ?? uncontrolledOpen.value;
    if (!Object.is(instance.${state.open.getter}(), nextOpen)) {
      instance.${state.open.setter}(nextOpen, { emit: false });
    }
  },
);
watch(() => props.${props.readOnly.name}, (value) => instance?.setReadOnly(value));
watch(() => props.${props.modal.name}, (value) => instance?.setModal(value));
watch(
  () => props.${props.highlightItemOnHover.name},
  (value) => instance?.setHighlightItemOnHover(value),
);
watch(
  () => [props.${props.autoComplete.name}, props.${props.form.name}, props.${props.name.name}, props.${props.required.name}] as const,
  ([autoComplete, form, name, required]) => {
    instance?.setFormOptions({ autoComplete, form, name, required });
    bindFormReset();
  },
  { flush: "post" },
);

onBeforeUnmount(() => {
  lifecycleGeneration += 1;
  mounted.value = false;
  destroyOwnedInstance();
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
  return `<!-- ${VUE_NON_SHIPPING_COMMENT} -->
<script setup lang="ts">
import { ref, useAttrs } from "vue";
import { ${facts.context.useRootContext} } from "./${facts.exports.root}.vue";

defineOptions({ inheritAttrs: false });
defineSlots<{ default?: () => unknown }>();
const attrs = useAttrs();
const triggerRef = ref<HTMLButtonElement | null>(null);
const select = ${facts.context.useRootContext}("Trigger");
defineExpose({ element: triggerRef });
</script>

<template>
  <button
    ref="triggerRef"
    v-bind="attrs"
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
  return `<!-- ${VUE_NON_SHIPPING_COMMENT} -->
<script setup lang="ts">
import { ref, useAttrs } from "vue";
import { ${facts.context.useRootContext} } from "./${facts.exports.root}.vue";

defineOptions({ inheritAttrs: false });
const props = defineProps<{ placeholder?: string }>();
defineSlots<{ default?: (props: { label: string | null; value: string | null }) => unknown }>();
const attrs = useAttrs();
const valueRef = ref<HTMLSpanElement | null>(null);
const select = ${facts.context.useRootContext}("Value");
defineExpose({ element: valueRef });
</script>

<template>
  <span
    ref="valueRef"
    v-bind="attrs"
    ${facts.attrs.value}
    data-sw-part="${part.name}"
    :data-placeholder="props.placeholder"
  >
    <slot :label="select.selectedLabel.value" :value="select.value.value">{{
      select.selectedLabel.value ?? props.placeholder
    }}</slot>
  </span>
</template>
`;
}

function printPortal(facts: AdapterOptionCollectionOverlayFacts): string {
  const part = facts.parts.portal;
  return `<!-- ${VUE_NON_SHIPPING_COMMENT} -->
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, useAttrs } from "vue";
import { ${facts.context.useRootContext} } from "./${facts.exports.root}.vue";

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<{ container?: string | HTMLElement; disabled?: boolean }>(), {
  container: "body",
  disabled: false,
});
defineSlots<{ default?: () => unknown }>();
const attrs = useAttrs();
const portalRef = ref<HTMLDivElement | null>(null);
const select = ${facts.context.useRootContext}("Portal");
const owner = Symbol("SelectPortalOwner");
onMounted(() => select.registerPortal(owner, portalRef.value));
onBeforeUnmount(() => select.registerPortal(owner, null));
defineExpose({ element: portalRef });
</script>

<template>
  <Teleport :to="props.container" :disabled="props.disabled || !select.mounted.value">
    <div
      ref="portalRef"
      v-bind="attrs"
      ${facts.attrs.portal}
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
  return `<!-- ${VUE_NON_SHIPPING_COMMENT} -->
<script setup lang="ts">
import { ref, useAttrs } from "vue";
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
const attrs = useAttrs();
const elementRef = ref<HTMLDivElement | null>(null);
const select = ${facts.context.useRootContext}("${part.namespaceKey}");
const initialOpen = select.open.value;
defineExpose({ element: elementRef });
</script>

<template>
  <${part.defaultElement}
    ref="elementRef"
    v-bind="attrs"
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
  return `<!-- ${VUE_NON_SHIPPING_COMMENT} -->
<script setup lang="ts">
import { computed, provide, ref, useAttrs } from "vue";
import {
  ${facts.context.itemContext},
  ${facts.context.useRootContext},
} from "./${facts.exports.root}.vue";

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<{ disabled?: boolean; value: string }>(), { disabled: false });
defineSlots<{ default?: () => unknown }>();
const attrs = useAttrs();
const itemRef = ref<HTMLDivElement | null>(null);
const select = ${facts.context.useRootContext}("Item");
const value = computed(() => props.value);
const disabled = computed(() => props.disabled);
const selected = computed(() => select.value.value === value.value);
provide(${facts.context.itemContext}, { disabled, value });
defineExpose({ element: itemRef });
</script>

<template>
  <${part.defaultElement}
    ref="itemRef"
    v-bind="attrs"
    ${facts.attrs.item}
    data-sw-part="${part.name}"
    :${facts.attrs.valueData}="props.value"
    role="${part.role ?? "option"}"
    :aria-selected="selected"
    :aria-disabled="props.disabled ? 'true' : undefined"
    :${facts.attrs.disabled}="props.disabled ? '' : undefined"
    :data-selected="selected ? '' : undefined"
    tabindex="-1"
  >
    <slot />
  </${part.defaultElement}>
</template>
`;
}

function printItemIndicator(facts: AdapterOptionCollectionOverlayFacts): string {
  const part = facts.parts.itemIndicator;
  return `<!-- ${VUE_NON_SHIPPING_COMMENT} -->
<script setup lang="ts">
import { computed, ref, useAttrs } from "vue";
import {
  ${facts.context.useRootContext},
  ${facts.context.useItemContext},
} from "./${facts.exports.root}.vue";

defineOptions({ inheritAttrs: false });
defineSlots<{ default?: () => unknown }>();
const attrs = useAttrs();
const indicatorRef = ref<HTMLSpanElement | null>(null);
const select = ${facts.context.useRootContext}("ItemIndicator");
const item = ${facts.context.useItemContext}("ItemIndicator");
const selected = computed(() => select.value.value === item.value.value);
defineExpose({ element: indicatorRef });
</script>

<template>
  <${part.defaultElement}
    ref="indicatorRef"
    v-bind="attrs"
    ${facts.attrs.itemIndicator}
    data-sw-part="${part.name}"
    aria-hidden="true"
    :data-state="selected ? 'checked' : 'unchecked'"
    :data-visible="selected ? '' : undefined"
    :data-hidden="selected ? undefined : ''"
    :hidden="!selected"
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
  return `<!-- ${VUE_NON_SHIPPING_COMMENT} -->
<script setup lang="ts">
import { ref, useAttrs } from "vue";

defineOptions({ inheritAttrs: false });
defineSlots<{ default?: () => unknown }>();
const attrs = useAttrs();
const elementRef = ref<${htmlType} | null>(null);
defineExpose({ element: elementRef });
</script>

<template>
  <${part.defaultElement}
    ref="elementRef"
    v-bind="attrs"
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
