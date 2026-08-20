<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, ref } from "vue";
import { paginationContent } from "./variants";

defineOptions({ inheritAttrs: false });

export type PaginationContentProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type PaginationContentDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ PaginationContentProps;
const { class: className } = defineProps<PaginationContentDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const element = ref<HTMLUListElement | null>(null);
defineExpose({ element });
</script>

<template>
  <ul
    ref="element"
    :class="paginationContent({ class: className })"
    v-bind="$attrs"
    data-slot="pagination-content"
  >
    <slot />
  </ul>
</template>
