<script setup lang="ts">
import * as MenuPrimitive from "@starwind-ui/vue/menu";
import type { ClassValue } from "tailwind-variants";
import { type AnchorHTMLAttributes } from "vue";
import { dropdownItem } from "./variants";

defineOptions({ inheritAttrs: false });

export type DropdownLinkItemProps = Omit<
  AnchorHTMLAttributes,
  "class" | "closeOnClick" | "disabled" | "inset"
> & {
  closeOnClick?: boolean;
  inset?: boolean;
  disabled?: boolean;
  class?: ClassValue;
};
type DropdownLinkItemDeclaredProps = {
  closeOnClick?: boolean;
  inset?: boolean;
  disabled?: boolean;
  class?: ClassValue;
} & /* @vue-ignore */ DropdownLinkItemProps;
const {
  class: className,
  closeOnClick = false,
  inset = false,
  disabled = false,
} = defineProps<DropdownLinkItemDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
</script>

<template>
  <MenuPrimitive.MenuLinkItem
    :class="dropdownItem({ inset, disabled, class: className })"
    :close-on-click="closeOnClick"
    :disabled="disabled"
    v-bind="$attrs"
    data-slot="dropdown-link-item"
  >
    <slot />
  </MenuPrimitive.MenuLinkItem>
</template>
