<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, ref, useAttrs } from "vue";
import { tableHeader } from "./variants";

defineOptions({ inheritAttrs: false });

export type TableHeaderProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type TableHeaderDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ TableHeaderProps;
const { class: className } = defineProps<TableHeaderDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
const element = ref<HTMLTableSectionElement | null>(null);
defineExpose({ element });
</script>

<template>
  <thead
    ref="element"
    :class="tableHeader({ class: className })"
    v-bind="attrs"
    data-slot="table-header"
  >
    <slot />
  </thead>
</template>
