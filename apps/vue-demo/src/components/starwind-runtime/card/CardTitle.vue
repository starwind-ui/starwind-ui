<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, ref } from "vue";
import { cardTitle } from "./variants";

defineOptions({ inheritAttrs: false });

export type CardTitleProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type CardTitleDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ CardTitleProps;
const { class: className } = defineProps<CardTitleDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const element = ref<HTMLDivElement | null>(null);
defineExpose({ element });
</script>

<template>
  <div
    ref="element"
    data-sw-card-title
    :class="cardTitle({ class: className })"
    v-bind="$attrs"
    data-slot="card-title"
  >
    <slot />
  </div>
</template>
