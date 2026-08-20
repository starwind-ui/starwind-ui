<script setup lang="ts">
import * as ContextMenuPrimitive from "@starwind-ui/vue/context-menu";
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes } from "vue";
import { contextMenuTrigger } from "./variants";

defineOptions({ inheritAttrs: false });

export type ContextMenuTriggerProps = Omit<HTMLAttributes, "class" | "disabled"> & {
  disabled?: boolean;
  class?: ClassValue;
};
type ContextMenuTriggerDeclaredProps = {
  disabled?: boolean;
  class?: ClassValue;
} & /* @vue-ignore */ ContextMenuTriggerProps;
const { disabled = false, class: className } = defineProps<ContextMenuTriggerDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
</script>

<template>
  <ContextMenuPrimitive.ContextMenuTrigger
    :class="contextMenuTrigger({ class: className })"
    :disabled="disabled"
    v-bind="$attrs"
    data-slot="context-menu-trigger"
  >
    <slot />
  </ContextMenuPrimitive.ContextMenuTrigger>
</template>
