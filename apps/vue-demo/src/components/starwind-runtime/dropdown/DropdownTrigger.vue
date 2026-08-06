<script setup lang="ts">
import * as MenuPrimitive from "@starwind-ui/vue/menu";
import type { ClassValue } from "tailwind-variants";
import { type ButtonHTMLAttributes, computed, useAttrs } from "vue";
import { dropdownTrigger } from "./variants";

defineOptions({ inheritAttrs: false });

export type DropdownTriggerProps = Omit<ButtonHTMLAttributes, "asChild" | "class"> & {
  asChild?: boolean;
  class?: ClassValue;
};
type DropdownTriggerDeclaredProps = {
  asChild?: boolean;
  class?: ClassValue;
} & /* @vue-ignore */ DropdownTriggerProps;
const { asChild = false, class: className } = defineProps<DropdownTriggerDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
const triggerBaseClassName = computed(() => dropdownTrigger({ class: className }));
const triggerClassName = computed(() => (asChild ? className : triggerBaseClassName.value));
</script>

<template>
  <MenuPrimitive.MenuTrigger
    :class="triggerClassName"
    :as-child="asChild"
    v-bind="attrs"
    data-slot="dropdown-trigger"
  >
    <slot />
  </MenuPrimitive.MenuTrigger>
</template>
