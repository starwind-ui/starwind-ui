<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, ref, useAttrs } from "vue";
import { tableCell } from "./variants";

defineOptions({ inheritAttrs: false });

export type TableCellProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type TableCellDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ TableCellProps;
const { class: className } = defineProps<TableCellDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
const element = ref<HTMLTableCellElement | null>(null);
defineExpose({ element });
</script>

<template>
  <td ref="element" :class="tableCell({ class: className })" v-bind="attrs" data-slot="table-cell">
    <slot />
  </td>
</template>
