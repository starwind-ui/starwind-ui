<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, ref, useAttrs } from "vue";
import { skeleton } from "./variants";

defineOptions({ inheritAttrs: false });

export type SkeletonProps = Omit<HTMLAttributes, "children" | "class"> & {
  class?: ClassValue;
};
type SkeletonDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ SkeletonProps;
const { class: className } = defineProps<SkeletonDeclaredProps>();
defineSlots<{}>();
const attrs = useAttrs();
const element = ref<HTMLDivElement | null>(null);
defineExpose({ element });
</script>

<template>
  <div
    ref="element"
    data-sw-skeleton
    :class="skeleton({ class: className })"
    v-bind="attrs"
    data-slot="skeleton"
  />
</template>
