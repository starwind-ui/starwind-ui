<script setup lang="ts">
import * as MenuPrimitive from "@starwind-ui/vue/menu";
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes } from "vue";
import { dropdownRadioItemIndicator } from "./variants";

defineOptions({ inheritAttrs: false });

export type DropdownRadioItemIndicatorProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type DropdownRadioItemIndicatorDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ DropdownRadioItemIndicatorProps;
const { class: className } = defineProps<DropdownRadioItemIndicatorDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
</script>

<template>
  <MenuPrimitive.MenuRadioItemIndicator
    :class="dropdownRadioItemIndicator({ class: className })"
    v-bind="$attrs"
    data-slot="dropdown-radio-item-indicator"
  >
    <slot />
  </MenuPrimitive.MenuRadioItemIndicator>
</template>
