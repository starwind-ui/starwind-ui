import type { AdapterComponentFile, AdapterIndexFile, AdapterPrintedFile } from "../types.js";
import { printVueFamilyIndex, VUE_NON_SHIPPING_COMMENT } from "./primitive/shared-fragments.js";

export function printVueBooleanFormControlIndex(file: AdapterIndexFile): AdapterPrintedFile {
  return printVueFamilyIndex(file, "boolean-form-control", {
    partExportOrder: "export-name",
    partExportSpacing: "separated",
  });
}

export function printVueBooleanFormControlComponent(
  file: AdapterComponentFile,
): AdapterPrintedFile {
  const family = file.component.family;
  if (family?.kind !== "boolean-form-control") {
    throw new TypeError(
      "Vue boolean-form-control projection requires a boolean-form-control component model.",
    );
  }
  assertBooleanFormControlFacts(family.facts);

  return family.part === "root"
    ? printVueCheckboxRoot(file, family.facts)
    : printVueCheckboxIndicator(file, family.facts);
}

type CheckboxFacts = Extract<
  NonNullable<AdapterComponentFile["component"]["family"]>,
  { kind: "boolean-form-control" }
>["facts"];

function assertBooleanFormControlFacts(facts: CheckboxFacts): void {
  if (!facts.props?.state) {
    throw new TypeError("Vue boolean-form-control projection requires the state prop fact.");
  }
}

function printVueCheckboxRoot(
  file: AdapterComponentFile,
  facts: CheckboxFacts,
): AdapterPrintedFile {
  const state = facts.props.state.name;
  const defaultState = facts.props.defaultState.name;
  const disabled = facts.props.disabled.name;
  const form = requireProp(facts.props.form?.name, "form");
  const id = requireProp(facts.props.id?.name, "id");
  const indeterminate = requireProp(facts.props.indeterminate?.name, "indeterminate");
  const name = requireProp(facts.props.name?.name, "name");
  const nativeButton = facts.props.nativeButton.name;
  const readOnly = requireProp(facts.props.readOnly?.name, "readOnly");
  const required = requireProp(facts.props.required?.name, "required");
  const uncheckedValue = requireProp(facts.props.uncheckedValue?.name, "uncheckedValue");
  const value = requireProp(facts.props.value?.name, "value");
  const detailType = facts.event.detailsType;

  return {
    contents: `<!-- ${VUE_NON_SHIPPING_COMMENT} -->
<script setup lang="ts">
import { type ${detailType}, ${facts.runtime.factory} } from "${facts.runtime.importSource}";
import { computed, onBeforeUnmount, onMounted, ref, useAttrs, watch } from "vue";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    ${state}?: boolean;
    ${defaultState}?: boolean;
    ${disabled}?: boolean;
    ${form}?: string;
    ${id}?: string;
    ${indeterminate}?: boolean;
    ${name}?: string;
    ${nativeButton}?: boolean;
    ${readOnly}?: boolean;
    ${required}?: boolean;
    ${uncheckedValue}?: string;
    ${value}?: string;
  }>(),
  {
    ${state}: undefined,
    ${disabled}: false,
    ${indeterminate}: false,
    ${nativeButton}: false,
    ${readOnly}: false,
    ${required}: false,
  },
);
const emit = defineEmits<{
  ${facts.event.name}: [value: boolean, detail: ${detailType}];
  "update:${state}": [value: boolean];
}>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
const rootRef = ref<HTMLElement | null>(null);
const inputRef = ref<HTMLInputElement | null>(null);
const initialDefaultChecked = props.${defaultState} ?? false;
const initialChecked = props.${state} ?? initialDefaultChecked;
const uncontrolledChecked = ref(initialDefaultChecked);
const renderedChecked = computed(() => props.${state} ?? uncontrolledChecked.value);
const renderedIndeterminate = ref(props.${indeterminate});
let instance: ReturnType<typeof ${facts.runtime.factory}> | undefined;
let resetForm: HTMLFormElement | null = null;
let resetTimer: number | undefined;

defineExpose({
  element: rootRef,
});

function handleCheckedChange(checked: boolean, detail: ${detailType}): void {
  emit("${facts.event.name}", checked, detail);
  if (detail.isCanceled) return;

  if (props.${state} === undefined) {
    uncontrolledChecked.value = checked;
  }
  if (!props.${indeterminate}) renderedIndeterminate.value = false;
  emit("update:${state}", checked);
}

function clearResetTimer(): void {
  if (resetTimer === undefined) return;

  window.clearTimeout(resetTimer);
  resetTimer = undefined;
}

function unbindFormReset(): void {
  clearResetTimer();
  resetForm?.removeEventListener("reset", handleFormReset);
  resetForm = null;
}

function handleFormReset(): void {
  clearResetTimer();
  resetTimer = window.setTimeout(() => {
    const ownedInstance = instance;
    if (ownedInstance && props.${state} === undefined) {
      uncontrolledChecked.value = ownedInstance.${facts.state.getter}();
      if (!props.${indeterminate}) renderedIndeterminate.value = false;
    }
    resetTimer = undefined;
  }, 0);
}

function bindFormReset(): void {
  const formElement = inputRef.value?.form ?? null;
  if (resetForm === formElement) return;

  unbindFormReset();
  resetForm = formElement;
  resetForm?.addEventListener("reset", handleFormReset);
}

function destroyOwnedInstance(): void {
  unbindFormReset();
  const ownedInstance = instance;
  if (!ownedInstance) return;

  if (instance === ownedInstance) instance = undefined;
  ownedInstance.destroy();
  removeRuntimeOwnedUncheckedInput();
}

function removeRuntimeOwnedUncheckedInput(): void {
  const candidate = inputRef.value?.nextElementSibling;
  if (
    candidate instanceof HTMLInputElement &&
    candidate.hasAttribute("data-sw-checkbox-unchecked-input")
  ) {
    candidate.remove();
  }
}

function setupRuntime(): void {
  destroyOwnedInstance();
  const element = rootRef.value;
  if (!element) return;

  const options = {
    ${defaultState}: renderedChecked.value,
    ${disabled}: props.${disabled},
    ${form}: props.${form},
    ${id}: props.${id},
    ${indeterminate}: props.${indeterminate},
    ${name}: props.${name},
    ${readOnly}: props.${readOnly},
    ${required}: props.${required},
    ${uncheckedValue}: props.${uncheckedValue},
    ${value}: props.${value},
    ${facts.event.callbackProp}: handleCheckedChange,
    ...(props.${state} === undefined ? {} : { ${state}: props.${state} }),
  };
  instance = ${facts.runtime.factory}(element, options);
  bindFormReset();
}

onMounted(setupRuntime);

watch(
  () => props.${state},
  (checked, previousChecked) => {
    const controllednessChanged = (checked === undefined) !== (previousChecked === undefined);
    if (controllednessChanged) {
      if (checked === undefined && instance) {
        uncontrolledChecked.value = instance.${facts.state.getter}();
      }
      setupRuntime();
      return;
    }
    if (checked === undefined || !instance || Object.is(instance.${facts.state.getter}(), checked)) {
      return;
    }

    instance.${facts.setters.state.method}(checked, { emit: false });
  },
  { flush: "post" },
);
watch(
  () => props.${disabled},
  (value) => instance?.${facts.setters.disabled.method}(value),
);
watch(
  () => props.${indeterminate},
  (value) => {
    renderedIndeterminate.value = value;
    instance?.${facts.setters.indeterminate?.method ?? "setIndeterminate"}(value, { emit: false });
  },
);
watch(
  () => [
    props.${form},
    props.${id},
    props.${name},
    props.${nativeButton},
    props.${readOnly},
    props.${required},
    props.${uncheckedValue},
    props.${value},
  ],
  setupRuntime,
  { flush: "post" },
);

onBeforeUnmount(destroyOwnedInstance);
</script>

<template>
  <component
    :is="props.${nativeButton} ? 'button' : 'span'"
    ref="rootRef"
    v-bind="attrs"
    ${facts.attrs.root}
    data-sw-part="${facts.parts.root.name}"
    :type="props.${nativeButton} ? 'button' : undefined"
    role="${facts.render.role}"
    :aria-checked="renderedIndeterminate ? 'mixed' : String(renderedChecked)"
    :aria-disabled="props.${disabled} ? 'true' : undefined"
    :${facts.attrs.ariaReadOnly}="String(props.${readOnly})"
    :${facts.attrs.ariaRequired}="String(props.${required})"
    :${facts.attrs.defaultState}="initialDefaultChecked ? 'true' : undefined"
    :${facts.attrs.truthyPresence}="renderedChecked ? '' : undefined"
    :${facts.attrs.falsyPresence}="renderedChecked ? undefined : ''"
    :${facts.attrs.disabled}="props.${disabled} ? '' : undefined"
    :${facts.attrs.form}="props.${form}"
    :${facts.attrs.id}="props.${id}"
    :${facts.attrs.indeterminate}="renderedIndeterminate ? '' : undefined"
    :${facts.attrs.name}="props.${name}"
    :${facts.attrs.readOnly}="props.${readOnly} ? '' : undefined"
    :${facts.attrs.required}="props.${required} ? '' : undefined"
    :${facts.attrs.uncheckedValue}="props.${uncheckedValue}"
    :${facts.attrs.value}="props.${value}"
    :tabindex="props.${disabled} ? -1 : 0"
    :disabled="props.${nativeButton} ? props.${disabled} : undefined"
  >
    <slot />
    <input
      v-if="!props.${nativeButton}"
      ref="inputRef"
      ${facts.attrs.input}
      aria-hidden="true"
      tabindex="-1"
      type="${facts.input.type}"
      :checked="initialChecked"
      :disabled="props.${disabled}"
      :form="props.${form}"
      :id="props.${id}"
      :name="props.${name}"
      :required="props.${required}"
      :value="props.${value}"
      style="
        position: absolute;
        width: 1px;
        height: 1px;
        margin: -1px;
        overflow: hidden;
        clip: rect(0 0 0 0);
        white-space: nowrap;
        border: 0;
      "
    />
  </component>
  <input
    v-if="props.${nativeButton}"
    ref="inputRef"
    ${facts.attrs.input}
    aria-hidden="true"
    tabindex="-1"
    type="${facts.input.type}"
    :checked="initialChecked"
    :disabled="props.${disabled}"
    :form="props.${form}"
    :id="props.${id}"
    :name="props.${name}"
    :required="props.${required}"
    :value="props.${value}"
    style="
      position: absolute;
      width: 1px;
      height: 1px;
      margin: -1px;
      overflow: hidden;
      clip: rect(0 0 0 0);
      white-space: nowrap;
      border: 0;
    "
  />
</template>
`,
    path: `${file.path}.vue`,
  };
}

function printVueCheckboxIndicator(
  file: AdapterComponentFile,
  facts: CheckboxFacts,
): AdapterPrintedFile {
  const keepMounted = requireProp(facts.props.keepMounted?.name, "keepMounted");
  const indicator = facts.parts.stateIndicator;
  if (!indicator) throw new TypeError("Vue Checkbox projection requires an indicator part.");

  return {
    contents: `<!-- ${VUE_NON_SHIPPING_COMMENT} -->
<script setup lang="ts">
import { ref, useAttrs } from "vue";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    ${keepMounted}?: boolean;
  }>(),
  {
    ${keepMounted}: false,
  },
);
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
const indicatorRef = ref<HTMLElement | null>(null);

defineExpose({
  element: indicatorRef,
});
</script>

<template>
  <span
    ref="indicatorRef"
    v-bind="attrs"
    ${facts.attrs.stateIndicator}
    data-sw-part="${indicator.name}"
    :${facts.attrs.stateIndicatorKeepMounted}="props.${keepMounted} ? '' : undefined"
    ${facts.attrs.stateIndicatorFalsyPresence}
    :hidden="!props.${keepMounted}"
  >
    <slot />
  </span>
</template>
`,
    path: `${file.path}.vue`,
  };
}

function requireProp(value: string | undefined, expected: string): string {
  if (!value)
    throw new TypeError(`Vue Checkbox projection requires the ${expected} contract fact.`);
  return value;
}
