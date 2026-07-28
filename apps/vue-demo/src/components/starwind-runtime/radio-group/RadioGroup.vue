<script setup lang="ts">
import * as RadioGroupPrimitive from "@starwind-ui/vue/radio-group";
import type { ClassValue, VariantProps } from "tailwind-variants";
import { type HTMLAttributes, useAttrs } from "vue";
import { radioGroup } from "./variants";

defineOptions({ inheritAttrs: false });

export type RadioGroupProps = Omit<
  HTMLAttributes,
  | "class"
  | "defaultValue"
  | "disabled"
  | "form"
  | "legend"
  | "modelValue"
  | "name"
  | "onChange"
  | "orientation"
  | "readOnly"
  | "required"
> &
  VariantProps<typeof radioGroup> & {
    defaultValue?: string;
    disabled?: boolean;
    form?: string;
    legend?: string;
    name?: string;
    orientation?: "horizontal" | "vertical";
    readOnly?: boolean;
    required?: boolean;
    class?: ClassValue;
    modelValue?: import("@starwind-ui/vue/radio-group").RadioGroupValue;
  };
type RadioGroupDeclaredProps = {
  defaultValue?: string;
  disabled?: boolean;
  form?: string;
  legend?: string;
  name?: string;
  orientation?: "horizontal" | "vertical";
  readOnly?: boolean;
  required?: boolean;
  class?: ClassValue;
  modelValue?: import("@starwind-ui/vue/radio-group").RadioGroupValue;
} & /* @vue-ignore */ RadioGroupProps;
const {
  defaultValue,
  disabled = false,
  form,
  legend,
  name,
  orientation = "vertical",
  readOnly = false,
  required = false,
  class: className,
  modelValue,
} = defineProps<RadioGroupDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
const emit = defineEmits<{
  valueChange: [
    value: string,
    detail: import("@starwind-ui/vue/radio-group").RadioGroupValueChangeDetails,
  ];
  "update:modelValue": [value: import("@starwind-ui/vue/radio-group").RadioGroupValue];
}>();
function handleValueChange(
  value: string,
  detail: import("@starwind-ui/vue/radio-group").RadioGroupValueChangeDetails,
): void {
  emit("valueChange", value, detail);
}
</script>

<template>
  <RadioGroupPrimitive.RadioGroupRoot
    :class="radioGroup({ orientation, class: className })"
    :default-value="defaultValue"
    :disabled="disabled"
    :form="form"
    :name="name"
    :orientation="orientation"
    :read-only="readOnly"
    :required="required"
    :model-value="modelValue"
    v-bind="{ ...(legend === undefined ? {} : { 'aria-label': legend }), ...attrs }"
    data-slot="radio-group"
    @update:model-value="emit('update:modelValue', $event)"
    @value-change="handleValueChange"
  >
    <template v-if="legend">
      <div class="sr-only" data-slot="radio-group-legend">
        {{ legend }}
      </div>
    </template>
    <slot />
  </RadioGroupPrimitive.RadioGroupRoot>
</template>
