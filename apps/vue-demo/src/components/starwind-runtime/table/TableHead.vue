<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, ref, useAttrs } from "vue";
import { tableHead } from "./variants";

defineOptions({ inheritAttrs: false });

export type TableHeadProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type TableHeadDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ TableHeadProps;
const { class: className } = defineProps<TableHeadDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
const element = ref<HTMLTableCellElement | null>(null);
defineExpose({ element });
</script>

<template>
  <th ref="element" :class="tableHead({ class: className })" v-bind="attrs" data-slot="table-head">
    <slot />
  </th>
</template>
