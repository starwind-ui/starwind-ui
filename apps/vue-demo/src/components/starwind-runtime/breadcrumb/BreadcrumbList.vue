<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, ref, useAttrs } from "vue";
import { breadcrumbList } from "./variants";

defineOptions({ inheritAttrs: false });

export type BreadcrumbListProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type BreadcrumbListDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ BreadcrumbListProps;
const { class: className } = defineProps<BreadcrumbListDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
const element = ref<HTMLOListElement | null>(null);
defineExpose({ element });
</script>

<template>
  <ol
    ref="element"
    data-sw-breadcrumb-list
    :class="breadcrumbList({ class: className })"
    v-bind="attrs"
    data-slot="breadcrumb-list"
  >
    <slot />
  </ol>
</template>
