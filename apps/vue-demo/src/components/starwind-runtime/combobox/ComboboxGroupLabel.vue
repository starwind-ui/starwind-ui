<script setup lang="ts">
import * as ComboboxPrimitive from "@starwind-ui/vue/combobox";
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes } from "vue";
import { comboboxGroupLabel } from "./variants";

defineOptions({ inheritAttrs: false });

export type ComboboxGroupLabelProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type ComboboxGroupLabelDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ ComboboxGroupLabelProps;
const { class: className } = defineProps<ComboboxGroupLabelDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
</script>

<template>
  <ComboboxPrimitive.ComboboxGroupLabel
    :class="comboboxGroupLabel({ class: className })"
    v-bind="$attrs"
    data-slot="combobox-group-label"
  >
    <slot />
  </ComboboxPrimitive.ComboboxGroupLabel>
</template>
