<script setup lang="ts">
import * as ComboboxPrimitive from "@starwind-ui/vue/combobox";
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, useAttrs } from "vue";
import { comboboxEmpty } from "./variants";

defineOptions({ inheritAttrs: false });

export type ComboboxEmptyProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type ComboboxEmptyDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ ComboboxEmptyProps;
const { class: className } = defineProps<ComboboxEmptyDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
</script>

<template>
  <ComboboxPrimitive.ComboboxEmpty
    :class="comboboxEmpty({ class: className })"
    v-bind="attrs"
    data-slot="combobox-empty"
  >
    <slot />
  </ComboboxPrimitive.ComboboxEmpty>
</template>
