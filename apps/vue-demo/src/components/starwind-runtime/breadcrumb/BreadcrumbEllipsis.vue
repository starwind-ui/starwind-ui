<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, ref } from "vue";
import { breadcrumbEllipsis } from "./variants";

defineOptions({ inheritAttrs: false });

export type BreadcrumbEllipsisProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type BreadcrumbEllipsisDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ BreadcrumbEllipsisProps;
const { class: className } = defineProps<BreadcrumbEllipsisDeclaredProps>();
defineSlots<{
  default?: () => unknown;
  icon?: () => unknown;
}>();
const element = ref<HTMLSpanElement | null>(null);
defineExpose({ element });
</script>

<template>
  <span
    ref="element"
    data-sw-breadcrumb-ellipsis
    role="presentation"
    aria-hidden="true"
    :class="breadcrumbEllipsis({ class: className })"
    v-bind="$attrs"
    data-slot="breadcrumb-ellipsis"
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
      >
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M5 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
        <path d="M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
        <path d="M19 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
      </svg>
    </slot>
    <slot>
      <span class="sr-only"> More </span>
    </slot>
  </span>
</template>
