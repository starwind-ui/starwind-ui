<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, ref } from "vue";
import { breadcrumbPage } from "./variants";

defineOptions({ inheritAttrs: false });

export type BreadcrumbPageProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type BreadcrumbPageDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ BreadcrumbPageProps;
const { class: className } = defineProps<BreadcrumbPageDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const element = ref<HTMLSpanElement | null>(null);
defineExpose({ element });
</script>

<template>
  <span
    ref="element"
    data-sw-breadcrumb-page
    role="link"
    aria-disabled="true"
    aria-current="page"
    :class="breadcrumbPage({ class: className })"
    v-bind="$attrs"
    data-slot="breadcrumb-page"
  >
    <slot />
  </span>
</template>
