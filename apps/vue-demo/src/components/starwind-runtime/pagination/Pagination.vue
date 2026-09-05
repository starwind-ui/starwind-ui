<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, ref } from "vue";
import { pagination } from "./variants";

defineOptions({ inheritAttrs: false });

export type PaginationProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type PaginationDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ PaginationProps;
const { class: className } = defineProps<PaginationDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const element = ref<HTMLElement | null>(null);
defineExpose({ element });
</script>

<template>
  <nav
    ref="element"
    role="navigation"
    aria-label="pagination"
    :class="pagination({ class: className })"
    v-bind="$attrs"
    data-slot="pagination"
  >
    <slot />
  </nav>
</template>
