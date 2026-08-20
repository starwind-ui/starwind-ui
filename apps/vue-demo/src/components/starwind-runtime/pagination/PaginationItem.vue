<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, ref } from "vue";

defineOptions({ inheritAttrs: false });

export type PaginationItemProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type PaginationItemDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ PaginationItemProps;
const { class: className } = defineProps<PaginationItemDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const element = ref<HTMLLIElement | null>(null);
defineExpose({ element });
</script>

<template>
  <li
    ref="element"
    :class="className as import('vue').ClassValue"
    v-bind="$attrs"
    data-slot="pagination-item"
  >
    <slot />
  </li>
</template>
