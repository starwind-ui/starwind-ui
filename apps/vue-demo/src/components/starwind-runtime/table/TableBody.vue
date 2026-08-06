<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, ref, useAttrs } from "vue";
import { tableBody } from "./variants";

defineOptions({ inheritAttrs: false });

export type TableBodyProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type TableBodyDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ TableBodyProps;
const { class: className } = defineProps<TableBodyDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
const element = ref<HTMLTableSectionElement | null>(null);
defineExpose({ element });
</script>

<template>
  <tbody
    ref="element"
    :class="tableBody({ class: className })"
    v-bind="attrs"
    data-slot="table-body"
  >
    <slot />
  </tbody>
</template>
