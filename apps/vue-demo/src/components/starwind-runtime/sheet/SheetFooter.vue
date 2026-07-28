<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, useAttrs } from "vue";
import { sheetFooter } from "./variants";

defineOptions({ inheritAttrs: false });

export type SheetFooterProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type SheetFooterDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ SheetFooterProps;
const { class: className } = defineProps<SheetFooterDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
</script>

<template>
  <div :class="sheetFooter({ class: className })" v-bind="attrs" data-slot="sheet-footer">
    <slot />
  </div>
</template>
