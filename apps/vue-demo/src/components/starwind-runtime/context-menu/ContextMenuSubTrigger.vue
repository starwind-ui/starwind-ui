<script setup lang="ts">
import * as ContextMenuPrimitive from "@starwind-ui/vue/context-menu";
import type { ClassValue } from "tailwind-variants";
import { computed, type HTMLAttributes } from "vue";
import { contextMenuItem } from "./variants";

defineOptions({ inheritAttrs: false });

export type ContextMenuSubTriggerProps = Omit<HTMLAttributes, "class" | "disabled" | "inset"> & {
  inset?: boolean;
  disabled?: boolean;
  class?: ClassValue;
};
type ContextMenuSubTriggerDeclaredProps = {
  inset?: boolean;
  disabled?: boolean;
  class?: ClassValue;
} & /* @vue-ignore */ ContextMenuSubTriggerProps;
const {
  class: className,
  inset = false,
  disabled = false,
} = defineProps<ContextMenuSubTriggerDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const subTriggerClassName = computed(() => className);
</script>

<template>
  <ContextMenuPrimitive.ContextMenuSubmenuTrigger
    :class="contextMenuItem({ inset, disabled, class: subTriggerClassName })"
    :disabled="disabled"
    v-bind="$attrs"
    data-slot="context-menu-sub-trigger"
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
  </ContextMenuPrimitive.ContextMenuSubmenuTrigger>
</template>
