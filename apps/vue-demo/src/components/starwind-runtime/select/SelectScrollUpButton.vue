<script setup lang="ts">
import * as SelectPrimitive from "@starwind-ui/vue/select";
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes } from "vue";
import { selectScrollButton } from "./variants";

defineOptions({ inheritAttrs: false });

export type SelectScrollUpButtonProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type SelectScrollUpButtonDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ SelectScrollUpButtonProps;
const { class: className } = defineProps<SelectScrollUpButtonDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
</script>

<template>
  <SelectPrimitive.SelectScrollUpArrow
    :class="selectScrollButton({ class: className })"
    v-bind="$attrs"
    data-slot="select-scroll-up-button"
  >
    <slot />
  </SelectPrimitive.SelectScrollUpArrow>
</template>
