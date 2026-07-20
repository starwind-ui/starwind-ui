<script setup lang="ts">
import * as SelectPrimitive from "@starwind-ui/vue/select";
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, useAttrs } from "vue";
import { selectItemText } from "./variants";

defineOptions({ inheritAttrs: false });

export type SelectItemTextProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type SelectItemTextDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ SelectItemTextProps;
const { class: className } = defineProps<SelectItemTextDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
</script>

<template>
  <SelectPrimitive.SelectItemText
    :class="selectItemText({ class: className })"
    v-bind="attrs"
    data-slot="select-item-text"
  >
    <slot />
  </SelectPrimitive.SelectItemText>
</template>
