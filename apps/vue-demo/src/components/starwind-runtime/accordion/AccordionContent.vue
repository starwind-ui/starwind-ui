<script setup lang="ts">
import * as AccordionPrimitive from "@starwind-ui/vue/accordion";
import type { ClassValue } from "tailwind-variants";
import { type ComponentPublicInstance, type HTMLAttributes, nextTick, ref } from "vue";
import { accordionContent } from "./variants";

defineOptions({ inheritAttrs: false });

export type AccordionContentProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type AccordionContentDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ AccordionContentProps;
const { class: className } = defineProps<AccordionContentDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const element = ref<HTMLElement | null>(null);
let pendingPrimitiveRef: ({ element?: HTMLElement | null } & ComponentPublicInstance) | null = null;
defineExpose({ element });

function setElement(value: Element | ComponentPublicInstance | null): void {
  if (value instanceof HTMLElement) {
    pendingPrimitiveRef = null;
    element.value = value;
    return;
  }
  const exposed = value as ({ element?: HTMLElement | null } & ComponentPublicInstance) | null;
  pendingPrimitiveRef = exposed;
  element.value = exposed?.element instanceof HTMLElement ? exposed.element : null;
  if (!exposed || element.value) return;

  void nextTick(() => {
    if (pendingPrimitiveRef !== exposed) return;
    element.value = exposed.element instanceof HTMLElement ? exposed.element : null;
  });
}
</script>

<template>
  <AccordionPrimitive.AccordionPanel
    :ref="setElement"
    :class="accordionContent({ class: className })"
    v-bind="$attrs"
    data-slot="accordion-content"
  >
    <div class="pt-0 pb-4">
      <slot />
    </div>
  </AccordionPrimitive.AccordionPanel>
</template>
