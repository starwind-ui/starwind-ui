<script setup lang="ts">
import * as ContextMenuPrimitive from "@starwind-ui/vue/context-menu";
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes } from "vue";
import { contextMenuItem } from "./variants";

defineOptions({ inheritAttrs: false });

export type ContextMenuItemProps = Omit<HTMLAttributes, "class" | "disabled" | "inset"> & {
  inset?: boolean;
  disabled?: boolean;
  class?: ClassValue;
};
type ContextMenuItemDeclaredProps = {
  inset?: boolean;
  disabled?: boolean;
  class?: ClassValue;
} & /* @vue-ignore */ ContextMenuItemProps;
const {
  class: className,
  inset = false,
  disabled = false,
} = defineProps<ContextMenuItemDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
</script>

<template>
  <ContextMenuPrimitive.ContextMenuItem
    :class="contextMenuItem({ inset, disabled, class: className })"
    :disabled="disabled"
    v-bind="$attrs"
    data-slot="context-menu-item"
  >
    <slot />
  </ContextMenuPrimitive.ContextMenuItem>
</template>
