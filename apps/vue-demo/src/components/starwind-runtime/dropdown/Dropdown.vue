<script setup lang="ts">
import * as MenuPrimitive from "@starwind-ui/vue/menu";
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, useAttrs } from "vue";
import { dropdown } from "./variants";

defineOptions({ inheritAttrs: false });

export type DropdownProps = Omit<
  HTMLAttributes,
  "class" | "closeDelay" | "defaultOpen" | "disabled" | "modal" | "open" | "openOnHover"
> & {
  defaultOpen?: boolean;
  open?: boolean;
  disabled?: boolean;
  modal?: boolean;
  openOnHover?: boolean;
  closeDelay?: number;
  class?: ClassValue;
};
type DropdownDeclaredProps = {
  defaultOpen?: boolean;
  open?: boolean;
  disabled?: boolean;
  modal?: boolean;
  openOnHover?: boolean;
  closeDelay?: number;
  class?: ClassValue;
} & /* @vue-ignore */ DropdownProps;
const {
  defaultOpen = false,
  open = undefined,
  disabled = false,
  modal = false,
  openOnHover = false,
  closeDelay = 200,
  class: className,
} = defineProps<DropdownDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
const emit = defineEmits<{
  closeComplete: [detail: import("@starwind-ui/vue/menu").MenuCloseCompleteDetails];
  openChange: [open: boolean, detail: import("@starwind-ui/vue/menu").MenuOpenChangeDetails];
  "update:open": [value: boolean];
}>();
function handleCloseComplete(
  detail: import("@starwind-ui/vue/menu").MenuCloseCompleteDetails,
): void {
  emit("closeComplete", detail);
}

function handleOpenChange(
  open: boolean,
  detail: import("@starwind-ui/vue/menu").MenuOpenChangeDetails,
): void {
  emit("openChange", open, detail);
}
</script>

<template>
  <MenuPrimitive.MenuRoot
    :class="dropdown({ class: className })"
    :default-open="defaultOpen"
    :open="open"
    :disabled="disabled"
    :modal="modal"
    :open-on-hover="openOnHover"
    :close-delay="closeDelay"
    v-bind="attrs"
    data-slot="dropdown"
    @update:open="emit('update:open', $event)"
    @close-complete="handleCloseComplete"
    @open-change="handleOpenChange"
  >
    <slot />
  </MenuPrimitive.MenuRoot>
</template>
