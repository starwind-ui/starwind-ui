<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, ref, useAttrs } from "vue";
import { tableRow } from "./variants";

defineOptions({ inheritAttrs: false });

export type TableRowProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type TableRowDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ TableRowProps;
const { class: className } = defineProps<TableRowDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
const element = ref<HTMLTableRowElement | null>(null);
defineExpose({ element });
</script>

<template>
  <tr ref="element" :class="tableRow({ class: className })" v-bind="attrs" data-slot="table-row">
    <slot />
  </tr>
</template>
