<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, ref } from "vue";
import { cardHeader } from "./variants";

defineOptions({ inheritAttrs: false });

export type CardHeaderProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type CardHeaderDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ CardHeaderProps;
const { class: className } = defineProps<CardHeaderDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const element = ref<HTMLDivElement | null>(null);
defineExpose({ element });
</script>

<template>
  <div
    ref="element"
    data-sw-card-header
    :class="cardHeader({ class: className })"
    v-bind="$attrs"
    data-slot="card-header"
  >
    <slot />
  </div>
</template>
