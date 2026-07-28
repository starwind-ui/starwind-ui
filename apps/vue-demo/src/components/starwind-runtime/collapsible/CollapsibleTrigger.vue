<script setup lang="ts">
import * as CollapsiblePrimitive from "@starwind-ui/vue/collapsible";
import type { ClassValue } from "tailwind-variants";
import { type ButtonHTMLAttributes, useAttrs } from "vue";
import { collapsibleTrigger } from "./variants";

defineOptions({ inheritAttrs: false });

export type CollapsibleTriggerProps = Omit<ButtonHTMLAttributes, "asChild" | "class"> & {
  asChild?: boolean;
  class?: ClassValue;
};
type CollapsibleTriggerDeclaredProps = {
  asChild?: boolean;
  class?: ClassValue;
} & /* @vue-ignore */ CollapsibleTriggerProps;
const { asChild = false, class: className } = defineProps<CollapsibleTriggerDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
</script>

<template>
  <CollapsiblePrimitive.CollapsibleTrigger
    :class="collapsibleTrigger({ class: className })"
    :as-child="asChild"
    v-bind="attrs"
    data-slot="collapsible-trigger"
  >
    <slot />
  </CollapsiblePrimitive.CollapsibleTrigger>
</template>
