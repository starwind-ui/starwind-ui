<script setup lang="ts">
import * as CarouselPrimitive from "@starwind-ui/vue/carousel";
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes } from "vue";
import { carouselContainer, carouselContent } from "./variants";

defineOptions({ inheritAttrs: false });

export type CarouselContentProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type CarouselContentDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ CarouselContentProps;
const { class: className } = defineProps<CarouselContentDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
</script>

<template>
  <CarouselPrimitive.CarouselViewport
    :class="carouselContent()"
    v-bind="$attrs"
    data-slot="carousel-content"
  >
    <CarouselPrimitive.CarouselContainer
      :class="carouselContainer({ class: className })"
      data-slot="carousel-container"
    >
      <slot />
    </CarouselPrimitive.CarouselContainer>
  </CarouselPrimitive.CarouselViewport>
</template>
