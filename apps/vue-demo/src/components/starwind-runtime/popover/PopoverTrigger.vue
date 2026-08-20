<script setup lang="ts">
import * as PopoverPrimitive from "@starwind-ui/vue/popover";
import type { ClassValue } from "tailwind-variants";
import { type ButtonHTMLAttributes, computed } from "vue";
import { popoverTrigger } from "./variants";

defineOptions({ inheritAttrs: false });

export type PopoverTriggerProps = Omit<ButtonHTMLAttributes, "asChild" | "class"> & {
  asChild?: boolean;
  class?: ClassValue;
};
type PopoverTriggerDeclaredProps = {
  asChild?: boolean;
  class?: ClassValue;
} & /* @vue-ignore */ PopoverTriggerProps;
const { asChild = false, class: className } = defineProps<PopoverTriggerDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const triggerBaseClassName = computed(() => popoverTrigger({ class: className }));
const triggerClassName = computed(() => (asChild ? className : triggerBaseClassName.value));
</script>

<template>
  <PopoverPrimitive.PopoverTrigger
    :class="triggerClassName"
    :as-child="asChild"
    v-bind="$attrs"
    data-slot="popover-trigger"
  >
    <slot />
  </PopoverPrimitive.PopoverTrigger>
</template>
