<script setup lang="ts">
import * as MenuPrimitive from "@starwind-ui/vue/menu";
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, useAttrs } from "vue";
import { dropdownRadioGroup } from "./variants";

defineOptions({ inheritAttrs: false });

export type DropdownRadioGroupProps = Omit<
  HTMLAttributes,
  "class" | "defaultValue" | "modelValue"
> & {
  defaultValue?: string;
  class?: ClassValue;
  modelValue?: string;
};
type DropdownRadioGroupDeclaredProps = {
  defaultValue?: string;
  class?: ClassValue;
  modelValue?: string;
} & /* @vue-ignore */ DropdownRadioGroupProps;
const {
  class: className,
  defaultValue,
  modelValue,
} = defineProps<DropdownRadioGroupDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
const emit = defineEmits<{
  valueChange: [value: string, detail: import("@starwind-ui/vue/menu").MenuValueChangeDetails];
  "update:modelValue": [value: string];
}>();
function handleValueChange(
  value: string,
  detail: import("@starwind-ui/vue/menu").MenuValueChangeDetails,
): void {
  emit("valueChange", value, detail);
}
</script>

<template>
  <MenuPrimitive.MenuRadioGroup
    :class="dropdownRadioGroup({ class: className })"
    :model-value="modelValue"
    :default-value="defaultValue"
    v-bind="attrs"
    data-slot="dropdown-radio-group"
    @update:model-value="emit('update:modelValue', $event)"
    @value-change="handleValueChange"
  >
    <slot />
  </MenuPrimitive.MenuRadioGroup>
</template>
