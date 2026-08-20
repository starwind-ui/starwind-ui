<script setup lang="ts">
import * as ComboboxPrimitive from "@starwind-ui/vue/combobox";
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes } from "vue";
import { comboboxLabel } from "./variants";

defineOptions({ inheritAttrs: false });

export type ComboboxLabelProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type ComboboxLabelDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ ComboboxLabelProps;
const { class: className } = defineProps<ComboboxLabelDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
</script>

<template>
  <ComboboxPrimitive.ComboboxLabel
    :class="comboboxLabel({ class: className })"
    v-bind="$attrs"
    data-slot="combobox-label"
  >
    <slot />
  </ComboboxPrimitive.ComboboxLabel>
</template>
