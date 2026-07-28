<script setup lang="ts">
import * as AccordionPrimitive from "@starwind-ui/vue/accordion";
import type { ClassValue } from "tailwind-variants";
import { type ComponentPublicInstance, type HTMLAttributes, nextTick, ref, useAttrs } from "vue";
import { accordionItem } from "./variants";

defineOptions({ inheritAttrs: false });

export type AccordionItemProps = Omit<HTMLAttributes, "class" | "disabled" | "value"> & {
  value: string;
  disabled?: boolean;
  class?: ClassValue;
};
type AccordionItemDeclaredProps = {
  value: string;
  disabled?: boolean;
  class?: ClassValue;
} & /* @vue-ignore */ AccordionItemProps;
const { value, disabled = false, class: className } = defineProps<AccordionItemDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
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
  <AccordionPrimitive.AccordionItem
    :ref="setElement"
    :class="accordionItem({ class: className })"
    :value="value"
    :disabled="disabled"
    v-bind="attrs"
    data-slot="accordion-item"
  >
    <slot />
  </AccordionPrimitive.AccordionItem>
</template>
