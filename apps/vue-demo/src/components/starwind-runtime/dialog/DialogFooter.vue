<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes } from "vue";
import { dialogFooter } from "./variants";

defineOptions({ inheritAttrs: false });

export type DialogFooterProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type DialogFooterDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ DialogFooterProps;
const { class: className } = defineProps<DialogFooterDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
</script>

<template>
  <div :class="dialogFooter({ class: className })" v-bind="$attrs" data-slot="dialog-footer">
    <slot />
  </div>
</template>
