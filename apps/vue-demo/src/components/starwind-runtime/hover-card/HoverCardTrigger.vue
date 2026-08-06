<script setup lang="ts">
import * as PreviewCardPrimitive from "@starwind-ui/vue/preview-card";
import type { ClassValue } from "tailwind-variants";
import { type AnchorHTMLAttributes, computed, useAttrs } from "vue";
import { hoverCardTrigger } from "./variants";

defineOptions({ inheritAttrs: false });

export type HoverCardTriggerProps = Omit<
  AnchorHTMLAttributes,
  "asChild" | "class" | "closeDelay" | "disabled" | "openDelay"
> & {
  asChild?: boolean;
  closeDelay?: number;
  disabled?: boolean;
  openDelay?: number;
  class?: ClassValue;
};
type HoverCardTriggerDeclaredProps = {
  asChild?: boolean;
  closeDelay?: number;
  disabled?: boolean;
  openDelay?: number;
  class?: ClassValue;
} & /* @vue-ignore */ HoverCardTriggerProps;
const {
  asChild = false,
  closeDelay,
  disabled = false,
  openDelay,
  class: className,
} = defineProps<HoverCardTriggerDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
const triggerBaseClassName = computed(() => hoverCardTrigger({ class: className }));
const triggerClassName = computed(() => (asChild ? className : triggerBaseClassName.value));
</script>

<template>
  <PreviewCardPrimitive.PreviewCardTrigger
    :class="triggerClassName"
    :as-child="asChild"
    :close-delay="closeDelay"
    :disabled="disabled"
    :open-delay="openDelay"
    v-bind="attrs"
    data-slot="hover-card-trigger"
  >
    <slot />
  </PreviewCardPrimitive.PreviewCardTrigger>
</template>
