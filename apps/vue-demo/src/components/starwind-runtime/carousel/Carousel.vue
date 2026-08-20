<script setup lang="ts">
import * as CarouselPrimitive from "@starwind-ui/vue/carousel";
import type { ClassValue } from "tailwind-variants";
import { type ComponentPublicInstance, type HTMLAttributes, nextTick, ref } from "vue";
import { carousel } from "./variants";

defineOptions({ inheritAttrs: false });

export type CarouselProps = Omit<
  HTMLAttributes,
  "class" | "opts" | "orientation" | "plugins" | "setApi"
> & {
  orientation?: "horizontal" | "vertical";
  opts?: import("@starwind-ui/runtime").CarouselOptions["opts"];
  plugins?: import("@starwind-ui/runtime").CarouselOptions["plugins"];
  setApi?: (api: import("@starwind-ui/runtime").CarouselInstance["api"]) => void;
  class?: ClassValue;
};
type CarouselDeclaredProps = {
  orientation?: "horizontal" | "vertical";
  opts?: import("@starwind-ui/runtime").CarouselOptions["opts"];
  plugins?: import("@starwind-ui/runtime").CarouselOptions["plugins"];
  setApi?: (api: import("@starwind-ui/runtime").CarouselInstance["api"]) => void;
  class?: ClassValue;
} & /* @vue-ignore */ CarouselProps;
const {
  orientation = "horizontal",
  opts,
  plugins,
  setApi,
  class: className,
} = defineProps<CarouselDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const element = ref<HTMLDivElement | null>(null);
let pendingPrimitiveRef: ({ element?: HTMLDivElement | null } & ComponentPublicInstance) | null =
  null;
defineExpose({ element });

function setElement(value: Element | ComponentPublicInstance | null): void {
  if (value instanceof HTMLDivElement) {
    pendingPrimitiveRef = null;
    element.value = value;
    return;
  }
  const exposed = value as ({ element?: HTMLDivElement | null } & ComponentPublicInstance) | null;
  pendingPrimitiveRef = exposed;
  element.value = exposed?.element instanceof HTMLDivElement ? exposed.element : null;
  if (!exposed || element.value) return;

  void nextTick(() => {
    if (pendingPrimitiveRef !== exposed) return;
    element.value = exposed.element instanceof HTMLDivElement ? exposed.element : null;
  });
}
</script>

<template>
  <CarouselPrimitive.CarouselRoot
    :ref="setElement"
    :orientation="orientation"
    :opts="opts"
    :plugins="plugins"
    :set-api="setApi"
    :class="carousel({ class: className })"
    v-bind="$attrs"
    data-slot="carousel"
  >
    <slot />
  </CarouselPrimitive.CarouselRoot>
</template>
