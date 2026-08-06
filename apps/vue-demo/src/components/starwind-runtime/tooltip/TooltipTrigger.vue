<script setup lang="ts">
import * as TooltipPrimitive from "@starwind-ui/vue/tooltip";
import type { ClassValue } from "tailwind-variants";
import { computed, type HTMLAttributes, useAttrs } from "vue";

defineOptions({ inheritAttrs: false });

export type TooltipTriggerProps = Omit<HTMLAttributes, "asChild" | "class" | "disabled"> & {
  asChild?: boolean;
  disabled?: boolean;
  class?: ClassValue;
};
type TooltipTriggerDeclaredProps = {
  asChild?: boolean;
  disabled?: boolean;
  class?: ClassValue;
} & /* @vue-ignore */ TooltipTriggerProps;
const {
  asChild = true,
  disabled = false,
  class: className,
} = defineProps<TooltipTriggerDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
const triggerClassName = computed(() =>
  [asChild ? undefined : "inline-flex", className].filter(Boolean).join(" "),
);
</script>

<template>
  <TooltipPrimitive.TooltipTrigger
    :class="triggerClassName"
    :as-child="asChild"
    :disabled="disabled"
    v-bind="attrs"
    data-slot="tooltip-trigger"
  >
    <slot />
  </TooltipPrimitive.TooltipTrigger>
</template>
