<script setup lang="ts">
import * as InputPrimitive from "@starwind-ui/vue/input";
import type { ClassValue, VariantProps } from "tailwind-variants";
import { type InputHTMLAttributes, useAttrs } from "vue";
import { input } from "./variants";

defineOptions({ inheritAttrs: false });

export type InputProps = Omit<
  InputHTMLAttributes,
  "children" | "class" | "data-slot" | "defaultValue" | "disabled" | "modelValue" | "size" | "value"
> &
  VariantProps<typeof input> & {
    defaultValue?: import("@starwind-ui/vue/input").InputValue;
    "data-slot"?: string;
    disabled?: boolean;
    class?: ClassValue;
    modelValue?: import("@starwind-ui/vue/input").InputValue | undefined;
  };
type InputDeclaredProps = {
  defaultValue?: import("@starwind-ui/vue/input").InputValue;
  "data-slot"?: string;
  disabled?: boolean;
  class?: ClassValue;
  modelValue?: import("@starwind-ui/vue/input").InputValue | undefined;
  size?: "sm" | "md" | "lg";
};
const {
  size,
  defaultValue,
  disabled = false,
  "data-slot": dataSlot = "input",
  class: className,
  modelValue,
} = defineProps<InputDeclaredProps>();
defineSlots<{}>();
const attrs = useAttrs();
const emit = defineEmits<{
  valueChange: [value: string, detail: import("@starwind-ui/vue/input").InputValueChangeDetails];
  "update:modelValue": [value: import("@starwind-ui/vue/input").InputValue | undefined];
}>();
function handleValueChange(
  value: string,
  detail: import("@starwind-ui/vue/input").InputValueChangeDetails,
): void {
  emit("valueChange", value, detail);
}
</script>

<template>
  <InputPrimitive.InputRoot
    :class="input({ size, class: className })"
    :default-value="defaultValue"
    :disabled="disabled"
    :model-value="modelValue"
    :data-slot="dataSlot ?? 'input'"
    v-bind="attrs"
    @update:model-value="emit('update:modelValue', $event)"
    @value-change="handleValueChange"
  />
</template>
