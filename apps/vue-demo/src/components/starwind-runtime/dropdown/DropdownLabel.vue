<script setup lang="ts">
import * as MenuPrimitive from "@starwind-ui/vue/menu";
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, useAttrs } from "vue";
import { dropdownLabel } from "./variants";

defineOptions({ inheritAttrs: false });

export type DropdownLabelProps = Omit<HTMLAttributes, "class" | "inset"> & {
  inset?: boolean;
  class?: ClassValue;
};
type DropdownLabelDeclaredProps = {
  inset?: boolean;
  class?: ClassValue;
} & /* @vue-ignore */ DropdownLabelProps;
const { class: className, inset = false } = defineProps<DropdownLabelDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
</script>

<template>
  <MenuPrimitive.MenuLabel
    :class="dropdownLabel({ inset, class: className })"
    v-bind="attrs"
    data-slot="dropdown-label"
  >
    <slot />
  </MenuPrimitive.MenuLabel>
</template>
