<script setup lang="ts">
import * as ContextMenuPrimitive from "@starwind-ui/vue/context-menu";
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes } from "vue";
import { contextMenuCheckboxItemIndicator } from "./variants";

defineOptions({ inheritAttrs: false });

export type ContextMenuCheckboxItemIndicatorProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type ContextMenuCheckboxItemIndicatorDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ ContextMenuCheckboxItemIndicatorProps;
const { class: className } = defineProps<ContextMenuCheckboxItemIndicatorDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
</script>

<template>
  <ContextMenuPrimitive.ContextMenuCheckboxItemIndicator
    :class="contextMenuCheckboxItemIndicator({ class: className })"
    v-bind="$attrs"
    data-slot="context-menu-checkbox-item-indicator"
  >
    <slot />
  </ContextMenuPrimitive.ContextMenuCheckboxItemIndicator>
</template>
