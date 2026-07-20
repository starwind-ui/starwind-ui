<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { type ComponentPublicInstance, type HTMLAttributes, nextTick, ref, useAttrs } from "vue";
import "./styles.css";
import * as ScrollAreaPrimitive from "@starwind-ui/vue/scroll-area";
import {
  scrollArea,
  scrollAreaContent,
  scrollAreaCorner,
  scrollAreaScrollbar,
  scrollAreaThumb,
  scrollAreaViewport,
} from "./variants";

defineOptions({ inheritAttrs: false });

export type ScrollAreaProps = Omit<
  HTMLAttributes,
  "class" | "overflowEdgeThreshold" | "viewportClass"
> & {
  overflowEdgeThreshold?: number;
  viewportClass?: string;
  class?: ClassValue;
};
type ScrollAreaDeclaredProps = {
  overflowEdgeThreshold?: number;
  viewportClass?: string;
  class?: ClassValue;
} & /* @vue-ignore */ ScrollAreaProps;
const {
  overflowEdgeThreshold,
  viewportClass,
  class: className,
} = defineProps<ScrollAreaDeclaredProps>();
defineSlots<{
  default?: () => unknown;
  scrollbar?: () => unknown;
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
  <ScrollAreaPrimitive.ScrollAreaRoot
    :ref="setElement"
    :class="scrollArea({ class: className })"
    :overflow-edge-threshold="overflowEdgeThreshold"
    v-bind="attrs"
    data-slot="scroll-area"
  >
    <ScrollAreaPrimitive.ScrollAreaViewport
      :class="scrollAreaViewport({ class: viewportClass })"
      data-slot="scroll-area-viewport"
    >
      <ScrollAreaPrimitive.ScrollAreaContent
        :class="scrollAreaContent()"
        data-slot="scroll-area-content"
      >
        <slot />
      </ScrollAreaPrimitive.ScrollAreaContent>
    </ScrollAreaPrimitive.ScrollAreaViewport>
    <slot name="scrollbar">
      <ScrollAreaPrimitive.ScrollAreaScrollbar
        :class="scrollAreaScrollbar()"
        data-slot="scroll-area-scrollbar"
      >
        <ScrollAreaPrimitive.ScrollAreaThumb
          :class="scrollAreaThumb()"
          data-slot="scroll-area-thumb"
        />
      </ScrollAreaPrimitive.ScrollAreaScrollbar>
    </slot>
    <ScrollAreaPrimitive.ScrollAreaCorner
      :class="scrollAreaCorner()"
      data-slot="scroll-area-corner"
    />
  </ScrollAreaPrimitive.ScrollAreaRoot>
</template>
