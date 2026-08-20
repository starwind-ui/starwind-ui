<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, ref } from "vue";
import { breadcrumbItem } from "./variants";

defineOptions({ inheritAttrs: false });

export type BreadcrumbItemProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type BreadcrumbItemDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ BreadcrumbItemProps;
const { class: className } = defineProps<BreadcrumbItemDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const element = ref<HTMLLIElement | null>(null);
defineExpose({ element });
</script>

<template>
  <li
    ref="element"
    data-sw-breadcrumb-item
    :class="breadcrumbItem({ class: className })"
    v-bind="$attrs"
    data-slot="breadcrumb-item"
  >
    <slot />
  </li>
</template>
