<script setup lang="ts">
import * as SelectPrimitive from "@starwind-ui/vue/select";
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, useAttrs } from "vue";
import { selectItemIndicator } from "./variants";

defineOptions({ inheritAttrs: false });

export type SelectItemIndicatorProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type SelectItemIndicatorDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ SelectItemIndicatorProps;
const { class: className } = defineProps<SelectItemIndicatorDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
</script>

<template>
  <SelectPrimitive.SelectItemIndicator
    :class="selectItemIndicator({ class: className })"
    v-bind="attrs"
    data-slot="select-item-indicator"
  >
    <slot />
  </SelectPrimitive.SelectItemIndicator>
</template>
