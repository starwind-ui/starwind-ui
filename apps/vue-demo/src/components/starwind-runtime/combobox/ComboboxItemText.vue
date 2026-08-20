<script setup lang="ts">
import * as ComboboxPrimitive from "@starwind-ui/vue/combobox";
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes } from "vue";
import { comboboxItemText } from "./variants";

defineOptions({ inheritAttrs: false });

export type ComboboxItemTextProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type ComboboxItemTextDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ ComboboxItemTextProps;
const { class: className } = defineProps<ComboboxItemTextDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
</script>

<template>
  <ComboboxPrimitive.ComboboxItemText
    :class="comboboxItemText({ class: className })"
    v-bind="$attrs"
    data-slot="combobox-item-text"
  >
    <slot />
  </ComboboxPrimitive.ComboboxItemText>
</template>
