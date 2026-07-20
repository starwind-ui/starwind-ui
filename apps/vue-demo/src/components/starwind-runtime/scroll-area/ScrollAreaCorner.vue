<script setup lang="ts">
import * as ScrollAreaPrimitive from "@starwind-ui/vue/scroll-area";
import type { ClassValue } from "tailwind-variants";
import { type ComponentPublicInstance, type HTMLAttributes, nextTick, ref, useAttrs } from "vue";
import { scrollAreaCorner } from "./variants";

defineOptions({ inheritAttrs: false });

export type ScrollAreaCornerProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type ScrollAreaCornerDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ ScrollAreaCornerProps;
const { class: className } = defineProps<ScrollAreaCornerDeclaredProps>();
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
  <ScrollAreaPrimitive.ScrollAreaCorner
    :ref="setElement"
    :class="scrollAreaCorner({ class: className })"
    v-bind="attrs"
    data-slot="scroll-area-corner"
  >
    <slot />
  </ScrollAreaPrimitive.ScrollAreaCorner>
</template>
