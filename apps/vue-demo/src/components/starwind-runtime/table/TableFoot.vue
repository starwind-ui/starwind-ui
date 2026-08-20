<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, ref } from "vue";
import { tableFoot } from "./variants";

defineOptions({ inheritAttrs: false });

export type TableFootProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type TableFootDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ TableFootProps;
const { class: className } = defineProps<TableFootDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const element = ref<HTMLTableSectionElement | null>(null);
defineExpose({ element });
</script>

<template>
  <tfoot
    ref="element"
    :class="tableFoot({ class: className })"
    v-bind="$attrs"
    data-slot="table-foot"
  >
    <slot />
  </tfoot>
</template>
