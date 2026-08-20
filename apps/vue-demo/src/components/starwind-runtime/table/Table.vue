<script setup lang="ts">
import type { ClassValue, VariantProps } from "tailwind-variants";
import { type HTMLAttributes, ref } from "vue";
import { table } from "./variants";

defineOptions({ inheritAttrs: false });

export type TableProps = Omit<HTMLAttributes, "class"> &
  VariantProps<typeof table> & {
    class?: ClassValue;
  };
type TableDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ TableProps;
const { class: className } = defineProps<TableDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const element = ref<HTMLTableElement | null>(null);
defineExpose({ element });
</script>

<template>
  <div data-slot="table-container" class="relative w-full overflow-x-auto">
    <table ref="element" :class="table({ class: className })" v-bind="$attrs" data-slot="table">
      <slot />
    </table>
  </div>
</template>
