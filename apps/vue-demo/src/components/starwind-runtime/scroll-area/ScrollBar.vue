<script setup lang="ts">
import * as ScrollAreaPrimitive from "@starwind-ui/vue/scroll-area";
import type { ClassValue } from "tailwind-variants";
import { type ComponentPublicInstance, type HTMLAttributes, nextTick, ref, useAttrs } from "vue";
import { scrollAreaScrollbar, scrollAreaThumb } from "./variants";

defineOptions({ inheritAttrs: false });

export type ScrollBarProps = Omit<HTMLAttributes, "class" | "keepMounted" | "orientation"> & {
  keepMounted?: boolean;
  orientation?: "horizontal" | "vertical";
  class?: ClassValue;
};
type ScrollBarDeclaredProps = {
  keepMounted?: boolean;
  orientation?: "horizontal" | "vertical";
  class?: ClassValue;
} & /* @vue-ignore */ ScrollBarProps;
const {
  keepMounted = false,
  orientation = "vertical",
  class: className,
} = defineProps<ScrollBarDeclaredProps>();
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
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    :ref="setElement"
    :class="scrollAreaScrollbar({ class: className })"
    :keep-mounted="keepMounted"
    :orientation="orientation"
    v-bind="attrs"
    :data-orientation="orientation"
    data-slot="scroll-area-scrollbar"
  >
    <slot>
      <ScrollAreaPrimitive.ScrollAreaThumb
        :class="scrollAreaThumb()"
        data-slot="scroll-area-thumb"
      />
    </slot>
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
</template>
