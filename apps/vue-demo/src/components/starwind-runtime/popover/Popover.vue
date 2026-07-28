<script setup lang="ts">
import * as PopoverPrimitive from "@starwind-ui/vue/popover";
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, useAttrs } from "vue";
import { popover } from "./variants";

defineOptions({ inheritAttrs: false });

export type PopoverProps = Omit<
  HTMLAttributes,
  | "class"
  | "closeDelay"
  | "closeOnEscape"
  | "closeOnOutsideInteract"
  | "defaultOpen"
  | "modal"
  | "open"
  | "openOnHover"
> & {
  defaultOpen?: boolean;
  closeOnEscape?: boolean;
  closeOnOutsideInteract?: boolean;
  modal?: boolean;
  openOnHover?: boolean;
  closeDelay?: number;
  class?: ClassValue;
  open?: boolean;
};
type PopoverDeclaredProps = {
  defaultOpen?: boolean;
  closeOnEscape?: boolean;
  closeOnOutsideInteract?: boolean;
  modal?: boolean;
  openOnHover?: boolean;
  closeDelay?: number;
  class?: ClassValue;
  open?: boolean;
} & /* @vue-ignore */ PopoverProps;
const {
  defaultOpen = false,
  closeOnEscape = true,
  closeOnOutsideInteract = true,
  modal = false,
  openOnHover = false,
  closeDelay = 200,
  class: className,
  open = undefined,
} = defineProps<PopoverDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
const emit = defineEmits<{
  closeComplete: [detail: import("@starwind-ui/vue/popover").PopoverCloseCompleteDetails];
  openChange: [open: boolean, detail: import("@starwind-ui/vue/popover").PopoverOpenChangeDetails];
  "update:open": [value: boolean];
}>();
function handleCloseComplete(
  detail: import("@starwind-ui/vue/popover").PopoverCloseCompleteDetails,
): void {
  emit("closeComplete", detail);
}

function handleOpenChange(
  open: boolean,
  detail: import("@starwind-ui/vue/popover").PopoverOpenChangeDetails,
): void {
  emit("openChange", open, detail);
}
</script>

<template>
  <PopoverPrimitive.PopoverRoot
    :class="popover({ class: className })"
    :default-open="defaultOpen"
    :close-on-escape="closeOnEscape"
    :close-on-outside-interact="closeOnOutsideInteract"
    :modal="modal"
    :open-on-hover="openOnHover"
    :close-delay="closeDelay"
    v-bind="attrs"
    data-slot="popover"
    :open="open"
    @update:open="emit('update:open', $event)"
    @close-complete="handleCloseComplete"
    @open-change="handleOpenChange"
  >
    <slot />
  </PopoverPrimitive.PopoverRoot>
</template>
