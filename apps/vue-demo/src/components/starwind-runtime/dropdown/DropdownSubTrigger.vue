<script setup lang="ts">
import * as MenuPrimitive from "@starwind-ui/vue/menu";
import type { ClassValue } from "tailwind-variants";
import { computed, type HTMLAttributes } from "vue";
import { dropdownItem } from "./variants";

defineOptions({ inheritAttrs: false });

export type DropdownSubTriggerProps = Omit<HTMLAttributes, "class" | "disabled" | "inset"> & {
  inset?: boolean;
  disabled?: boolean;
  class?: ClassValue;
};
type DropdownSubTriggerDeclaredProps = {
  inset?: boolean;
  disabled?: boolean;
  class?: ClassValue;
} & /* @vue-ignore */ DropdownSubTriggerProps;
const {
  class: className,
  inset = false,
  disabled = false,
} = defineProps<DropdownSubTriggerDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const subTriggerClassName = computed(() => className);
</script>

<template>
  <MenuPrimitive.MenuSubmenuTrigger
    :class="dropdownItem({ inset, disabled, class: subTriggerClassName })"
    :disabled="disabled"
    v-bind="$attrs"
    data-slot="dropdown-sub-trigger"
  >
    <slot />
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      class="ml-auto size-4"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M9 6l6 6l-6 6" />
    </svg>
  </MenuPrimitive.MenuSubmenuTrigger>
</template>
