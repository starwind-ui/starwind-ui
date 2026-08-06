<script setup lang="ts">
import * as MenuPrimitive from "@starwind-ui/vue/menu";
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, useAttrs } from "vue";
import { dropdownItem } from "./variants";

defineOptions({ inheritAttrs: false });

export type DropdownItemProps = Omit<HTMLAttributes, "class" | "disabled" | "inset"> & {
  inset?: boolean;
  disabled?: boolean;
  class?: ClassValue;
};
type DropdownItemDeclaredProps = {
  inset?: boolean;
  disabled?: boolean;
  class?: ClassValue;
} & /* @vue-ignore */ DropdownItemProps;
const {
  class: className,
  inset = false,
  disabled = false,
} = defineProps<DropdownItemDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
</script>

<template>
  <MenuPrimitive.MenuItem
    :class="dropdownItem({ inset, disabled, class: className })"
    :disabled="disabled"
    v-bind="attrs"
    data-slot="dropdown-item"
  >
    <slot />
  </MenuPrimitive.MenuItem>
</template>
