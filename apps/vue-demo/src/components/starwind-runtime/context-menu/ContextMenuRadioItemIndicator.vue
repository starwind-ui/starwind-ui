<script setup lang="ts">
import * as ContextMenuPrimitive from "@starwind-ui/vue/context-menu";
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, useAttrs } from "vue";
import { contextMenuRadioItemIndicator } from "./variants";

defineOptions({ inheritAttrs: false });

export type ContextMenuRadioItemIndicatorProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type ContextMenuRadioItemIndicatorDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ ContextMenuRadioItemIndicatorProps;
const { class: className } = defineProps<ContextMenuRadioItemIndicatorDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
</script>

<template>
  <ContextMenuPrimitive.ContextMenuRadioItemIndicator
    :class="contextMenuRadioItemIndicator({ class: className })"
    v-bind="attrs"
    data-slot="context-menu-radio-item-indicator"
  >
    <slot />
  </ContextMenuPrimitive.ContextMenuRadioItemIndicator>
</template>
