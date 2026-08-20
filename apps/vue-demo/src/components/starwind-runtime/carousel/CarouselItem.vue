<script setup lang="ts">
import * as CarouselPrimitive from "@starwind-ui/vue/carousel";
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes } from "vue";
import { carouselItem } from "./variants";

defineOptions({ inheritAttrs: false });

export type CarouselItemProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type CarouselItemDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ CarouselItemProps;
const { class: className } = defineProps<CarouselItemDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
</script>

<template>
  <CarouselPrimitive.CarouselItem
    :class="carouselItem({ class: className })"
    v-bind="$attrs"
    data-slot="carousel-item"
  >
    <slot />
  </CarouselPrimitive.CarouselItem>
</template>
