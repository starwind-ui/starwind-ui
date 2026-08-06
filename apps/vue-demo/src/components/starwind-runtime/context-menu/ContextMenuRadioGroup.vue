<script setup lang="ts">
import * as ContextMenuPrimitive from "@starwind-ui/vue/context-menu";
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, useAttrs } from "vue";
import { contextMenuRadioGroup } from "./variants";

defineOptions({ inheritAttrs: false });

export type ContextMenuRadioGroupProps = Omit<
  HTMLAttributes,
  "class" | "defaultValue" | "modelValue"
> & {
  defaultValue?: string;
  class?: ClassValue;
  modelValue?: string;
};
type ContextMenuRadioGroupDeclaredProps = {
  defaultValue?: string;
  class?: ClassValue;
  modelValue?: string;
} & /* @vue-ignore */ ContextMenuRadioGroupProps;
const {
  class: className,
  defaultValue,
  modelValue,
} = defineProps<ContextMenuRadioGroupDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
const emit = defineEmits<{
  valueChange: [
    value: string,
    detail: import("@starwind-ui/vue/context-menu").MenuValueChangeDetails,
  ];
  "update:modelValue": [value: string];
}>();
function handleValueChange(
  value: string,
  detail: import("@starwind-ui/vue/context-menu").MenuValueChangeDetails,
): void {
  emit("valueChange", value, detail);
}
</script>

<template>
  <ContextMenuPrimitive.ContextMenuRadioGroup
    :class="contextMenuRadioGroup({ class: className })"
    :model-value="modelValue"
    :default-value="defaultValue"
    v-bind="attrs"
    data-slot="context-menu-radio-group"
    @update:model-value="emit('update:modelValue', $event)"
    @value-change="handleValueChange"
  >
    <slot />
  </ContextMenuPrimitive.ContextMenuRadioGroup>
</template>
