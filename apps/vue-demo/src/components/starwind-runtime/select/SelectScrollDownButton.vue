<script setup lang="ts">
import * as SelectPrimitive from "@starwind-ui/vue/select";
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, useAttrs } from "vue";
import { selectScrollButton } from "./variants";

defineOptions({ inheritAttrs: false });

export type SelectScrollDownButtonProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type SelectScrollDownButtonDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ SelectScrollDownButtonProps;
const { class: className } = defineProps<SelectScrollDownButtonDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
</script>

<template>
  <SelectPrimitive.SelectScrollDownArrow
    :class="selectScrollButton({ class: className })"
    v-bind="attrs"
    data-slot="select-scroll-down-button"
  >
    <slot />
  </SelectPrimitive.SelectScrollDownArrow>
</template>
