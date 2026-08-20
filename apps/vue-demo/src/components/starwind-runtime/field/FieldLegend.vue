<script setup lang="ts">
import * as FieldsetPrimitive from "@starwind-ui/vue/fieldset";
import type { ClassValue, VariantProps } from "tailwind-variants";
import { type ComponentPublicInstance, type HTMLAttributes, nextTick, ref } from "vue";
import { fieldLegend } from "./variants";

defineOptions({ inheritAttrs: false });

export type FieldLegendProps = Omit<HTMLAttributes, "class"> &
  VariantProps<typeof fieldLegend> & {
    class?: ClassValue;
  };
type FieldLegendDeclaredProps = {
  class?: ClassValue;
  variant?: FieldLegendProps["variant"];
} & /* @vue-ignore */ FieldLegendProps;
const { variant, class: className } = defineProps<FieldLegendDeclaredProps>();
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
  <FieldsetPrimitive.FieldsetLegend
    :ref="setElement"
    :class="fieldLegend({ variant, class: className })"
    v-bind="$attrs"
    data-slot="field-legend"
  >
    <slot />
  </FieldsetPrimitive.FieldsetLegend>
</template>
