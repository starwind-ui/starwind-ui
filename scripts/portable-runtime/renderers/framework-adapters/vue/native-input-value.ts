import { projectVueAttributeAccess } from "./public-contract.js";

const VUE_TEMPLATE_ONLY_ATTRIBUTE_ACCESS = projectVueAttributeAccess([]);

import type { AdapterComponentFile, AdapterIndexFile, AdapterPrintedFile } from "../types.js";
import { printVueFamilyIndex } from "./primitive/shared-fragments.js";

export function printVueNativeInputValueIndex(file: AdapterIndexFile): AdapterPrintedFile {
  return printVueFamilyIndex(file, "native-input-value");
}

export function printVueNativeInputValueComponent(file: AdapterComponentFile): AdapterPrintedFile {
  const family = file.component.family;
  if (family?.kind !== "native-input-value") {
    throw new TypeError(
      "Vue native-input-value projection requires a native-input-value component model.",
    );
  }

  const { facts } = family;
  const defaultValue = facts.props.defaultValue.name;
  const disabled = facts.props.disabled.name;
  const event = facts.events.valueChange;
  const value = facts.props.value.name;

  return {
    contents: `<script setup lang="ts">
import {
  ${facts.runtime.factory},
  type ${facts.props.value.type},
  type ${event.detailsType},
} from "${facts.runtime.importSource}";
import { onBeforeUnmount, onMounted, ref, useAttrs, watch } from "vue";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    ${defaultValue}?: ${facts.props.defaultValue.type};
    ${disabled}?: ${facts.props.disabled.type};
  }>(),
  {
    ${disabled}: ${getPropDefault(facts.props.disabled.defaultValue, facts.displayName, disabled)},
  },
);
const modelValue = defineModel<${facts.props.value.type}>();
const emit = defineEmits<{
  valueChange: [value: ${event.valueType}, detail: ${event.detailsType}];
}>();
const attrs = useAttrs();
const isControlled = modelValue.value !== undefined;
const rootRef = ref<HTMLInputElement | null>(null);
const initialDefaultValue = props.${defaultValue};
const initialRenderedValue = modelValue.value ?? initialDefaultValue;
let instance: ReturnType<typeof ${facts.runtime.factory}> | undefined;
let resetForm: HTMLFormElement | null = null;
let resetReconciliationTimer: number | undefined;

defineExpose({
  element: rootRef,
});

function destroyOwnedInstance(): void {
  unbindControlledFormReset();
  const ownedInstance = instance;
  if (!ownedInstance) return;

  if (instance === ownedInstance) instance = undefined;
  ownedInstance.destroy();
}

function clearResetReconciliationTimer(): void {
  if (resetReconciliationTimer === undefined) return;

  window.clearTimeout(resetReconciliationTimer);
  resetReconciliationTimer = undefined;
}

function unbindControlledFormReset(): void {
  clearResetReconciliationTimer();
  resetForm?.removeEventListener("reset", handleControlledFormReset);
  resetForm = null;
}

function handleControlledFormReset(): void {
  clearResetReconciliationTimer();
  resetReconciliationTimer = window.setTimeout(() => {
    resetReconciliationTimer = undefined;
    syncRuntimeValue(modelValue.value);
  }, 0);
}

function bindControlledFormReset(): void {
  if (!isControlled) return;
  const form = rootRef.value?.form ?? null;
  if (resetForm === form) return;

  unbindControlledFormReset();
  resetForm = form;
  resetForm?.addEventListener("reset", handleControlledFormReset);
}

function handleValueChange(nextValue: ${event.valueType}, detail: ${event.detailsType}): void {
  const controlledValue = modelValue.value;
  emit("valueChange", nextValue, detail);
  modelValue.value = nextValue;
  if (isControlled) syncRuntimeValue(controlledValue);
}

function syncRuntimeValue(nextValue: ${facts.props.value.type} | undefined): void {
  const ownedInstance = instance;
  if (nextValue === undefined || !ownedInstance) return;
  const normalizedValue = String(nextValue);
  if (ownedInstance.${facts.runtime.valueGetter}() === normalizedValue && rootRef.value?.value === normalizedValue) {
    return;
  }

  ownedInstance.${facts.runtime.valueSetter.method}(nextValue, ${formatOptions(
    facts.runtime.valueSetter.options,
  )});
}

onMounted(() => {
  const element = rootRef.value;
  if (!element) throw new Error("${facts.displayName} requires its native input before Runtime setup.");

  instance = ${facts.runtime.factory}(element, {
    ${defaultValue}: initialDefaultValue,
    ${disabled}: props.${disabled},
    ${event.callbackProp}: handleValueChange,
    ...(modelValue.value === undefined ? {} : { ${value}: modelValue.value }),
  });
  bindControlledFormReset();
});

watch(
  modelValue,
  (nextValue) => {
    if (isControlled) syncRuntimeValue(nextValue);
  },
  { flush: "post" },
);
watch(
  () => props.${disabled},
  (nextDisabled) => {
    instance?.${facts.runtime.disabledSetter.method}(nextDisabled);
  },
);

onBeforeUnmount(destroyOwnedInstance);
</script>

<template>
  <input
    ref="rootRef"
    v-bind="attrs"
    ${facts.attrs.root}
    data-sw-part="${facts.parts.root.name}"
    :${facts.attrs.stateDisabled}="props.${disabled} ? '' : undefined"
    :${facts.attrs.disabled}="props.${disabled}"
    :${facts.attrs.value}="initialRenderedValue"
  />
</template>
`,
    path: `${file.path}.vue`,
  };
}

function getPropDefault(
  defaultValue: string | undefined,
  displayName: string,
  propName: string,
): string {
  if (defaultValue === undefined) {
    throw new Error(`${displayName} ${propName} prop is missing a default value.`);
  }
  return defaultValue;
}

function formatOptions(options: Readonly<Record<string, boolean | number | string>> | undefined) {
  if (!options || Object.keys(options).length === 0) return "{}";
  return `{ ${Object.entries(options)
    .map(([key, option]) => `${key}: ${JSON.stringify(option)}`)
    .join(", ")} }`;
}
