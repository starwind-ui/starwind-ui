<script setup lang="ts">
import * as ScrollAreaPrimitive from "@starwind-ui/vue/scroll-area";
import type { ClassValue } from "tailwind-variants";
import { type ComponentPublicInstance, type HTMLAttributes, nextTick, ref, useAttrs } from "vue";
import { scrollAreaThumb } from "./variants";

defineOptions({ inheritAttrs: false });

export type ScrollAreaThumbProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type ScrollAreaThumbDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ ScrollAreaThumbProps;
const { class: className } = defineProps<ScrollAreaThumbDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
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
  <ScrollAreaPrimitive.ScrollAreaThumb
    :ref="setElement"
    :class="scrollAreaThumb({ class: className })"
    v-bind="attrs"
    data-slot="scroll-area-thumb"
  >
    <slot />
  </ScrollAreaPrimitive.ScrollAreaThumb>
</template>
