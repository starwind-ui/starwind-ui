<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, ref, useAttrs } from "vue";
import { breadcrumbSeparator } from "./variants";

defineOptions({ inheritAttrs: false });

export type BreadcrumbSeparatorProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type BreadcrumbSeparatorDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ BreadcrumbSeparatorProps;
const { class: className } = defineProps<BreadcrumbSeparatorDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
const element = ref<HTMLLIElement | null>(null);
defineExpose({ element });
</script>

<template>
  <li
    ref="element"
    data-sw-breadcrumb-separator
    role="presentation"
    aria-hidden="true"
    :class="breadcrumbSeparator({ class: className })"
    v-bind="attrs"
    data-slot="breadcrumb-separator"
  >
    <slot>
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
        <path d="M9 6l6 6l-6 6" />
      </svg>
    </slot>
  </li>
</template>
