<script setup lang="ts">
import type { ClassValue, VariantProps } from "tailwind-variants";
import { computed, type HTMLAttributes, useAttrs } from "vue";
import { aspectRatio, aspectRatioWrapper } from "./variants";

defineOptions({ inheritAttrs: false });

export type AspectRatioProps = Omit<HTMLAttributes, "as" | "class" | "ratio"> &
  VariantProps<typeof aspectRatio> & {
    as?: string;
    ratio?: number;
    class?: ClassValue;
  };
type AspectRatioDeclaredProps = {
  as?: string;
  ratio?: number;
  class?: ClassValue;
} & /* @vue-ignore */ AspectRatioProps;
const { ratio = 1, as: Tag = "div", class: className } = defineProps<AspectRatioDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
const wrapperStyle = computed(() => ({ paddingBottom: `${100 / ratio}%` }));
</script>

<template>
  <div :class="aspectRatioWrapper()" :style="wrapperStyle" data-slot="aspect-ratio-wrapper">
    <component
      :is="Tag"
      :class="aspectRatio({ class: className })"
      data-slot="aspect-ratio"
      v-bind="attrs"
    >
      <slot />
    </component>
  </div>
</template>
