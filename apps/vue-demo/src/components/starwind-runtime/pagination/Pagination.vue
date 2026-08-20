<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, ref } from "vue";
import { pagination } from "./variants";

defineOptions({ inheritAttrs: false });

export type PaginationProps = Omit<HTMLAttributes, "class" | "size"> & {
  size?: "sm" | "md" | "lg";
  class?: ClassValue;
};
type PaginationDeclaredProps = {
  size?: "sm" | "md" | "lg";
  class?: ClassValue;
} & /* @vue-ignore */ PaginationProps;
const { size = "md", class: className } = defineProps<PaginationDeclaredProps>();
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
    :data-size="size"
    data-slot="pagination"
  >
    <slot />
  </nav>
</template>
