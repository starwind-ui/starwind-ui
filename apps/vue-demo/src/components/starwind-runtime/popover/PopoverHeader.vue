<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes } from "vue";
import { popoverHeader } from "./variants";

defineOptions({ inheritAttrs: false });

export type PopoverHeaderProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type PopoverHeaderDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ PopoverHeaderProps;
const { class: className } = defineProps<PopoverHeaderDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
</script>

<template>
  <div :class="popoverHeader({ class: className })" v-bind="$attrs" data-slot="popover-header">
    <slot />
  </div>
</template>
