<script setup lang="ts">
import * as AccordionPrimitive from "@starwind-ui/vue/accordion";
import type { ClassValue } from "tailwind-variants";
import { type ComponentPublicInstance, type HTMLAttributes, nextTick, ref, useAttrs } from "vue";
import { accordion } from "./variants";

defineOptions({ inheritAttrs: false });

export type AccordionProps = Omit<
  HTMLAttributes,
  "class" | "collapsible" | "defaultValue" | "modelValue" | "type"
> & {
  type?: "single" | "multiple";
  defaultValue?: string | string[];
  collapsible?: boolean;
  class?: ClassValue;
  modelValue?: import("@starwind-ui/vue/accordion").AccordionValue;
};
type AccordionDeclaredProps = {
  type?: "single" | "multiple";
  defaultValue?: string | string[];
  collapsible?: boolean;
  class?: ClassValue;
  modelValue?: import("@starwind-ui/vue/accordion").AccordionValue;
} & /* @vue-ignore */ AccordionProps;
const {
  type = "single",
  defaultValue,
  collapsible = true,
  class: className,
  modelValue,
} = defineProps<AccordionDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
const emit = defineEmits<{
  valueChange: [
    value: import("@starwind-ui/vue/accordion").AccordionValue,
    detail: import("@starwind-ui/vue/accordion").AccordionValueChangeDetails,
  ];
  "update:modelValue": [value: import("@starwind-ui/vue/accordion").AccordionValue];
}>();
function handleValueChange(
  value: import("@starwind-ui/vue/accordion").AccordionValue,
  detail: import("@starwind-ui/vue/accordion").AccordionValueChangeDetails,
): void {
  emit("valueChange", value, detail);
}
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
  <AccordionPrimitive.AccordionRoot
    :ref="setElement"
    :class="accordion({ class: className })"
    :type="type"
    :default-value="defaultValue"
    :collapsible="collapsible"
    v-bind="attrs"
    data-slot="accordion"
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    @value-change="handleValueChange"
  >
    <slot />
  </AccordionPrimitive.AccordionRoot>
</template>
