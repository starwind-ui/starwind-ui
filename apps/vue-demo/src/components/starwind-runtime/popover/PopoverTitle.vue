<script setup lang="ts">
import * as PopoverPrimitive from "@starwind-ui/vue/popover";
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes } from "vue";
import { popoverTitle } from "./variants";

defineOptions({ inheritAttrs: false });

export type PopoverTitleProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type PopoverTitleDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ PopoverTitleProps;
const { class: className } = defineProps<PopoverTitleDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
</script>

<template>
  <PopoverPrimitive.PopoverTitle
    :class="popoverTitle({ class: className })"
    v-bind="$attrs"
    data-slot="popover-title"
  >
    <slot />
  </PopoverPrimitive.PopoverTitle>
</template>
