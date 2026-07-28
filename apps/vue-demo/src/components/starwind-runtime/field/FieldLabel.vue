<script setup lang="ts">
import * as FieldPrimitive from "@starwind-ui/vue/field";
import type { ClassValue, VariantProps } from "tailwind-variants";
import { type ComponentPublicInstance, type HTMLAttributes, nextTick, ref, useAttrs } from "vue";
import { fieldLabel } from "./variants";

defineOptions({ inheritAttrs: false });

export type FieldLabelProps = Omit<HTMLAttributes, "class"> &
  VariantProps<typeof fieldLabel> & {
    class?: ClassValue;
  };
type FieldLabelDeclaredProps = {
  class?: ClassValue;
  size?: FieldLabelProps["size"];
} & /* @vue-ignore */ FieldLabelProps;
const { size, class: className } = defineProps<FieldLabelDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
const element = ref<HTMLLabelElement | null>(null);
let pendingPrimitiveRef: ({ element?: HTMLLabelElement | null } & ComponentPublicInstance) | null =
  null;
defineExpose({ element });

function setElement(value: Element | ComponentPublicInstance | null): void {
  if (value instanceof HTMLLabelElement) {
    pendingPrimitiveRef = null;
    element.value = value;
    return;
  }
  const exposed = value as ({ element?: HTMLLabelElement | null } & ComponentPublicInstance) | null;
  pendingPrimitiveRef = exposed;
  element.value = exposed?.element instanceof HTMLLabelElement ? exposed.element : null;
  if (!exposed || element.value) return;

  void nextTick(() => {
    if (pendingPrimitiveRef !== exposed) return;
    element.value = exposed.element instanceof HTMLLabelElement ? exposed.element : null;
  });
}
</script>

<template>
  <FieldPrimitive.FieldLabel
    :ref="setElement"
    :class="fieldLabel({ size, class: className })"
    v-bind="attrs"
    data-slot="field-label"
  >
    <slot />
  </FieldPrimitive.FieldLabel>
</template>
