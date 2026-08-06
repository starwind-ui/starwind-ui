<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, ref, useAttrs } from "vue";
import { cardDescription } from "./variants";

defineOptions({ inheritAttrs: false });

export type CardDescriptionProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type CardDescriptionDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ CardDescriptionProps;
const { class: className } = defineProps<CardDescriptionDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
const element = ref<HTMLDivElement | null>(null);
defineExpose({ element });
</script>

<template>
  <div
    ref="element"
    data-sw-card-description
    :class="cardDescription({ class: className })"
    v-bind="attrs"
    data-slot="card-description"
  >
    <slot />
  </div>
</template>
