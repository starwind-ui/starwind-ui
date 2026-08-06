<script setup lang="ts">
import type { ClassValue, VariantProps } from "tailwind-variants";
import { type HTMLAttributes, ref, useAttrs } from "vue";
import { card } from "./variants";

defineOptions({ inheritAttrs: false });

export type CardProps = Omit<HTMLAttributes, "class"> &
  VariantProps<typeof card> & {
    class?: ClassValue;
  };
type CardDeclaredProps = {
  class?: ClassValue;
  size?: CardProps["size"];
} & /* @vue-ignore */ CardProps;
const { size = "md", class: className } = defineProps<CardDeclaredProps>();
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
    data-sw-card
    :class="card({ size, class: className })"
    v-bind="attrs"
    :data-size="size"
    data-slot="card"
  >
    <slot />
  </div>
</template>
