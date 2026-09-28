import {
  type FormControlPlan,
  formGroupExpressions,
} from "../../shared-recipes/structured/forms/plan.js";
import { operations } from "../../shared-recipes/structured/operations.js";
import type { FormProjection } from "../form-control-frame.js";
import type { FormTargetOperations } from "../form-control-operations.js";
export const formOperations = (plan: FormControlPlan): FormTargetOperations => ({
  ...operations.vue,
  restoreRuntimeInputName: false,
  renderMixed: () => "renderedIndeterminate.value = connection.input?.indeterminate ?? false;",
});
export function printFormProjection(projection: FormProjection): string {
  const {
    target,
    plan,
    fw,
    grouped,
    fields,
    defaults,
    destructure,
    inputNames,
    access,
    attributes,
    inputAttrs,
    inputData,
    initial,
    code,
    imports,
    groupFunction,
    connection,
    hiddenStyle,
  } = projection;
  const groupExpressions = formGroupExpressions(plan, {
    value: "props.value",
    name: "props.name",
    item: "item",
    groupValues: "group.value.value",
    groupDisabled: "group?.disabled.value === true",
    disabled: "props.disabled",
  });
  const input = `<input ${inputAttrs} ref="inputElement" :checked="initialChecked" ${Object.entries(
    inputData,
  )
    .map(([key, value]) => `:${key}='${value.replace(/'/g, "&apos;")}'`)
    .join(" ")} style="${hiddenStyle}" />`;
  return `<script setup lang="ts">
${imports}
import { computed, onBeforeUnmount, onMounted, ref, useAttrs, watch } from "vue";
${grouped ? 'import { useCheckboxGroupContext } from "../checkbox-group/CheckboxGroupContext";' : ""}
defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<{ ${fields} }>(), { ${defaults.map((prop) => `${prop.name}: ${prop.defaultValue ?? "undefined"}`).join(", ")} });
const emit = defineEmits<{ checkedChange: [checked: boolean, detail: ${plan.model.details}]; "update:checked": [checked: boolean] }>();
defineSlots<{ default?: () => unknown }>();
const attrs = useAttrs();
const rootRef = ref<HTMLElement | null>(null);
const inputElement = ref<HTMLInputElement | null>(null);
${
  grouped
    ? `const group = useCheckboxGroupContext();
const groupChecked = computed(() => { const item = ${groupExpressions.item}; return ${groupExpressions.checked}; });`
    : ""
}
const effectiveDisabledValue = computed(() => ${groupExpressions.disabled});
${groupFunction}
${initial}
${fw.acceptedCell("checked", "boolean", "initialChecked")}
const renderedChecked = computed(() => effectiveChecked() ?? uncontrolledChecked.value);
${plan.mixed ? "const renderedIndeterminate = ref(props.indeterminate);" : ""}
const connection: ${connection} = { accepted: initialChecked };
defineExpose({ element: rootRef${plan.form.publicInputRef ? ", input: inputElement" : ""} });
${code}
${observe(plan)}
</script>
<template><component :is="props.nativeButton ? 'button' : 'span'" ref="rootRef" v-bind="attrs" ${attributes} :type="props.nativeButton ? 'button' : undefined" :disabled="props.nativeButton ? effectiveDisabledValue : undefined"><slot />${plan.form.inputPlacement.vue === "inside-span" ? input.replace("<input ", '<input v-if="!props.nativeButton" ') : ""}</component>${plan.form.inputPlacement.vue === "inside-span" ? input.replace("<input ", '<input v-if="props.nativeButton" ') : input}</template>
`;
}
function observe(plan: FormControlPlan): string {
  const grouped = plan.group !== "none";
  const deps = (names: readonly string[]) =>
    names.map((name) => (name === "disabled" ? "effectiveDisabledValue" : name)).join(", ");
  return `function reconnectRuntime(): void { if (rootRef.value && inputElement.value) connectRuntime(rootRef.value, inputElement.value); }
onMounted(reconnectRuntime);
${operations.vue.observeModel(plan.model.name, "reconnectRuntime")}
${grouped ? 'watch(groupChecked, applyParentCommand, { flush: "post" });' : ""}
watch([${plan.reconstructionInputs.map((name) => `() => props.${name}`).join(", ")}], reconnectRuntime, { flush: "post" });
${plan.live.map((live, i) => `watch([${live.inputs.map((name) => (name === "disabled" ? "effectiveDisabledValue" : `() => props.${name}`)).join(", ")}], applyLive${i}, { flush: "post" });`).join("\n")}
onBeforeUnmount(disconnectRuntime);`;
}
