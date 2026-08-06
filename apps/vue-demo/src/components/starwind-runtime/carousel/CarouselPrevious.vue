<script setup lang="ts">
import * as CarouselPrimitive from "@starwind-ui/vue/carousel";
import type { ClassValue, VariantProps } from "tailwind-variants";
import { type ButtonHTMLAttributes, computed, useAttrs } from "vue";
import { carouselControl, carouselPrevious } from "./variants";

defineOptions({ inheritAttrs: false });

export type CarouselPreviousProps = Omit<ButtonHTMLAttributes, "class"> &
  VariantProps<typeof carouselControl> & {
    class?: ClassValue;
  };
type CarouselPreviousDeclaredProps = {
  class?: ClassValue;
  variant?: CarouselPreviousProps["variant"];
  size?: CarouselPreviousProps["size"];
} & /* @vue-ignore */ CarouselPreviousProps;
const {
  variant = "outline",
  size = "icon",
  class: className,
} = defineProps<CarouselPreviousDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
const controlClassName = computed(() => carouselPrevious({ class: className }));
</script>

<template>
  <CarouselPrimitive.CarouselPrevious
    :class="carouselControl({ variant, size, class: controlClassName })"
    v-bind="{ ...attrs, 'aria-label': 'Previous slide' } as Record<string, unknown>"
    data-slot="carousel-previous"
  >
    <slot>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M15 6l-6 6l6 6" />
      </svg>
      <span class="sr-only"> Previous slide </span>
    </slot>
  </CarouselPrimitive.CarouselPrevious>
</template>
