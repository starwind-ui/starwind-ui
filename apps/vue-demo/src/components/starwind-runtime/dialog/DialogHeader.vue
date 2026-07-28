<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, useAttrs } from "vue";
import { dialogHeader } from "./variants";

defineOptions({ inheritAttrs: false });

export type DialogHeaderProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type DialogHeaderDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ DialogHeaderProps;
const { class: className } = defineProps<DialogHeaderDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
</script>

<template>
  <div :class="dialogHeader({ class: className })" v-bind="attrs" data-slot="dialog-header">
    <slot />
  </div>
</template>
