<script setup lang="ts">
import * as ComboboxPrimitive from "@starwind-ui/vue/combobox";
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, useAttrs } from "vue";
import { comboboxItemIndicator } from "./variants";

defineOptions({ inheritAttrs: false });

export type ComboboxItemIndicatorProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type ComboboxItemIndicatorDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ ComboboxItemIndicatorProps;
const { class: className } = defineProps<ComboboxItemIndicatorDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
</script>

<template>
  <ComboboxPrimitive.ComboboxItemIndicator
    :class="comboboxItemIndicator({ class: className })"
    v-bind="attrs"
    data-slot="combobox-item-indicator"
  >
    <slot />
  </ComboboxPrimitive.ComboboxItemIndicator>
</template>
