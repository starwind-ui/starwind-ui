<script setup lang="ts">
import * as PreviewCardPrimitive from "@starwind-ui/vue/preview-card";
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, useAttrs } from "vue";
import { hoverCard } from "./variants";

defineOptions({ inheritAttrs: false });

export type HoverCardProps = Omit<
  HTMLAttributes,
  | "class"
  | "closeDelay"
  | "closeOnEscape"
  | "closeOnOutsideInteract"
  | "defaultOpen"
  | "disableHoverableContent"
  | "open"
  | "openDelay"
> & {
  defaultOpen?: boolean;
  open?: boolean;
  closeDelay?: number;
  closeOnEscape?: boolean;
  closeOnOutsideInteract?: boolean;
  disableHoverableContent?: boolean;
  openDelay?: number;
  class?: ClassValue;
};
type HoverCardDeclaredProps = {
  defaultOpen?: boolean;
  open?: boolean;
  closeDelay?: number;
  closeOnEscape?: boolean;
  closeOnOutsideInteract?: boolean;
  disableHoverableContent?: boolean;
  openDelay?: number;
  class?: ClassValue;
} & /* @vue-ignore */ HoverCardProps;
const {
  defaultOpen = false,
  open = undefined,
  closeDelay = 300,
  closeOnEscape = true,
  closeOnOutsideInteract = true,
  disableHoverableContent = false,
  openDelay = 600,
  class: className,
} = defineProps<HoverCardDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
const emit = defineEmits<{
  openChange: [
    open: boolean,
    detail: import("@starwind-ui/vue/preview-card").PreviewCardOpenChangeDetails,
  ];
  "update:open": [value: boolean];
}>();
function handleOpenChange(
  open: boolean,
  detail: import("@starwind-ui/vue/preview-card").PreviewCardOpenChangeDetails,
): void {
  emit("openChange", open, detail);
}
</script>

<template>
  <PreviewCardPrimitive.PreviewCardRoot
    :class="hoverCard({ class: className })"
    :default-open="defaultOpen"
    :open="open"
    :close-delay="closeDelay"
    :close-on-escape="closeOnEscape"
    :close-on-outside-interact="closeOnOutsideInteract"
    :disable-hoverable-content="disableHoverableContent"
    :open-delay="openDelay"
    v-bind="attrs"
    data-slot="hover-card"
    @update:open="emit('update:open', $event)"
    @open-change="handleOpenChange"
  >
    <slot />
  </PreviewCardPrimitive.PreviewCardRoot>
</template>
