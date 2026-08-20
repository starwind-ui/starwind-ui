<script setup lang="ts">
import * as ContextMenuPrimitive from "@starwind-ui/vue/context-menu";
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes } from "vue";
import { contextMenuLabel } from "./variants";

defineOptions({ inheritAttrs: false });

export type ContextMenuLabelProps = Omit<HTMLAttributes, "class" | "inset"> & {
  inset?: boolean;
  class?: ClassValue;
};
type ContextMenuLabelDeclaredProps = {
  inset?: boolean;
  class?: ClassValue;
} & /* @vue-ignore */ ContextMenuLabelProps;
const { class: className, inset = false } = defineProps<ContextMenuLabelDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
</script>

<template>
  <ContextMenuPrimitive.ContextMenuLabel
    :class="contextMenuLabel({ inset, class: className })"
    v-bind="$attrs"
    data-slot="context-menu-label"
  >
    <slot />
  </ContextMenuPrimitive.ContextMenuLabel>
</template>
