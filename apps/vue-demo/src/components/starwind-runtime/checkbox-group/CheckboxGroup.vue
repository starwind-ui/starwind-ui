<script setup lang="ts">
import * as CheckboxGroupPrimitive from "@starwind-ui/vue/checkbox-group";
import type { ClassValue, VariantProps } from "tailwind-variants";
import { type HTMLAttributes, useAttrs } from "vue";
import { checkboxGroup } from "./variants";

defineOptions({ inheritAttrs: false });

export type CheckboxGroupProps = Omit<
  HTMLAttributes,
  "class" | "defaultValue" | "disabled" | "modelValue" | "onChange"
> &
  VariantProps<typeof checkboxGroup> & {
    defaultValue?: string[];
    disabled?: boolean;
    class?: ClassValue;
    modelValue?: import("@starwind-ui/vue/checkbox-group").CheckboxGroupValue;
  };
type CheckboxGroupDeclaredProps = {
  defaultValue?: string[];
  disabled?: boolean;
  class?: ClassValue;
  modelValue?: import("@starwind-ui/vue/checkbox-group").CheckboxGroupValue;
} & /* @vue-ignore */ CheckboxGroupProps;
const {
  defaultValue,
  disabled = false,
  class: className,
  modelValue,
} = defineProps<CheckboxGroupDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
const emit = defineEmits<{
  valueChange: [
    value: import("@starwind-ui/vue/checkbox-group").CheckboxGroupValue,
    detail: import("@starwind-ui/vue/checkbox-group").CheckboxGroupValueChangeDetails,
  ];
  "update:modelValue": [value: import("@starwind-ui/vue/checkbox-group").CheckboxGroupValue];
}>();
function handleValueChange(
  value: import("@starwind-ui/vue/checkbox-group").CheckboxGroupValue,
  detail: import("@starwind-ui/vue/checkbox-group").CheckboxGroupValueChangeDetails,
): void {
  emit("valueChange", value, detail);
}
</script>

<template>
  <CheckboxGroupPrimitive.CheckboxGroupRoot
    :class="checkboxGroup({ class: className })"
    :default-value="defaultValue"
    :disabled="disabled"
    v-bind="attrs"
    data-slot="checkbox-group"
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    @value-change="handleValueChange"
  >
    <slot />
  </CheckboxGroupPrimitive.CheckboxGroupRoot>
</template>
