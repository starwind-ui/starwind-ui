<script setup lang="ts">
import * as AccordionPrimitive from "@starwind-ui/vue/accordion";
import type { ClassValue } from "tailwind-variants";
import { type ButtonHTMLAttributes, type ComponentPublicInstance, nextTick, ref } from "vue";
import { accordionTrigger } from "./variants";

defineOptions({ inheritAttrs: false });

export type AccordionTriggerProps = Omit<ButtonHTMLAttributes, "class"> & {
  class?: ClassValue;
};
type AccordionTriggerDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ AccordionTriggerProps;
const { class: className } = defineProps<AccordionTriggerDeclaredProps>();
defineSlots<{
  default?: () => unknown;
  icon?: () => unknown;
}>();
const element = ref<HTMLButtonElement | null>(null);
let pendingPrimitiveRef: ({ element?: HTMLButtonElement | null } & ComponentPublicInstance) | null =
  null;
defineExpose({ element });

function setElement(value: Element | ComponentPublicInstance | null): void {
  if (value instanceof HTMLButtonElement) {
    pendingPrimitiveRef = null;
    element.value = value;
    return;
  }
  const exposed = value as
    | ({ element?: HTMLButtonElement | null } & ComponentPublicInstance)
    | null;
  pendingPrimitiveRef = exposed;
  element.value = exposed?.element instanceof HTMLButtonElement ? exposed.element : null;
  if (!exposed || element.value) return;

  void nextTick(() => {
    if (pendingPrimitiveRef !== exposed) return;
    element.value = exposed.element instanceof HTMLButtonElement ? exposed.element : null;
  });
}
</script>

<template>
  <AccordionPrimitive.AccordionTrigger
    :ref="setElement"
    :class="accordionTrigger({ class: className })"
    v-bind="$attrs"
    data-slot="accordion-trigger"
  >
    <slot />
    <slot name="icon">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
        class="size-5 shrink-0 transition-transform duration-200"
      >
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M6 9l6 6l6 -6" />
      </svg>
    </slot>
  </AccordionPrimitive.AccordionTrigger>
</template>
