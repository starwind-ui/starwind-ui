<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, ref, useAttrs } from "vue";

defineOptions({ inheritAttrs: false });

export type BreadcrumbProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type BreadcrumbDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ BreadcrumbProps;
const { class: className } = defineProps<BreadcrumbDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
const element = ref<HTMLElement | null>(null);
defineExpose({ element });
</script>

<template>
  <nav
    ref="element"
    data-sw-breadcrumb
    aria-label="breadcrumb"
    :class="className as import('vue').ClassValue"
    v-bind="attrs"
    data-slot="breadcrumb"
  >
    <slot />
  </nav>
</template>
