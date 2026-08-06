<script setup lang="ts">
import * as ComboboxPrimitive from "@starwind-ui/vue/combobox";
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, useAttrs } from "vue";
import { comboboxValue } from "./variants";

defineOptions({ inheritAttrs: false });

export type ComboboxValueProps = Omit<HTMLAttributes, "class" | "placeholder"> & {
  placeholder?: string;
  class?: ClassValue;
};
type ComboboxValueDeclaredProps = {
  placeholder?: string;
  class?: ClassValue;
} & /* @vue-ignore */ ComboboxValueProps;
const { class: className, placeholder } = defineProps<ComboboxValueDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
</script>

<template>
  <ComboboxPrimitive.ComboboxValue
    :class="comboboxValue({ class: className })"
    :placeholder="placeholder"
    v-bind="attrs"
    data-slot="combobox-value"
  >
    <slot />
  </ComboboxPrimitive.ComboboxValue>
</template>
