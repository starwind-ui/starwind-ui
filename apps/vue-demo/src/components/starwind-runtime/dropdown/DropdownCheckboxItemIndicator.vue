<script setup lang="ts">
import * as MenuPrimitive from "@starwind-ui/vue/menu";
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, useAttrs } from "vue";
import { dropdownCheckboxItemIndicator } from "./variants";

defineOptions({ inheritAttrs: false });

export type DropdownCheckboxItemIndicatorProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type DropdownCheckboxItemIndicatorDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ DropdownCheckboxItemIndicatorProps;
const { class: className } = defineProps<DropdownCheckboxItemIndicatorDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
</script>

<template>
  <MenuPrimitive.MenuCheckboxItemIndicator
    :class="dropdownCheckboxItemIndicator({ class: className })"
    v-bind="attrs"
    data-slot="dropdown-checkbox-item-indicator"
  >
    <slot />
  </MenuPrimitive.MenuCheckboxItemIndicator>
</template>
