<script setup lang="ts">
import * as ContextMenuPrimitive from "@starwind-ui/vue/context-menu";
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, useAttrs } from "vue";
import { contextMenu } from "./variants";

defineOptions({ inheritAttrs: false });

export type ContextMenuProps = Omit<
  HTMLAttributes,
  "class" | "closeDelay" | "defaultOpen" | "disabled" | "modal" | "open"
> & {
  defaultOpen?: boolean;
  open?: boolean;
  disabled?: boolean;
  modal?: boolean;
  closeDelay?: number;
  class?: ClassValue;
};
type ContextMenuDeclaredProps = {
  defaultOpen?: boolean;
  open?: boolean;
  disabled?: boolean;
  modal?: boolean;
  closeDelay?: number;
  class?: ClassValue;
} & /* @vue-ignore */ ContextMenuProps;
const {
  defaultOpen = false,
  open = undefined,
  disabled = false,
  modal = true,
  closeDelay = 200,
  class: className,
} = defineProps<ContextMenuDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
const emit = defineEmits<{
  closeComplete: [detail: import("@starwind-ui/vue/context-menu").ContextMenuCloseCompleteDetails];
  openChange: [
    open: boolean,
    detail: import("@starwind-ui/vue/context-menu").ContextMenuOpenChangeDetails,
  ];
  "update:open": [value: boolean];
}>();
function handleCloseComplete(
  detail: import("@starwind-ui/vue/context-menu").ContextMenuCloseCompleteDetails,
): void {
  emit("closeComplete", detail);
}

function handleOpenChange(
  open: boolean,
  detail: import("@starwind-ui/vue/context-menu").ContextMenuOpenChangeDetails,
): void {
  emit("openChange", open, detail);
}
</script>

<template>
  <ContextMenuPrimitive.ContextMenuRoot
    :class="contextMenu({ class: className })"
    :default-open="defaultOpen"
    :open="open"
    :disabled="disabled"
    :modal="modal"
    :close-delay="closeDelay"
    v-bind="attrs"
    data-slot="context-menu"
    @update:open="emit('update:open', $event)"
    @close-complete="handleCloseComplete"
    @open-change="handleOpenChange"
  >
    <slot />
  </ContextMenuPrimitive.ContextMenuRoot>
</template>
