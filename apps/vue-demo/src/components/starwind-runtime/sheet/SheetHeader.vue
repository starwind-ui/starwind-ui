<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, useAttrs } from "vue";
import { sheetHeader } from "./variants";

defineOptions({ inheritAttrs: false });

export type SheetHeaderProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type SheetHeaderDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ SheetHeaderProps;
const { class: className } = defineProps<SheetHeaderDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
</script>

<template>
  <div :class="sheetHeader({ class: className })" v-bind="attrs" data-slot="sheet-header">
    <slot />
  </div>
</template>
