<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, useAttrs } from "vue";
import { alertDialogHeader } from "./variants";

defineOptions({ inheritAttrs: false });

export type AlertDialogHeaderProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type AlertDialogHeaderDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ AlertDialogHeaderProps;
const { class: className } = defineProps<AlertDialogHeaderDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
</script>

<template>
  <div
    :class="alertDialogHeader({ class: className })"
    v-bind="attrs"
    data-slot="alert-dialog-header"
  >
    <slot />
  </div>
</template>
