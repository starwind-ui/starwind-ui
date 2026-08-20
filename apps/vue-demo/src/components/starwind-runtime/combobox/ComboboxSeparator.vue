<script setup lang="ts">
import * as ComboboxPrimitive from "@starwind-ui/vue/combobox";
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes } from "vue";
import { comboboxSeparator } from "./variants";

defineOptions({ inheritAttrs: false });

export type ComboboxSeparatorProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type ComboboxSeparatorDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ ComboboxSeparatorProps;
const { class: className } = defineProps<ComboboxSeparatorDeclaredProps>();
defineSlots<{}>();
</script>

<template>
  <ComboboxPrimitive.ComboboxSeparator
    :class="comboboxSeparator({ class: className })"
    v-bind="$attrs"
    data-slot="combobox-separator"
  />
</template>
