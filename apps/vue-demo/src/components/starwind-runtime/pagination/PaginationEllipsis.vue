<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, ref, useAttrs } from "vue";
import { paginationEllipsis } from "./variants";

defineOptions({ inheritAttrs: false });

export type PaginationEllipsisProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type PaginationEllipsisDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ PaginationEllipsisProps;
const { class: className } = defineProps<PaginationEllipsisDeclaredProps>();
defineSlots<{
  default?: () => unknown;
  icon?: () => unknown;
}>();
const attrs = useAttrs();
const element = ref<HTMLSpanElement | null>(null);
defineExpose({ element });
</script>

<template>
  <span
    ref="element"
    aria-hidden
    :class="paginationEllipsis({ class: className })"
    v-bind="attrs"
    data-slot="pagination-ellipsis"
  >
    <slot name="icon">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
        class="size-4"
      >
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M5 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
        <path d="M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
        <path d="M19 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
      </svg>
    </slot>
    <slot>
      <span class="sr-only"> More pages </span>
    </slot>
  </span>
</template>
