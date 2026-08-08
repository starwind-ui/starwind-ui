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

  if (family.facts.behavior.inputPlacement === "external") {
    return family.part === "root"
      ? printVueExternalBooleanRoot(file, family.facts)
      : printVueBooleanStateIndicator(file, family.facts);
  }

  if (family.facts.behavior.groupStrategy === "value-equals") {
    return family.part === "root"
      ? printVueRadioRoot(file, family.facts)
      : printVueCheckboxIndicator(file, family.facts);
  }

  return family.part === "root"
    ? printVueCheckboxRoot(file, family.facts)
    : printVueCheckboxIndicator(file, family.facts);
}

type BooleanFormControlFacts = Extract<
  NonNullable<AdapterComponentFile["component"]["family"]>,
  { kind: "boolean-form-control" }
>["facts"];

function assertBooleanFormControlFacts(facts: BooleanFormControlFacts): void {
  if (!facts.props?.state) {
    throw new TypeError("Vue boolean-form-control projection requires the state prop fact.");
  }
}

function printVueRadioRoot(
  file: AdapterComponentFile,
  facts: BooleanFormControlFacts,
): AdapterPrintedFile {
  const state = facts.props.state.name;
  const defaultState = facts.props.defaultState.name;
  const disabled = facts.props.disabled.name;
  const form = requireProp(facts.props.form?.name, "form", facts.displayName);
  const id = requireProp(facts.props.id?.name, "id", facts.displayName);
  const name = requireProp(facts.props.name?.name, "name", facts.displayName);
  const nativeButton = facts.props.nativeButton.name;
  const readOnly = requireProp(facts.props.readOnly?.name, "readOnly", facts.displayName);
  const required = requireProp(facts.props.required?.name, "required", facts.displayName);
  const value = requireProp(facts.props.value?.name, "value", facts.displayName);
  const group = facts.group;
  const detailType = facts.event.detailsType;
  const formOptionsSetter = facts.setters.formOptions;
  const readOnlySetter = facts.setters.readOnly;
  if (!group || group.requirement !== "optional") {
    throw new TypeError("Vue Radio projection requires optional radio-group context facts.");
  }
  if (!formOptionsSetter || !readOnlySetter || !facts.state.syncEvent) {
    throw new TypeError(
      "Vue Radio projection requires form, read-only, and state-sync contract facts.",
    );
  }

  return {
    contents: `<!-- ${VUE_NON_SHIPPING_COMMENT} -->
<script setup lang="ts">
import { ${facts.runtime.factory}, type ${detailType} } from "${facts.runtime.importSource}";
import { computed, onBeforeUnmount, onMounted, ref, useAttrs, watch } from "vue";

import { ${group.hookName} } from "${group.importPath}";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    ${state}?: boolean;
    ${defaultState}?: boolean;
    ${disabled}?: boolean;
    ${form}?: string;
    ${id}?: string;
    ${name}?: string;
    ${nativeButton}?: boolean;
    ${readOnly}?: boolean;
    ${required}?: boolean;
    ${value}: string;
  }>(),
  {
    ${state}: undefined,
    ${defaultState}: false,
    ${disabled}: false,
    ${nativeButton}: false,
    ${readOnly}: false,
    ${required}: false,
  },
);
const emit = defineEmits<{
  ${facts.event.name}: [value: boolean, detail: ${detailType}];
  "update:${state}": [value: boolean];
}>();
defineSlots<{ default?: () => unknown }>();
const attrs = useAttrs();
const rootRef = ref<HTMLElement | null>(null);
const inputRef = ref<HTMLInputElement | null>(null);
const ${group.variableName} = ${group.hookName}();
const isGroupOwned = ${group.variableName} !== undefined;
const groupChecked = computed(() =>
  ${group.variableName} ? ${group.variableName}.${value}.value === props.${value} : undefined,
);
const effectiveDisabled = computed(() => props.${disabled} || ${group.variableName}?.${disabled}.value === true);
const effectiveForm = computed(() => props.${form} ?? ${group.variableName}?.${form}?.value);
const effectiveName = computed(() => props.${name} ?? ${group.variableName}?.${name}?.value);
const effectiveReadOnly = computed(() => props.${readOnly} || ${group.variableName}?.${readOnly}.value === true);
const effectiveRequired = computed(() => props.${required} || ${group.variableName}?.${required}.value === true);
const initialDefaultChecked = props.${defaultState};
const uncontrolledChecked = ref(initialDefaultChecked);
const renderedChecked = computed(() =>
  isGroupOwned ? (groupChecked.value ?? false) : (props.${state} ?? uncontrolledChecked.value),
);
let instance: ReturnType<typeof ${facts.runtime.factory}> | undefined;
let unsubscribeStateSync: (() => void) | undefined;
let instanceGeneration = 0;
let mounted = false;

defineExpose({ element: rootRef, input: inputRef });

function handleCheckedChange(_checked: boolean, detail: ${detailType}): void {
  const eventInstance = instance;
  const eventGeneration = instanceGeneration;
  const eventWasGroupOwned = isGroupOwned;
  const eventWasControlled = !eventWasGroupOwned && props.${state} !== undefined;
  emit("${facts.event.name}", detail.${facts.event.valueProperty}, detail);
  detail.onAccepted(() => {
    if (!mounted || instance !== eventInstance || instanceGeneration !== eventGeneration) {
      return;
    }
    if (!eventWasGroupOwned && !eventWasControlled) {
      uncontrolledChecked.value = detail.${facts.event.valueProperty};
    }
    emit("update:${state}", detail.${facts.event.valueProperty});
  });
}

function handleStateSync(): void {
  if (!isGroupOwned && props.${state} === undefined && instance) {
    uncontrolledChecked.value = instance.${facts.state.getter}();
  }
}

function destroyOwnedInstance(): void {
  instanceGeneration += 1;
  unsubscribeStateSync?.();
  unsubscribeStateSync = undefined;
  const ownedInstance = instance;
  if (!ownedInstance) return;
  instance = undefined;
  ownedInstance.destroy();
}

function setupRuntime(): void {
  destroyOwnedInstance();
  const element = rootRef.value;
  if (!element) return;

  const createdInstance = ${facts.runtime.factory}(element, {
    ${defaultState}: renderedChecked.value,
    ${disabled}: effectiveDisabled.value,
    ${form}: effectiveForm.value,
    ${id}: props.${id},
    ${name}: effectiveName.value,
    ${readOnly}: effectiveReadOnly.value,
    ${required}: effectiveRequired.value,
    ${value}: props.${value},
    ${facts.event.callbackProp}: handleCheckedChange,
    ...(isGroupOwned
      ? { ${state}: groupChecked.value ?? false }
      : props.${state} !== undefined
        ? { ${state}: props.${state} }
        : {}),
  });
  instance = createdInstance;
  unsubscribeStateSync = createdInstance.subscribe("${facts.state.syncEvent}", handleStateSync);
}

onMounted(() => {
  mounted = true;
  setupRuntime();
});

watch(
  () => props.${state},
  (checked, previousChecked) => {
    if (isGroupOwned) return;
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
watch(groupChecked, (checked) => {
  if (!isGroupOwned || checked === undefined || !instance) return;
  if (Object.is(instance.${facts.state.getter}(), checked)) return;
  instance.${facts.setters.state.method}(checked, { emit: false });
});
watch(effectiveDisabled, (nextDisabled) => instance?.${facts.setters.disabled.method}(nextDisabled));
watch(effectiveReadOnly, (nextReadOnly) => instance?.${readOnlySetter.method}(nextReadOnly));
watch(
  () => [effectiveForm.value, effectiveName.value, effectiveRequired.value, props.${value}] as const,
  ([nextForm, nextName, nextRequired, nextValue]) => {
    instance?.${formOptionsSetter.method}({
      ${form}: nextForm,
      ${name}: nextName,
      ${required}: nextRequired,
      ${value}: nextValue,
    });
  },
  { flush: "post" },
);
watch(() => [props.${id}, props.${nativeButton}] as const, setupRuntime, { flush: "post" });

onBeforeUnmount(() => {
  mounted = false;
  destroyOwnedInstance();
});
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
    :aria-checked="String(renderedChecked)"
    :aria-disabled="effectiveDisabled ? 'true' : undefined"
    :${facts.attrs.defaultState}="!isGroupOwned && initialDefaultChecked ? 'true' : undefined"
    :${facts.attrs.truthyPresence}="renderedChecked ? '' : undefined"
    :${facts.attrs.falsyPresence}="renderedChecked ? undefined : ''"
    :${facts.attrs.disabled}="effectiveDisabled ? '' : undefined"
    :${facts.attrs.form}="effectiveForm"
    :${facts.attrs.id}="props.${id}"
    :${facts.attrs.name}="effectiveName"
    :${facts.attrs.readOnly}="effectiveReadOnly ? '' : undefined"
    :${facts.attrs.required}="effectiveRequired ? '' : undefined"
    :${facts.attrs.value}="props.${value}"
    :id="props.${nativeButton} ? props.${id} : undefined"
    :tabindex="effectiveDisabled ? -1 : 0"
    :disabled="props.${nativeButton} ? effectiveDisabled : undefined"
  >
    <slot />
    <input
      v-if="!props.${nativeButton}"
      ref="inputRef"
      ${facts.attrs.input}
      aria-hidden="true"
      tabindex="-1"
      type="${facts.input.type}"
      :checked="renderedChecked"
      :disabled="effectiveDisabled"
      :form="effectiveForm"
      :id="props.${id}"
      :name="effectiveName"
      :required="effectiveRequired"
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
    :checked="renderedChecked"
    :disabled="effectiveDisabled"
    :form="effectiveForm"
    :name="effectiveName"
    :required="effectiveRequired"
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

function printVueCheckboxRoot(
  file: AdapterComponentFile,
  facts: BooleanFormControlFacts,
): AdapterPrintedFile {
  const state = facts.props.state.name;
  const defaultState = facts.props.defaultState.name;
  const disabled = facts.props.disabled.name;
  const form = requireProp(facts.props.form?.name, "form", facts.displayName);
  const id = requireProp(facts.props.id?.name, "id", facts.displayName);
  const indeterminate = requireProp(
    facts.props.indeterminate?.name,
    "indeterminate",
    facts.displayName,
  );
  const name = requireProp(facts.props.name?.name, "name", facts.displayName);
  const nativeButton = facts.props.nativeButton.name;
  const readOnly = requireProp(facts.props.readOnly?.name, "readOnly", facts.displayName);
  const required = requireProp(facts.props.required?.name, "required", facts.displayName);
  const uncheckedValue = requireProp(
    facts.props.uncheckedValue?.name,
    "uncheckedValue",
    facts.displayName,
  );
  const value = requireProp(facts.props.value?.name, "value", facts.displayName);
  const detailType = facts.event.detailsType;
  const uncheckedInput = facts.parts.uncheckedInput;
  if (!uncheckedInput) {
    throw new TypeError(
      `Vue ${facts.displayName} projection requires a Runtime-owned unchecked input fact.`,
    );
  }
  const group = facts.group;
  const groupImport = group ? `import { ${group.hookName} } from "${group.importPath}";` : "";
  const groupSetup = group
    ? `const ${group.variableName} = ${group.hookName}();
const groupItemValue = computed(() => props.${value} ?? props.${name});
const groupChecked = computed(() => {
  const itemValue = groupItemValue.value;
  return ${group.variableName} && itemValue !== undefined
    ? ${group.variableName}.${value}.value.includes(itemValue)
    : undefined;
});
const effectiveDisabled = computed(() => props.${disabled} || ${group.variableName}?.${disabled}.value === true);`
    : `const groupChecked = computed<boolean | undefined>(() => undefined);
const effectiveDisabled = computed(() => props.${disabled});`;

  return {
    contents: `<!-- ${VUE_NON_SHIPPING_COMMENT} -->
<script setup lang="ts">
import { type ${detailType}, ${facts.runtime.factory} } from "${facts.runtime.importSource}";
import { computed, onBeforeUnmount, onMounted, ref, useAttrs, watch } from "vue";
${groupImport}

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
${groupSetup}
const initialDefaultChecked = props.${defaultState} ?? false;
const initialChecked = props.${state} ?? groupChecked.value ?? initialDefaultChecked;
const uncontrolledChecked = ref(groupChecked.value ?? initialDefaultChecked);
const renderedChecked = computed(
  () => props.${state} ?? groupChecked.value ?? uncontrolledChecked.value,
);
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
    candidate.hasAttribute("${uncheckedInput.discoveryAttribute}")
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
    ${disabled}: effectiveDisabled.value,
    ${form}: props.${form},
    ${id}: props.${id},
    ${indeterminate}: props.${indeterminate},
    ${name}: props.${name},
    ${readOnly}: props.${readOnly},
    ${required}: props.${required},
    ${uncheckedValue}: props.${uncheckedValue},
    ${value}: props.${value},
    ${facts.event.callbackProp}: handleCheckedChange,
    ...(props.${state} !== undefined
      ? { ${state}: props.${state} }
      : groupChecked.value !== undefined
        ? { ${state}: groupChecked.value }
        : {}),
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
watch(groupChecked, (checked) => {
  if (checked === undefined || props.${state} !== undefined || !instance) return;
  if (Object.is(instance.${facts.state.getter}(), checked)) return;
  instance.${facts.setters.state.method}(checked, { emit: false });
});
watch(effectiveDisabled, (value) => instance?.${facts.setters.disabled.method}(value));
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
    :aria-disabled="effectiveDisabled ? 'true' : undefined"
    :${facts.attrs.ariaReadOnly}="String(props.${readOnly})"
    :${facts.attrs.ariaRequired}="String(props.${required})"
    :${facts.attrs.defaultState}="initialDefaultChecked ? 'true' : undefined"
    :${facts.attrs.truthyPresence}="renderedChecked ? '' : undefined"
    :${facts.attrs.falsyPresence}="renderedChecked ? undefined : ''"
    :${facts.attrs.disabled}="effectiveDisabled ? '' : undefined"
    :${facts.attrs.form}="props.${form}"
    :${facts.attrs.id}="props.${id}"
    :${facts.attrs.indeterminate}="renderedIndeterminate ? '' : undefined"
    :${facts.attrs.name}="props.${name}"
    :${facts.attrs.readOnly}="props.${readOnly} ? '' : undefined"
    :${facts.attrs.required}="props.${required} ? '' : undefined"
    :${facts.attrs.uncheckedValue}="props.${uncheckedValue}"
    :${facts.attrs.value}="props.${value}"
    :tabindex="effectiveDisabled ? -1 : 0"
    :disabled="props.${nativeButton} ? effectiveDisabled : undefined"
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
      :disabled="effectiveDisabled"
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
    :disabled="effectiveDisabled"
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
  facts: BooleanFormControlFacts,
): AdapterPrintedFile {
  const keepMounted = requireProp(facts.props.keepMounted?.name, "keepMounted", facts.displayName);
  const indicator = facts.parts.stateIndicator;
  if (!indicator) {
    throw new TypeError(`Vue ${facts.displayName} projection requires an indicator part.`);
  }

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

function printVueExternalBooleanRoot(
  file: AdapterComponentFile,
  facts: BooleanFormControlFacts,
): AdapterPrintedFile {
  const state = facts.props.state.name;
  const defaultState = facts.props.defaultState.name;
  const disabled = facts.props.disabled.name;
  const form = requireProp(facts.props.form?.name, "form", facts.displayName);
  const id = requireProp(facts.props.id?.name, "id", facts.displayName);
  const name = requireProp(facts.props.name?.name, "name", facts.displayName);
  const nativeButton = facts.props.nativeButton.name;
  const readOnly = requireProp(facts.props.readOnly?.name, "readOnly", facts.displayName);
  const required = requireProp(facts.props.required?.name, "required", facts.displayName);
  const uncheckedValue = requireProp(
    facts.props.uncheckedValue?.name,
    "uncheckedValue",
    facts.displayName,
  );
  const value = requireProp(facts.props.value?.name, "value", facts.displayName);
  const inputRefProp = requireProp(facts.input.refProp?.name, "inputRef", facts.displayName);
  const detailType = facts.event.detailsType;
  const uncheckedInput = facts.parts.uncheckedInput;
  const formOptionsSetter = facts.setters.formOptions;
  if (!formOptionsSetter || !uncheckedInput) {
    throw new TypeError(
      `Vue ${facts.displayName} projection requires form-options and Runtime-owned unchecked-input contract facts.`,
    );
  }

  return {
    contents: `<!-- ${VUE_NON_SHIPPING_COMMENT} -->
<script setup lang="ts">
import { ${facts.runtime.factory}, type ${detailType} } from "${facts.runtime.importSource}";
import { computed, onBeforeUnmount, onMounted, ref, useAttrs, watch } from "vue";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    ${state}?: boolean;
    ${defaultState}?: boolean;
    ${disabled}?: boolean;
    ${form}?: string;
    ${id}?: string;
    ${name}?: string;
    ${nativeButton}?: boolean;
    ${readOnly}?: boolean;
    ${required}?: boolean;
    ${uncheckedValue}?: string;
    ${value}?: string;
  }>(),
  {
    ${state}: undefined,
    ${defaultState}: false,
    ${disabled}: false,
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
const ${inputRefProp} = ref<HTMLInputElement | null>(null);
const initialDefaultChecked = props.${defaultState};
const uncontrolledChecked = ref(initialDefaultChecked);
const renderedChecked = computed(() => props.${state} ?? uncontrolledChecked.value);
let instance: ReturnType<typeof ${facts.runtime.factory}> | undefined;
let resetForm: HTMLFormElement | null = null;
let resetTimer: number | undefined;

defineExpose({
  element: rootRef,
  input: ${inputRefProp},
});

function handleCheckedChange(checked: boolean, detail: ${detailType}): void {
  emit("${facts.event.name}", checked, detail);
  if (detail.isCanceled) return;

  if (props.${state} === undefined) uncontrolledChecked.value = checked;
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
    if (instance && props.${state} === undefined) {
      uncontrolledChecked.value = instance.${facts.state.getter}();
    }
    resetTimer = undefined;
  }, 0);
}

function bindFormReset(): void {
  const formElement = ${inputRefProp}.value?.form ?? null;
  if (resetForm === formElement) return;
  unbindFormReset();
  resetForm = formElement;
  resetForm?.addEventListener("reset", handleFormReset);
}

function removeRuntimeOwnedUncheckedInput(): void {
  const candidate = ${inputRefProp}.value?.nextElementSibling;
  if (
    candidate instanceof HTMLInputElement &&
    candidate.hasAttribute("${uncheckedInput.discoveryAttribute}")
  ) {
    candidate.remove();
  }
}

function destroyOwnedInstance(): void {
  unbindFormReset();
  const ownedInstance = instance;
  if (!ownedInstance) return;
  instance = undefined;
  ownedInstance.destroy();
  removeRuntimeOwnedUncheckedInput();
}

function setupRuntime(): void {
  destroyOwnedInstance();
  const element = rootRef.value;
  if (!element) return;

  instance = ${facts.runtime.factory}(element, {
    ${defaultState}: renderedChecked.value,
    ${disabled}: props.${disabled},
    ${form}: props.${form},
    ${id}: props.${id},
    ${name}: props.${name},
    ${readOnly}: props.${readOnly},
    ${required}: props.${required},
    ${uncheckedValue}: props.${uncheckedValue},
    ${value}: props.${value},
    ${facts.event.callbackProp}: handleCheckedChange,
    ...(props.${state} === undefined ? {} : { ${state}: props.${state} }),
  });
  bindFormReset();
}

onMounted(setupRuntime);

watch(
  () => props.${state},
  (checked, previousChecked) => {
    const controllednessChanged = (checked === undefined) !== (previousChecked === undefined);
    if (controllednessChanged) {
      if (checked === undefined && instance) uncontrolledChecked.value = instance.${facts.state.getter}();
      setupRuntime();
      return;
    }
    if (checked === undefined || !instance || Object.is(instance.${facts.state.getter}(), checked)) return;
    instance.${facts.setters.state.method}(checked, { emit: false });
  },
  { flush: "post" },
);
watch(
  () => props.${disabled},
  (nextDisabled) => {
    if (!instance || rootRef.value?.hasAttribute("${facts.attrs.disabled}") === nextDisabled) return;
    instance.${facts.setters.disabled.method}(nextDisabled);
  },
);
watch(
  () => [props.${form}, props.${name}, props.${required}, props.${uncheckedValue}, props.${value}] as const,
  ([nextForm, nextName, nextRequired, nextUncheckedValue, nextValue], previous) => {
    if (!instance || previous === undefined) return;
    instance.${formOptionsSetter.method}({
      ${form}: nextForm,
      ${name}: nextName,
      ${required}: nextRequired,
      ${uncheckedValue}: nextUncheckedValue,
      ${value}: nextValue,
    });
    bindFormReset();
  },
  { flush: "post" },
);
watch(() => [props.${id}, props.${nativeButton}, props.${readOnly}] as const, setupRuntime, {
  flush: "post",
});

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
    :aria-checked="String(renderedChecked)"
    :aria-disabled="props.${disabled} ? 'true' : undefined"
    :${facts.attrs.ariaReadOnly}="props.${readOnly} ? 'true' : undefined"
    :${facts.attrs.ariaRequired}="props.${required} ? 'true' : undefined"
    :${facts.attrs.defaultState}="initialDefaultChecked ? 'true' : undefined"
    :${facts.attrs.truthyPresence}="renderedChecked ? '' : undefined"
    :${facts.attrs.falsyPresence}="renderedChecked ? undefined : ''"
    :${facts.attrs.disabled}="props.${disabled} ? '' : undefined"
    :${facts.attrs.filled}="renderedChecked ? '' : undefined"
    :${facts.attrs.form}="props.${form}"
    :${facts.attrs.id}="props.${id}"
    :${facts.attrs.name}="props.${name}"
    :${facts.attrs.readOnly}="props.${readOnly} ? '' : undefined"
    :${facts.attrs.required}="props.${required} ? '' : undefined"
    :${facts.attrs.uncheckedValue}="props.${uncheckedValue}"
    :${facts.attrs.value}="props.${value}"
    :id="props.${nativeButton} ? props.${id} : undefined"
    :tabindex="props.${disabled} ? -1 : 0"
    :disabled="props.${nativeButton} ? props.${disabled} : undefined"
  >
    <slot />
  </component>
  <input
    ref="${inputRefProp}"
    ${facts.attrs.input}
    aria-hidden="true"
    tabindex="-1"
    type="${facts.input.type}"
    :checked="initialDefaultChecked"
    :disabled="props.${disabled}"
    :form="props.${form}"
    :id="props.${id} ? (props.${nativeButton} ? \`\${props.${id}}-input\` : props.${id}) : undefined"
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

function printVueBooleanStateIndicator(
  file: AdapterComponentFile,
  facts: BooleanFormControlFacts,
): AdapterPrintedFile {
  const indicator = facts.parts.stateIndicator;
  if (!indicator) {
    throw new TypeError(
      `Vue ${facts.displayName} projection requires a state-indicator part contract fact.`,
    );
  }

  return {
    contents: `<!-- ${VUE_NON_SHIPPING_COMMENT} -->
<script setup lang="ts">
import { ref, useAttrs } from "vue";

defineOptions({ inheritAttrs: false });

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
  <span ref="indicatorRef" v-bind="attrs" ${facts.attrs.stateIndicator} data-sw-part="${indicator.name}">
    <slot />
  </span>
</template>
`,
    path: `${file.path}.vue`,
  };
}

function requireProp(value: string | undefined, expected: string, displayName: string): string {
  if (!value)
    throw new TypeError(`Vue ${displayName} projection requires the ${expected} contract fact.`);
  return value;
}
