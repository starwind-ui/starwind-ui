<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, useAttrs } from "vue";
import { alertDialogFooter } from "./variants";

defineOptions({ inheritAttrs: false });

export type AlertDialogFooterProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type AlertDialogFooterDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ AlertDialogFooterProps;
const { class: className } = defineProps<AlertDialogFooterDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
</script>

<template>
  <div
    :class="alertDialogFooter({ class: className })"
    v-bind="attrs"
    data-slot="alert-dialog-footer"
  >
    <slot />
  </div>
</template>
