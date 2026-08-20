<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, ref } from "vue";
import { cardContent } from "./variants";

defineOptions({ inheritAttrs: false });

export type CardContentProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type CardContentDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ CardContentProps;
const { class: className } = defineProps<CardContentDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const element = ref<HTMLDivElement | null>(null);
defineExpose({ element });
</script>

<template>
  <div
    ref="element"
    data-sw-card-content
    :class="cardContent({ class: className })"
    v-bind="$attrs"
    data-slot="card-content"
  >
    <slot />
  </div>
</template>
