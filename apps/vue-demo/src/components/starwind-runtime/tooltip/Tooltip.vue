<script setup lang="ts">
import * as TooltipPrimitive from "@starwind-ui/vue/tooltip";
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, useAttrs } from "vue";
import { tooltip } from "./variants";

defineOptions({ inheritAttrs: false });

export type TooltipProps = Omit<
  HTMLAttributes,
  | "class"
  | "closeDelay"
  | "closeOnEscape"
  | "closeOnOutsideInteract"
  | "defaultOpen"
  | "disableHoverableContent"
  | "disabled"
  | "open"
  | "openDelay"
> & {
  defaultOpen?: boolean;
  open?: boolean;
  closeDelay?: number;
  closeOnEscape?: boolean;
  closeOnOutsideInteract?: boolean;
  disabled?: boolean;
  disableHoverableContent?: boolean;
  openDelay?: number;
  class?: ClassValue;
};
type TooltipDeclaredProps = {
  defaultOpen?: boolean;
  open?: boolean;
  closeDelay?: number;
  closeOnEscape?: boolean;
  closeOnOutsideInteract?: boolean;
  disabled?: boolean;
  disableHoverableContent?: boolean;
  openDelay?: number;
  class?: ClassValue;
} & /* @vue-ignore */ TooltipProps;
const {
  defaultOpen = false,
  open = undefined,
  closeDelay = 200,
  closeOnEscape = true,
  closeOnOutsideInteract = true,
  disabled = false,
  disableHoverableContent = false,
  openDelay = 200,
  class: className,
} = defineProps<TooltipDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
const emit = defineEmits<{
  openChange: [open: boolean, detail: import("@starwind-ui/vue/tooltip").TooltipOpenChangeDetails];
  "update:open": [value: boolean];
}>();
function handleOpenChange(
  open: boolean,
  detail: import("@starwind-ui/vue/tooltip").TooltipOpenChangeDetails,
): void {
  emit("openChange", open, detail);
}
</script>

<template>
  <TooltipPrimitive.TooltipRoot
    :class="tooltip({ class: className })"
    :default-open="defaultOpen"
    :open="open"
    :close-delay="closeDelay"
    :close-on-escape="closeOnEscape"
    :close-on-outside-interact="closeOnOutsideInteract"
    :disabled="disabled"
    :disable-hoverable-content="disableHoverableContent"
    :open-delay="openDelay"
    v-bind="attrs"
    data-slot="tooltip"
    @update:open="emit('update:open', $event)"
    @open-change="handleOpenChange"
  >
    <slot />
  </TooltipPrimitive.TooltipRoot>
</template>
