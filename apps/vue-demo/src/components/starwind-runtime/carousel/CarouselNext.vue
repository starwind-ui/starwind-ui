<script setup lang="ts">
import * as CarouselPrimitive from "@starwind-ui/vue/carousel";
import type { ClassValue, VariantProps } from "tailwind-variants";
import { type ButtonHTMLAttributes, computed, useAttrs } from "vue";
import { carouselControl, carouselNext } from "./variants";

defineOptions({ inheritAttrs: false });

export type CarouselNextProps = Omit<ButtonHTMLAttributes, "class"> &
  VariantProps<typeof carouselControl> & {
    class?: ClassValue;
  };
type CarouselNextDeclaredProps = {
  class?: ClassValue;
  variant?: CarouselNextProps["variant"];
  size?: CarouselNextProps["size"];
} & /* @vue-ignore */ CarouselNextProps;
const {
  variant = "outline",
  size = "icon",
  class: className,
} = defineProps<CarouselNextDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
const controlClassName = computed(() => carouselNext({ class: className }));
</script>

<template>
  <CarouselPrimitive.CarouselNext
    :class="carouselControl({ variant, size, class: controlClassName })"
    v-bind="{ ...attrs, 'aria-label': 'Next slide' } as Record<string, unknown>"
    data-slot="carousel-next"
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
        <path d="M9 6l6 6l-6 6" />
      </svg>
      <span class="sr-only"> Next slide </span>
    </slot>
  </CarouselPrimitive.CarouselNext>
</template>
